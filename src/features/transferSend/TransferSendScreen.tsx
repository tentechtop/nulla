import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getGlobalHeaderHeight } from '../../components/GlobalHeader';
import { HeaderScanSvgIcon } from '../../components/HeaderSvgIcons';
import { colors, fontFamilies } from '../../theme/tokens';
import { transferSendImages } from './designAssets';
import {
  AddressContactIcon,
  BackChevronIcon,
  ChevronRightIcon,
  CurrentRouteIcon,
  InfoIcon,
  RouteMaskIcon,
  RouteShieldIcon
} from './TransferSendSvgIcons';
import { useTransferSendResponsiveLayout } from './useTransferSendResponsiveLayout';

const AVAILABLE_SOL = '99,999,999.958218';
const TOP_NAVIGATION_DESIGN_HEIGHT = 117;

const modeOptions = [
  { key: 'auto', title: '自动', subtitle: '推荐' },
  { key: 'transparent', title: '透明', subtitle: '速度最快' },
  { key: 'private', title: '隐私', subtitle: '保护隐私' },
  { key: 'privateToTransparent', title: '隐私转透明', subtitle: '跨类型转账' }
] as const;

type ModeOption = (typeof modeOptions)[number];
type ModeOptionKey = (typeof modeOptions)[number]['key'];

type TransferSendScreenProps = {
  readonly bottomPadding?: number;
  readonly onBackPress?: () => void;
  readonly onScanPress?: () => void;
  readonly topPadding?: number;
};

function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

function scaledBelowTopNavigation(value: number, scale: number) {
  return scaled(value - TOP_NAVIGATION_DESIGN_HEIGHT, scale);
}

function sanitizeAddressInput(nextValue: string) {
  return nextValue.replace(/\s/g, '').slice(0, 64);
}

function sanitizeLamportsInput(nextValue: string) {
  return nextValue.replace(/[^\d]/g, '').slice(0, 18);
}

export function TransferSendScreen({ bottomPadding, onBackPress, onScanPress, topPadding }: TransferSendScreenProps) {
  const layoutMetrics = useTransferSendResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const headerHeight = getGlobalHeaderHeight(layoutMetrics.scale);
  const resolvedBottomPadding = bottomPadding ?? layoutMetrics.bottomNavHeight;
  const resolvedTopPadding = topPadding ?? layoutMetrics.topSafeArea + headerHeight;
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedMode, setSelectedMode] = useState<ModeOptionKey>('auto');

  const handleAddressChange = (nextValue: string) => {
    setAddress(sanitizeAddressInput(nextValue));
  };

  const handleAmountChange = (nextValue: string) => {
    setAmount(sanitizeLamportsInput(nextValue));
  };

  const handleUseAllBalance = () => {
    setAmount('99999999995821800');
  };

  const handleCheckRoute = () => {
    console.info('[transfer-send] route check requested', {
      hasAddress: address.length > 0,
      hasAmount: amount.length > 0,
      mode: selectedMode
    });
  };

  const handleConfirmSend = () => {
    console.info('[transfer-send] confirm send requested', {
      hasAddress: address.length > 0,
      hasAmount: amount.length > 0,
      mode: selectedMode
    });
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
        keyboardShouldPersistTaps="handled"
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.canvas}>
          <Header onBackPress={onBackPress} scale={layoutMetrics.scale} styles={styles} />
          <RouteEstimateCard scale={layoutMetrics.scale} styles={styles} />
          <TransferFormCard
            address={address}
            amount={amount}
            onAddressChange={handleAddressChange}
            onAmountChange={handleAmountChange}
            onModeChange={setSelectedMode}
            onScanPress={onScanPress}
            onUseAllBalance={handleUseAllBalance}
            scale={layoutMetrics.scale}
            selectedMode={selectedMode}
            styles={styles}
          />
          <FeeSummaryCard scale={layoutMetrics.scale} styles={styles} />
          <CurrentRouteCard scale={layoutMetrics.scale} styles={styles} />
          <Pressable accessibilityRole="button" onPress={handleConfirmSend} style={styles.primaryButtonOuter}>
            {({ pressed }) => (
              <View style={pressed ? styles.pressedButtonWrapper : styles.normalButtonWrapper}>
                <LinearGradient
                  colors={['#0B72FF', '#613CFF', '#B332FF']}
                  end={{ x: 1, y: 0.5 }}
                  start={{ x: 0, y: 0.5 }}
                  style={styles.primaryButtonGradient}
                >
                  <View style={styles.primaryButtonInner}>
                    <Text style={styles.primaryButtonText}>确认发送</Text>
                  </View>
                </LinearGradient>
              </View>
            )}
          </Pressable>
          <Pressable accessibilityRole="button" onPress={handleCheckRoute} style={styles.checkRouteButton}>
            <Text style={styles.checkRouteText}>检查路由</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function Header({
  onBackPress,
  scale,
  styles
}: {
  readonly onBackPress?: () => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityLabel="返回" accessibilityRole="button" onPress={onBackPress} style={styles.backButton}>
        <BackChevronIcon size={scaled(48, scale)} />
      </Pressable>
      <Text style={styles.title}>发送</Text>
      <Text style={styles.subtitle}>透明 / 隐私自动路由</Text>
    </View>
  );
}

