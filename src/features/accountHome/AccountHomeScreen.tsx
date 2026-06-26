import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AddressActionDialog } from '../../components/AddressActionDialog';
import { getGlobalHeaderHeight } from '../../components/GlobalHeader';
import { colors, fontFamilies, fontWeights } from '../../theme/tokens';
import { DEFAULT_PUBLIC_RPC_URL } from '../../utils/chainRpc';
import { copyTextToClipboard } from '../../utils/clipboard';
import { formatShortAddress } from '../../utils/walletSetup';
import { accountHomeImages } from './designAssets';
import {
  CardAddressQrIcon,
  CardCopyAddressIcon,
  CardUnlockBadgeIcon,
  ChevronRightIcon,
  LogoutIcon,
  RpcGlobeIcon,
  SecurityRowIcon,
  type SecurityIconKey,
  WalletRowIcon,
  type WalletIconKey
} from './AccountHomeSvgIcons';
import { useAccountHomeResponsiveLayout } from './useAccountHomeResponsiveLayout';

const TOP_NAVIGATION_DESIGN_HEIGHT = 117;

const walletRowTemplates = [
  { key: 'currentWallet', icon: 'walletCurrent', label: '当前钱包' },
  { key: 'switchAccount', icon: 'switchAccount', label: '切换账户' },
  { key: 'addressQr', icon: 'addressQr', label: '导出地址二维码' },
  { key: 'backupKey', icon: 'backupKey', label: '备份助记词' }
] as const;

const securityRows = [
  { key: 'localSign', icon: 'sign', label: '本地签名', value: '已开启' },
  { key: 'deployConfirm', icon: 'confirm', label: '部署请求确认', value: '已开启' },
  { key: 'privateKeyLocal', icon: 'lock', label: '私钥不上链', value: '已开启' },
  { key: 'clearLocal', icon: 'clear', label: '清除本机账户', value: '' }
] as const;

const rpcTabs = [
  { key: 'public', label: '公网节点' },
  { key: 'local', label: '本地节点' },
  { key: 'custom', label: '自定义' }
] as const;

type WalletRowKey = (typeof walletRowTemplates)[number]['key'];
type SecurityRowKey = (typeof securityRows)[number]['key'];
export type RpcEndpointMode = (typeof rpcTabs)[number]['key'];
type WalletRowItem = {
  readonly icon: (typeof walletRowTemplates)[number]['icon'];
  readonly key: WalletRowKey;
  readonly label: string;
  readonly value: string;
};

type AccountHomeScreenProps = {
  readonly bottomPadding?: number;
  readonly currentWalletAddress?: string | null;
  readonly customRpcEndpoint?: string;
  readonly onBackupMnemonicPress?: () => void;
  readonly onChainStatusPress?: () => void;
  readonly onCustomRpcEndpointChange?: (endpoint: string) => void;
  readonly onRpcNodeDetailPress?: () => void;
  readonly onRpcModeChange?: (mode: RpcEndpointMode) => void;
  readonly onSwitchAccountPress?: () => void;
  readonly rpcEndpoint?: string;
  readonly rpcStatusText?: string;
  readonly selectedRpcMode?: RpcEndpointMode;
  readonly topPadding?: number;
};

function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

function scaledBelowTopNavigation(value: number, scale: number) {
  return scaled(value - TOP_NAVIGATION_DESIGN_HEIGHT, scale);
}

