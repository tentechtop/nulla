import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getGlobalHeaderHeight } from '../../components/GlobalHeader';
import { colors, fontFamilies, fontWeights } from '../../theme/tokens';
import { JsonRpcClient } from '../../utils/chainRpc';
import { getSensitiveAmountParts, getSensitiveAmountText } from '../../utils/sensitiveDisplay';
import { createEmptyWalletPortfolio, formatLamports, loadWalletPortfolio, type WalletDposSummary, type WalletPortfolio, type WalletValidatorSummary } from '../../utils/walletBusiness';
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
  { key: 'rewardDetails', label: '收益明细' },
  { key: 'validator', label: '验证者' }
] as const;

type ActionKey = (typeof actionItems)[number]['key'];
type DetailRowKey = 'cooling' | 'delegate' | 'reward' | 'self';
type ValidatorKey = 'sol' | 'v';

type SummaryItem = {
  readonly label: string;
  readonly unit: string;
  readonly value: string;
};

type DetailRow = {
  readonly key: DetailRowKey;
  readonly label: string;
  readonly status: string;
  readonly tone: 'muted' | 'primary';
  readonly unit: string;
  readonly value: string;
};

type ValidatorRow = {
  readonly commission: string;
  readonly key: string;
  readonly name: string;
  readonly power: string;
  readonly reachabilityLabel: string;
  readonly reachabilityStatus: WalletValidatorSummary['reachabilityStatus'];
  readonly status: string;
  readonly validatorKey: ValidatorKey;
};

type DposOverviewScreenProps = {
  readonly bottomPadding?: number;
  readonly currentWalletAddress?: string | null;
  readonly onDelegatePress?: () => void;
  readonly onRewardPress?: () => void;
  readonly onStakePress?: () => void;
  readonly onValidatorListPress?: () => void;
  readonly rpcEndpoint?: string;
  readonly topPadding?: number;
};

function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