function RouteEstimateCard({ scale, styles }: { readonly scale: number; readonly styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.routeCard}>
      <Image resizeMode="cover" source={transferSendImages.routeArtwork} style={styles.routeArtwork} />
      <LinearGradient
        colors={['#050507', '#050507F2', '#05050700']}
        end={{ x: 1, y: 0.5 }}
        start={{ x: 0, y: 0.5 }}
        style={styles.routeArtworkShade}
      />
      <Text style={styles.routeTitle}>路由预估</Text>
      <View style={styles.routeTitleInfoIcon}>
        <InfoIcon size={scaled(25, scale)} />
      </View>
      <View style={styles.routeStatusGroup}>
        <View style={styles.routeStatusDot} />
        <View style={styles.routeStatusTextPanel}>
          <Text style={styles.routeStatusText}>可发送</Text>
        </View>
      </View>

      <View style={styles.transparentIcon}>
        <RouteShieldIcon size={scaled(64, scale)} />
      </View>
      <Text style={styles.transparentLabel}>透明余额</Text>
      <Text style={styles.transparentAmount}>{AVAILABLE_SOL}</Text>
      <Text style={styles.transparentSymbol}>SOL</Text>

      <View style={styles.privateIcon}>
        <RouteMaskIcon size={scaled(64, scale)} />
      </View>
      <Text style={styles.privateLabel}>隐私可用</Text>
      <Text style={styles.privateAmount}>0.000000</Text>
      <Text style={styles.privateSymbol}>SOL</Text>

      <View style={styles.routeDivider} />
      <Text style={styles.routeStrategyLabel}>路由策略</Text>
      <LinearGradient
        colors={['#15DFF0', '#993DFF']}
        end={{ x: 1, y: 0.5 }}
        start={{ x: 0, y: 0.5 }}
        style={styles.routeStrategyPillBorder}
      >
        <View style={styles.routeStrategyPillInner}>
          <Text style={styles.routeStrategyPillText}>自动选择</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function TransferFormCard({
  address,
  amount,
  onAddressChange,
  onAmountChange,
  onModeChange,
  onScanPress,
  onUseAllBalance,
  scale,
  selectedMode,
  styles
}: {
  readonly address: string;
  readonly amount: string;
  readonly onAddressChange: (nextValue: string) => void;
  readonly onAmountChange: (nextValue: string) => void;
  readonly onModeChange: (nextValue: ModeOptionKey) => void;
  readonly onScanPress?: () => void;
  readonly onUseAllBalance: () => void;
  readonly scale: number;
  readonly selectedMode: ModeOptionKey;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.formCard}>
      <Text style={styles.addressLabel}>收款地址</Text>
      <View style={styles.addressInputBox}>
        <TextInput
          accessibilityLabel="收款地址"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={64}
          onChangeText={onAddressChange}
          placeholder="输入或粘贴 SOL 地址"
          placeholderTextColor="#9AA0AE"
          selectionColor={colors.primary}
          style={styles.addressInputText}
          underlineColorAndroid="transparent"
          value={address}
        />
        <Pressable accessibilityLabel="选择联系人" accessibilityRole="button" style={styles.addressContactButton}>
          <AddressContactIcon size={scaled(48, scale)} />
        </Pressable>
        <View style={styles.addressActionDivider} />
        <Pressable accessibilityLabel="扫码输入地址" accessibilityRole="button" onPress={onScanPress} style={styles.addressScanButton}>
          <HeaderScanSvgIcon size={scaled(48, scale)} />
        </Pressable>
      </View>

      <Text style={styles.amountLabel}>数量（lamports）</Text>
      <View style={styles.amountInputBox}>
        <TextInput
          accessibilityLabel="转账数量"
          keyboardType="number-pad"
          maxLength={18}
          onChangeText={onAmountChange}
          placeholder="请输入数量"
          placeholderTextColor="#9AA0AE"
          selectionColor={colors.primary}
          style={styles.amountInputText}
          underlineColorAndroid="transparent"
          value={amount}
        />
        <Text style={styles.amountSymbol}>SOL</Text>
        <Pressable accessibilityRole="button" onPress={onUseAllBalance} style={styles.useAllButton}>
          <Text style={styles.useAllText}>全部</Text>
        </Pressable>
      </View>
      <Text style={styles.availableText}>可用 {AVAILABLE_SOL} SOL</Text>

      <Text style={styles.modeLabel}>转账模式</Text>
      <View style={styles.modeSegmented}>
        {modeOptions.map((option, index) => {
          const isSelected = selectedMode === option.key;

          return (
            <TransferModeOption
              index={index}
              isSelected={isSelected}
              key={option.key}
              onModeChange={onModeChange}
              option={option}
              styles={styles}
            />
          );
        })}
      </View>
    </View>
  );
}