export function AccountHomeScreen({
  bottomPadding,
  currentWalletAddress = null,
  customRpcEndpoint = '',
  onBackupMnemonicPress,
  onChainStatusPress,
  onCustomRpcEndpointChange,
  onRpcNodeDetailPress,
  onRpcModeChange,
  onSwitchAccountPress,
  rpcEndpoint = DEFAULT_PUBLIC_RPC_URL,
  rpcStatusText = '已选择',
  selectedRpcMode = 'public',
  topPadding
}: AccountHomeScreenProps) {
  const layoutMetrics = useAccountHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const headerHeight = getGlobalHeaderHeight(layoutMetrics.scale);
  const resolvedBottomPadding = bottomPadding ?? layoutMetrics.bottomNavHeight;
  const resolvedTopPadding = topPadding ?? layoutMetrics.topSafeArea + headerHeight;
  const walletRows = createWalletRows(currentWalletAddress);
  const [isAddressDialogVisible, setIsAddressDialogVisible] = useState(false);
  const [addressDialogMessage, setAddressDialogMessage] = useState('请核对完整地址后扫码或复制。');

  const handleAccountActionPress = (actionKey: string) => {
    if (actionKey === 'copyAddress') {
      handleCopyCurrentAddress();
      return;
    }

    if (actionKey === 'showQr') {
      handleShowCurrentQr();
      return;
    }

    console.info('[account-home] action requested', { actionKey });
  };

  const handleCopyCurrentAddress = () => {
    setIsAddressDialogVisible(true);
    setAddressDialogMessage('正在复制地址...');

    void copyTextToClipboard(currentWalletAddress ?? '', '地址已复制')
      .then((result) => setAddressDialogMessage(result.message))
      .catch((error) => setAddressDialogMessage(error instanceof Error ? error.message : String(error)));
  };

  const handleShowCurrentQr = () => {
    setAddressDialogMessage('请核对完整地址后扫码或复制。');
    setIsAddressDialogVisible(true);
  };

  const handleWalletPress = (rowKey: WalletRowKey) => {
    if (rowKey === 'currentWallet') {
      handleCopyCurrentAddress();
      return;
    }

    if (rowKey === 'switchAccount') {
      onSwitchAccountPress?.();
      return;
    }

    if (rowKey === 'addressQr') {
      handleShowCurrentQr();
      return;
    }

    if (rowKey === 'backupKey') {
      onBackupMnemonicPress?.();
      return;
    }

    console.info('[account-home] wallet row requested', { rowKey });
  };

  const handleRpcTabPress = (mode: RpcEndpointMode) => {
    onRpcModeChange?.(mode);
    console.info('[account-home] rpc mode selected', { mode });
  };

  const handleCustomRpcEndpointChange = (nextValue: string) => {
    onCustomRpcEndpointChange?.(sanitizeRpcEndpointInput(nextValue));
  };

  const handleSecurityPress = (rowKey: SecurityRowKey) => {
    console.info('[account-home] security row requested', { rowKey });
  };

  return (
    <View style={styles.root}>
      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: resolvedBottomPadding,
            paddingTop: resolvedTopPadding
          }
        ]}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.canvas}>
          <PageHeading styles={styles} />
          <AccountSummaryCard address={currentWalletAddress} onActionPress={handleAccountActionPress} scale={layoutMetrics.scale} styles={styles} />
          <WalletManageCard onWalletPress={handleWalletPress} scale={layoutMetrics.scale} styles={styles} walletRows={walletRows} />
          <RpcNodeCard
            customRpcEndpoint={customRpcEndpoint}
            onCustomRpcEndpointChange={handleCustomRpcEndpointChange}
            onPress={onRpcNodeDetailPress ?? onChainStatusPress}
            onRpcTabPress={handleRpcTabPress}
            rpcEndpoint={rpcEndpoint}
            rpcStatusText={rpcStatusText}
            scale={layoutMetrics.scale}
            selectedRpcMode={selectedRpcMode}
            styles={styles}
          />
          <SecuritySettingsCard onSecurityPress={handleSecurityPress} scale={layoutMetrics.scale} styles={styles} />
          <LogoutButton onPress={() => handleAccountActionPress('logout')} scale={layoutMetrics.scale} styles={styles} />
        </View>
      </ScrollView>
      <AddressActionDialog
        address={currentWalletAddress ?? ''}
        message={addressDialogMessage}
        onClose={() => setIsAddressDialogVisible(false)}
        onCopyPress={handleCopyCurrentAddress}
        scale={layoutMetrics.scale}
        visible={isAddressDialogVisible}
      />
    </View>
  );
}

