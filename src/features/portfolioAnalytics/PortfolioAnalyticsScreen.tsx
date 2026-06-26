import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, type DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getGlobalHeaderHeight } from '../../components/GlobalHeader';
import { colors, fontFamilies } from '../../theme/tokens';
import { JsonRpcClient } from '../../utils/chainRpc';
import {
  createEmptyWalletPortfolio,
  formatLamportsAsSol,
  formatLamports,
  loadWalletPortfolio,
  type WalletPortfolio
} from '../../utils/walletBusiness';
import { formatShortAddress } from '../../utils/walletSetup';
import { portfolioAnalyticsImages } from './designAssets';
import {
  PortfolioAnalyticsIcon,
  SimpleTokenIcon,
  SolTokenIcon,
  type PortfolioAnalyticsIconKey
} from './PortfolioAnalyticsSvgIcons';
import { usePortfolioAnalyticsResponsiveLayout } from './usePortfolioAnalyticsResponsiveLayout';

type PortfolioDistributionRow = {
  readonly amount: string;
  readonly color: string;
  readonly label: string;
  readonly share: string;
  readonly valueLamports: bigint;
};

type PortfolioRiskRow = {
  readonly badge: string;
  readonly badgeTone: 'blue' | 'warning';
  readonly description: string;
  readonly iconKey: PortfolioAnalyticsIconKey;
  readonly title: string;
};

type PortfolioPerformanceRow = {
  readonly color: string;
  readonly delta: string;
  readonly label: string;
  readonly value: string;
};

type PortfolioSuggestionRow = {
  readonly description: string;
  readonly iconKey: PortfolioAnalyticsIconKey;
  readonly title: string;
};

type PortfolioHoldingRow = {
  readonly amount: string;
  readonly change: string;
  readonly icon: 'reward' | 'sol' | 'stake';
  readonly label: string;
  readonly share: string;
};

type PortfolioSnapshot = {
  readonly assetKindCount: string;
  readonly chainHealthText: string;
  readonly distributionRows: readonly PortfolioDistributionRow[];
  readonly holdingRows: readonly PortfolioHoldingRow[];
  readonly isChainHealthy: boolean;
  readonly performanceRows: readonly PortfolioPerformanceRow[];
  readonly performanceSubtitle: string;
  readonly performanceValue: string;
  readonly privateSolText: string;
  readonly riskRows: readonly PortfolioRiskRow[];
  readonly suggestionRows: readonly PortfolioSuggestionRow[];
  readonly totalSolText: string;
  readonly validatorCountText: string;
};

type PortfolioAnalyticsScreenProps = {
  readonly bottomPadding?: number;
  readonly currentWalletAddress?: string | null;
  readonly onBackPress?: () => void;
  readonly rpcEndpoint?: string;
  readonly topPadding?: number;
};

function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

function getCurrentTimeLabel() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function PortfolioAnalyticsScreen({
  bottomPadding,
  currentWalletAddress = null,
  onBackPress,
  rpcEndpoint,
  topPadding
}: PortfolioAnalyticsScreenProps) {
  const layoutMetrics = usePortfolioAnalyticsResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const headerHeight = getGlobalHeaderHeight(layoutMetrics.scale);
  const resolvedBottomPadding = bottomPadding ?? layoutMetrics.bottomNavHeight;
  const resolvedTopPadding = topPadding ?? layoutMetrics.topSafeArea + headerHeight;
  const [sortMode, setSortMode] = useState<'按估值' | '按风险'>('按估值');
  const [lastRefreshTime, setLastRefreshTime] = useState(getCurrentTimeLabel());
  const [actionMessage, setActionMessage] = useState('');
  const [portfolio, setPortfolio] = useState<WalletPortfolio>(() => createEmptyWalletPortfolio(currentWalletAddress));
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(true);
  const client = useMemo(() => new JsonRpcClient(rpcEndpoint), [rpcEndpoint]);
  const shortAddress = useMemo(() => {
    try {
      return currentWalletAddress ? formatShortAddress(currentWalletAddress, 7, 7) : '未选择钱包';
    } catch {
      return '地址待校验';
    }
  }, [currentWalletAddress]);
  const portfolioSnapshot = useMemo(() => createPortfolioSnapshot(portfolio, isPortfolioLoading), [isPortfolioLoading, portfolio]);

  useEffect(() => {
    let cancelled = false;
    setIsPortfolioLoading(true);

    // 功能目的：加载资产页真实链上数据；实现原因：资产余额必须来自当前 RPC 和当前钱包地址。
    void loadWalletPortfolio(currentWalletAddress, client)
      .then((nextPortfolio) => {
        if (cancelled) {
          return;
        }
        setPortfolio(nextPortfolio);
        setLastRefreshTime(getCurrentTimeLabel());
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        setPortfolio(createPortfolioErrorState(currentWalletAddress, client.endpoint, error));
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

  const handleRefresh = () => {
    setIsPortfolioLoading(true);
    setActionMessage('');

    // 功能目的：手动刷新真实资产；实现原因：用户点击刷新时必须重新读取链上状态。
    void loadWalletPortfolio(currentWalletAddress, client)
      .then((nextPortfolio) => {
        setPortfolio(nextPortfolio);
        setLastRefreshTime(getCurrentTimeLabel());
        console.info('[portfolio-analytics] refresh completed', { address: shortAddress, rpc: client.endpoint });
      })
      .catch((error: unknown) => {
        setPortfolio(createPortfolioErrorState(currentWalletAddress, client.endpoint, error));
        console.info('[portfolio-analytics] refresh failed', {
          address: shortAddress,
          error: error instanceof Error ? error.message : String(error),
          rpc: client.endpoint
        });
      })
      .finally(() => {
        setIsPortfolioLoading(false);
      });
  };

  const handleReportUnavailable = () => {
    setActionMessage('导出资产报告暂不可用：当前运行环境未提供文件写入入口');
  };

  return (
    <View style={styles.root}>
      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: resolvedBottomPadding, paddingTop: resolvedTopPadding }
        ]}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.canvas}>
          <PortfolioPageTitle onBackPress={onBackPress} styles={styles} />
          <HeroPortfolioCard lastRefreshTime={lastRefreshTime} onRefresh={handleRefresh} scale={layoutMetrics.scale} snapshot={portfolioSnapshot} styles={styles} />
          <DistributionCard onSortPress={() => setSortMode(sortMode === '按估值' ? '按风险' : '按估值')} rows={portfolioSnapshot.distributionRows} scale={layoutMetrics.scale} sortMode={sortMode} styles={styles} totalSolText={portfolioSnapshot.totalSolText} />
          <RiskExposureCard rows={portfolioSnapshot.riskRows} scale={layoutMetrics.scale} styles={styles} />
          <PerformanceCard rows={portfolioSnapshot.performanceRows} scale={layoutMetrics.scale} snapshot={portfolioSnapshot} styles={styles} />
          <SuggestionCard rows={portfolioSnapshot.suggestionRows} scale={layoutMetrics.scale} styles={styles} />
          <HoldingsCard rows={portfolioSnapshot.holdingRows} scale={layoutMetrics.scale} styles={styles} />
          {actionMessage.length > 0 ? <Text style={styles.actionMessage}>{actionMessage}</Text> : null}
          <PortfolioActionBar onExportPress={handleReportUnavailable} onRefreshPress={handleRefresh} scale={layoutMetrics.scale} styles={styles} />
        </View>
      </ScrollView>
    </View>
  );
}

