import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getGlobalHeaderHeight } from '../../components/GlobalHeader';
import { colors, fontFamilies } from '../../theme/tokens';
import { getSensitiveAmountParts, getSensitiveAmountText } from '../../utils/sensitiveDisplay';
import { dposOverviewImages } from './designAssets';
import {
  ActionClaimIcon,
  ActionDelegateIcon,
  ActionStakeIcon,
  ActionValidatorIcon,
  ChevronRightIcon,
  CoolingHourglassIcon,
  EyeIcon,
  MyDelegateIcon,
  RewardGiftIcon,
  SelfStakeIcon,
  SolanaValidatorAvatar,
  VValidatorAvatar,
  ValidatorSummaryIcon
} from './DposOverviewSvgIcons';
import { useDposOverviewResponsiveLayout } from './useDposOverviewResponsiveLayout';

const actionItems = [
  { key: 'stake', label: '质押' },
  { key: 'delegate', label: '委托' },
  { key: 'claim', label: '领取收益' },
  { key: 'validator', label: '验证者' }
] as const;

const summaryItems = [
  { label: '自质押', value: '10,000,000', unit: 'lamports' },
  { label: '委托质押', value: '0', unit: 'lamports' },
  { label: '自质押收益', value: '128', unit: 'lamports' },
  { label: '委托收益', value: '0', unit: 'lamports' }
] as const;

const detailRows = [
  { key: 'self', label: '我的自质押', value: '10,000,000', unit: 'lamports', status: '已质押', tone: 'primary' },
  { key: 'delegate', label: '我的委托', value: '0', unit: 'lamports', status: '未委托', tone: 'muted' },
  { key: 'reward', label: '待领取收益', value: '128', unit: 'lamports', status: '可领取', tone: 'primary' },
  { key: 'cooling', label: '冷却中', value: '0', unit: 'lamports', status: '无', tone: 'muted' }
] as const;

const validatorRows = [
  {
    key: 'sol',
    commission: '佣金 0%',
    name: '3GT9QRA...TcZjT5S',
    power: '总权重 10,000,000'
  },
  {
    key: 'v',
    commission: '佣金 0%',
    name: '2LDSjHQ3...RKic2c',
    power: '总权重 10,000,000'
  }
] as const;

type ActionKey = (typeof actionItems)[number]['key'];
type DetailRowKey = (typeof detailRows)[number]['key'];
type ValidatorKey = (typeof validatorRows)[number]['key'];

type DposOverviewScreenProps = {
  readonly bottomPadding?: number;
  readonly topPadding?: number;
};

function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

export function DposOverviewScreen({ bottomPadding, topPadding }: DposOverviewScreenProps) {
  const [isStakeAmountVisible, setIsStakeAmountVisible] = useState(true);
  const layoutMetrics = useDposOverviewResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const headerHeight = getGlobalHeaderHeight(layoutMetrics.scale);
  const resolvedBottomPadding = bottomPadding ?? layoutMetrics.bottomNavHeight;
  const resolvedTopPadding = topPadding ?? layoutMetrics.topSafeArea + headerHeight;

  const handleActionPress = (actionKey: ActionKey) => {
    console.info('[dpos-overview] action requested', { actionKey });
  };

  const handleToggleStakeAmount = () => {
    setIsStakeAmountVisible((currentValue) => !currentValue);
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
          <OverviewCard
            isAmountVisible={isStakeAmountVisible}
            onToggleAmountVisibility={handleToggleStakeAmount}
            scale={layoutMetrics.scale}
            styles={styles}
          />
          <ActionCard onActionPress={handleActionPress} scale={layoutMetrics.scale} styles={styles} />
          <ValidatorSummaryCard scale={layoutMetrics.scale} styles={styles} />
          <StakeDetailCard isAmountVisible={isStakeAmountVisible} scale={layoutMetrics.scale} styles={styles} />
          <ValidatorListCard scale={layoutMetrics.scale} styles={styles} />
        </View>
      </ScrollView>
    </View>
  );
}

function PageHeading({ styles }: { readonly styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.pageHeading}>
      <Text style={styles.pageTitle}>DPoS</Text>
      <Text style={styles.pageSubtitle}>质押、委托、收益</Text>
    </View>
  );
}