function PageHeading({ styles }: { readonly styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.pageHeading}>
      <Text style={styles.pageTitle}>账户</Text>
      <Text style={styles.pageSubtitle}>钱包、RPC、安全</Text>
    </View>
  );
}

function AccountSummaryCard({
  address,
  onActionPress,
  scale,
  styles
}: {
  readonly address: string | null;
  readonly onActionPress: (actionKey: string) => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  const displayAddress = formatWalletDisplayAddress(address, 7, 7);

  return (
    <View style={styles.summaryCard}>
      <Image resizeMode="cover" source={accountHomeImages.accountCardBackground} style={styles.summaryArtwork} />
      <LinearGradient colors={['#050507F7', '#050507BB', '#05050722']} end={{ x: 1, y: 0.5 }} start={{ x: 0, y: 0.5 }} style={styles.summaryShade} />
      <Text style={styles.summaryLabel}>当前账户</Text>
      <Text adjustsFontSizeToFit minimumFontScale={0.82} numberOfLines={1} style={styles.summaryAddress}>{displayAddress}</Text>
      <Pressable accessibilityLabel="复制当前账户地址" accessibilityRole="button" onPress={() => onActionPress('copyAddress')} style={styles.copyAddressButton}>
        <CardCopyAddressIcon size={scaled(64, scale)} />
      </Pressable>
      <Pressable accessibilityLabel="显示当前账户二维码" accessibilityRole="button" onPress={() => onActionPress('showQr')} style={styles.cardQrButton}>
        <CardAddressQrIcon size={scaled(64, scale)} />
      </Pressable>
      <View style={styles.summaryStatusRow}>
        <View style={styles.unlockBadge}>
          <CardUnlockBadgeIcon size={scaled(28, scale)} />
          <Text style={styles.unlockBadgeText}>已解锁</Text>
        </View>
        <View style={styles.summaryRpcStatus}>
          <View style={styles.rpcDot} />
          <Text numberOfLines={1} style={styles.rpcLabel}>公网 RPC</Text>
        </View>
      </View>
    </View>
  );
}

function WalletManageCard({
  onWalletPress,
  scale,
  styles,
  walletRows
}: {
  readonly onWalletPress: (rowKey: WalletRowKey) => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
  readonly walletRows: readonly WalletRowItem[];
}) {
  return (
    <View style={styles.walletCard}>
      <Text style={styles.cardTitle}>钱包管理</Text>
      {walletRows.map((row, index) => (
        <Pressable accessibilityRole="button" key={row.key} onPress={() => onWalletPress(row.key)} style={[styles.listRow, { top: scaled(82 + index * 78, scale) }]}>
          <View style={styles.walletRowIcon}>
            <WalletRowIcon iconKey={row.icon as WalletIconKey} size={scaled(44, scale)} />
          </View>
          <Text style={styles.listRowLabel}>{row.label}</Text>
          {row.value ? <Text numberOfLines={1} style={styles.walletRowValue}>{row.value}</Text> : null}
          <View style={styles.rowChevron}>
            <ChevronRightIcon size={scaled(36, scale)} />
          </View>
          {index < walletRows.length - 1 ? <View style={styles.listDivider} /> : null}
        </Pressable>
      ))}
    </View>
  );
}

function createWalletRows(currentWalletAddress: string | null): readonly WalletRowItem[] {
  const displayAddress = formatWalletDisplayAddress(currentWalletAddress, 7, 7);

  return walletRowTemplates.map((row) => ({
    icon: row.icon,
    key: row.key,
    label: row.label,
    value: row.key === 'currentWallet' ? displayAddress : ''
  }));
}

function formatWalletDisplayAddress(address: string | null, prefixLength: number, suffixLength: number) {
  if (!address) {
    return '未创建钱包';
  }

  return formatShortAddress(address, prefixLength, suffixLength);
}

function sanitizeRpcEndpointInput(nextValue: string) {
  // 功能目的：限制 RPC 输入边界；实现原因：避免控制字符和超长文本进入全局网络配置。
  return nextValue.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 160);
}

