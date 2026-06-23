import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getGlobalHeaderHeight } from '../../components/GlobalHeader';
import { colors, fontFamilies, fontWeights } from '../../theme/tokens';
import { marketHomeImages } from './designAssets';
import {
  ChevronRightIcon,
  FilterIcon,
  ListMenuIcon,
  MarketActionIcon,
  type MarketActionIconKey,
  MarketAssetIcon,
  type MarketAssetIconKey,
  MarketCategoryIcon,
  type MarketCategoryIconKey,
  SearchIcon
} from './MarketHomeSvgIcons';
import { useMarketHomeResponsiveLayout } from './useMarketHomeResponsiveLayout';

const TOP_NAVIGATION_DESIGN_HEIGHT = 117;

const categoryTabs = [
  { key: 'crypto', label: '虚拟货币', left: 32, width: 172, iconSize: 56, active: true },
  { key: 'stockToken', label: '股票代币', left: 219, width: 171, iconSize: 40, active: false },
  { key: 'cfd', label: 'CFD', left: 406, width: 128, iconSize: 40, active: false },
  { key: 'futures', label: '期货', left: 552, width: 127, iconSize: 44, active: false },
  { key: 'metal', label: '金属', left: 697, width: 123, iconSize: 44, active: false }
] as const;

const heroModeTabs = [
  { label: '现货', left: 65, width: 94, active: true },
  { label: '股票代币', left: 176, width: 128, active: false },
  { label: '永续', left: 321, width: 88, active: false }
] as const;

const actionItems = [
  { key: 'swap', label: 'Swap' },
  { key: 'stockTrade', label: '股票交易' },
  { key: 'futures', label: '期货合约' },
  { key: 'orderBook', label: '订单簿' }
] as const;

const focusRows = [
  {
    badge: '股票代币',
    badgeLeft: 240,
    badgeWidth: 95,
    change: '+1.18%',
    iconKey: 'AAPLx',
    name: 'Apple Inc.',
    price: '192.34',
    quote: '$192.34',
    symbol: 'AAPLx'
  },
  {
    badge: '去中心化现货',
    badgeLeft: 266,
    badgeWidth: 132,
    change: '+2.56%',
    iconKey: 'SOL',
    name: 'Solana',
    price: '71.28',
    quote: '$71.28',
    symbol: 'SOL/USDT'
  },
  {
    badge: '金属',
    badgeLeft: 216,
    badgeWidth: 64,
    change: '+0.42%',
    iconKey: 'XAUx',
    name: '黄金/USDT',
    price: '2331.80',
    quote: '$2,331.80',
    symbol: 'XAUx'
  }
] as const;

const marketTabs = [
  { label: '自选', left: 0, width: 78 },
  { label: '主流', left: 115, width: 78 },
  { label: '涨幅榜', left: 244, width: 106 },
  { label: '跌幅榜', left: 388, width: 106 },
  { label: '24h成交额', left: 532, width: 150 }
] as const;

const marketRows = [
  { symbol: 'BTC', iconKey: 'BTC', name: 'Bitcoin', price: '63,990.01', quote: '$63,990.01', change: '-1.23%', volume: '315.05亿', positive: false },
  { symbol: 'ETH', iconKey: 'ETH', name: 'Ethereum', price: '1,742.69', quote: '$1,742.69', change: '+0.85%', volume: '147.82亿', positive: true },
  { symbol: 'SOL', iconKey: 'SOL', name: 'Solana', price: '71.28', quote: '$71.28', change: '+2.56%', volume: '24.67亿', positive: true },
  { symbol: 'AAPLx', iconKey: 'AAPLx', name: 'Apple Inc.  股票代币', price: '192.34', quote: '$192.34', change: '+1.18%', volume: '23,112.00', positive: true },
  { symbol: 'NAS100', iconKey: 'NAS100', name: 'CFD 指数', price: '18,420.5', quote: '$18,420.50', change: '-0.34%', volume: '9.21亿', positive: false }
] as const;

type ActionKey = (typeof actionItems)[number]['key'];
type CategoryKey = (typeof categoryTabs)[number]['key'];