function PortfolioPageTitle({
  onBackPress,
  styles
}: {
  readonly onBackPress?: () => void;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.pageTitleRow}>
      <Pressable accessibilityLabel="返回" accessibilityRole="button" onPress={onBackPress} style={styles.pageBackButton}>
        <Text style={styles.pageBackIcon}>‹</Text>
      </Pressable>
      <View style={styles.pageTitleBlock}>
        <Text style={styles.pageTitle}>资产组合</Text>
        <Text style={styles.pageSubtitle}>配置、风险与收益归因</Text>
      </View>
    </View>
  );
}

function PortfolioActionBar({
  onExportPress,
  onRefreshPress,
  scale,
  styles
}: {
  readonly onExportPress: () => void;
  readonly onRefreshPress: () => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.actionBar}>
      <Pressable accessibilityRole="button" onPress={onRefreshPress} style={styles.actionPrimaryButton}>
        <PortfolioAnalyticsIcon color="#FFFFFF" iconKey="refresh" size={scaled(28, scale)} />
        <Text style={styles.actionPrimaryText}>刷新资产</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onExportPress} style={styles.actionSecondaryButton}>
        <PortfolioAnalyticsIcon color={colors.text} iconKey="report" size={scaled(28, scale)} />
        <Text style={styles.actionSecondaryText}>导出资产报告</Text>
      </Pressable>
    </View>
  );
}

function HeroPortfolioCard({
  lastRefreshTime,
  onRefresh,
  scale,
  snapshot,
  styles
}: {
  readonly lastRefreshTime: string;
  readonly onRefresh: () => void;
  readonly scale: number;
  readonly snapshot: PortfolioSnapshot;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.heroCardModern}>
      <Image resizeMode="cover" source={portfolioAnalyticsImages.heroBackground} style={styles.heroBackground} />
      <LinearGradient colors={['#050507F8', '#050507D8', '#05050722']} end={{ x: 1, y: 0.5 }} start={{ x: 0, y: 0.5 }} style={styles.heroShade} />
      <View style={styles.heroContent}>
        <View style={styles.heroTopRow}>
          <View>
            <View style={styles.heroTitleRowModern}>
              <Text style={styles.heroLabel}>总资产 (SOL)</Text>
              <PortfolioAnalyticsIcon color="#8B91A3" iconKey="eye" size={scaled(30, scale)} />
            </View>
            <Text style={styles.heroSubtitle}>当前钱包链上权益</Text>
          </View>
          <Pressable accessibilityLabel="刷新资产" accessibilityRole="button" onPress={onRefresh} style={styles.refreshPill}>
            <PortfolioAnalyticsIcon color="#FFFFFF" iconKey="refresh" size={scaled(24, scale)} />
            <Text style={styles.refreshPillText}>{lastRefreshTime}</Text>
          </Pressable>
        </View>
        <Text adjustsFontSizeToFit minimumFontScale={0.58} numberOfLines={1} style={styles.heroAmountModern}>{snapshot.totalSolText}</Text>
        <View style={styles.heroStatusRow}>
          <Text style={styles.heroStatusText}>链上实时</Text>
          <Text style={snapshot.isChainHealthy ? styles.heroStatusGood : styles.heroStatusWarning}>{snapshot.chainHealthText}</Text>
        </View>
        <View style={styles.heroMetricGrid}>
          <HeroMetric iconKey="risk" label="RPC 状态" scale={scale} styles={styles} value={snapshot.chainHealthText} valueTone={snapshot.isChainHealthy ? 'purple' : undefined} />
          <HeroMetric iconKey="assetKind" label="资产种类" scale={scale} styles={styles} value={snapshot.assetKindCount} />
          <HeroMetric iconKey="contract" label="验证者" scale={scale} styles={styles} value={snapshot.validatorCountText} />
          <HeroMetric iconKey="private" label="隐私可用" scale={scale} styles={styles} value={snapshot.privateSolText} />
        </View>
      </View>
    </View>
  );
}