function TransferModeOption({
  index,
  isSelected,
  onModeChange,
  option,
  styles
}: {
  readonly index: number;
  readonly isSelected: boolean;
  readonly onModeChange: (mode: ModeOptionKey) => void;
  readonly option: ModeOption;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={() => onModeChange(option.key)}
      style={styles.modeOption}
    >
      {index > 0 && !isSelected ? <View style={styles.modeOptionDivider} /> : null}
      <View style={isSelected ? styles.modeOptionContentActive : styles.modeOptionContent}>
        <Text style={isSelected ? styles.modeTitleActive : styles.modeTitle}>{option.title}</Text>
        <Text style={isSelected ? styles.modeSubtitleActive : styles.modeSubtitle}>{option.subtitle}</Text>
      </View>
    </Pressable>
  );
}

function FeeSummaryCard({ scale, styles }: { readonly scale: number; readonly styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.feeCard}>
      <View style={styles.feeDividerLeft} />
      <View style={styles.feeDividerRight} />
      <Text style={styles.networkFeeLabel}>网络费</Text>
      <Text style={styles.networkFeeValue}>0.000005 <Text style={styles.feeSymbol}>SOL</Text></Text>
      <Text style={styles.networkFeeSub}>(5,000 lamports)</Text>
      <Text style={styles.computeLabel}>compute</Text>
      <View style={styles.computeInfoIcon}>
        <InfoIcon size={scaled(22, scale)} />
      </View>
      <Text style={styles.computeValue}>200,000 CU</Text>
      <Text style={styles.computeSub}>(~0.000004 SOL)</Text>
      <Text style={styles.confirmLabel}>预计确认</Text>
      <Text style={styles.confirmValue}>~1.5 秒</Text>
      <Text style={styles.confirmSub}>（约 1 个区块）</Text>
    </View>
  );
}

function CurrentRouteCard({ scale, styles }: { readonly scale: number; readonly styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.currentRouteCard}>
      <View style={styles.currentRouteIcon}>
        <CurrentRouteIcon height={scaled(48, scale)} width={scaled(128, scale)} />
      </View>
      <Text style={styles.currentRouteTitle}>当前路径：透明账户 → 收款账户</Text>
      <Text style={styles.currentRouteSub}>自动路由 | 透明直发</Text>
      <View style={styles.currentRouteChevron}>
        <ChevronRightIcon size={scaled(42, scale)} />
      </View>
    </View>
  );
}

