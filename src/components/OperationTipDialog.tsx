import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, Stop } from 'react-native-svg';
import { colors, fontFamilies } from '../theme/tokens';

const DIALOG_LEFT = 161;
const DIALOG_TOP = 599;
const DIALOG_WIDTH = 535;
const DIALOG_HEIGHT = 652;

type SvgIconProps = {
  readonly size: number;
};

type OperationTipDialogProps = {
  readonly blockEstimate?: string;
  readonly message?: string;
  readonly onClose: () => void;
  readonly onDetailPress?: () => void;
  readonly scale: number;
  readonly statusText?: string;
  readonly title?: string;
  readonly visible: boolean;
};

function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

export function OperationTipDialog({
  blockEstimate = '预计 1-2 个区块',
  message = '交易已提交到公网 RPC，正在等待链上确认。',
  onClose,
  onDetailPress,
  scale,
  statusText = '处理中',
  title = '操作提示',
  visible
}: OperationTipDialogProps) {
  const styles = createStyles(scale);

  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.dialogCard}>
          <View style={styles.heroIcon}>
            <DialogInfoLargeIcon size={scaled(106, scale)} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.summaryRow}>
            <View style={styles.statusPill}>
              <StatusProcessingIcon size={scaled(32, scale)} />
              <Text style={styles.statusLabel}>状态：</Text>
              <Text style={styles.statusValue}>{statusText}</Text>
            </View>
            <View style={styles.blockPill}>
              <EstimatedBlockIcon size={scaled(32, scale)} />
              <Text style={styles.blockText}>{blockEstimate}</Text>
            </View>
          </View>

          <Pressable accessibilityRole="button" onPress={onClose} style={styles.primaryButton}>
            {({ pressed }) => (
              <LinearGradient
                colors={['#09B7FF', '#7843FF', '#D635FF']}
                end={{ x: 1, y: 0.5 }}
                start={{ x: 0, y: 0.5 }}
                style={pressed ? styles.primaryButtonPressed : styles.primaryButtonBorder}
              >
                <View style={styles.primaryButtonInner}>
                  <Text style={styles.primaryButtonText}>知道了</Text>
                </View>
              </LinearGradient>
            )}
          </Pressable>

          <Pressable accessibilityRole="button" onPress={onDetailPress} style={styles.detailButton}>
            <Text style={styles.detailText}>查看详情</Text>
          </Pressable>

          <View style={styles.resultRow}>
            <View style={styles.resultPill}>
              <ResultSuccessIcon size={scaled(32, scale)} />
              <Text style={styles.resultText}>成功</Text>
            </View>
            <View style={styles.resultPill}>
              <ResultInfoIcon size={scaled(32, scale)} />
              <Text style={styles.resultText}>提示</Text>
            </View>
            <View style={styles.resultPill}>
              <ResultRiskIcon size={scaled(32, scale)} />
              <Text style={styles.resultText}>风险</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function DialogInfoLargeIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 96 96" width={size}>
      <Defs>
        <SvgLinearGradient gradientUnits="userSpaceOnUse" id="dialogInfoRing" x1="22" x2="74" y1="14" y2="82">
          <Stop stopColor="#2F7BFF" />
          <Stop offset="0.55" stopColor="#625BFF" />
          <Stop offset="1" stopColor="#9B3DFF" />
        </SvgLinearGradient>
        <SvgLinearGradient gradientUnits="userSpaceOnUse" id="dialogInfoSoft" x1="16" x2="80" y1="16" y2="80">
          <Stop stopColor="#E7E9FF" />
          <Stop offset="1" stopColor="#F4EAFF" />
        </SvgLinearGradient>
      </Defs>
      <Circle cx="48" cy="48" fill="url(#dialogInfoSoft)" opacity="0.95" r="38" />
      <Circle
        cx="48"
        cy="48"
        r="31"
        stroke="url(#dialogInfoRing)"
        strokeDasharray="130 22"
        strokeLinecap="round"
        strokeWidth="4"
      />
      <Circle cx="48" cy="26" fill="#456BFF" r="4" />
      <Path d="M48 41V62" stroke="url(#dialogInfoRing)" strokeLinecap="round" strokeWidth="5" />
      <Circle cx="62" cy="70" fill="#8252FF" r="4" />
    </Svg>
  );
}

function StatusProcessingIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Circle cx="16" cy="16" r="10" stroke="#765BFF" strokeWidth="2.4" />
      <Path d="M16 10V16L20 19" stroke="#765BFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
    </Svg>
  );
}

function EstimatedBlockIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Path d="M16 5L25 10V21L16 27L7 21V10L16 5Z" stroke="#5F6675" strokeLinejoin="round" strokeWidth="2.2" />
      <Path d="M7.5 10.5L16 15.5L24.5 10.5" stroke="#5F6675" strokeLinejoin="round" strokeWidth="2.2" />
      <Path d="M16 15.5V26.5" stroke="#5F6675" strokeLinecap="round" strokeWidth="2.2" />
    </Svg>
  );
}

function ResultSuccessIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Circle cx="16" cy="16" r="10" stroke="#20C978" strokeWidth="2.4" />
      <Path d="M11.5 16.4L14.7 19.6L21.2 12.8" stroke="#20C978" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.6" />
    </Svg>
  );
}

function ResultInfoIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Circle cx="16" cy="16" r="10" stroke="#2F7BFF" strokeWidth="2.4" />
      <Circle cx="16" cy="11" fill="#2F7BFF" r="1.7" />
      <Path d="M16 15.5V21.5" stroke="#2F7BFF" strokeLinecap="round" strokeWidth="2.5" />
    </Svg>
  );
}

function ResultRiskIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Path d="M16 4.8L26 9.2V17C26 24.3 21.7 28.7 16 31C10.3 28.7 6 24.3 6 17V9.2L16 4.8Z" stroke="#8B3DFF" strokeLinejoin="round" strokeWidth="2.4" />
      <Path d="M16 12V18" stroke="#8B3DFF" strokeLinecap="round" strokeWidth="2.4" />
      <Circle cx="16" cy="22.5" fill="#8B3DFF" r="1.5" />
    </Svg>
  );
}

function createStyles(scale: number) {
  const textBase = {
    fontFamily: fontFamilies.system,
    includeFontPadding: false
  } as const;

  return StyleSheet.create({
    blockPill: {
      alignItems: 'center',
      backgroundColor: '#F7F8FC',
      borderRadius: scaled(19, scale),
      flexDirection: 'row',
      height: scaled(58, scale),
      justifyContent: 'center',
      marginLeft: scaled(20, scale),
      width: scaled(235, scale)
    },
    blockText: {
      color: '#1B1D27',
      fontSize: scaled(24, scale),
      fontWeight: '500',
      lineHeight: scaled(31, scale),
      marginLeft: scaled(12, scale),
      ...textBase
    },
    detailButton: {
      alignItems: 'center',
      height: scaled(54, scale),
      justifyContent: 'center',
      left: scaled(187, scale),
      position: 'absolute',
      top: scaled(492, scale),
      width: scaled(160, scale)
    },
    detailText: {
      color: colors.primary,
      fontSize: scaled(24, scale),
      fontWeight: '700',
      lineHeight: scaled(31, scale),
      ...textBase
    },
    dialogCard: {
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: scaled(28, scale),
      height: scaled(DIALOG_HEIGHT, scale),
      left: scaled(DIALOG_LEFT, scale),
      position: 'absolute',
      shadowColor: '#070A12',
      shadowOffset: { width: 0, height: scaled(18, scale) },
      shadowOpacity: 0.22,
      shadowRadius: scaled(38, scale),
      top: scaled(DIALOG_TOP, scale),
      width: scaled(DIALOG_WIDTH, scale),
      elevation: 18
    },
    heroIcon: {
      left: scaled(214, scale),
      position: 'absolute',
      top: scaled(50, scale)
    },
    message: {
      color: '#1E212C',
      fontSize: scaled(24, scale),
      fontWeight: '400',
      left: scaled(55, scale),
      lineHeight: scaled(32, scale),
      position: 'absolute',
      textAlign: 'center',
      top: scaled(250, scale),
      width: scaled(422, scale),
      ...textBase
    },
    overlay: {
      backgroundColor: 'rgba(6, 8, 14, 0.58)',
      flex: 1,
      position: 'relative'
    },
    primaryButton: {
      height: scaled(73, scale),
      left: scaled(33, scale),
      position: 'absolute',
      top: scaled(395, scale),
      width: scaled(467, scale)
    },
    primaryButtonBorder: {
      borderRadius: scaled(20, scale),
      height: '100%',
      padding: scaled(2, scale),
      width: '100%'
    },
    primaryButtonInner: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderRadius: scaled(18, scale),
      flex: 1,
      justifyContent: 'center'
    },
    primaryButtonPressed: {
      borderRadius: scaled(20, scale),
      height: '100%',
      opacity: 0.82,
      padding: scaled(2, scale),
      width: '100%'
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: scaled(26, scale),
      fontWeight: '800',
      lineHeight: scaled(34, scale),
      ...textBase
    },
    resultPill: {
      alignItems: 'center',
      backgroundColor: '#F7F8FC',
      borderRadius: scaled(19, scale),
      flexDirection: 'row',
      height: scaled(58, scale),
      justifyContent: 'center',
      width: scaled(136, scale)
    },
    resultRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      left: scaled(31, scale),
      position: 'absolute',
      top: scaled(560, scale),
      width: scaled(470, scale)
    },
    resultText: {
      color: '#1B1D27',
      fontSize: scaled(24, scale),
      fontWeight: '500',
      lineHeight: scaled(31, scale),
      marginLeft: scaled(10, scale),
      ...textBase
    },
    statusLabel: {
      color: '#1B1D27',
      fontSize: scaled(24, scale),
      fontWeight: '500',
      lineHeight: scaled(31, scale),
      marginLeft: scaled(9, scale),
      ...textBase
    },
    statusPill: {
      alignItems: 'center',
      backgroundColor: '#F7F8FC',
      borderRadius: scaled(19, scale),
      flexDirection: 'row',
      height: scaled(58, scale),
      justifyContent: 'center',
      width: scaled(215, scale)
    },
    statusValue: {
      color: colors.primary,
      fontSize: scaled(24, scale),
      fontWeight: '700',
      lineHeight: scaled(31, scale),
      ...textBase
    },
    summaryRow: {
      flexDirection: 'row',
      left: scaled(31, scale),
      position: 'absolute',
      top: scaled(303, scale),
      width: scaled(470, scale)
    },
    title: {
      color: colors.text,
      fontSize: scaled(34, scale),
      fontWeight: '900',
      lineHeight: scaled(42, scale),
      position: 'absolute',
      textAlign: 'center',
      top: scaled(185, scale),
      width: scaled(320, scale),
      ...textBase
    }
  });
}