function HeroMetric({
  iconKey,
  label,
  scale,
  styles,
  value,
  valueTone
}: {
  readonly iconKey: PortfolioAnalyticsIconKey;
  readonly label: string;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
  readonly value: string;
  readonly valueTone?: 'purple';
}) {
  return (
    <View style={styles.heroMetricTile}>
      <PortfolioAnalyticsIcon color={iconKey === 'risk' ? '#8A4DFF' : '#27D8FF'} iconKey={iconKey} size={scaled(25, scale)} />
      <View style={styles.heroMetricTextBlock}>
        <Text numberOfLines={1} style={styles.heroMetricLabelModern}>{label}</Text>
        <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={valueTone === 'purple' ? styles.heroMetricValuePurpleModern : styles.heroMetricValueModern}>{value}</Text>
      </View>
    </View>
  );
}

function DistributionCard({
  onSortPress,
  rows,
  scale,
  sortMode,
  styles,
  totalSolText
}: {
  readonly onSortPress: () => void;
  readonly rows: readonly PortfolioDistributionRow[];
  readonly scale: number;
  readonly sortMode: string;
  readonly styles: ReturnType<typeof createStyles>;
  readonly totalSolText: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.sectionTitleModern}>资产分布</Text>
        <Pressable accessibilityRole="button" onPress={onSortPress} style={styles.sortButtonModern}>
          <Text style={styles.sortText}>{sortMode}</Text>
          <PortfolioAnalyticsIcon color="#090A12" iconKey="chevronDown" size={scaled(22, scale)} />
        </Pressable>
      </View>
      <View style={styles.distributionTotalBox}>
        <Text style={styles.mutedLabel}>合计</Text>
        <Text adjustsFontSizeToFit minimumFontScale={0.68} numberOfLines={1} style={styles.distributionTotalAmountModern}>{totalSolText}</Text>
      </View>
      <View style={styles.distributionList}>
        {rows.map((row, index) => (
          <DistributionRow index={index} key={row.label} row={row} styles={styles} />
        ))}
      </View>
    </View>
  );
}

function DistributionRow({
  index,
  row,
  styles
}: {
  readonly index: number;
  readonly row: PortfolioDistributionRow;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={[styles.distributionRowModern, index > 0 ? styles.rowSpacing : null]}>
      <View style={styles.rowTopLine}>
        <View style={styles.legendTitleBlock}>
          <View style={[styles.legendDot, { backgroundColor: row.color }]} />
          <Text numberOfLines={1} style={styles.legendLabelModern}>{row.label}</Text>
        </View>
        <Text style={styles.legendShareModern}>{row.share}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { backgroundColor: row.color, width: row.share as DimensionValue }]} />
      </View>
      <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.legendAmountModern}>{row.amount} SOL</Text>
    </View>
  );
}