type MarketHomeScreenProps = {
  readonly bottomPadding?: number;
  readonly topPadding?: number;
};

function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

function scaledBelowTopNavigation(value: number, scale: number) {
  return scaled(value - TOP_NAVIGATION_DESIGN_HEIGHT, scale);
}

export function MarketHomeScreen({ bottomPadding, topPadding }: MarketHomeScreenProps) {
  const layoutMetrics = useMarketHomeResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const headerHeight = getGlobalHeaderHeight(layoutMetrics.scale);
  const resolvedBottomPadding = bottomPadding ?? layoutMetrics.bottomNavHeight;
  const resolvedTopPadding = topPadding ?? layoutMetrics.topSafeArea + headerHeight;

  const handleCategoryPress = (_categoryKey: CategoryKey) => {
    return undefined;
  };

  const handleActionPress = (_actionKey: ActionKey) => {
    return undefined;
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
          <SearchBar scale={layoutMetrics.scale} styles={styles} />
          <CategoryStrip onCategoryPress={handleCategoryPress} scale={layoutMetrics.scale} styles={styles} />
          <MarketVolumeCard scale={layoutMetrics.scale} styles={styles} />
          <ActionPanel onActionPress={handleActionPress} scale={layoutMetrics.scale} styles={styles} />
          <TodayFocusCard scale={layoutMetrics.scale} styles={styles} />
          <MarketTable scale={layoutMetrics.scale} styles={styles} />
        </View>
      </ScrollView>
    </View>
  );
}

function PageHeading({ styles }: { readonly styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.pageHeading}>
      <Text style={styles.pageTitle}>市场</Text>
      <Text style={styles.pageSubtitle}>行情、交易、去中心化市场</Text>
    </View>
  );
}

function SearchBar({ scale, styles }: { readonly scale: number; readonly styles: ReturnType<typeof createStyles> }) {
  return (
    <Pressable accessibilityRole="search" style={styles.searchBar}>
      <View style={styles.searchIcon}>
        <SearchIcon size={scaled(44, scale)} />
      </View>
      <Text style={styles.searchPlaceholder}>搜索币种 / 股票 / 金属 / 合约</Text>
      <View style={styles.filterIcon}>
        <FilterIcon size={scaled(44, scale)} />
      </View>
    </Pressable>
  );
}

