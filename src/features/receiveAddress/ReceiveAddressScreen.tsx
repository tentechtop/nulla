import { useMemo, useState } from 'react';
import { Image, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect } from 'react-native-svg';
import { AppShell } from '../../components/AppShell';
import { getGlobalHeaderHeight } from '../../components/GlobalHeader';
import { colors, fontFamilies, fontWeights } from '../../theme/tokens';
import { copyTextToClipboard } from '../../utils/clipboard';
import { generateQrMatrix, type QrMatrix } from '../../utils/qrCode';
import { formatShortAddress } from '../../utils/walletSetup';
import { receiveAddressImages } from './designAssets';
import { useReceiveAddressResponsiveLayout } from './useReceiveAddressResponsiveLayout';

type ReceiveAddressScreenProps = {
  readonly bottomPadding?: number;
  readonly currentWalletAddress?: string | null;
  readonly onBackPress?: () => void;
  readonly topPadding?: number;
};

type QrState = {
  readonly message: string;
  readonly matrix: QrMatrix;
};

function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

export function ReceiveAddressScreen({
  bottomPadding,
  currentWalletAddress = null,
  onBackPress,
  topPadding
}: ReceiveAddressScreenProps) {
  const layoutMetrics = useReceiveAddressResponsiveLayout();
  const headerHeight = getGlobalHeaderHeight(layoutMetrics.scale);
  const resolvedBottomPadding = bottomPadding ?? layoutMetrics.bottomNavHeight;
  const resolvedTopPadding = topPadding ?? layoutMetrics.topSafeArea + headerHeight;
  const styles = createStyles(layoutMetrics.scale);
  const address = typeof currentWalletAddress === 'string' ? currentWalletAddress.trim() : '';
  const [actionMessage, setActionMessage] = useState('');
  const qrState = useMemo(() => createQrState(address), [address]);
  const shortAddress = address ? formatShortAddress(address, 8, 7) : '未创建钱包';

  const handleCopyAddress = async () => {
    if (!address) {
      setActionMessage('当前没有可复制的钱包地址');
      return;
    }

    try {
      const result = await copyTextToClipboard(address, '地址已复制');
      setActionMessage(result.message);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const handleShareAddress = async () => {
    if (!address) {
      setActionMessage('当前没有可分享的钱包地址');
      return;
    }

    try {
      await Share.share({ message: address, title: 'SOL 收款地址' });
      setActionMessage('已打开系统分享');
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <View style={styles.root}>
      <AppShell bottomPadding={resolvedBottomPadding} topPadding={resolvedTopPadding}>
        <View style={styles.titleRow}>
          <Pressable accessibilityLabel="返回" accessibilityRole="button" onPress={onBackPress} style={styles.backButton}>
            <MaterialCommunityIcons color={colors.text} name="chevron-left" size={scaled(48, layoutMetrics.scale)} />
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={styles.pageTitle}>接收</Text>
            <Text style={styles.pageSubtitle}>展示地址二维码</Text>
          </View>
        </View>

        <View style={styles.walletCard}>
          <Image resizeMode="cover" source={receiveAddressImages.walletCardBackground} style={styles.walletCardImage} />
          <View style={styles.walletCardDimmer} />
          <View style={styles.addressHeader}>
            <Text style={styles.cardLabel}>当前地址</Text>
            <View style={styles.addressLine}>
              <Text numberOfLines={1} style={styles.shortAddress}>{shortAddress}</Text>
              <Pressable accessibilityLabel="复制当前地址" accessibilityRole="button" onPress={handleCopyAddress} style={styles.iconButton}>
                <MaterialCommunityIcons color="#FFFFFF" name="content-copy" size={scaled(25, layoutMetrics.scale)} />
              </Pressable>
            </View>
            <View style={styles.addressMetaRow}>
              <View style={styles.networkPill}>
                <Text style={styles.networkPillText}>SOL</Text>
              </View>
              <Text style={styles.transparentText}>透明账户</Text>
            </View>
          </View>

          <View style={styles.networkBlock}>
            <Text style={styles.cardLabel}>网络</Text>
            <Text style={styles.networkValue}>SOL</Text>
          </View>

          <View style={styles.qrBlock}>
            <Text style={styles.qrTitle}>收款地址</Text>
            <View style={styles.qrFrame}>
              {qrState.matrix.length > 0 ? (
                <QrMatrixView matrix={qrState.matrix} size={scaled(312, layoutMetrics.scale)} />
              ) : (
                <Text style={styles.qrError}>{qrState.message}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.addressCard}>
          <Text style={styles.addressCardLabel}>收款地址</Text>
          <View style={styles.fullAddressRow}>
            <Text numberOfLines={2} selectable style={styles.fullAddress}>{address || '当前没有可展示的钱包地址'}</Text>
            <Pressable accessibilityLabel="复制收款地址" accessibilityRole="button" onPress={handleCopyAddress} style={styles.copyIconButton}>
              <MaterialCommunityIcons color={colors.text} name="content-copy" size={scaled(34, layoutMetrics.scale)} />
            </Pressable>
          </View>

          <View style={styles.actionRow}>
            <Pressable accessibilityRole="button" onPress={handleCopyAddress} style={styles.primaryButton}>
              <LinearGradient colors={['#126DFF', '#8A4DFF']} end={{ x: 1, y: 0.5 }} start={{ x: 0, y: 0.5 }} style={styles.primaryButtonGradient}>
                <MaterialCommunityIcons color="#FFFFFF" name="content-copy" size={scaled(31, layoutMetrics.scale)} />
                <Text style={styles.primaryButtonText}>复制地址</Text>
              </LinearGradient>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={handleShareAddress} style={styles.secondaryButton}>
              <MaterialCommunityIcons color={colors.text} name="share-variant-outline" size={scaled(31, layoutMetrics.scale)} />
              <Text style={styles.secondaryButtonText}>分享地址</Text>
            </Pressable>
          </View>
          {actionMessage.length > 0 ? <Text style={styles.actionMessage}>{actionMessage}</Text> : null}
        </View>

        <View style={styles.receiveTypeCard}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>接收类型</Text>
            <MaterialCommunityIcons color={colors.textSoft} name="information-outline" size={scaled(30, layoutMetrics.scale)} />
          </View>
          <View style={styles.receiveModeRow}>
            <View style={styles.receiveModeSelected}>
              <MaterialCommunityIcons color={colors.primary} name="web" size={scaled(32, layoutMetrics.scale)} />
              <Text style={styles.receiveModeSelectedText}>透明地址</Text>
            </View>
            <View style={styles.receiveModeDisabled}>
              <MaterialCommunityIcons color="#AEB4C2" name="shield-lock-outline" size={scaled(32, layoutMetrics.scale)} />
              <Text style={styles.receiveModeDisabledText}>隐私地址</Text>
            </View>
          </View>
          <Text style={styles.receiveTypeHint}>隐私地址需先生成本地状态</Text>
        </View>

        <View style={styles.warningCard}>
          <MaterialCommunityIcons color="#737987" name="alert-circle" size={scaled(34, layoutMetrics.scale)} />
          <Text style={styles.warningText}>仅接收 SOL / LAMPORTS 兼容资产</Text>
          <MaterialCommunityIcons color="#737987" name="chevron-right" size={scaled(34, layoutMetrics.scale)} />
        </View>
      </AppShell>
    </View>
  );
}

function createQrState(address: string): QrState {
  if (!address) {
    return {
      matrix: [],
      message: '请先创建或导入钱包'
    };
  }

  try {
    return {
      matrix: generateQrMatrix(address),
      message: ''
    };
  } catch (error) {
    return {
      matrix: [],
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

function QrMatrixView({ matrix, size }: { readonly matrix: QrMatrix; readonly size: number }) {
  const matrixSize = matrix.length;
  const moduleSize = Math.max(1, Math.floor(size / matrixSize));
  const actualSize = matrixSize * moduleSize;

  return (
    <Svg height={actualSize} viewBox={`0 0 ${actualSize} ${actualSize}`} width={actualSize}>
      <Rect fill="#FFFFFF" height={actualSize} width={actualSize} x={0} y={0} />
      {matrix.map((row, rowIndex) => (
        row.map((isDark, columnIndex) => (
          isDark ? (
            <Rect
              fill="#050507"
              height={moduleSize}
              key={`${rowIndex}-${columnIndex}`}
              width={moduleSize}
              x={columnIndex * moduleSize}
              y={rowIndex * moduleSize}
            />
          ) : null
        ))
      ))}
    </Svg>
  );
}

function createStyles(scale: number) {
  // 功能目的：按收款设计稿还原移动端收款页；实现原因：收款二维码必须是原生生成且绑定当前钱包真实地址。
  const textBase = {
    fontFamily: fontFamilies.system,
    includeFontPadding: false
  } as const;

  return StyleSheet.create({
    actionMessage: {
      color: colors.textMuted,
      fontSize: scaled(17, scale),
      fontWeight: '500',
      lineHeight: scaled(24, scale),
      marginTop: scaled(13, scale),
      textAlign: 'center',
      ...textBase
    },
    actionRow: {
      flexDirection: 'row',
      gap: scaled(34, scale),
      marginTop: scaled(29, scale)
    },
    addressCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(26, scale),
      borderWidth: 1,
      marginHorizontal: scaled(30, scale),
      marginTop: scaled(22, scale),
      paddingHorizontal: scaled(30, scale),
      paddingTop: scaled(26, scale),
      paddingBottom: scaled(29, scale),
      shadowColor: '#151824',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.04,
      shadowRadius: 12,
      elevation: 1
    },
    addressCardLabel: {
      color: colors.textSoft,
      fontSize: scaled(22, scale),
      fontWeight: '500',
      lineHeight: scaled(29, scale),
      ...textBase
    },
    addressHeader: {
      left: scaled(40, scale),
      position: 'absolute',
      right: scaled(40, scale),
      top: scaled(44, scale)
    },
    addressLine: {
      alignItems: 'center',
      flexDirection: 'row',
      marginTop: scaled(20, scale)
    },
    addressMetaRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: scaled(27, scale),
      marginTop: scaled(23, scale)
    },
    backButton: {
      alignItems: 'center',
      height: scaled(62, scale),
      justifyContent: 'center',
      left: scaled(0, scale),
      position: 'absolute',
      top: scaled(27, scale),
      width: scaled(62, scale)
    },
    cardLabel: {
      color: 'rgba(255,255,255,0.66)',
      fontSize: scaled(24, scale),
      fontWeight: '500',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    copyIconButton: {
      alignItems: 'center',
      height: scaled(56, scale),
      justifyContent: 'center',
      width: scaled(56, scale)
    },
    fullAddress: {
      color: colors.text,
      flex: 1,
      fontSize: scaled(25, scale),
      fontWeight: '500',
      lineHeight: scaled(36, scale),
      ...textBase
    },
    fullAddressRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: scaled(18, scale),
      marginTop: scaled(18, scale)
    },
    iconButton: {
      alignItems: 'center',
      height: scaled(42, scale),
      justifyContent: 'center',
      marginLeft: scaled(10, scale),
      width: scaled(42, scale)
    },
    networkBlock: {
      left: scaled(40, scale),
      position: 'absolute',
      top: scaled(246, scale)
    },
    networkPill: {
      alignItems: 'center',
      borderColor: colors.violet,
      borderRadius: scaled(22, scale),
      borderWidth: 1,
      height: scaled(44, scale),
      justifyContent: 'center',
      paddingHorizontal: scaled(22, scale)
    },
    networkPillText: {
      color: '#9B67FF',
      fontSize: scaled(24, scale),
      fontWeight: '700',
      lineHeight: scaled(30, scale),
      ...textBase
    },
    networkValue: {
      color: '#FFFFFF',
      fontSize: scaled(31, scale),
      fontWeight: '800',
      lineHeight: scaled(39, scale),
      marginTop: scaled(15, scale),
      ...textBase
    },
    pageSubtitle: {
      color: colors.textMuted,
      fontSize: scaled(25, scale),
      fontWeight: '500',
      lineHeight: scaled(32, scale),
      marginTop: scaled(12, scale),
      textAlign: 'center',
      ...textBase
    },
    pageTitle: {
      color: colors.text,
      fontSize: scaled(40, scale),
      fontWeight: fontWeights.pageTitle,
      lineHeight: scaled(50, scale),
      textAlign: 'center',
      ...textBase
    },
    primaryButton: {
      borderRadius: scaled(12, scale),
      flex: 1,
      height: scaled(72, scale),
      overflow: 'hidden'
    },
    primaryButtonGradient: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      gap: scaled(13, scale),
      justifyContent: 'center'
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: scaled(25, scale),
      fontWeight: '800',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    qrBlock: {
      alignItems: 'center',
      left: 0,
      position: 'absolute',
      right: 0,
      top: scaled(293, scale)
    },
    qrError: {
      color: colors.negative,
      fontSize: scaled(22, scale),
      fontWeight: '700',
      lineHeight: scaled(30, scale),
      textAlign: 'center',
      ...textBase
    },
    qrFrame: {
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: scaled(18, scale),
      height: scaled(346, scale),
      justifyContent: 'center',
      marginTop: scaled(20, scale),
      overflow: 'hidden',
      position: 'relative',
      width: scaled(346, scale)
    },
    qrTitle: {
      color: '#FFFFFF',
      fontSize: scaled(27, scale),
      fontWeight: '700',
      lineHeight: scaled(35, scale),
      ...textBase
    },
    receiveModeDisabled: {
      alignItems: 'center',
      backgroundColor: '#F7F8FC',
      borderColor: colors.border,
      borderRadius: scaled(14, scale),
      borderWidth: 1,
      flex: 1,
      flexDirection: 'row',
      gap: scaled(12, scale),
      height: scaled(70, scale),
      justifyContent: 'center'
    },
    receiveModeDisabledText: {
      color: '#A8AEBB',
      fontSize: scaled(24, scale),
      fontWeight: '700',
      lineHeight: scaled(31, scale),
      ...textBase
    },
    receiveModeRow: {
      flexDirection: 'row',
      gap: scaled(22, scale),
      marginTop: scaled(24, scale)
    },
    receiveModeSelected: {
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderColor: colors.primary,
      borderRadius: scaled(14, scale),
      borderWidth: 1,
      flex: 1,
      flexDirection: 'row',
      gap: scaled(12, scale),
      height: scaled(70, scale),
      justifyContent: 'center'
    },
    receiveModeSelectedText: {
      color: colors.primary,
      fontSize: scaled(24, scale),
      fontWeight: '800',
      lineHeight: scaled(31, scale),
      ...textBase
    },
    receiveTypeCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(26, scale),
      borderWidth: 1,
      marginHorizontal: scaled(30, scale),
      marginTop: scaled(22, scale),
      paddingHorizontal: scaled(30, scale),
      paddingTop: scaled(27, scale),
      paddingBottom: scaled(26, scale),
      shadowColor: '#151824',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.035,
      shadowRadius: 12,
      elevation: 1
    },
    receiveTypeHint: {
      color: colors.textMuted,
      fontSize: scaled(22, scale),
      fontWeight: '500',
      lineHeight: scaled(30, scale),
      marginTop: scaled(18, scale),
      textAlign: 'center',
      ...textBase
    },
    root: {
      backgroundColor: colors.background,
      flex: 1
    },
    secondaryButton: {
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderColor: colors.borderStrong,
      borderRadius: scaled(12, scale),
      borderWidth: 1,
      flex: 1,
      flexDirection: 'row',
      gap: scaled(13, scale),
      height: scaled(72, scale),
      justifyContent: 'center'
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '800',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    sectionTitle: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '900',
      lineHeight: scaled(36, scale),
      ...textBase
    },
    sectionTitleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: scaled(10, scale)
    },
    shortAddress: {
      color: '#FFFFFF',
      flexShrink: 1,
      fontSize: scaled(38, scale),
      fontWeight: '900',
      letterSpacing: 0,
      lineHeight: scaled(50, scale),
      ...textBase
    },
    titleBlock: {
      alignItems: 'center',
      flex: 1
    },
    titleRow: {
      alignItems: 'center',
      height: scaled(128, scale),
      justifyContent: 'center',
      marginHorizontal: scaled(30, scale),
      position: 'relative'
    },
    transparentText: {
      color: colors.success,
      fontSize: scaled(25, scale),
      fontWeight: '700',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    walletCard: {
      borderRadius: scaled(26, scale),
      height: scaled(704, scale),
      marginHorizontal: scaled(30, scale),
      marginTop: scaled(14, scale),
      overflow: 'hidden',
      position: 'relative'
    },
    walletCardDimmer: {
      backgroundColor: 'rgba(0,0,0,0.14)',
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0
    },
    walletCardImage: {
      bottom: 0,
      height: '100%',
      position: 'absolute',
      right: 0,
      top: 0,
      width: scaled(1510, scale)
    },
    warningCard: {
      alignItems: 'center',
      backgroundColor: '#F5F7FB',
      borderRadius: scaled(22, scale),
      flexDirection: 'row',
      gap: scaled(18, scale),
      height: scaled(82, scale),
      marginHorizontal: scaled(30, scale),
      marginTop: scaled(22, scale),
      paddingHorizontal: scaled(30, scale)
    },
    warningText: {
      color: '#555B68',
      flex: 1,
      fontSize: scaled(24, scale),
      fontWeight: '700',
      lineHeight: scaled(31, scale),
      ...textBase
    }
  });
}