function RiskExposureCard({
  rows,
  scale,
  styles
}: {
  readonly rows: readonly PortfolioRiskRow[];
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitleModern}>风险敞口</Text>
      <View style={styles.compactList}>
        {rows.map((row) => (
          <View key={row.title} style={styles.infoRow}>
            <View style={styles.infoIconSlot}>
              <PortfolioAnalyticsIcon color={row.badgeTone === 'warning' ? '#7C4DFF' : '#1E6BFF'} iconKey={row.iconKey} size={scaled(34, scale)} />
            </View>
            <View style={styles.infoTextBlock}>
              <Text numberOfLines={1} style={styles.infoTitle}>{row.title}</Text>
              <Text numberOfLines={1} style={styles.infoDescription}>{row.description}</Text>
            </View>
            <View style={row.badgeTone === 'warning' ? styles.badgeWarning : styles.badgeBlue}>
              <Text style={row.badgeTone === 'warning' ? styles.badgeTextWarning : styles.badgeTextBlue}>{row.badge}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function PerformanceCard({
  rows,
  scale,
  snapshot,
  styles
}: {
  readonly rows: readonly PortfolioPerformanceRow[];
  readonly scale: number;
  readonly snapshot: PortfolioSnapshot;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.sectionTitleModern}>组合表现 (SOL)</Text>
        <Text style={styles.snapshotBadge}>{snapshot.performanceSubtitle}</Text>
      </View>
      <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.rewardValue}>{snapshot.performanceValue}</Text>
      <Text style={styles.mutedLabel}>待领取质押奖励</Text>
      <View style={styles.metricMatrix}>
        {rows.map((row) => (
          <View key={row.label} style={styles.metricCell}>
            <View style={[styles.performanceDot, { backgroundColor: row.color }]} />
            <Text numberOfLines={1} style={styles.metricCellLabel}>{row.label}</Text>
            <Text adjustsFontSizeToFit minimumFontScale={0.7} numberOfLines={1} style={styles.metricCellValue}>{row.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function SuggestionCard({
  rows,
  scale,
  styles
}: {
  readonly rows: readonly PortfolioSuggestionRow[];
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitleModern}>优化建议</Text>
      <View style={styles.compactList}>
        {rows.map((row) => (
          <View key={row.title} style={styles.infoRow}>
            <View style={styles.infoIconSlot}>
              <PortfolioAnalyticsIcon color="#1E6BFF" iconKey={row.iconKey} size={scaled(34, scale)} />
            </View>
            <View style={styles.infoTextBlock}>
              <Text numberOfLines={1} style={styles.infoTitle}>{row.title}</Text>
              <Text numberOfLines={1} style={styles.infoDescription}>{row.description}</Text>
            </View>
            <PortfolioAnalyticsIcon color="#9BA0AA" iconKey="chevronRight" size={scaled(28, scale)} />
          </View>
        ))}
      </View>
    </View>
  );
}

function HoldingsCard({
  rows,
  scale,
  styles
}: {
  readonly rows: readonly PortfolioHoldingRow[];
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.sectionTitleModern}>资产持仓</Text>
      <View style={styles.holdingList}>
        {rows.map((row) => (
          <HoldingRow key={row.label} row={row} scale={scale} styles={styles} />
        ))}
      </View>
    </View>
  );
}

function HoldingRow({
  row,
  scale,
  styles
}: {
  readonly row: PortfolioHoldingRow;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.holdingRowModern}>
      <TokenIcon icon={row.icon} scale={scale} styles={styles} />
      <View style={styles.holdingMain}>
        <Text numberOfLines={1} style={styles.holdingLabelModern}>{row.label}</Text>
        <Text style={styles.holdingMeta}>占比 {row.share} · {row.change}</Text>
      </View>
      <Text adjustsFontSizeToFit minimumFontScale={0.72} numberOfLines={1} style={styles.holdingAmountModern}>{row.amount}</Text>
    </View>
  );
}

function TokenIcon({
  icon,
  scale,
  styles
}: {
  readonly icon: PortfolioHoldingRow['icon'];
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  if (icon === 'sol') {
    return <SolTokenIcon size={scaled(36, scale)} />;
  }

  if (icon === 'stake') {
    return <SimpleTokenIcon backgroundColor="#1E6BFF" color="#FFFFFF" label="S" size={scaled(36, scale)} />;
  }

  return <SimpleTokenIcon backgroundColor="#10B965" color="#FFFFFF" label="R" size={scaled(36, scale)} />;
}

function createPortfolioSnapshot(portfolio: WalletPortfolio, isLoading: boolean): PortfolioSnapshot {
  const selfStakeLamports = portfolio.dpos.selfStakeLamports + portfolio.dpos.selfPendingLamports + portfolio.dpos.selfUnlockingLamports;
  const delegatedStakeLamports = portfolio.dpos.delegatedLamports + portfolio.dpos.delegatedPendingLamports + portfolio.dpos.delegatedUnlockingLamports;
  const rewardLamports = portfolio.dpos.totalRewardLamports;
  const totalLamports = portfolio.transparentLamports + selfStakeLamports + delegatedStakeLamports + rewardLamports;
  const distributionRows = createDistributionRows(portfolio.transparentLamports, selfStakeLamports, delegatedStakeLamports, rewardLamports, totalLamports);
  const positiveAssetKinds = distributionRows.filter((row) => row.valueLamports > 0n).length;
  const chainHealthText = isLoading ? '加载中' : portfolio.chain.isHealthy && !portfolio.chain.error ? '正常' : '异常';

  return {
    assetKindCount: String(positiveAssetKinds),
    chainHealthText,
    distributionRows,
    holdingRows: createHoldingRows(distributionRows),
    isChainHealthy: chainHealthText === '正常',
    performanceRows: createPerformanceRows(portfolio, selfStakeLamports, delegatedStakeLamports, rewardLamports),
    performanceSubtitle: '实时快照',
    performanceValue: formatLamportsAsSol(rewardLamports),
    privateSolText: portfolio.privateSolText,
    riskRows: createRiskRows(portfolio, chainHealthText, selfStakeLamports, delegatedStakeLamports),
    suggestionRows: createSuggestionRows(portfolio, rewardLamports),
    totalSolText: formatLamportsAsSol(totalLamports),
    validatorCountText: String(portfolio.chain.validatorCount)
  };
}

function createDistributionRows(
  availableLamports: bigint,
  selfStakeLamports: bigint,
  delegatedStakeLamports: bigint,
  rewardLamports: bigint,
  totalLamports: bigint
): readonly PortfolioDistributionRow[] {
  return [
    createDistributionRow('可用 LAMPORTS', availableLamports, totalLamports, '#6652FF'),
    createDistributionRow('自质押', selfStakeLamports, totalLamports, '#168BFF'),
    createDistributionRow('委托质押', delegatedStakeLamports, totalLamports, '#FFB000'),
    createDistributionRow('待领奖励', rewardLamports, totalLamports, '#10A6A0')
  ];
}

function createDistributionRow(label: string, valueLamports: bigint, totalLamports: bigint, color: string): PortfolioDistributionRow {
  return {
    amount: formatLamportsAsSol(valueLamports),
    color,
    label,
    share: formatShare(valueLamports, totalLamports),
    valueLamports
  };
}

function createHoldingRows(rows: readonly PortfolioDistributionRow[]): readonly PortfolioHoldingRow[] {
  const positiveRows = rows.filter((row) => row.valueLamports > 0n);
  const sourceRows = positiveRows.length > 0 ? positiveRows : rows.slice(0, 1);

  return sourceRows.slice(0, 5).map((row) => ({
    amount: row.amount,
    change: '链上',
    icon: row.label === '可用 LAMPORTS' ? 'sol' : row.label === '待领奖励' ? 'reward' : 'stake',
    label: row.label,
    share: row.share
  }));
}

function createRiskRows(
  portfolio: WalletPortfolio,
  chainHealthText: string,
  selfStakeLamports: bigint,
  delegatedStakeLamports: bigint
): readonly PortfolioRiskRow[] {
  return [
    {
      badge: chainHealthText,
      badgeTone: portfolio.chain.isHealthy && !portfolio.chain.error ? 'blue' : 'warning',
      description: abbreviateText(portfolio.chain.error || portfolio.chain.rpcURL, 18),
      iconKey: 'contractRisk',
      title: 'RPC 状态'
    },
    {
      badge: `${portfolio.chain.validatorCount}`,
      badgeTone: portfolio.chain.validatorCount > 0 ? 'blue' : 'warning',
      description: `链高 ${portfolio.chain.headHeight}`,
      iconKey: 'liquidity',
      title: '验证者数量'
    },
    {
      badge: selfStakeLamports > 0n ? '有' : '无',
      badgeTone: selfStakeLamports > 0n ? 'blue' : 'warning',
      description: `${formatLamportsAsSol(selfStakeLamports)} SOL`,
      iconKey: 'rwa',
      title: '自质押'
    },
    {
      badge: delegatedStakeLamports > 0n ? '有' : '无',
      badgeTone: delegatedStakeLamports > 0n ? 'blue' : 'warning',
      description: `${formatLamportsAsSol(delegatedStakeLamports)} SOL`,
      iconKey: 'cfd',
      title: '委托质押'
    }
  ];
}

function createPerformanceRows(
  portfolio: WalletPortfolio,
  selfStakeLamports: bigint,
  delegatedStakeLamports: bigint,
  rewardLamports: bigint
): readonly PortfolioPerformanceRow[] {
  return [
    { color: '#0E80C8', delta: '链上', label: '可用余额', value: formatLamportsAsSol(portfolio.transparentLamports) },
    { color: '#FFD21F', delta: '链上', label: '自质押', value: formatLamportsAsSol(selfStakeLamports) },
    { color: '#22B4C7', delta: '链上', label: '委托质押', value: formatLamportsAsSol(delegatedStakeLamports) },
    { color: '#1E6BFF', delta: '链上', label: '待领奖励', value: formatLamportsAsSol(rewardLamports) }
  ];
}

function createSuggestionRows(portfolio: WalletPortfolio, rewardLamports: bigint): readonly PortfolioSuggestionRow[] {
  if (!portfolio.address) {
    return [
      { description: '创建或导入钱包后读取余额', iconKey: 'review', title: '选择钱包账户' },
      { description: '资产页会使用当前 RPC', iconKey: 'diversify', title: '确认 RPC 节点' },
      { description: '余额不会使用设计稿样例', iconKey: 'claim', title: '等待链上数据' }
    ];
  }

  if (portfolio.chain.error) {
    return [
      { description: abbreviateText(portfolio.chain.error, 22), iconKey: 'review', title: '检查 RPC 连接' },
      { description: abbreviateText(portfolio.chain.rpcURL, 22), iconKey: 'diversify', title: '切换可用节点' },
      { description: '确认手机和节点网络可达', iconKey: 'claim', title: '网络诊断' }
    ];
  }

  return [
    { description: rewardLamports > 0n ? `可领取 ${formatLamportsAsSol(rewardLamports)} SOL` : '当前无可领取奖励', iconKey: 'claim', title: '领取质押奖励' },
    { description: `当前 RPC ${abbreviateText(portfolio.chain.rpcURL, 18)}`, iconKey: 'review', title: '核对数据来源' },
    { description: `余额 ${formatLamports(portfolio.transparentLamports)} lamports`, iconKey: 'diversify', title: '链上余额明细' }
  ];
}

function createPortfolioErrorState(address: string | null, rpcURL: string, error: unknown): WalletPortfolio {
  const fallbackPortfolio = createEmptyWalletPortfolio(address);
  return {
    ...fallbackPortfolio,
    chain: {
      ...fallbackPortfolio.chain,
      error: error instanceof Error ? error.message : String(error),
      rpcURL
    }
  };
}

function formatShare(valueLamports: bigint, totalLamports: bigint) {
  if (totalLamports <= 0n || valueLamports <= 0n) {
    return '0.00%';
  }

  const basisPoints = (valueLamports * 10000n) / totalLamports;
  const integerPart = basisPoints / 100n;
  const decimalPart = String(basisPoints % 100n).padStart(2, '0');
  return `${integerPart}.${decimalPart}%`;
}

function abbreviateText(value: string, maxLength: number) {
  const text = String(value ?? '').trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxLength - 1))}…`;
}

function createStyles(scale: number) {
  // 功能目的：建立移动端资产页自适应布局；实现原因：真实链上数据长度不可控，绝对坐标会导致重叠。
  const textBase = {
    fontFamily: fontFamilies.system,
    includeFontPadding: false
  } as const;
  const cardPadding = scaled(20, scale);
  const cardRadius = scaled(18, scale);

  return StyleSheet.create({
    badgeBlue: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: scaled(14, scale),
      minWidth: scaled(48, scale),
      paddingHorizontal: scaled(10, scale),
      paddingVertical: scaled(5, scale)
    },
    badgeTextBlue: {
      color: colors.primary,
      fontSize: scaled(15, scale),
      fontWeight: '800',
      lineHeight: scaled(20, scale),
      ...textBase
    },
    badgeTextWarning: {
      color: colors.warning,
      fontSize: scaled(15, scale),
      fontWeight: '800',
      lineHeight: scaled(20, scale),
      ...textBase
    },
    badgeWarning: {
      alignItems: 'center',
      backgroundColor: '#FFF4E8',
      borderRadius: scaled(14, scale),
      minWidth: scaled(48, scale),
      paddingHorizontal: scaled(10, scale),
      paddingVertical: scaled(5, scale)
    },
    barFill: {
      borderRadius: scaled(5, scale),
      height: '100%',
      maxWidth: '100%'
    },
    barTrack: {
      backgroundColor: '#EEF1F8',
      borderRadius: scaled(5, scale),
      height: scaled(10, scale),
      marginTop: scaled(8, scale),
      overflow: 'hidden',
      width: '100%'
    },
    actionBar: {
      flexDirection: 'row',
      gap: scaled(14, scale),
      marginTop: scaled(18, scale)
    },
    actionMessage: {
      color: colors.textMuted,
      fontSize: scaled(15, scale),
      fontWeight: '600',
      lineHeight: scaled(22, scale),
      marginTop: scaled(14, scale),
      textAlign: 'center',
      ...textBase
    },
    actionPrimaryButton: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderColor: colors.primary,
      borderRadius: scaled(17, scale),
      borderWidth: 1,
      flex: 1,
      flexDirection: 'row',
      gap: scaled(8, scale),
      height: scaled(64, scale),
      justifyContent: 'center'
    },
    actionPrimaryText: {
      color: '#FFFFFF',
      fontSize: scaled(20, scale),
      fontWeight: '900',
      lineHeight: scaled(28, scale),
      ...textBase
    },
    actionSecondaryButton: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: '#2E3344',
      borderRadius: scaled(17, scale),
      borderWidth: 1,
      flex: 1,
      flexDirection: 'row',
      gap: scaled(8, scale),
      height: scaled(64, scale),
      justifyContent: 'center'
    },
    actionSecondaryText: {
      color: colors.text,
      fontSize: scaled(20, scale),
      fontWeight: '900',
      lineHeight: scaled(28, scale),
      ...textBase
    },
    canvas: {
      backgroundColor: colors.background,
      paddingHorizontal: scaled(18, scale),
      paddingTop: scaled(12, scale),
      width: '100%'
    },
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: cardRadius,
      borderWidth: 1,
      marginTop: scaled(16, scale),
      padding: cardPadding,
      width: '100%'
    },
    cardHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: scaled(14, scale)
    },
    compactList: {
      marginTop: scaled(14, scale)
    },
    distributionList: {
      marginTop: scaled(16, scale)
    },
    distributionRowModern: {
      width: '100%'
    },
    distributionTotalAmountModern: {
      color: colors.text,
      fontSize: scaled(24, scale),
      fontWeight: '800',
      lineHeight: scaled(32, scale),
      marginTop: scaled(4, scale),
      ...textBase
    },
    distributionTotalBox: {
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.border,
      borderRadius: scaled(14, scale),
      borderWidth: 1,
      paddingHorizontal: scaled(14, scale),
      paddingVertical: scaled(12, scale)
    },
    heroBackground: {
      height: '100%',
      left: 0,
      position: 'absolute',
      top: 0,
      width: '100%'
    },
    heroCardModern: {
      backgroundColor: colors.black,
      borderRadius: scaled(22, scale),
      minHeight: scaled(330, scale),
      overflow: 'hidden',
      width: '100%'
    },
    heroContent: {
      minHeight: scaled(330, scale),
      padding: scaled(22, scale),
      position: 'relative'
    },
    heroAmountModern: {
      color: '#FFFFFF',
      fontSize: scaled(37, scale),
      fontWeight: '900',
      lineHeight: scaled(46, scale),
      marginTop: scaled(24, scale),
      ...textBase
    },
    heroLabel: {
      color: '#FFFFFF',
      fontSize: scaled(22, scale),
      fontWeight: '800',
      lineHeight: scaled(29, scale),
      marginRight: scaled(9, scale),
      ...textBase
    },
    heroMetricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginTop: scaled(22, scale),
      rowGap: scaled(10, scale)
    },
    heroMetricLabelModern: {
      color: '#D7DAE5',
      fontSize: scaled(13, scale),
      fontWeight: '600',
      lineHeight: scaled(18, scale),
      ...textBase
    },
    heroMetricTextBlock: {
      flex: 1,
      marginLeft: scaled(9, scale),
      minWidth: 0
    },
    heroMetricTile: {
      alignItems: 'center',
      backgroundColor: '#FFFFFF12',
      borderColor: '#FFFFFF24',
      borderRadius: scaled(14, scale),
      borderWidth: 1,
      flexDirection: 'row',
      minHeight: scaled(58, scale),
      paddingHorizontal: scaled(11, scale),
      paddingVertical: scaled(9, scale),
      width: '48.5%'
    },
    heroMetricValueModern: {
      color: '#FFFFFF',
      fontSize: scaled(17, scale),
      fontWeight: '800',
      lineHeight: scaled(23, scale),
      marginTop: scaled(2, scale),
      ...textBase
    },
    heroMetricValuePurpleModern: {
      color: '#B896FF',
      fontSize: scaled(17, scale),
      fontWeight: '800',
      lineHeight: scaled(23, scale),
      marginTop: scaled(2, scale),
      ...textBase
    },
    heroShade: {
      height: '100%',
      left: 0,
      position: 'absolute',
      top: 0,
      width: '100%'
    },
    heroStatusGood: {
      color: colors.success,
      fontSize: scaled(16, scale),
      fontWeight: '800',
      lineHeight: scaled(22, scale),
      ...textBase
    },
    heroStatusRow: {
      alignItems: 'center',
      flexDirection: 'row',
      marginTop: scaled(8, scale)
    },
    heroStatusText: {
      color: '#D7DAE5',
      fontSize: scaled(16, scale),
      fontWeight: '600',
      lineHeight: scaled(22, scale),
      marginRight: scaled(8, scale),
      ...textBase
    },
    heroStatusWarning: {
      color: '#FFB000',
      fontSize: scaled(16, scale),
      fontWeight: '800',
      lineHeight: scaled(22, scale),
      ...textBase
    },
    heroSubtitle: {
      color: '#9AA0AE',
      fontSize: scaled(14, scale),
      fontWeight: '500',
      lineHeight: scaled(20, scale),
      marginTop: scaled(2, scale),
      ...textBase
    },
    heroTitleRowModern: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    heroTopRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      justifyContent: 'space-between'
    },
    holdingAmountModern: {
      color: colors.text,
      flexShrink: 1,
      fontSize: scaled(17, scale),
      fontWeight: '800',
      lineHeight: scaled(23, scale),
      marginLeft: scaled(12, scale),
      maxWidth: '45%',
      textAlign: 'right',
      ...textBase
    },
    holdingLabelModern: {
      color: colors.text,
      fontSize: scaled(18, scale),
      fontWeight: '800',
      lineHeight: scaled(25, scale),
      ...textBase
    },
    holdingList: {
      marginTop: scaled(12, scale)
    },
    holdingMain: {
      flex: 1,
      marginLeft: scaled(12, scale),
      minWidth: 0
    },
    holdingMeta: {
      color: colors.textMuted,
      fontSize: scaled(14, scale),
      fontWeight: '500',
      lineHeight: scaled(20, scale),
      marginTop: scaled(3, scale),
      ...textBase
    },
    holdingRowModern: {
      alignItems: 'center',
      borderTopColor: colors.border,
      borderTopWidth: 1,
      flexDirection: 'row',
      paddingVertical: scaled(13, scale)
    },
    infoDescription: {
      color: colors.textMuted,
      fontSize: scaled(14, scale),
      fontWeight: '500',
      lineHeight: scaled(20, scale),
      marginTop: scaled(2, scale),
      ...textBase
    },
    infoIconSlot: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: scaled(15, scale),
      height: scaled(46, scale),
      justifyContent: 'center',
      width: scaled(46, scale)
    },
    infoRow: {
      alignItems: 'center',
      borderTopColor: colors.border,
      borderTopWidth: 1,
      flexDirection: 'row',
      minHeight: scaled(70, scale),
      paddingVertical: scaled(12, scale)
    },
    infoTextBlock: {
      flex: 1,
      marginHorizontal: scaled(12, scale),
      minWidth: 0
    },
    infoTitle: {
      color: colors.text,
      fontSize: scaled(17, scale),
      fontWeight: '800',
      lineHeight: scaled(23, scale),
      ...textBase
    },
    legendDot: {
      borderRadius: scaled(5, scale),
      height: scaled(9, scale),
      marginRight: scaled(8, scale),
      width: scaled(10, scale)
    },
    legendAmountModern: {
      color: colors.text,
      fontSize: scaled(16, scale),
      fontWeight: '700',
      lineHeight: scaled(24, scale),
      marginTop: scaled(6, scale),
      ...textBase
    },
    legendLabelModern: {
      color: colors.text,
      flexShrink: 1,
      fontSize: scaled(16, scale),
      fontWeight: '700',
      lineHeight: scaled(22, scale),
      ...textBase
    },
    legendShareModern: {
      color: colors.textMuted,
      fontSize: scaled(15, scale),
      fontWeight: '700',
      lineHeight: scaled(21, scale),
      ...textBase
    },
    legendTitleBlock: {
      alignItems: 'center',
      flex: 1,
      flexDirection: 'row',
      minWidth: 0
    },
    metricCell: {
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.border,
      borderRadius: scaled(14, scale),
      borderWidth: 1,
      marginTop: scaled(10, scale),
      padding: scaled(12, scale),
      width: '48.5%'
    },
    metricCellLabel: {
      color: colors.textMuted,
      fontSize: scaled(14, scale),
      fontWeight: '700',
      lineHeight: scaled(20, scale),
      marginTop: scaled(8, scale),
      ...textBase
    },
    metricCellValue: {
      color: colors.text,
      fontSize: scaled(17, scale),
      fontWeight: '800',
      lineHeight: scaled(23, scale),
      marginTop: scaled(4, scale),
      ...textBase
    },
    metricMatrix: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginTop: scaled(10, scale)
    },
    mutedLabel: {
      color: colors.textMuted,
      fontSize: scaled(15, scale),
      fontWeight: '600',
      lineHeight: scaled(21, scale),
      ...textBase
    },
    performanceDot: {
      borderRadius: scaled(5, scale),
      height: scaled(10, scale),
      width: scaled(10, scale)
    },
    pageBackButton: {
      alignItems: 'center',
      height: scaled(52, scale),
      justifyContent: 'center',
      width: scaled(52, scale)
    },
    pageBackIcon: {
      color: colors.text,
      fontSize: scaled(50, scale),
      lineHeight: scaled(52, scale),
      ...textBase
    },
    pageSubtitle: {
      color: colors.textMuted,
      fontSize: scaled(21, scale),
      lineHeight: scaled(29, scale),
      marginTop: scaled(4, scale),
      ...textBase
    },
    pageTitle: {
      color: colors.text,
      fontSize: scaled(34, scale),
      fontWeight: '900',
      lineHeight: scaled(43, scale),
      ...textBase
    },
    pageTitleBlock: {
      flex: 1,
      marginLeft: scaled(8, scale)
    },
    pageTitleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      marginBottom: scaled(16, scale),
      minHeight: scaled(74, scale)
    },
    refreshPill: {
      alignItems: 'center',
      backgroundColor: '#FFFFFF18',
      borderColor: '#FFFFFF2E',
      borderRadius: scaled(18, scale),
      borderWidth: 1,
      flexDirection: 'row',
      paddingHorizontal: scaled(10, scale),
      paddingVertical: scaled(8, scale)
    },
    refreshPillText: {
      color: '#FFFFFF',
      fontSize: scaled(13, scale),
      fontWeight: '800',
      lineHeight: scaled(18, scale),
      marginLeft: scaled(4, scale),
      ...textBase
    },
    rewardValue: {
      color: '#10B965',
      fontSize: scaled(30, scale),
      fontWeight: '800',
      lineHeight: scaled(38, scale),
      marginTop: scaled(2, scale),
      ...textBase
    },
    root: {
      backgroundColor: colors.background,
      flex: 1
    },
    rowSpacing: {
      marginTop: scaled(18, scale)
    },
    rowTopLine: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between'
    },
    scrollContent: {
      backgroundColor: colors.background
    },
    scrollView: {
      backgroundColor: colors.background
    },
    sectionTitleModern: {
      color: colors.text,
      fontSize: scaled(21, scale),
      fontWeight: '800',
      lineHeight: scaled(28, scale),
      ...textBase
    },
    snapshotBadge: {
      backgroundColor: colors.primarySoft,
      borderRadius: scaled(12, scale),
      color: colors.primary,
      fontSize: scaled(14, scale),
      fontWeight: '800',
      lineHeight: scaled(20, scale),
      overflow: 'hidden',
      paddingHorizontal: scaled(10, scale),
      paddingVertical: scaled(4, scale),
      ...textBase
    },
    sortButtonModern: {
      alignItems: 'center',
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.border,
      borderRadius: scaled(14, scale),
      borderWidth: 1,
      flexDirection: 'row',
      paddingHorizontal: scaled(10, scale),
      paddingVertical: scaled(6, scale)
    },
    sortText: {
      color: colors.text,
      fontSize: scaled(15, scale),
      fontWeight: '700',
      lineHeight: scaled(21, scale),
      ...textBase
    },
  });
}