function RpcNodeCard({
  customRpcEndpoint,
  onCustomRpcEndpointChange,
  onPress,
  onRpcTabPress,
  rpcEndpoint,
  rpcStatusText,
  scale,
  selectedRpcMode,
  styles
}: {
  readonly customRpcEndpoint: string;
  readonly onCustomRpcEndpointChange: (endpoint: string) => void;
  readonly onPress?: () => void;
  readonly onRpcTabPress: (mode: RpcEndpointMode) => void;
  readonly rpcEndpoint: string;
  readonly rpcStatusText: string;
  readonly scale: number;
  readonly selectedRpcMode: RpcEndpointMode;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.rpcCard}>
      <Text style={styles.cardTitle}>RPC 节点</Text>
      <View style={styles.rpcGlobeIcon}>
        <RpcGlobeIcon size={scaled(66, scale)} />
      </View>
      <Text adjustsFontSizeToFit minimumFontScale={0.74} numberOfLines={1} style={styles.rpcUrl}>{rpcEndpoint}</Text>
      <View style={styles.rpcHealthyDot} />
      <Text style={styles.rpcHealthyText}>{rpcStatusText}</Text>
      <View style={styles.rpcChevron}>
        <ChevronRightIcon size={scaled(38, scale)} />
      </View>
      {rpcTabs.map((tab, index) => {
        const isActive = tab.key === selectedRpcMode;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            key={tab.key}
            onPress={() => onRpcTabPress(tab.key)}
            style={[isActive ? styles.rpcTabActive : styles.rpcTab, { left: scaled(32 + index * 247, scale) }]}
          >
            <Text style={isActive ? styles.rpcTabTextActive : styles.rpcTabText}>{tab.label}</Text>
          </Pressable>
        );
      })}
      {selectedRpcMode === 'custom' ? (
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          onChangeText={onCustomRpcEndpointChange}
          placeholder="http://192.168.1.10:8899/"
          placeholderTextColor="#8D93A1"
          style={styles.customRpcInput}
          underlineColorAndroid="transparent"
          value={customRpcEndpoint}
        />
      ) : (
        <Text numberOfLines={1} style={styles.rpcHint}>点击右侧查看当前 RPC 节点详情</Text>
      )}
    </Pressable>
  );
}

function SecuritySettingsCard({
  onSecurityPress,
  scale,
  styles
}: {
  readonly onSecurityPress: (rowKey: SecurityRowKey) => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.securityCard}>
      <Text style={styles.cardTitle}>安全设置</Text>
      {securityRows.map((row, index) => (
        <Pressable accessibilityRole="button" key={row.key} onPress={() => onSecurityPress(row.key)} style={[styles.securityRow, { top: scaled(80 + index * 61, scale) }]}>
          <View style={styles.securityRowIcon}>
            <SecurityRowIcon iconKey={row.icon as SecurityIconKey} size={scaled(40, scale)} />
          </View>
          <Text style={styles.securityRowLabel}>{row.label}</Text>
          {row.value ? <Text style={styles.securityRowValue}>{row.value}</Text> : null}
          <View style={styles.securityChevron}>
            <ChevronRightIcon size={scaled(36, scale)} />
          </View>
          {index < securityRows.length - 1 ? <View style={styles.securityDivider} /> : null}
        </Pressable>
      ))}
    </View>
  );
}