function OverviewCard({
  isAmountVisible,
  onToggleAmountVisibility,
  scale,
  styles
}: {
  readonly isAmountVisible: boolean;
  readonly onToggleAmountVisibility: () => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  const totalAmountParts = getSensitiveAmountParts('10,000,000', 'lamports', isAmountVisible);

  return (
    <View style={styles.overviewCard}>
      <Image resizeMode="cover" source={dposOverviewImages.overviewArtwork} style={styles.overviewArtwork} />
      <View style={styles.overviewArtworkShade} />
      <Text style={styles.totalLabel}>总质押权益</Text>
      <Pressable
        accessibilityLabel={isAmountVisible ? '隐藏DPoS金额' : '显示DPoS金额'}
        accessibilityRole="button"
        accessibilityState={{ selected: !isAmountVisible }}
        hitSlop={scaled(12, scale)}
        onPress={onToggleAmountVisibility}
        style={styles.eyeButton}
      >
        <EyeIcon size={scaled(36, scale)} />
      </Pressable>
      <Text adjustsFontSizeToFit minimumFontScale={0.78} numberOfLines={1} style={styles.totalValue}>
        {totalAmountParts.amountText}
      </Text>
      <Text style={styles.totalUnit}>{totalAmountParts.unitText}</Text>
      {summaryItems.map((item, index) => (
        <View key={item.label} style={[styles.summaryColumn, { left: scaled(38 + index * 200, scale) }]}>
          {index > 0 ? <View style={styles.summaryDivider} /> : null}
          <Text style={styles.summaryLabel}>{item.label}</Text>
          <Text adjustsFontSizeToFit minimumFontScale={0.76} numberOfLines={1} style={styles.summaryValue}>
            {getSensitiveAmountText(item.value, isAmountVisible)}
          </Text>
          <Text style={styles.summaryUnit}>{item.unit}</Text>
        </View>
      ))}
    </View>
  );
}

function ActionCard({
  onActionPress,
  scale,
  styles
}: {
  readonly onActionPress: (actionKey: ActionKey) => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.actionCard}>
      <View style={styles.actionDividerOne} />
      <View style={styles.actionDividerTwo} />
      <View style={styles.actionDividerThree} />
      {actionItems.map((item, index) => (
        <Pressable
          accessibilityRole="button"
          key={item.key}
          onPress={() => onActionPress(item.key)}
          style={[styles.actionButton, { left: scaled(index * 204, scale) }]}
        >
          <ActionIcon actionKey={item.key} size={scaled(64, scale)} />
          <Text style={styles.actionLabel}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function ActionIcon({ actionKey, size }: { readonly actionKey: ActionKey; readonly size: number }) {
  if (actionKey === 'stake') {
    return <ActionStakeIcon size={size} />;
  }

  if (actionKey === 'delegate') {
    return <ActionDelegateIcon size={size} />;
  }

  if (actionKey === 'claim') {
    return <ActionClaimIcon size={size} />;
  }

  return <ActionValidatorIcon size={size} />;
}

function ValidatorSummaryCard({ scale, styles }: { readonly scale: number; readonly styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.validatorSummaryCard}>
      <View style={styles.validatorSummaryIcon}>
        <ValidatorSummaryIcon size={scaled(64, scale)} />
      </View>
      <Text style={styles.validatorSummaryTitle}>验证者</Text>
      <Text style={styles.validatorSummaryValue}>2 个</Text>
      <View style={styles.validatorSummaryChevron}>
        <ChevronRightIcon size={scaled(42, scale)} />
      </View>
      <View style={styles.validatorDividerOne} />
      <View style={styles.validatorDividerTwo} />
      <View style={styles.validatorDividerThree} />
      <Text style={styles.connectedLabel}>已连接</Text>
      <Text style={styles.connectedValue}>2</Text>
      <Text style={styles.heightLabel}>同步高度</Text>
      <Text style={styles.heightValue}>1,180</Text>
      <Text style={styles.recommendLabel}>推荐</Text>
      <Text style={styles.recommendValue}>3GT9QRA...TcZjT5S</Text>
    </View>
  );
}

function StakeDetailCard({
  isAmountVisible,
  scale,
  styles
}: {
  readonly isAmountVisible: boolean;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.detailCard}>
      {detailRows.map((row, index) => (
        <View key={row.key} style={[styles.detailRow, { top: scaled(29 + index * 74, scale) }]}>
          <View style={styles.detailIcon}>
            <DetailIcon rowKey={row.key} size={scaled(48, scale)} />
          </View>
          <Text style={styles.detailLabel}>{row.label}</Text>
          <Text adjustsFontSizeToFit minimumFontScale={0.76} numberOfLines={1} style={styles.detailValue}>
            {getSensitiveAmountText(row.value, isAmountVisible)}
          </Text>
          <Text style={styles.detailUnit}>{row.unit}</Text>
          <Text style={row.tone === 'primary' ? styles.detailStatusPrimary : styles.detailStatusMuted}>{row.status}</Text>
          <View style={styles.detailChevron}>
            {row.key === 'cooling' ? null : <ChevronRightIcon size={scaled(38, scale)} />}
          </View>
        </View>
      ))}
    </View>
  );
}

function DetailIcon({ rowKey, size }: { readonly rowKey: DetailRowKey; readonly size: number }) {
  if (rowKey === 'self') {
    return <SelfStakeIcon size={size} />;
  }

  if (rowKey === 'delegate') {
    return <MyDelegateIcon size={size} />;
  }

  if (rowKey === 'reward') {
    return <RewardGiftIcon size={size} />;
  }

  return <CoolingHourglassIcon size={size} />;
}

function ValidatorListCard({ scale, styles }: { readonly scale: number; readonly styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.validatorListCard}>
      <Text style={styles.validatorListTitle}>验证者列表</Text>
      <Pressable accessibilityRole="button" style={styles.viewAllValidatorsButton}>
        <Text style={styles.viewAllValidatorsText}>查看全部 2 个</Text>
        <View style={styles.viewAllChevron}>
          <ChevronRightIcon size={scaled(38, scale)} />
        </View>
      </Pressable>
      {validatorRows.map((row, index) => (
        <View key={row.key} style={[styles.validatorRow, { top: scaled(81 + index * 106, scale) }]}>
          <View style={styles.validatorAvatar}>
            <ValidatorAvatar rowKey={row.key} size={scaled(64, scale)} />
            <View style={styles.onlineDotOnAvatar} />
          </View>
          <Text style={styles.validatorName}>{row.name}</Text>
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>active</Text>
          </View>
          <Text style={styles.validatorMeta}>{row.power}</Text>
          <Text style={styles.validatorMetaDot}>·</Text>
          <Text style={styles.validatorCommission}>{row.commission}</Text>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>在线</Text>
          <View style={styles.validatorRowChevron}>
            <ChevronRightIcon size={scaled(38, scale)} />
          </View>
        </View>
      ))}
    </View>
  );
}

function ValidatorAvatar({ rowKey, size }: { readonly rowKey: ValidatorKey; readonly size: number }) {
  if (rowKey === 'sol') {
    return <SolanaValidatorAvatar size={size} />;
  }

  return <VValidatorAvatar size={size} />;
}

function createStyles(scale: number) {
  const textBase = {
    fontFamily: fontFamilies.system,
    includeFontPadding: false
  } as const;

  return StyleSheet.create({
    actionButton: {
      alignItems: 'center',
      height: scaled(128, scale),
      justifyContent: 'flex-start',
      paddingTop: scaled(26, scale),
      position: 'absolute',
      top: 0,
      width: scaled(204, scale)
    },
    actionCard: {
      backgroundColor: colors.surface,
      borderColor: '#E5E7EF',
      borderRadius: scaled(26, scale),
      borderWidth: 1,
      height: scaled(160, scale),
      left: scaled(24, scale),
      position: 'absolute',
      top: scaled(582, scale),
      width: scaled(816, scale)
    },
    actionDividerOne: {
      backgroundColor: '#E0E3EB',
      height: scaled(105, scale),
      left: scaled(204, scale),
      position: 'absolute',
      top: scaled(27, scale),
      width: 1
    },
    actionDividerThree: {
      backgroundColor: '#E0E3EB',
      height: scaled(105, scale),
      left: scaled(612, scale),
      position: 'absolute',
      top: scaled(27, scale),
      width: 1
    },
    actionDividerTwo: {
      backgroundColor: '#E0E3EB',
      height: scaled(105, scale),
      left: scaled(408, scale),
      position: 'absolute',
      top: scaled(27, scale),
      width: 1
    },
    actionLabel: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '700',
      lineHeight: scaled(34, scale),
      marginTop: scaled(14, scale),
      ...textBase
    },
    activePill: {
      alignItems: 'center',
      backgroundColor: '#EEEAFE',
      borderRadius: scaled(6, scale),
      height: scaled(32, scale),
      justifyContent: 'center',
      left: scaled(392, scale),
      position: 'absolute',
      top: scaled(3, scale),
      width: scaled(82, scale)
    },
    activePillText: {
      color: '#5A32FF',
      fontSize: scaled(22, scale),
      fontWeight: '500',
      lineHeight: scaled(28, scale),
      ...textBase
    },
    canvas: {
      backgroundColor: colors.background,
      height: scaled(1595, scale),
      position: 'relative',
      width: '100%'
    },
    connectedLabel: {
      color: colors.textMuted,
      fontSize: scaled(24, scale),
      fontWeight: '400',
      left: scaled(292, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      top: scaled(23, scale),
      ...textBase
    },
    connectedValue: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '500',
      left: scaled(292, scale),
      lineHeight: scaled(35, scale),
      position: 'absolute',
      top: scaled(63, scale),
      ...textBase
    },
    detailCard: {
      backgroundColor: colors.surface,
      borderColor: '#E5E7EF',
      borderRadius: scaled(26, scale),
      borderWidth: 1,
      height: scaled(323, scale),
      left: scaled(24, scale),
      position: 'absolute',
      top: scaled(901, scale),
      width: scaled(816, scale)
    },
    detailChevron: {
      alignItems: 'center',
      height: scaled(52, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(31, scale),
      top: scaled(4, scale),
      width: scaled(46, scale)
    },
    detailIcon: {
      left: scaled(35, scale),
      position: 'absolute',
      top: scaled(6, scale)
    },
    detailLabel: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '600',
      left: scaled(100, scale),
      lineHeight: scaled(35, scale),
      position: 'absolute',
      top: scaled(12, scale),
      ...textBase
    },
    detailRow: {
      height: scaled(64, scale),
      left: 0,
      position: 'absolute',
      width: '100%'
    },
    detailStatusMuted: {
      color: colors.textMuted,
      fontSize: scaled(25, scale),
      fontWeight: '400',
      lineHeight: scaled(32, scale),
      position: 'absolute',
      right: scaled(75, scale),
      top: scaled(14, scale),
      ...textBase
    },
    detailStatusPrimary: {
      color: colors.primary,
      fontSize: scaled(25, scale),
      fontWeight: '500',
      lineHeight: scaled(32, scale),
      position: 'absolute',
      right: scaled(75, scale),
      top: scaled(14, scale),
      ...textBase
    },
    detailUnit: {
      color: colors.textMuted,
      fontSize: scaled(22, scale),
      fontWeight: '400',
      left: scaled(523, scale),
      lineHeight: scaled(28, scale),
      position: 'absolute',
      top: scaled(17, scale),
      ...textBase
    },
    detailValue: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '500',
      lineHeight: scaled(35, scale),
      position: 'absolute',
      right: scaled(317, scale),
      textAlign: 'right',
      top: scaled(12, scale),
      width: scaled(192, scale),
      ...textBase
    },
    eyeButton: {
      alignItems: 'center',
      height: scaled(46, scale),
      justifyContent: 'center',
      left: scaled(170, scale),
      position: 'absolute',
      top: scaled(44, scale),
      width: scaled(46, scale)
    },
    heightLabel: {
      color: colors.textMuted,
      fontSize: scaled(24, scale),
      fontWeight: '400',
      left: scaled(433, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      top: scaled(23, scale),
      ...textBase
    },
    heightValue: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '500',
      left: scaled(433, scale),
      lineHeight: scaled(35, scale),
      position: 'absolute',
      top: scaled(63, scale),
      ...textBase
    },
    onlineDot: {
      backgroundColor: '#20C76A',
      borderRadius: scaled(5, scale),
      height: scaled(10, scale),
      position: 'absolute',
      right: scaled(128, scale),
      top: scaled(38, scale),
      width: scaled(10, scale)
    },
    onlineDotOnAvatar: {
      backgroundColor: '#18C772',
      borderColor: '#FFFFFF',
      borderRadius: scaled(8, scale),
      borderWidth: scaled(3, scale),
      bottom: scaled(-1, scale),
      height: scaled(20, scale),
      position: 'absolute',
      right: scaled(-1, scale),
      width: scaled(20, scale)
    },
    onlineText: {
      color: colors.textMuted,
      fontSize: scaled(24, scale),
      fontWeight: '400',
      lineHeight: scaled(31, scale),
      position: 'absolute',
      right: scaled(70, scale),
      top: scaled(27, scale),
      ...textBase
    },
    overviewArtwork: {
      height: '100%',
      left: 0,
      position: 'absolute',
      top: 0,
      width: '100%'
    },
    overviewArtworkShade: {
      backgroundColor: '#05050755',
      height: '100%',
      left: 0,
      position: 'absolute',
      top: 0,
      width: '100%'
    },
    overviewCard: {
      backgroundColor: colors.black,
      borderRadius: scaled(27, scale),
      height: scaled(425, scale),
      left: scaled(24, scale),
      overflow: 'hidden',
      position: 'absolute',
      top: scaled(134, scale),
      width: scaled(816, scale)
    },
    pageHeading: {
      height: scaled(134, scale),
      position: 'absolute',
      top: 0,
      width: '100%'
    },
    pageSubtitle: {
      color: colors.textMuted,
      fontSize: scaled(31, scale),
      fontWeight: '400',
      left: scaled(34, scale),
      lineHeight: scaled(39, scale),
      position: 'absolute',
      top: scaled(86, scale),
      ...textBase
    },
    pageTitle: {
      color: colors.text,
      fontSize: scaled(54, scale),
      fontWeight: '800',
      left: scaled(34, scale),
      lineHeight: scaled(65, scale),
      position: 'absolute',
      top: scaled(12, scale),
      ...textBase
    },
    recommendLabel: {
      color: colors.textMuted,
      fontSize: scaled(24, scale),
      fontWeight: '400',
      left: scaled(594, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      top: scaled(23, scale),
      ...textBase
    },
    recommendValue: {
      color: colors.textMuted,
      fontSize: scaled(23, scale),
      fontWeight: '400',
      left: scaled(594, scale),
      lineHeight: scaled(30, scale),
      position: 'absolute',
      top: scaled(65, scale),
      ...textBase
    },
    root: {
      backgroundColor: colors.background,
      flex: 1
    },
    scrollContent: {
      backgroundColor: colors.background
    },
    scrollView: {
      backgroundColor: colors.background
    },
    summaryColumn: {
      height: scaled(110, scale),
      position: 'absolute',
      top: scaled(287, scale),
      width: scaled(178, scale)
    },
    summaryDivider: {
      backgroundColor: '#666A78',
      height: scaled(94, scale),
      left: scaled(-21, scale),
      position: 'absolute',
      top: scaled(4, scale),
      width: 1
    },
    summaryLabel: {
      color: '#D5D8E0',
      fontSize: scaled(25, scale),
      fontWeight: '500',
      lineHeight: scaled(32, scale),
      position: 'absolute',
      top: 0,
      ...textBase
    },
    summaryUnit: {
      color: '#C5C9D2',
      fontSize: scaled(22, scale),
      fontWeight: '400',
      lineHeight: scaled(28, scale),
      position: 'absolute',
      top: scaled(68, scale),
      ...textBase
    },
    summaryValue: {
      color: '#FFFFFF',
      fontSize: scaled(29, scale),
      fontWeight: '600',
      lineHeight: scaled(36, scale),
      position: 'absolute',
      top: scaled(38, scale),
      width: scaled(150, scale),
      ...textBase
    },
    totalLabel: {
      color: '#D5D8E0',
      fontSize: scaled(25, scale),
      fontWeight: '500',
      left: scaled(38, scale),
      lineHeight: scaled(32, scale),
      position: 'absolute',
      top: scaled(53, scale),
      ...textBase
    },
    totalUnit: {
      color: '#C5C9D2',
      fontSize: scaled(28, scale),
      fontWeight: '400',
      left: scaled(38, scale),
      lineHeight: scaled(35, scale),
      position: 'absolute',
      top: scaled(174, scale),
      ...textBase
    },
    totalValue: {
      color: '#FFFFFF',
      fontSize: scaled(58, scale),
      fontWeight: '700',
      left: scaled(38, scale),
      lineHeight: scaled(69, scale),
      position: 'absolute',
      top: scaled(100, scale),
      width: scaled(378, scale),
      ...textBase
    },
    validatorAvatar: {
      left: scaled(32, scale),
      position: 'absolute',
      top: scaled(4, scale)
    },
    validatorCommission: {
      color: colors.textMuted,
      fontSize: scaled(22, scale),
      fontWeight: '400',
      left: scaled(322, scale),
      lineHeight: scaled(28, scale),
      position: 'absolute',
      top: scaled(50, scale),
      ...textBase
    },
    validatorDividerOne: {
      backgroundColor: '#E0E3EB',
      height: scaled(80, scale),
      left: scaled(248, scale),
      position: 'absolute',
      top: scaled(20, scale),
      width: 1
    },
    validatorDividerThree: {
      backgroundColor: '#E0E3EB',
      height: scaled(80, scale),
      left: scaled(565, scale),
      position: 'absolute',
      top: scaled(20, scale),
      width: 1
    },
    validatorDividerTwo: {
      backgroundColor: '#E0E3EB',
      height: scaled(80, scale),
      left: scaled(394, scale),
      position: 'absolute',
      top: scaled(20, scale),
      width: 1
    },
    validatorListCard: {
      backgroundColor: colors.surface,
      borderColor: '#E5E7EF',
      borderRadius: scaled(26, scale),
      borderWidth: 1,
      height: scaled(307, scale),
      left: scaled(24, scale),
      position: 'absolute',
      top: scaled(1244, scale),
      width: scaled(816, scale)
    },
    validatorListTitle: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '700',
      left: scaled(36, scale),
      lineHeight: scaled(35, scale),
      position: 'absolute',
      top: scaled(33, scale),
      ...textBase
    },
    validatorMeta: {
      color: colors.textMuted,
      fontSize: scaled(22, scale),
      fontWeight: '400',
      left: scaled(116, scale),
      lineHeight: scaled(28, scale),
      position: 'absolute',
      top: scaled(50, scale),
      ...textBase
    },
    validatorMetaDot: {
      color: colors.textMuted,
      fontSize: scaled(22, scale),
      fontWeight: '400',
      left: scaled(302, scale),
      lineHeight: scaled(28, scale),
      position: 'absolute',
      top: scaled(50, scale),
      ...textBase
    },
    validatorName: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '800',
      left: scaled(116, scale),
      lineHeight: scaled(35, scale),
      position: 'absolute',
      top: scaled(0, scale),
      ...textBase
    },
    validatorRow: {
      height: scaled(82, scale),
      left: 0,
      position: 'absolute',
      width: '100%'
    },
    validatorRowChevron: {
      alignItems: 'center',
      height: scaled(48, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(30, scale),
      top: scaled(18, scale),
      width: scaled(44, scale)
    },
    validatorSummaryCard: {
      backgroundColor: colors.surface,
      borderColor: '#E5E7EF',
      borderRadius: scaled(26, scale),
      borderWidth: 1,
      height: scaled(119, scale),
      left: scaled(24, scale),
      position: 'absolute',
      top: scaled(762, scale),
      width: scaled(816, scale)
    },
    validatorSummaryChevron: {
      alignItems: 'center',
      height: scaled(48, scale),
      justifyContent: 'center',
      left: scaled(205, scale),
      position: 'absolute',
      top: scaled(36, scale),
      width: scaled(44, scale)
    },
    validatorSummaryIcon: {
      left: scaled(34, scale),
      position: 'absolute',
      top: scaled(28, scale)
    },
    validatorSummaryTitle: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '600',
      left: scaled(100, scale),
      lineHeight: scaled(35, scale),
      position: 'absolute',
      top: scaled(29, scale),
      ...textBase
    },
    validatorSummaryValue: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '500',
      left: scaled(100, scale),
      lineHeight: scaled(35, scale),
      position: 'absolute',
      top: scaled(67, scale),
      ...textBase
    },
    viewAllChevron: {
      alignItems: 'center',
      height: scaled(42, scale),
      justifyContent: 'center',
      marginLeft: scaled(8, scale),
      width: scaled(34, scale)
    },
    viewAllValidatorsButton: {
      alignItems: 'center',
      flexDirection: 'row',
      height: scaled(54, scale),
      justifyContent: 'flex-end',
      position: 'absolute',
      right: scaled(24, scale),
      top: scaled(23, scale),
      width: scaled(230, scale)
    },
    viewAllValidatorsText: {
      color: colors.primary,
      fontSize: scaled(24, scale),
      fontWeight: '500',
      lineHeight: scaled(31, scale),
      ...textBase
    }
  });
}