function createStyles(scale: number) {
  const textBase = {
    fontFamily: fontFamilies.system,
    includeFontPadding: false
  } as const;

  return StyleSheet.create({
    addressActionDivider: {
      backgroundColor: '#E6E8EF',
      height: scaled(44, scale),
      left: scaled(656, scale),
      position: 'absolute',
      top: scaled(24, scale),
      width: 1
    },
    addressContactButton: {
      alignItems: 'center',
      height: scaled(64, scale),
      justifyContent: 'center',
      left: scaled(582, scale),
      position: 'absolute',
      top: scaled(14, scale),
      width: scaled(64, scale)
    },
    addressInputBox: {
      borderColor: '#E5E7EF',
      borderRadius: scaled(21, scale),
      borderWidth: 1,
      height: scaled(94, scale),
      left: scaled(30, scale),
      position: 'absolute',
      top: scaled(75, scale),
      width: scaled(752, scale)
    },
    addressInputText: {
      color: colors.text,
      fontSize: scaled(25, scale),
      height: scaled(92, scale),
      left: scaled(28, scale),
      lineHeight: scaled(34, scale),
      padding: 0,
      position: 'absolute',
      top: 0,
      width: scaled(520, scale),
      ...textBase
    },
    addressLabel: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '600',
      left: scaled(30, scale),
      lineHeight: scaled(33, scale),
      position: 'absolute',
      top: scaled(31, scale),
      ...textBase
    },
    addressScanButton: {
      alignItems: 'center',
      height: scaled(64, scale),
      justifyContent: 'center',
      left: scaled(670, scale),
      position: 'absolute',
      top: scaled(14, scale),
      width: scaled(64, scale)
    },
    amountInputBox: {
      borderColor: '#E5E7EF',
      borderRadius: scaled(21, scale),
      borderWidth: 1,
      height: scaled(92, scale),
      left: scaled(30, scale),
      position: 'absolute',
      top: scaled(248, scale),
      width: scaled(752, scale)
    },
    amountInputText: {
      color: colors.text,
      fontSize: scaled(25, scale),
      height: scaled(90, scale),
      left: scaled(28, scale),
      lineHeight: scaled(34, scale),
      padding: 0,
      position: 'absolute',
      top: 0,
      width: scaled(510, scale),
      ...textBase
    },
    amountLabel: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '600',
      left: scaled(30, scale),
      lineHeight: scaled(33, scale),
      position: 'absolute',
      top: scaled(205, scale),
      ...textBase
    },
    amountSymbol: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '500',
      lineHeight: scaled(34, scale),
      position: 'absolute',
      right: scaled(112, scale),
      top: scaled(29, scale),
      ...textBase
    },
    availableText: {
      color: '#7C828F',
      fontSize: scaled(22, scale),
      fontWeight: '400',
      left: scaled(30, scale),
      lineHeight: scaled(28, scale),
      position: 'absolute',
      top: scaled(361, scale),
      ...textBase
    },
    backButton: {
      alignItems: 'center',
      height: scaled(64, scale),
      justifyContent: 'center',
      left: scaled(32, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(132, scale),
      width: scaled(56, scale)
    },
    canvas: {
      backgroundColor: colors.background,
      height: scaledBelowTopNavigation(1712, scale),
      position: 'relative',
      width: '100%'
    },
    checkRouteButton: {
      alignItems: 'center',
      height: scaled(58, scale),
      justifyContent: 'center',
      left: scaled(314, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(1648, scale),
      width: scaled(236, scale)
    },
    checkRouteText: {
      color: colors.primary,
      fontSize: scaled(25, scale),
      fontWeight: '600',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    computeInfoIcon: {
      left: scaled(415, scale),
      position: 'absolute',
      top: scaled(31, scale)
    },
    computeLabel: {
      color: colors.textMuted,
      fontSize: scaled(22, scale),
      fontWeight: '400',
      left: scaled(314, scale),
      lineHeight: scaled(28, scale),
      position: 'absolute',
      top: scaled(31, scale),
      ...textBase
    },
    computeSub: {
      color: colors.textMuted,
      fontSize: scaled(21, scale),
      fontWeight: '400',
      left: scaled(314, scale),
      lineHeight: scaled(28, scale),
      position: 'absolute',
      top: scaled(101, scale),
      ...textBase
    },
    computeValue: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '700',
      left: scaled(314, scale),
      lineHeight: scaled(34, scale),
      position: 'absolute',
      top: scaled(67, scale),
      ...textBase
    },
    confirmLabel: {
      color: colors.textMuted,
      fontSize: scaled(22, scale),
      fontWeight: '400',
      left: scaled(621, scale),
      lineHeight: scaled(28, scale),
      position: 'absolute',
      top: scaled(31, scale),
      ...textBase
    },
    confirmSub: {
      color: colors.textMuted,
      fontSize: scaled(21, scale),
      fontWeight: '400',
      left: scaled(621, scale),
      lineHeight: scaled(28, scale),
      position: 'absolute',
      top: scaled(101, scale),
      ...textBase
    },
    confirmValue: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '700',
      left: scaled(621, scale),
      lineHeight: scaled(34, scale),
      position: 'absolute',
      top: scaled(67, scale),
      ...textBase
    },
    currentRouteCard: {
      backgroundColor: colors.surface,
      borderColor: '#E5E7EF',
      borderRadius: scaled(26, scale),
      borderWidth: 1,
      height: scaled(116, scale),
      left: scaled(26, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(1386, scale),
      width: scaled(812, scale)
    },
    currentRouteChevron: {
      alignItems: 'center',
      height: scaled(54, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(30, scale),
      top: scaled(31, scale),
      width: scaled(54, scale)
    },
    currentRouteIcon: {
      left: scaled(54, scale),
      position: 'absolute',
      top: scaled(34, scale)
    },
    currentRouteSub: {
      color: colors.textMuted,
      fontSize: scaled(23, scale),
      fontWeight: '400',
      left: scaled(194, scale),
      lineHeight: scaled(30, scale),
      position: 'absolute',
      top: scaled(72, scale),
      ...textBase
    },
    currentRouteTitle: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '600',
      left: scaled(194, scale),
      lineHeight: scaled(32, scale),
      position: 'absolute',
      top: scaled(28, scale),
      ...textBase
    },
    feeCard: {
      backgroundColor: colors.surface,
      borderColor: '#E5E7EF',
      borderRadius: scaled(26, scale),
      borderWidth: 1,
      height: scaled(153, scale),
      left: scaled(26, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(1215, scale),
      width: scaled(812, scale)
    },
    feeDividerLeft: {
      backgroundColor: '#E0E3EB',
      height: scaled(91, scale),
      left: scaled(260, scale),
      position: 'absolute',
      top: scaled(31, scale),
      width: 1
    },
    feeDividerRight: {
      backgroundColor: '#E0E3EB',
      height: scaled(91, scale),
      left: scaled(555, scale),
      position: 'absolute',
      top: scaled(31, scale),
      width: 1
    },
    feeSymbol: {
      fontSize: scaled(23, scale),
      fontWeight: '400',
      lineHeight: scaled(30, scale)
    },
    formCard: {
      backgroundColor: colors.surface,
      borderColor: '#E5E7EF',
      borderRadius: scaled(26, scale),
      borderWidth: 1,
      height: scaled(579, scale),
      left: scaled(26, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(618, scale),
      width: scaled(812, scale)
    },
    header: {
      height: scaledBelowTopNavigation(215, scale),
      position: 'absolute',
      top: 0,
      width: '100%'
    },
    modeLabel: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '600',
      left: scaled(30, scale),
      lineHeight: scaled(33, scale),
      position: 'absolute',
      top: scaled(414, scale),
      ...textBase
    },
    modeOption: {
      alignItems: 'center',
      flex: 1,
      height: '100%',
      justifyContent: 'center',
      minWidth: 0,
      position: 'relative'
    },
    modeOptionContent: {
      alignItems: 'center',
      height: '100%',
      justifyContent: 'center',
      paddingHorizontal: scaled(4, scale),
      width: '100%'
    },
    modeOptionContentActive: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderRadius: scaled(16, scale),
      height: '100%',
      justifyContent: 'center',
      paddingHorizontal: scaled(4, scale),
      width: '100%'
    },
    modeOptionDivider: {
      backgroundColor: '#E5E7EF',
      height: scaled(66, scale),
      left: 0,
      position: 'absolute',
      top: scaled(9, scale),
      width: 1
    },
    modeSegmented: {
      alignItems: 'stretch',
      borderColor: '#E5E7EF',
      borderRadius: scaled(21, scale),
      borderWidth: 1,
      flexDirection: 'row',
      height: scaled(92, scale),
      left: scaled(30, scale),
      overflow: 'hidden',
      padding: scaled(4, scale),
      position: 'absolute',
      top: scaled(455, scale),
      width: scaled(752, scale)
    },
    modeSubtitle: {
      color: colors.textMuted,
      fontSize: scaled(19, scale),
      fontWeight: '400',
      lineHeight: scaled(25, scale),
      marginTop: scaled(6, scale),
      ...textBase
    },
    modeSubtitleActive: {
      color: colors.primary,
      fontSize: scaled(19, scale),
      fontWeight: '500',
      lineHeight: scaled(25, scale),
      marginTop: scaled(6, scale),
      ...textBase
    },
    modeTitle: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '700',
      lineHeight: scaled(31, scale),
      ...textBase
    },
    modeTitleActive: {
      color: '#FFFFFF',
      fontSize: scaled(25, scale),
      fontWeight: '700',
      lineHeight: scaled(31, scale),
      ...textBase
    },
    networkFeeLabel: {
      color: colors.textMuted,
      fontSize: scaled(22, scale),
      fontWeight: '400',
      left: scaled(43, scale),
      lineHeight: scaled(28, scale),
      position: 'absolute',
      top: scaled(31, scale),
      ...textBase
    },
    networkFeeSub: {
      color: colors.textMuted,
      fontSize: scaled(21, scale),
      fontWeight: '400',
      left: scaled(43, scale),
      lineHeight: scaled(28, scale),
      position: 'absolute',
      top: scaled(101, scale),
      ...textBase
    },
    networkFeeValue: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '700',
      left: scaled(43, scale),
      lineHeight: scaled(34, scale),
      position: 'absolute',
      top: scaled(67, scale),
      ...textBase
    },
    normalButtonWrapper: {
      height: '100%',
      width: '100%'
    },
    pressedButtonWrapper: {
      height: '100%',
      opacity: 0.82,
      width: '100%'
    },
    primaryButtonGradient: {
      borderRadius: scaled(22, scale),
      height: '100%',
      padding: scaled(3, scale),
      width: '100%'
    },
    primaryButtonInner: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderRadius: scaled(19, scale),
      flex: 1,
      justifyContent: 'center',
      overflow: 'hidden'
    },
    primaryButtonOuter: {
      height: scaled(96, scale),
      left: scaled(28, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(1534, scale),
      width: scaled(808, scale)
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: scaled(31, scale),
      fontWeight: '800',
      lineHeight: scaled(38, scale),
      ...textBase
    },
    privateAmount: {
      color: '#F8FAFF',
      fontSize: scaled(30, scale),
      fontWeight: '700',
      left: scaled(99, scale),
      lineHeight: scaled(37, scale),
      position: 'absolute',
      top: scaled(224, scale),
      ...textBase
    },
    privateIcon: {
      left: scaled(30, scale),
      position: 'absolute',
      top: scaled(187, scale)
    },
    privateLabel: {
      color: '#B6BAC5',
      fontSize: scaled(24, scale),
      fontWeight: '400',
      left: scaled(99, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      top: scaled(186, scale),
      ...textBase
    },
    privateSymbol: {
      color: '#B6BAC5',
      fontSize: scaled(24, scale),
      fontWeight: '400',
      left: scaled(255, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      top: scaled(229, scale),
      ...textBase
    },
    root: {
      backgroundColor: colors.background,
      flex: 1
    },
    routeArtwork: {
      height: scaled(604, scale),
      left: scaled(357, scale),
      position: 'absolute',
      top: scaled(-54, scale),
      width: scaled(453, scale)
    },
    routeArtworkShade: {
      height: '100%',
      left: scaled(255, scale),
      position: 'absolute',
      top: 0,
      width: scaled(410, scale)
    },
    routeCard: {
      backgroundColor: colors.black,
      borderRadius: scaled(27, scale),
      height: scaled(369, scale),
      left: scaled(26, scale),
      overflow: 'hidden',
      position: 'absolute',
      top: scaledBelowTopNavigation(227, scale),
      width: scaled(812, scale)
    },
    routeDivider: {
      backgroundColor: '#343844',
      height: 1,
      left: scaled(30, scale),
      position: 'absolute',
      top: scaled(277, scale),
      width: scaled(472, scale)
    },
    routeStatusDot: {
      backgroundColor: '#15D979',
      borderRadius: scaled(7, scale),
      flexShrink: 0,
      height: scaled(14, scale),
      marginRight: scaled(10, scale),
      width: scaled(14, scale)
    },
    routeStatusGroup: {
      alignItems: 'center',
      elevation: 3,
      flexDirection: 'row',
      height: scaled(42, scale),
      justifyContent: 'flex-end',
      position: 'absolute',
      right: scaled(34, scale),
      top: scaled(26, scale),
      width: scaled(170, scale),
      zIndex: 3
    },
    routeStatusTextPanel: {
      alignItems: 'center',
      backgroundColor: 'rgba(5, 5, 7, 0.72)',
      borderRadius: scaled(14, scale),
      height: scaled(36, scale),
      justifyContent: 'center',
      minWidth: scaled(96, scale),
      paddingHorizontal: scaled(8, scale)
    },
    routeStatusText: {
      color: '#FFFFFF',
      fontSize: scaled(25, scale),
      fontWeight: '500',
      lineHeight: scaled(32, scale),
      textAlign: 'center',
      ...textBase
    },
    routeStrategyLabel: {
      color: '#B6BAC5',
      fontSize: scaled(24, scale),
      fontWeight: '400',
      left: scaled(30, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      top: scaled(310, scale),
      ...textBase
    },
    routeStrategyPillBorder: {
      borderRadius: scaled(22, scale),
      height: scaled(40, scale),
      left: scaled(142, scale),
      padding: scaled(2, scale),
      position: 'absolute',
      top: scaled(301, scale),
      width: scaled(132, scale)
    },
    routeStrategyPillInner: {
      alignItems: 'center',
      backgroundColor: '#151722',
      borderRadius: scaled(20, scale),
      flex: 1,
      justifyContent: 'center'
    },
    routeStrategyPillText: {
      color: '#B3B7C4',
      fontSize: scaled(21, scale),
      fontWeight: '500',
      lineHeight: scaled(26, scale),
      ...textBase
    },
    routeTitle: {
      color: '#B6BAC5',
      fontSize: scaled(24, scale),
      fontWeight: '500',
      left: scaled(30, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      top: scaled(34, scale),
      ...textBase
    },
    routeTitleInfoIcon: {
      left: scaled(137, scale),
      position: 'absolute',
      top: scaled(35, scale)
    },
    scrollContent: {
      backgroundColor: colors.background
    },
    scrollView: {
      backgroundColor: colors.background
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: scaled(22, scale),
      fontWeight: '400',
      left: scaled(111, scale),
      lineHeight: scaled(28, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(181, scale),
      ...textBase
    },
    title: {
      color: colors.text,
      fontSize: scaled(41, scale),
      fontWeight: '800',
      left: scaled(111, scale),
      lineHeight: scaled(49, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(126, scale),
      ...textBase
    },
    transparentAmount: {
      color: '#F8FAFF',
      fontSize: scaled(30, scale),
      fontWeight: '700',
      left: scaled(99, scale),
      lineHeight: scaled(37, scale),
      position: 'absolute',
      top: scaled(129, scale),
      ...textBase
    },
    transparentIcon: {
      left: scaled(30, scale),
      position: 'absolute',
      top: scaled(92, scale)
    },
    transparentLabel: {
      color: '#B6BAC5',
      fontSize: scaled(24, scale),
      fontWeight: '400',
      left: scaled(99, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      top: scaled(91, scale),
      ...textBase
    },
    transparentSymbol: {
      color: '#B6BAC5',
      fontSize: scaled(24, scale),
      fontWeight: '400',
      left: scaled(390, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      top: scaled(134, scale),
      ...textBase
    },
    useAllButton: {
      alignItems: 'center',
      height: scaled(58, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(17, scale),
      top: scaled(17, scale),
      width: scaled(72, scale)
    },
    useAllText: {
      color: colors.primary,
      fontSize: scaled(25, scale),
      fontWeight: '500',
      lineHeight: scaled(32, scale),
      ...textBase
    }
  });
}