export function DposOverviewScreen({
  bottomPadding,
  currentWalletAddress = null,
  onDelegatePress,
  onRewardPress,
  onStakePress,
  onValidatorListPress,
  rpcEndpoint,
  topPadding
}: DposOverviewScreenProps) {
  const [isStakeAmountVisible, setIsStakeAmountVisible] = useState(true);
  const [portfolio, setPortfolio] = useState<WalletPortfolio>(() => createEmptyWalletPortfolio(currentWalletAddress));
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(true);
  const layoutMetrics = useDposOverviewResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const headerHeight = getGlobalHeaderHeight(layoutMetrics.scale);
  const resolvedBottomPadding = bottomPadding ?? layoutMetrics.bottomNavHeight;
  const resolvedTopPadding = topPadding ?? layoutMetrics.topSafeArea + headerHeight;
  const summaryItems = createSummaryItems(portfolio.dpos, isPortfolioLoading);
  const detailRows = createDetailRows(portfolio.dpos, isPortfolioLoading);
  const validatorRows = createValidatorRows(portfolio.dpos.validators, isPortfolioLoading);
  const totalPowerText = isPortfolioLoading ? '加载中' : formatLamports(portfolio.dpos.totalPowerLamports);
  const client = useMemo(() => new JsonRpcClient(rpcEndpoint), [rpcEndpoint]);

  useEffect(() => {
    let cancelled = false;
    setIsPortfolioLoading(true);

    // 功能目的：加载 DPoS 真实账户视图；实现原因：质押、委托和验证者数量必须来自当前 RPC。
    void loadWalletPortfolio(currentWalletAddress, client)
      .then((nextPortfolio) => {
        if (!cancelled) {
          setPortfolio(nextPortfolio);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const fallbackPortfolio = createEmptyWalletPortfolio(currentWalletAddress);
          setPortfolio({
            ...fallbackPortfolio,
            chain: {
              ...fallbackPortfolio.chain,
              error: error instanceof Error ? error.message : String(error)
            }
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsPortfolioLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [client, currentWalletAddress]);

  const handleActionPress = (actionKey: ActionKey) => {
    if (actionKey === 'stake') {
      onStakePress?.();
      return;
    }

    if (actionKey === 'delegate') {
      onDelegatePress?.();
      return;
    }

    if (actionKey === 'validator') {
      onValidatorListPress?.();
      return;
    }

    onRewardPress?.();
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
            summaryItems={summaryItems}
            styles={styles}
            totalPowerText={totalPowerText}
          />
          <ActionCard onActionPress={handleActionPress} scale={layoutMetrics.scale} styles={styles} />
          <ValidatorSummaryCard isLoading={isPortfolioLoading} onPress={onValidatorListPress} portfolio={portfolio} scale={layoutMetrics.scale} styles={styles} />
          <StakeDetailCard detailRows={detailRows} isAmountVisible={isStakeAmountVisible} scale={layoutMetrics.scale} styles={styles} />
          <ValidatorListCard onValidatorListPress={onValidatorListPress} scale={layoutMetrics.scale} styles={styles} validatorCount={portfolio.dpos.validatorCount} validatorRows={validatorRows} />
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
  summaryItems,
  styles,
  totalPowerText
}: {
  readonly isAmountVisible: boolean;
  readonly onToggleAmountVisibility: () => void;
  readonly scale: number;
  readonly summaryItems: readonly SummaryItem[];
  readonly styles: ReturnType<typeof createStyles>;
  readonly totalPowerText: string;
}) {
  const totalAmountParts = getSensitiveAmountParts(totalPowerText, 'lamports', isAmountVisible);

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

  if (actionKey === 'rewardDetails') {
    return <ActionClaimIcon size={size} />;
  }

  return <ActionValidatorIcon size={size} />;
}

function ValidatorSummaryCard({
  isLoading,
  onPress,
  portfolio,
  scale,
  styles
}: {
  readonly isLoading: boolean;
  readonly onPress?: () => void;
  readonly portfolio: WalletPortfolio;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  const firstValidatorName = portfolio.dpos.validators[0]?.displayName ?? '-';
  const loadingText = isLoading ? '加载中' : '';

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.validatorSummaryCard}>
      <View style={styles.validatorSummaryIcon}>
        <ValidatorSummaryIcon size={scaled(64, scale)} />
      </View>
      <Text style={styles.validatorSummaryTitle}>验证者</Text>
      <Text style={styles.validatorSummaryValue}>{loadingText || `${portfolio.dpos.validatorCount} 个`}</Text>
      <View style={styles.validatorSummaryChevron}>
        <ChevronRightIcon size={scaled(42, scale)} />
      </View>
      <View style={styles.validatorDividerOne} />
      <View style={styles.validatorDividerTwo} />
      <View style={styles.validatorDividerThree} />
      <Text style={styles.connectedLabel}>已连接</Text>
      <Text style={styles.connectedValue}>{loadingText || String(portfolio.chain.knownPeerCount)}</Text>
      <Text style={styles.heightLabel}>同步高度</Text>
      <Text style={styles.heightValue}>{loadingText || String(portfolio.chain.headHeight)}</Text>
      <Text style={styles.recommendLabel}>推荐</Text>
      <Text ellipsizeMode="middle" numberOfLines={1} style={styles.recommendValue}>{loadingText || firstValidatorName}</Text>
    </Pressable>
  );
}

function StakeDetailCard({
  detailRows,
  isAmountVisible,
  scale,
  styles
}: {
  readonly detailRows: readonly DetailRow[];
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

function ValidatorListCard({
  onValidatorListPress,
  scale,
  styles,
  validatorCount,
  validatorRows
}: {
  readonly onValidatorListPress?: () => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
  readonly validatorCount: number;
  readonly validatorRows: readonly ValidatorRow[];
}) {
  return (
    <View style={styles.validatorListCard}>
      <Text style={styles.validatorListTitle}>验证者列表</Text>
      <Pressable accessibilityRole="button" onPress={onValidatorListPress} style={styles.viewAllValidatorsButton}>
        <Text style={styles.viewAllValidatorsText}>查看全部 {validatorCount} 个</Text>
        <View style={styles.viewAllChevron}>
          <ChevronRightIcon size={scaled(38, scale)} />
        </View>
      </Pressable>
      {validatorRows.map((row, index) => (
        <Pressable accessibilityRole="button" key={row.key} onPress={onValidatorListPress} style={[styles.validatorRow, { top: scaled(81 + index * 106, scale) }]}>
          <View style={styles.validatorAvatar}>
            <ValidatorAvatar rowKey={row.validatorKey} size={scaled(64, scale)} />
            <View style={getAvatarReachabilityDotStyle(row.reachabilityStatus, styles)} />
          </View>
          <Text ellipsizeMode="middle" numberOfLines={1} style={styles.validatorName}>{row.name}</Text>
          <View style={styles.activePill}>
            <Text numberOfLines={1} style={styles.activePillText}>{row.status}</Text>
          </View>
          <Text ellipsizeMode="tail" numberOfLines={1} style={styles.validatorMeta}>{row.power}</Text>
          <Text style={styles.validatorMetaDot}>·</Text>
          <Text ellipsizeMode="tail" numberOfLines={1} style={styles.validatorCommission}>{row.commission}</Text>
          <View style={getReachabilityDotStyle(row.reachabilityStatus, styles)} />
          <Text style={getReachabilityTextStyle(row.reachabilityStatus, styles)}>{row.reachabilityLabel}</Text>
          <View style={styles.validatorRowChevron}>
            <ChevronRightIcon size={scaled(38, scale)} />
          </View>
        </Pressable>
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

function createSummaryItems(dpos: WalletDposSummary, isLoading: boolean): readonly SummaryItem[] {
  const loadingValue = isLoading ? '加载中' : '';
  const validatorRewardLamports = dpos.selfRewardLamports + dpos.commissionRewardLamports;
  const delegatedLamportsText = formatLamports(dpos.delegatedLamports);
  const delegatedLockedLamports = dpos.delegatedLamports + dpos.delegatedPendingLamports;
  const delegatedLockedLamportsText = delegatedLockedLamports > 0n ? formatLamports(delegatedLockedLamports) : delegatedLamportsText;

  return [
    { label: '自质押', value: loadingValue || formatLamports(dpos.selfStakeLamports), unit: 'lamports' },
    { label: '委托质押', value: loadingValue || delegatedLockedLamportsText, unit: 'lamports' },
    { label: '节点收益', value: loadingValue || formatLamports(validatorRewardLamports), unit: 'lamports' },
    { label: '委托收益', value: loadingValue || formatLamports(dpos.delegatedRewardLamports), unit: 'lamports' }
  ];
}

function createDetailRows(dpos: WalletDposSummary, isLoading: boolean): readonly DetailRow[] {
  const loadingValue = isLoading ? '加载中' : '';
  const coolingLamports = dpos.selfUnlockingLamports + dpos.delegatedUnlockingLamports;
  const delegatedLamportsText = formatLamports(dpos.delegatedLamports);
  const delegatedLockedLamports = dpos.delegatedLamports + dpos.delegatedPendingLamports;
  const delegatedLockedLamportsText = delegatedLockedLamports > 0n ? formatLamports(delegatedLockedLamports) : delegatedLamportsText;
  const rewardLamports = dpos.totalRewardLamports;

  return [
    {
      key: 'self',
      label: '我的自质押',
      status: dpos.selfStakeLamports > 0n ? '已质押' : '未质押',
      tone: dpos.selfStakeLamports > 0n ? 'primary' : 'muted',
      unit: 'lamports',
      value: loadingValue || formatLamports(dpos.selfStakeLamports)
    },
    {
      key: 'delegate',
      label: '我的委托',
      status: delegatedLockedLamports > 0n ? '已委托' : '未委托',
      tone: delegatedLockedLamports > 0n ? 'primary' : 'muted',
      unit: 'lamports',
      value: loadingValue || delegatedLockedLamportsText
    },
    {
      key: 'reward',
      label: '累计收益',
      status: rewardLamports > 0n ? '已自动到账' : '无收益',
      tone: rewardLamports > 0n ? 'primary' : 'muted',
      unit: 'lamports',
      value: loadingValue || formatLamports(rewardLamports)
    },
    {
      key: 'cooling',
      label: '冷却中',
      status: coolingLamports > 0n ? '解锁中' : '无',
      tone: coolingLamports > 0n ? 'primary' : 'muted',
      unit: 'lamports',
      value: loadingValue || formatLamports(coolingLamports)
    }
  ];
}

function createValidatorRows(validators: readonly WalletValidatorSummary[], isLoading: boolean): readonly ValidatorRow[] {
  if (isLoading) {
    return [{
      commission: '佣金 -',
      key: 'loading-validator',
      name: '加载中',
      power: '总权重 加载中',
      reachabilityLabel: '待检测',
      reachabilityStatus: 'unknown',
      status: 'sync',
      validatorKey: 'sol'
    }];
  }

  return validators.slice(0, 2).map((validator, index) => ({
    commission: `佣金 ${formatCommissionBps(validator.commissionBps)}`,
    key: validator.accountAddress || validator.validatorID || `validator-${index}`,
    name: validator.displayName,
    power: `总权重 ${formatLamports(validator.totalStakeLamports)}`,
    reachabilityLabel: validator.reachabilityLabel,
    reachabilityStatus: validator.reachabilityStatus,
    status: validator.status || 'unknown',
    validatorKey: index % 2 === 0 ? 'sol' : 'v'
  }));
}

function getAvatarReachabilityDotStyle(
  reachabilityStatus: WalletValidatorSummary['reachabilityStatus'],
  styles: ReturnType<typeof createStyles>
) {
  if (reachabilityStatus === 'offline') {
    return [styles.onlineDotOnAvatar, styles.onlineDotOnAvatarOffline];
  }

  if (reachabilityStatus === 'unknown') {
    return [styles.onlineDotOnAvatar, styles.onlineDotOnAvatarUnknown];
  }

  return styles.onlineDotOnAvatar;
}

function getReachabilityDotStyle(
  reachabilityStatus: WalletValidatorSummary['reachabilityStatus'],
  styles: ReturnType<typeof createStyles>
) {
  if (reachabilityStatus === 'offline') {
    return [styles.onlineDot, styles.onlineDotOffline];
  }

  if (reachabilityStatus === 'unknown') {
    return [styles.onlineDot, styles.onlineDotUnknown];
  }

  return styles.onlineDot;
}

function getReachabilityTextStyle(
  reachabilityStatus: WalletValidatorSummary['reachabilityStatus'],
  styles: ReturnType<typeof createStyles>
) {
  if (reachabilityStatus === 'offline') {
    return [styles.onlineText, styles.onlineTextOffline];
  }

  if (reachabilityStatus === 'unknown') {
    return [styles.onlineText, styles.onlineTextUnknown];
  }

  return styles.onlineText;
}

function formatCommissionBps(commissionBps: number) {
  if (!Number.isFinite(commissionBps) || commissionBps < 0) {
    return '0%';
  }

  const integerPart = Math.floor(commissionBps / 100);
  const fractionalPart = commissionBps % 100;
  if (fractionalPart === 0) {
    return `${integerPart}%`;
  }

  return `${integerPart}.${String(fractionalPart).padStart(2, '0').replace(/0+$/, '')}%`;
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
      textAlign: 'center',
      width: scaled(70, scale),
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
    onlineDotOffline: {
      backgroundColor: '#D84D4D'
    },
    onlineDotUnknown: {
      backgroundColor: '#A0A6B2'
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
    onlineDotOnAvatarOffline: {
      backgroundColor: '#D84D4D'
    },
    onlineDotOnAvatarUnknown: {
      backgroundColor: '#A0A6B2'
    },
    onlineText: {
      color: '#18C772',
      fontSize: scaled(24, scale),
      fontWeight: '400',
      lineHeight: scaled(31, scale),
      position: 'absolute',
      right: scaled(70, scale),
      top: scaled(27, scale),
      ...textBase
    },
    onlineTextOffline: {
      color: '#D84D4D'
    },
    onlineTextUnknown: {
      color: colors.textMuted
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
      fontWeight: fontWeights.pageTitle,
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
      width: scaled(184, scale),
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
      width: scaled(150, scale),
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
      width: scaled(180, scale),
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
      width: scaled(260, scale),
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