function LogoutButton({
  onPress,
  scale,
  styles
}: {
  readonly onPress: () => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.logoutButton}>
      <LogoutIcon size={scaled(48, scale)} />
      <Text style={styles.logoutText}>退出当前账户</Text>
    </Pressable>
  );
}

function createStyles(scale: number) {
  // 功能目的：按 10-account 设计坐标还原账户页；实现原因：避免切整图导致真实控件不可维护。
  const textBase = {
    fontFamily: fontFamilies.system,
    includeFontPadding: false
  } as const;

  return StyleSheet.create({
    canvas: {
      backgroundColor: colors.background,
      height: scaled(1654, scale),
      position: 'relative',
      width: '100%'
    },
    cardQrButton: {
      height: scaled(64, scale),
      left: scaled(500, scale),
      position: 'absolute',
      top: scaled(92, scale),
      width: scaled(64, scale)
    },
    cardTitle: {
      color: colors.text,
      fontSize: scaled(30, scale),
      fontWeight: '800',
      left: scaled(28, scale),
      lineHeight: scaled(38, scale),
      position: 'absolute',
      top: scaled(27, scale),
      ...textBase
    },
    copyAddressButton: {
      height: scaled(64, scale),
      left: scaled(420, scale),
      position: 'absolute',
      top: scaled(92, scale),
      width: scaled(64, scale)
    },
    listDivider: {
      backgroundColor: '#E6E8EF',
      bottom: 0,
      height: 1,
      left: scaled(76, scale),
      position: 'absolute',
      right: 0
    },
    listRow: {
      height: scaled(78, scale),
      left: scaled(28, scale),
      position: 'absolute',
      width: scaled(760, scale)
    },
    listRowLabel: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '500',
      left: scaled(72, scale),
      lineHeight: scaled(35, scale),
      position: 'absolute',
      top: scaled(17, scale),
      ...textBase
    },
    logoutButton: {
      alignItems: 'center',
      borderColor: '#FF3B30',
      borderRadius: scaled(19, scale),
      borderWidth: 1,
      flexDirection: 'row',
      height: scaled(78, scale),
      justifyContent: 'center',
      left: scaled(28, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(1662, scale),
      width: scaled(808, scale)
    },
    logoutText: {
      color: '#FF3B30',
      fontSize: scaled(28, scale),
      fontWeight: '700',
      lineHeight: scaled(36, scale),
      marginLeft: scaled(16, scale),
      ...textBase
    },
    pageHeading: {
      height: scaledBelowTopNavigation(238, scale),
      position: 'absolute',
      top: 0,
      width: '100%'
    },
    pageSubtitle: {
      color: colors.textMuted,
      fontSize: scaled(25, scale),
      fontWeight: '400',
      left: scaled(37, scale),
      lineHeight: scaled(33, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(196, scale),
      ...textBase
    },
    pageTitle: {
      color: colors.text,
      fontSize: scaled(44, scale),
      fontWeight: fontWeights.pageTitle,
      left: scaled(37, scale),
      lineHeight: scaled(55, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(128, scale),
      ...textBase
    },
    root: {
      backgroundColor: colors.background,
      flex: 1
    },
    rowChevron: {
      alignItems: 'center',
      height: scaled(46, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(4, scale),
      top: scaled(15, scale),
      width: scaled(46, scale)
    },
    rpcCard: {
      backgroundColor: colors.surface,
      borderColor: '#E8EAF1',
      borderRadius: scaled(27, scale),
      borderWidth: 1,
      elevation: 1,
      height: scaled(330, scale),
      left: scaled(28, scale),
      position: 'absolute',
      shadowColor: '#151824',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.04,
      shadowRadius: 16,
      top: scaledBelowTopNavigation(949, scale),
      width: scaled(808, scale)
    },
    rpcChevron: {
      alignItems: 'center',
      height: scaled(52, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(31, scale),
      top: scaled(92, scale),
      width: scaled(52, scale)
    },
    rpcDot: {
      backgroundColor: '#236EFF',
      borderRadius: scaled(8, scale),
      height: scaled(16, scale),
      marginRight: scaled(14, scale),
      width: scaled(16, scale)
    },
    rpcGlobeIcon: {
      left: scaled(34, scale),
      position: 'absolute',
      top: scaled(86, scale)
    },
    rpcHealthyDot: {
      backgroundColor: '#18C772',
      borderRadius: scaled(7, scale),
      height: scaled(14, scale),
      left: scaled(117, scale),
      position: 'absolute',
      top: scaled(137, scale),
      width: scaled(14, scale)
    },
    rpcHealthyText: {
      color: '#10B965',
      fontSize: scaled(24, scale),
      fontWeight: '400',
      left: scaled(140, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      top: scaled(128, scale),
      ...textBase
    },
    rpcHint: {
      color: colors.textMuted,
      fontSize: scaled(20, scale),
      fontWeight: '400',
      left: scaled(34, scale),
      lineHeight: scaled(27, scale),
      position: 'absolute',
      top: scaled(250, scale),
      width: scaled(700, scale),
      ...textBase
    },
    rpcLabel: {
      color: '#FFFFFF',
      fontSize: scaled(24, scale),
      fontWeight: '500',
      lineHeight: scaled(31, scale),
      width: scaled(132, scale),
      ...textBase
    },
    rpcTab: {
      alignItems: 'center',
      borderColor: '#E3E6EF',
      borderRadius: scaled(11, scale),
      borderWidth: 1,
      height: scaled(54, scale),
      justifyContent: 'center',
      position: 'absolute',
      top: scaled(174, scale),
      width: scaled(228, scale)
    },
    rpcTabActive: {
      alignItems: 'center',
      backgroundColor: '#F2F7FF',
      borderColor: '#9EC1FF',
      borderRadius: scaled(11, scale),
      borderWidth: 1,
      height: scaled(54, scale),
      justifyContent: 'center',
      position: 'absolute',
      top: scaled(174, scale),
      width: scaled(228, scale)
    },
    rpcTabText: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '500',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    rpcTabTextActive: {
      color: colors.primary,
      fontSize: scaled(25, scale),
      fontWeight: '700',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    rpcUrl: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '500',
      left: scaled(118, scale),
      lineHeight: scaled(33, scale),
      position: 'absolute',
      top: scaled(92, scale),
      width: scaled(560, scale),
      ...textBase
    },
    customRpcInput: {
      borderColor: '#D9DEE9',
      borderRadius: scaled(13, scale),
      borderWidth: 1,
      color: colors.text,
      fontSize: scaled(22, scale),
      height: scaled(58, scale),
      left: scaled(32, scale),
      paddingHorizontal: scaled(16, scale),
      position: 'absolute',
      top: scaled(242, scale),
      width: scaled(744, scale),
      ...textBase
    },
    scrollContent: {
      backgroundColor: colors.background
    },
    scrollView: {
      backgroundColor: colors.background
    },
    securityCard: {
      backgroundColor: colors.surface,
      borderColor: '#E8EAF1',
      borderRadius: scaled(27, scale),
      borderWidth: 1,
      elevation: 1,
      height: scaled(337, scale),
      left: scaled(28, scale),
      position: 'absolute',
      shadowColor: '#151824',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.04,
      shadowRadius: 16,
      top: scaledBelowTopNavigation(1300, scale),
      width: scaled(808, scale)
    },
    securityChevron: {
      alignItems: 'center',
      height: scaled(44, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(5, scale),
      top: scaled(9, scale),
      width: scaled(44, scale)
    },
    securityDivider: {
      backgroundColor: '#E6E8EF',
      bottom: 0,
      height: 1,
      left: scaled(60, scale),
      position: 'absolute',
      right: 0
    },
    securityRow: {
      height: scaled(61, scale),
      left: scaled(28, scale),
      position: 'absolute',
      width: scaled(760, scale)
    },
    securityRowIcon: {
      left: 0,
      position: 'absolute',
      top: scaled(10, scale)
    },
    securityRowLabel: {
      color: colors.text,
      fontSize: scaled(26, scale),
      fontWeight: '500',
      left: scaled(64, scale),
      lineHeight: scaled(34, scale),
      position: 'absolute',
      top: scaled(12, scale),
      ...textBase
    },
    securityRowValue: {
      color: colors.textMuted,
      fontSize: scaled(25, scale),
      fontWeight: '400',
      lineHeight: scaled(32, scale),
      position: 'absolute',
      right: scaled(58, scale),
      textAlign: 'right',
      top: scaled(13, scale),
      width: scaled(150, scale),
      ...textBase
    },
    summaryAddress: {
      color: '#FFFFFF',
      fontSize: scaled(38, scale),
      fontWeight: '800',
      left: scaled(30, scale),
      lineHeight: scaled(50, scale),
      position: 'absolute',
      top: scaled(106, scale),
      width: scaled(364, scale),
      ...textBase
    },
    summaryArtwork: {
      height: '100%',
      left: 0,
      position: 'absolute',
      top: 0,
      width: '100%'
    },
    summaryCard: {
      backgroundColor: colors.black,
      borderRadius: scaled(28, scale),
      height: scaled(274, scale),
      left: scaled(28, scale),
      overflow: 'hidden',
      position: 'absolute',
      top: scaledBelowTopNavigation(238, scale),
      width: scaled(808, scale)
    },
    summaryLabel: {
      color: '#D6D9E2',
      fontSize: scaled(25, scale),
      fontWeight: '500',
      left: scaled(30, scale),
      lineHeight: scaled(32, scale),
      position: 'absolute',
      top: scaled(42, scale),
      ...textBase
    },
    summaryShade: {
      height: '100%',
      left: 0,
      position: 'absolute',
      top: 0,
      width: '100%'
    },
    summaryRpcStatus: {
      alignItems: 'center',
      flexDirection: 'row',
      height: scaled(48, scale),
      marginLeft: scaled(20, scale)
    },
    summaryStatusRow: {
      alignItems: 'center',
      flexDirection: 'row',
      height: scaled(50, scale),
      left: scaled(30, scale),
      position: 'absolute',
      top: scaled(180, scale)
    },
    unlockBadge: {
      alignItems: 'center',
      backgroundColor: '#0E3B26CC',
      borderColor: '#1CBF72',
      borderRadius: scaled(22, scale),
      borderWidth: 1,
      flexDirection: 'row',
      height: scaled(44, scale),
      justifyContent: 'center',
      minWidth: scaled(124, scale),
      paddingHorizontal: scaled(12, scale)
    },
    unlockBadgeText: {
      color: '#38E38E',
      fontSize: scaled(23, scale),
      fontWeight: '700',
      lineHeight: scaled(29, scale),
      marginLeft: scaled(5, scale),
      ...textBase
    },
    walletCard: {
      backgroundColor: colors.surface,
      borderColor: '#E8EAF1',
      borderRadius: scaled(27, scale),
      borderWidth: 1,
      elevation: 1,
      height: scaled(390, scale),
      left: scaled(28, scale),
      position: 'absolute',
      shadowColor: '#151824',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.04,
      shadowRadius: 16,
      top: scaledBelowTopNavigation(535, scale),
      width: scaled(808, scale)
    },
    walletRowIcon: {
      left: 0,
      position: 'absolute',
      top: scaled(17, scale)
    },
    walletRowValue: {
      color: colors.textMuted,
      fontSize: scaled(25, scale),
      fontWeight: '400',
      lineHeight: scaled(32, scale),
      position: 'absolute',
      right: scaled(58, scale),
      textAlign: 'right',
      top: scaled(18, scale),
      width: scaled(220, scale),
      ...textBase
    }
  });
}