function CategoryStrip({
  onCategoryPress,
  scale,
  styles
}: {
  readonly onCategoryPress: (categoryKey: CategoryKey) => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.categoryStrip}>
      {categoryTabs.map((category) => (
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: category.active }}
          key={category.key}
          onPress={() => onCategoryPress(category.key)}
          style={[
            styles.categoryChip,
            category.active ? styles.activeCategoryChip : styles.inactiveCategoryChip,
            { left: scaled(category.left, scale), width: scaled(category.width, scale) }
          ]}
        >
          <MarketCategoryIcon iconKey={category.key as MarketCategoryIconKey} size={scaled(category.iconSize, scale)} />
          <Text style={category.active ? styles.activeCategoryText : styles.categoryText}>{category.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function MarketVolumeCard({ scale, styles }: { readonly scale: number; readonly styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.volumeCard}>
      <Image resizeMode="cover" source={marketHomeImages.marketVolumeCardBackground} style={styles.volumeBackground} />
      <LinearGradient
        colors={['#050507F8', '#050507D0', '#0505072A', '#05050700']}
        end={{ x: 0.78, y: 0.5 }}
        start={{ x: 0, y: 0.5 }}
        style={styles.volumeShade}
      />
      <View style={styles.volumeTitleRow}>
        <Text style={styles.volumeLabel}>全市场成交额</Text>
        <Text style={styles.infoDot}>i</Text>
      </View>
      <View style={styles.volumeAmountRow}>
        <Text style={styles.volumeAmount}>24.67亿</Text>
        <Text style={styles.volumeUnit}>USDT</Text>
      </View>
      <Text style={styles.volumeChange}>+2.56%</Text>
      <Text style={styles.volumePeriod}>(24h)</Text>
      {heroModeTabs.map((mode) => (
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: mode.active }}
          key={mode.label}
          style={[
            styles.heroModePill,
            mode.active ? styles.activeHeroModePill : styles.inactiveHeroModePill,
            { left: scaled(mode.left, scale), width: scaled(mode.width, scale) }
          ]}
        >
          <Text style={mode.active ? styles.activeHeroModeText : styles.heroModeText}>{mode.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function ActionPanel({
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
          style={[styles.actionButton, { left: scaled(index * 197, scale) }]}
        >
          <MarketActionIcon iconKey={item.key as MarketActionIconKey} size={scaled(64, scale)} />
          <Text style={styles.actionLabel}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function TodayFocusCard({ scale, styles }: { readonly scale: number; readonly styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.focusCard}>
      <Text style={styles.sectionTitle}>今日关注</Text>
      <View style={styles.focusDividerOne} />
      <View style={styles.focusDividerTwo} />
      {focusRows.map((row, index) => (
        <FocusRow key={row.symbol} row={row} scale={scale} styles={styles} top={63 + index * 93} />
      ))}
    </View>
  );
}

function FocusRow({
  row,
  scale,
  styles,
  top
}: {
  readonly row: (typeof focusRows)[number];
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
  readonly top: number;
}) {
  return (
    <Pressable accessibilityRole="button" style={[styles.focusRow, { top: scaled(top, scale) }]}>
      <MarketAssetIcon iconKey={row.iconKey as MarketAssetIconKey} size={scaled(64, scale)} />
      <Text style={styles.focusSymbol}>{row.symbol}</Text>
      <View style={[styles.focusBadge, { left: scaled(row.badgeLeft, scale), width: scaled(row.badgeWidth, scale) }]}>
        <Text style={styles.focusBadgeText}>{row.badge}</Text>
      </View>
      <Text style={styles.focusName}>{row.name}</Text>
      <View style={styles.focusPriceBlock}>
        <Text style={styles.focusPrice}>{row.price}</Text>
        <Text style={styles.focusQuote}>{row.quote}</Text>
      </View>
      <Text style={styles.focusChange}>{row.change}</Text>
      <View style={styles.focusChevron}>
        <ChevronRightIcon size={scaled(34, scale)} />
      </View>
    </Pressable>
  );
}

function MarketTable({ scale, styles }: { readonly scale: number; readonly styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.marketCard}>
      <View style={styles.tableTabs}>
        {marketTabs.map((tab, index) => (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: index === 0 }}
            key={tab.label}
            style={[styles.tableTab, { left: scaled(tab.left, scale), width: scaled(tab.width, scale) }]}
          >
            <Text style={index === 0 ? styles.activeTableTabText : styles.tableTabText}>{tab.label}</Text>
            {index === 0 ? <View style={styles.tableTabUnderline} /> : null}
          </Pressable>
        ))}
        <View style={styles.tableMenuIcon}>
          <ListMenuIcon size={scaled(40, scale)} />
        </View>
      </View>
      <View style={styles.tableHeader}>
        <Text style={styles.tableNameHeader}>名称</Text>
        <Text style={styles.tablePriceHeader}>最新价(USDT)</Text>
        <Text style={styles.tableChangeHeader}>24h涨跌</Text>
        <Text style={styles.tableVolumeHeader}>24h成交额</Text>
      </View>
      {marketRows.map((row, index) => (
        <MarketRow key={row.symbol} row={row} scale={scale} styles={styles} top={120 + index * 76} />
      ))}
    </View>
  );
}

function MarketRow({
  row,
  scale,
  styles,
  top
}: {
  readonly row: (typeof marketRows)[number];
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
  readonly top: number;
}) {
  return (
    <Pressable accessibilityRole="button" style={[styles.marketRow, { top: scaled(top, scale) }]}>
      <MarketAssetIcon iconKey={row.iconKey as MarketAssetIconKey} size={scaled(56, scale)} />
      <View style={styles.marketNameBlock}>
        <Text style={styles.marketSymbol}>{row.symbol}</Text>
        <Text numberOfLines={1} style={styles.marketName}>{row.name}</Text>
      </View>
      <View style={styles.marketPriceBlock}>
        <Text style={styles.marketPrice}>{row.price}</Text>
        <Text style={styles.marketQuote}>{row.quote}</Text>
      </View>
      <Text style={row.positive ? styles.marketPositive : styles.marketNegative}>{row.change}</Text>
      <Text style={styles.marketVolume}>{row.volume}</Text>
      <View style={styles.marketChevron}>
        <ChevronRightIcon size={scaled(32, scale)} />
      </View>
    </Pressable>
  );
}

function createStyles(scale: number) {
  // 功能目的：按 50 号市场首页设计坐标缩放；实现原因：保持钱包首页不变时也能做到市场页高保真复刻。
  const textBase = {
    fontFamily: fontFamilies.system,
    includeFontPadding: false
  } as const;

  return StyleSheet.create({
    actionButton: {
      alignItems: 'center',
      height: scaled(121, scale),
      justifyContent: 'flex-start',
      paddingTop: scaled(19, scale),
      position: 'absolute',
      top: 0,
      width: scaled(197, scale)
    },
    actionCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(20, scale),
      borderWidth: 1,
      height: scaled(121, scale),
      left: scaled(32, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(762, scale),
      width: scaled(788, scale)
    },
    actionDividerOne: {
      backgroundColor: colors.border,
      height: scaled(76, scale),
      left: scaled(197, scale),
      position: 'absolute',
      top: scaled(23, scale),
      width: 1
    },
    actionDividerThree: {
      backgroundColor: colors.border,
      height: scaled(76, scale),
      left: scaled(591, scale),
      position: 'absolute',
      top: scaled(23, scale),
      width: 1
    },
    actionDividerTwo: {
      backgroundColor: colors.border,
      height: scaled(76, scale),
      left: scaled(394, scale),
      position: 'absolute',
      top: scaled(23, scale),
      width: 1
    },
    actionLabel: {
      color: colors.text,
      fontSize: scaled(23, scale),
      fontWeight: '500',
      lineHeight: scaled(30, scale),
      marginTop: scaled(4, scale),
      ...textBase
    },
    activeCategoryChip: {
      backgroundColor: colors.black,
      borderColor: colors.black
    },
    activeCategoryText: {
      color: '#FFFFFF',
      fontSize: scaled(25, scale),
      fontWeight: '800',
      lineHeight: scaled(32, scale),
      marginLeft: scaled(9, scale),
      ...textBase
    },
    activeHeroModePill: {
      backgroundColor: '#10111699',
      borderColor: colors.primary
    },
    activeHeroModeText: {
      color: '#FFFFFF',
      fontSize: scaled(24, scale),
      fontWeight: '700',
      lineHeight: scaled(30, scale),
      ...textBase
    },
    activeTableTabText: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '800',
      lineHeight: scaled(34, scale),
      textAlign: 'center',
      ...textBase
    },
    canvas: {
      backgroundColor: colors.background,
      height: scaled(1607, scale),
      position: 'relative',
      width: '100%'
    },
    categoryChip: {
      alignItems: 'center',
      borderRadius: scaled(18, scale),
      borderWidth: 1,
      flexDirection: 'row',
      height: scaled(64, scale),
      justifyContent: 'center',
      position: 'absolute',
      top: 0
    },
    categoryStrip: {
      height: scaled(64, scale),
      left: 0,
      position: 'absolute',
      top: scaledBelowTopNavigation(363, scale),
      width: '100%'
    },
    categoryText: {
      color: colors.text,
      fontSize: scaled(24, scale),
      fontWeight: '700',
      lineHeight: scaled(31, scale),
      marginLeft: scaled(10, scale),
      ...textBase
    },
    filterIcon: {
      alignItems: 'center',
      height: scaled(52, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(21, scale),
      top: scaled(10, scale),
      width: scaled(52, scale)
    },
    focusBadge: {
      alignItems: 'center',
      backgroundColor: '#EFE6FF',
      borderRadius: scaled(14, scale),
      height: scaled(31, scale),
      justifyContent: 'center',
      position: 'absolute',
      top: scaled(7, scale)
    },
    focusBadgeText: {
      color: '#6B45FF',
      fontSize: scaled(20, scale),
      fontWeight: '700',
      lineHeight: scaled(25, scale),
      ...textBase
    },
    focusCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(21, scale),
      borderWidth: 1,
      height: scaled(324, scale),
      left: scaled(32, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(897, scale),
      width: scaled(788, scale)
    },
    focusChange: {
      color: colors.primary,
      fontSize: scaled(26, scale),
      fontWeight: '500',
      lineHeight: scaled(34, scale),
      position: 'absolute',
      right: scaled(83, scale),
      textAlign: 'right',
      top: scaled(18, scale),
      width: scaled(105, scale),
      ...textBase
    },
    focusChevron: {
      alignItems: 'center',
      height: scaled(44, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(8, scale),
      top: scaled(15, scale),
      width: scaled(44, scale)
    },
    focusDividerOne: {
      backgroundColor: colors.border,
      height: 1,
      left: scaled(104, scale),
      position: 'absolute',
      top: scaled(136, scale),
      width: scaled(652, scale)
    },
    focusDividerTwo: {
      backgroundColor: colors.border,
      height: 1,
      left: scaled(104, scale),
      position: 'absolute',
      top: scaled(229, scale),
      width: scaled(652, scale)
    },
    focusName: {
      color: colors.textMuted,
      fontSize: scaled(22, scale),
      fontWeight: '400',
      left: scaled(82, scale),
      lineHeight: scaled(29, scale),
      position: 'absolute',
      top: scaled(42, scale),
      ...textBase
    },
    focusPrice: {
      color: colors.text,
      fontSize: scaled(24, scale),
      fontWeight: '500',
      lineHeight: scaled(31, scale),
      textAlign: 'right',
      ...textBase
    },
    focusPriceBlock: {
      alignItems: 'flex-end',
      position: 'absolute',
      right: scaled(228, scale),
      top: scaled(12, scale),
      width: scaled(128, scale)
    },
    focusQuote: {
      color: colors.textMuted,
      fontSize: scaled(20, scale),
      fontWeight: '400',
      lineHeight: scaled(25, scale),
      marginTop: scaled(1, scale),
      textAlign: 'right',
      ...textBase
    },
    focusRow: {
      height: scaled(78, scale),
      left: scaled(24, scale),
      position: 'absolute',
      width: scaled(740, scale)
    },
    focusSymbol: {
      color: colors.text,
      fontSize: scaled(28, scale),
      fontWeight: '800',
      left: scaled(82, scale),
      lineHeight: scaled(35, scale),
      position: 'absolute',
      top: scaled(3, scale),
      ...textBase
    },
    heroModePill: {
      alignItems: 'center',
      borderRadius: scaled(26, scale),
      borderWidth: 2,
      height: scaled(52, scale),
      justifyContent: 'center',
      position: 'absolute',
      top: scaled(222, scale)
    },
    heroModeText: {
      color: '#C7CBD6',
      fontSize: scaled(24, scale),
      fontWeight: '500',
      lineHeight: scaled(30, scale),
      ...textBase
    },
    inactiveCategoryChip: {
      backgroundColor: '#F7F7F8',
      borderColor: '#F0F1F5'
    },
    inactiveHeroModePill: {
      backgroundColor: '#15161B99',
      borderColor: '#3A3B42'
    },
    infoDot: {
      color: '#B9BDC9',
      fontSize: scaled(18, scale),
      fontWeight: '800',
      lineHeight: scaled(20, scale),
      marginLeft: scaled(8, scale),
      textAlign: 'center',
      width: scaled(21, scale),
      ...textBase
    },
    marketCard: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(21, scale),
      borderWidth: 1,
      height: scaled(488, scale),
      left: scaled(32, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(1236, scale),
      width: scaled(788, scale)
    },
    marketChevron: {
      alignItems: 'center',
      height: scaled(40, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: 0,
      top: scaled(10, scale),
      width: scaled(40, scale)
    },
    marketName: {
      color: colors.textMuted,
      fontSize: scaled(20, scale),
      fontWeight: '400',
      lineHeight: scaled(25, scale),
      marginTop: scaled(1, scale),
      ...textBase
    },
    marketNameBlock: {
      left: scaled(70, scale),
      position: 'absolute',
      top: scaled(2, scale),
      width: scaled(220, scale)
    },
    marketNegative: {
      color: colors.negative,
      fontSize: scaled(23, scale),
      fontWeight: '400',
      left: scaled(506, scale),
      lineHeight: scaled(30, scale),
      position: 'absolute',
      textAlign: 'right',
      top: scaled(11, scale),
      width: scaled(96, scale),
      ...textBase
    },
    marketPositive: {
      color: colors.primary,
      fontSize: scaled(23, scale),
      fontWeight: '400',
      left: scaled(506, scale),
      lineHeight: scaled(30, scale),
      position: 'absolute',
      textAlign: 'right',
      top: scaled(11, scale),
      width: scaled(96, scale),
      ...textBase
    },
    marketPrice: {
      color: colors.text,
      fontSize: scaled(22, scale),
      fontWeight: '400',
      lineHeight: scaled(28, scale),
      textAlign: 'right',
      ...textBase
    },
    marketPriceBlock: {
      alignItems: 'flex-end',
      left: scaled(314, scale),
      position: 'absolute',
      top: scaled(4, scale),
      width: scaled(135, scale)
    },
    marketQuote: {
      color: colors.textMuted,
      fontSize: scaled(18, scale),
      fontWeight: '400',
      lineHeight: scaled(23, scale),
      marginTop: scaled(1, scale),
      textAlign: 'right',
      ...textBase
    },
    marketRow: {
      height: scaled(60, scale),
      left: scaled(22, scale),
      position: 'absolute',
      width: scaled(744, scale)
    },
    marketSymbol: {
      color: colors.text,
      fontSize: scaled(24, scale),
      fontWeight: '500',
      lineHeight: scaled(31, scale),
      ...textBase
    },
    marketVolume: {
      color: colors.text,
      fontSize: scaled(22, scale),
      fontWeight: '400',
      lineHeight: scaled(28, scale),
      position: 'absolute',
      right: scaled(38, scale),
      textAlign: 'right',
      top: scaled(11, scale),
      width: scaled(112, scale),
      ...textBase
    },
    pageHeading: {
      height: scaled(80, scale),
      left: scaled(46, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(175, scale),
      width: scaled(430, scale)
    },
    pageSubtitle: {
      color: '#687184',
      fontSize: scaled(25, scale),
      fontWeight: '400',
      lineHeight: scaled(33, scale),
      marginTop: scaled(12, scale),
      ...textBase
    },
    pageTitle: {
      color: colors.text,
      fontSize: scaled(43, scale),
      fontWeight: fontWeights.pageTitle,
      lineHeight: scaled(49, scale),
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
    searchBar: {
      backgroundColor: colors.surface,
      borderColor: colors.borderStrong,
      borderRadius: scaled(19, scale),
      borderWidth: 1,
      height: scaled(72, scale),
      left: scaled(46, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(270, scale),
      width: scaled(760, scale)
    },
    searchIcon: {
      alignItems: 'center',
      height: scaled(52, scale),
      justifyContent: 'center',
      left: scaled(18, scale),
      position: 'absolute',
      top: scaled(10, scale),
      width: scaled(52, scale)
    },
    searchPlaceholder: {
      color: colors.textMuted,
      fontSize: scaled(25, scale),
      fontWeight: '500',
      left: scaled(73, scale),
      lineHeight: scaled(32, scale),
      position: 'absolute',
      top: scaled(20, scale),
      ...textBase
    },
    sectionTitle: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '800',
      left: scaled(25, scale),
      lineHeight: scaled(35, scale),
      position: 'absolute',
      top: scaled(22, scale),
      ...textBase
    },
    tableChangeHeader: {
      color: colors.textMuted,
      fontSize: scaled(18, scale),
      fontWeight: '400',
      left: scaled(495, scale),
      lineHeight: scaled(23, scale),
      position: 'absolute',
      top: 0,
      ...textBase
    },
    tableHeader: {
      height: scaled(24, scale),
      left: scaled(22, scale),
      position: 'absolute',
      top: scaled(82, scale),
      width: scaled(744, scale)
    },
    tableMenuIcon: {
      alignItems: 'center',
      height: scaled(44, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(5, scale),
      top: scaled(-4, scale),
      width: scaled(44, scale)
    },
    tableNameHeader: {
      color: colors.textMuted,
      fontSize: scaled(18, scale),
      fontWeight: '400',
      left: 0,
      lineHeight: scaled(23, scale),
      position: 'absolute',
      top: 0,
      ...textBase
    },
    tablePriceHeader: {
      color: colors.textMuted,
      fontSize: scaled(18, scale),
      fontWeight: '400',
      left: scaled(310, scale),
      lineHeight: scaled(23, scale),
      position: 'absolute',
      top: 0,
      ...textBase
    },
    tableTab: {
      alignItems: 'center',
      height: scaled(52, scale),
      justifyContent: 'flex-start',
      position: 'absolute',
      top: 0
    },
    tableTabText: {
      color: colors.textMuted,
      fontSize: scaled(24, scale),
      fontWeight: '400',
      lineHeight: scaled(31, scale),
      textAlign: 'center',
      ...textBase
    },
    tableTabUnderline: {
      backgroundColor: colors.primary,
      borderRadius: scaled(2, scale),
      height: scaled(4, scale),
      marginTop: scaled(8, scale),
      width: scaled(56, scale)
    },
    tableTabs: {
      height: scaled(56, scale),
      left: scaled(30, scale),
      position: 'absolute',
      top: scaled(25, scale),
      width: scaled(728, scale)
    },
    tableVolumeHeader: {
      color: colors.textMuted,
      fontSize: scaled(18, scale),
      fontWeight: '400',
      left: scaled(627, scale),
      lineHeight: scaled(23, scale),
      position: 'absolute',
      top: 0,
      ...textBase
    },
    volumeAmount: {
      color: '#FFFFFF',
      fontSize: scaled(60, scale),
      fontWeight: '800',
      lineHeight: scaled(66, scale),
      ...textBase
    },
    volumeAmountRow: {
      alignItems: 'baseline',
      flexDirection: 'row',
      left: scaled(65, scale),
      position: 'absolute',
      top: scaled(81, scale)
    },
    volumeBackground: {
      height: '100%',
      left: 0,
      position: 'absolute',
      top: 0,
      width: '100%'
    },
    volumeCard: {
      backgroundColor: colors.black,
      borderRadius: scaled(19, scale),
      height: scaled(297, scale),
      left: scaled(32, scale),
      overflow: 'hidden',
      position: 'absolute',
      top: scaledBelowTopNavigation(448, scale),
      width: scaled(788, scale)
    },
    volumeChange: {
      color: colors.primary,
      fontSize: scaled(29, scale),
      fontWeight: '800',
      left: scaled(65, scale),
      lineHeight: scaled(37, scale),
      position: 'absolute',
      top: scaled(161, scale),
      ...textBase
    },
    volumeLabel: {
      color: '#C7CBD6',
      fontSize: scaled(23, scale),
      fontWeight: '500',
      lineHeight: scaled(29, scale),
      ...textBase
    },
    volumePeriod: {
      color: '#C7CBD6',
      fontSize: scaled(28, scale),
      fontWeight: '400',
      left: scaled(176, scale),
      lineHeight: scaled(36, scale),
      position: 'absolute',
      top: scaled(162, scale),
      ...textBase
    },
    volumeShade: {
      height: '100%',
      left: 0,
      position: 'absolute',
      top: 0,
      width: '100%'
    },
    volumeTitleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      left: scaled(65, scale),
      position: 'absolute',
      top: scaled(32, scale)
    },
    volumeUnit: {
      color: '#C7CBD6',
      fontSize: scaled(30, scale),
      fontWeight: '500',
      lineHeight: scaled(38, scale),
      marginLeft: scaled(20, scale),
      ...textBase
    }
  });
}
