import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { colors, fontFamilies } from '../theme/tokens';
import { formatShortAddress } from '../utils/walletSetup';
import { generateQrMatrix, type QrMatrix } from '../utils/qrCode';
import { FastDialogModal } from './FastDialogModal';

type AddressActionDialogProps = {
  readonly address: string;
  readonly message?: string;
  readonly onClose: () => void;
  readonly onCopyPress: () => void;
  readonly scale: number;
  readonly title?: string;
  readonly visible: boolean;
};

type QrState = {
  readonly errorMessage: string;
  readonly matrix: QrMatrix;
};

const webNoFocusOutline = Platform.OS === 'web'
  ? ({ outlineColor: 'transparent', outlineStyle: 'none', outlineWidth: 0 } as unknown as ViewStyle)
  : undefined;

function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

export function AddressActionDialog({
  address,
  message = '请核对完整地址后扫码或复制。',
  onClose,
  onCopyPress,
  scale,
  title = '地址二维码',
  visible
}: AddressActionDialogProps) {
  const effectiveScale = Math.min(scale, 1);
  const styles = createStyles(effectiveScale);
  const qrSize = Math.max(188, scaled(330, effectiveScale));
  const qrState = useMemo(() => createQrState(address), [address]);
  const displayAddress = address ? formatShortAddress(address, 8, 8) : '未创建钱包';

  return (
    <FastDialogModal onRequestClose={onClose} visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.dialogCard}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{qrState.errorMessage || message}</Text>

          <View style={styles.qrFrame}>
            {qrState.matrix.length > 0 ? <AddressQrMatrix matrix={qrState.matrix} size={qrSize} /> : <Text style={styles.qrError}>二维码不可用</Text>}
          </View>

          <Text numberOfLines={1} style={styles.shortAddress}>{displayAddress}</Text>
          <Text selectable style={styles.fullAddress}>{address || '当前没有可复制的钱包地址'}</Text>

          <View style={styles.actionRow}>
            <Pressable accessibilityRole="button" onPress={onCopyPress} style={[styles.copyButton, webNoFocusOutline]}>
              <Text style={styles.copyButtonText}>复制地址</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onClose} style={[styles.closeButton, webNoFocusOutline]}>
              <Text style={styles.closeButtonText}>关闭</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </FastDialogModal>
  );
}

function createQrState(address: string): QrState {
  if (!address) {
    return {
      errorMessage: '当前没有可展示的钱包地址',
      matrix: []
    };
  }

  try {
    return {
      errorMessage: '',
      matrix: generateQrMatrix(address)
    };
  } catch (error) {
    return {
      errorMessage: error instanceof Error ? error.message : String(error),
      matrix: []
    };
  }
}

function AddressQrMatrix({ matrix, size }: { readonly matrix: QrMatrix; readonly size: number }) {
  const matrixSize = matrix.length;

  return (
    <Svg height={size} viewBox={`0 0 ${matrixSize} ${matrixSize}`} width={size}>
      <Rect fill="#FFFFFF" height={matrixSize} width={matrixSize} x={0} y={0} />
      {matrix.map((row, rowIndex) => (
        row.map((isDark, columnIndex) => (
          isDark ? <Rect fill="#11131A" height={1} key={`${rowIndex}-${columnIndex}`} width={1} x={columnIndex} y={rowIndex} /> : null
        ))
      ))}
    </Svg>
  );
}

function createStyles(scale: number) {
  // 功能目的：展示地址复制和二维码反馈；实现原因：复制/二维码按钮必须产生明确可见状态。
  const textBase = {
    fontFamily: fontFamilies.system,
    includeFontPadding: false
  } as const;
  const qrFrameSize = Math.max(214, scaled(362, scale));

  return StyleSheet.create({
    actionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: scaled(28, scale),
      width: '100%'
    },
    closeButton: {
      alignItems: 'center',
      backgroundColor: '#F3F5FA',
      borderRadius: scaled(8, scale),
      height: scaled(70, scale),
      justifyContent: 'center',
      width: '47%'
    },
    closeButtonText: {
      color: '#303541',
      fontSize: scaled(25, scale),
      fontWeight: '700',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    copyButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: scaled(8, scale),
      height: scaled(70, scale),
      justifyContent: 'center',
      width: '47%'
    },
    copyButtonText: {
      color: '#FFFFFF',
      fontSize: scaled(25, scale),
      fontWeight: '800',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    dialogCard: {
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderColor: '#E7EAF2',
      borderRadius: scaled(8, scale),
      borderWidth: 1,
      paddingBottom: scaled(30, scale),
      paddingHorizontal: scaled(30, scale),
      paddingTop: scaled(30, scale),
      width: Math.max(320, scaled(640, scale))
    },
    fullAddress: {
      color: '#555D6E',
      fontSize: scaled(22, scale),
      fontWeight: '500',
      lineHeight: scaled(31, scale),
      marginTop: scaled(14, scale),
      textAlign: 'center',
      width: '100%',
      ...textBase
    },
    message: {
      color: colors.textMuted,
      fontSize: scaled(23, scale),
      fontWeight: '500',
      lineHeight: scaled(32, scale),
      marginTop: scaled(14, scale),
      minHeight: scaled(32, scale),
      textAlign: 'center',
      ...textBase
    },
    overlay: {
      alignItems: 'center',
      backgroundColor: 'rgba(9, 11, 18, 0.52)',
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 24
    },
    qrError: {
      color: '#D33B3B',
      fontSize: scaled(23, scale),
      fontWeight: '700',
      lineHeight: scaled(31, scale),
      ...textBase
    },
    qrFrame: {
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderColor: '#DDE2EC',
      borderRadius: scaled(8, scale),
      borderWidth: 1,
      height: qrFrameSize,
      justifyContent: 'center',
      marginTop: scaled(24, scale),
      width: qrFrameSize
    },
    shortAddress: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '900',
      lineHeight: scaled(36, scale),
      marginTop: scaled(23, scale),
      textAlign: 'center',
      width: '100%',
      ...textBase
    },
    title: {
      color: colors.text,
      fontSize: scaled(34, scale),
      fontWeight: '900',
      lineHeight: scaled(43, scale),
      textAlign: 'center',
      ...textBase
    }
  });
}
