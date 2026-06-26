import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getGlobalHeaderHeight } from '../../components/GlobalHeader';
import { colors, fontFamilies, fontWeights } from '../../theme/tokens';
import { contractsListImages } from './designAssets';
import {
  ChevronRightIcon,
  ContractIcon,
  type ContractIconKey,
  DeployContractIcon,
  FilterIcon,
  RefreshIcon,
  ScanDeployIcon,
  SearchIcon
} from './ContractsListSvgIcons';
import { useContractsListResponsiveLayout } from './useContractsListResponsiveLayout';

const TOP_NAVIGATION_DESIGN_HEIGHT = 117;

const filterTabs = ['全部', 'ERC20-like', 'NFT', '系统'] as const;

const contractRows = [
  {
    address: '7m3X...Kp9q',
    height: '1,245,890',
    icon: 'pop',
    name: 'POP 泡泡币',
    status: '已启用',
    statusTone: 'enabled',
    tag: 'ERC20-like'
  },
  {
    address: '9kLm...Bz3d',
    height: '1,245,663',
    icon: 'coreNft',
    name: 'Core NFT',
    status: '已启用',
    statusTone: 'enabled',
    tag: 'NFT'
  },
  {
    address: '8aRt...Hf7x',
    height: '1,245,102',
    icon: 'stakingPool',
    name: 'Staking Pool',
    status: '待升级',
    statusTone: 'warning',
    tag: '系统'
  },
  {
    address: '6pQ2...Lm9n',
    height: '1,244,512',
    icon: 'privacyRouter',
    name: 'Privacy Router',
    status: '已启用',
    statusTone: 'enabled',
    tag: '隐私'
  }
] as const;

type FilterTab = (typeof filterTabs)[number];

type ContractsListScreenProps = {
  readonly bottomPadding?: number;
  readonly onDeployPress?: () => void;
  readonly topPadding?: number;
};

function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

function scaledBelowTopNavigation(value: number, scale: number) {
  return scaled(value - TOP_NAVIGATION_DESIGN_HEIGHT, scale);
}

export function ContractsListScreen({ bottomPadding, onDeployPress, topPadding }: ContractsListScreenProps) {
  const layoutMetrics = useContractsListResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const headerHeight = getGlobalHeaderHeight(layoutMetrics.scale);
  const resolvedBottomPadding = bottomPadding ?? layoutMetrics.bottomNavHeight;
  const resolvedTopPadding = topPadding ?? layoutMetrics.topSafeArea + headerHeight;

  const handleFilterPress = (tab: FilterTab) => {
    console.info('[contracts-list] filter requested', { tab });
  };

  const handleContractPress = (contractName: string) => {
    console.info('[contracts-list] contract requested', { contractName });
  };

  const handleDeployPress = () => {
    onDeployPress?.();
    console.info('[contracts-list] deploy requested');
  };

  const handleScanPress = () => {
    console.info('[contracts-list] scan deploy requested');
  };

  const handleRefreshPress = () => {
    console.info('[contracts-list] refresh requested');
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
          <ContractsSummaryCard onDeployPress={handleDeployPress} scale={layoutMetrics.scale} styles={styles} />
          <SearchFilterCard onFilterPress={handleFilterPress} scale={layoutMetrics.scale} styles={styles} />
          <ContractsCard onContractPress={handleContractPress} scale={layoutMetrics.scale} styles={styles} />
          <BottomActions onRefreshPress={handleRefreshPress} onScanPress={handleScanPress} scale={layoutMetrics.scale} styles={styles} />
        </View>
      </ScrollView>
    </View>
  );
}

function PageHeading({ styles }: { readonly styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.pageHeading}>
      <Text style={styles.pageTitle}>链上合约</Text>
      <Text style={styles.pageSubtitle}>部署、调用、查看资产合约</Text>
    </View>
  );
}

function ContractsSummaryCard({
  onDeployPress,
  scale,
  styles
}: {
  readonly onDeployPress: () => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.summaryCard}>
      <Image resizeMode="cover" source={contractsListImages.contractsCardBackground} style={styles.summaryArtwork} />
      <LinearGradient
        colors={['#050507F2', '#050507CC', '#05050733']}
        end={{ x: 1, y: 0.5 }}
        start={{ x: 0, y: 0.5 }}
        style={styles.summaryShade}
      />
      <Text style={styles.metricLabelOne}>已部署合约</Text>
      <Text style={styles.metricValueOne}>12 个</Text>
      <View style={styles.metricDividerOne} />
      <Text style={styles.metricLabelTwo}>可升级</Text>
      <Text style={styles.metricValueTwo}>2 个</Text>
      <View style={styles.metricDividerTwo} />
      <Text style={styles.metricLabelThree}>本账户权限</Text>
      <Text style={styles.metricValueThree}>owner</Text>
      <Pressable accessibilityRole="button" onPress={onDeployPress} style={styles.deployButton}>
        <LinearGradient
          colors={['#249DFF', '#6D59FF', '#B735FF']}
          end={{ x: 1, y: 0.5 }}
          start={{ x: 0, y: 0.5 }}
          style={styles.deployButtonGradient}
        >
          <DeployContractIcon size={scaled(52, scale)} />
          <Text style={styles.deployButtonText}>部署合约</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

function SearchFilterCard({
  onFilterPress,
  scale,
  styles
}: {
  readonly onFilterPress: (tab: FilterTab) => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.searchCard}>
      <View style={styles.searchInput}>
        <SearchIcon size={scaled(44, scale)} />
        <Text style={styles.searchPlaceholder}>搜索 program address / name</Text>
      </View>
      <Pressable accessibilityRole="button" style={styles.filterButton}>
        <FilterIcon size={scaled(44, scale)} />
      </Pressable>
      {filterTabs.map((tab, index) => {
        const isActive = index === 0;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            key={tab}
            onPress={() => onFilterPress(tab)}
            style={[isActive ? styles.filterPillActive : styles.filterPill, { left: scaled(30 + index * 176, scale) }]}
          >
            <Text style={isActive ? styles.filterTextActive : styles.filterText}>{tab}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ContractsCard({
  onContractPress,
  scale,
  styles
}: {
  readonly onContractPress: (contractName: string) => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.contractsCard}>
      {contractRows.map((contract, index) => (
        <Pressable
          accessibilityRole="button"
          key={contract.name}
          onPress={() => onContractPress(contract.name)}
          style={[styles.contractRow, { top: scaled(26 + index * 161, scale) }]}
        >
          <ContractIcon iconKey={contract.icon as ContractIconKey} size={scaled(96, scale)} />
          <View style={styles.contractTitleRow}>
            <Text numberOfLines={1} style={styles.contractName}>{contract.name}</Text>
            <View style={styles.contractTag}>
              <Text style={styles.contractTagText}>{contract.tag}</Text>
            </View>
          </View>
          <Text style={styles.contractAddress}>{contract.address}</Text>
          <Text style={styles.contractHeight}>最近调用高度&nbsp;&nbsp;{contract.height}</Text>
          <View style={contract.statusTone === 'warning' ? styles.statusDotWarning : styles.statusDotEnabled} />
          <Text style={styles.contractStatus}>{contract.status}</Text>
          <View style={styles.contractChevron}>
            <ChevronRightIcon size={scaled(38, scale)} />
          </View>
          {index < contractRows.length - 1 ? <View style={styles.contractDivider} /> : null}
        </Pressable>
      ))}
    </View>
  );
}

function BottomActions({
  onRefreshPress,
  onScanPress,
  scale,
  styles
}: {
  readonly onRefreshPress: () => void;
  readonly onScanPress: () => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.bottomActionsCard}>
      <Pressable accessibilityRole="button" onPress={onScanPress} style={styles.scanDeployButton}>
        <ScanDeployIcon size={scaled(48, scale)} />
        <Text style={styles.scanDeployText}>扫码部署请求</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onRefreshPress} style={styles.refreshButton}>
        <RefreshIcon size={scaled(44, scale)} />
        <Text style={styles.refreshText}>刷新</Text>
      </Pressable>
    </View>
  );
}

function createStyles(scale: number) {
  // 功能目的：按设计坐标还原合约列表；实现原因：页面需要与 05-contracts-list 高保真一致。
  const textBase = {
    fontFamily: fontFamilies.system,
    includeFontPadding: false
  } as const;

  return StyleSheet.create({
    bottomActionsCard: {
      backgroundColor: colors.surface,
      borderColor: '#E8EAF1',
      borderRadius: scaled(27, scale),
      borderWidth: 1,
      height: scaled(118, scale),
      left: scaled(28, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(1585, scale),
      width: scaled(808, scale)
    },
    canvas: {
      backgroundColor: colors.background,
      height: scaled(1590, scale),
      position: 'relative',
      width: '100%'
    },
    contractAddress: {
      color: colors.textMuted,
      fontSize: scaled(25, scale),
      fontWeight: '400',
      left: scaled(140, scale),
      lineHeight: scaled(32, scale),
      position: 'absolute',
      top: scaled(56, scale),
      ...textBase
    },
    contractChevron: {
      alignItems: 'center',
      height: scaled(50, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(14, scale),
      top: scaled(34, scale),
      width: scaled(50, scale)
    },
    contractDivider: {
      backgroundColor: '#E7E9EF',
      bottom: 0,
      height: 1,
      left: 0,
      position: 'absolute',
      right: 0
    },
    contractHeight: {
      color: colors.textMuted,
      fontSize: scaled(24, scale),
      fontWeight: '400',
      left: scaled(140, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      top: scaled(98, scale),
      ...textBase
    },
    contractName: {
      color: colors.text,
      fontSize: scaled(31, scale),
      fontWeight: '800',
      lineHeight: scaled(40, scale),
      maxWidth: scaled(260, scale),
      ...textBase
    },
    contractRow: {
      height: scaled(145, scale),
      left: scaled(31, scale),
      position: 'absolute',
      width: scaled(746, scale)
    },
    contractStatus: {
      color: colors.textMuted,
      fontSize: scaled(25, scale),
      fontWeight: '400',
      lineHeight: scaled(32, scale),
      position: 'absolute',
      right: scaled(62, scale),
      top: scaled(37, scale),
      ...textBase
    },
    contractTag: {
      alignItems: 'center',
      backgroundColor: '#EEE9FF',
      borderRadius: scaled(15, scale),
      height: scaled(34, scale),
      justifyContent: 'center',
      marginLeft: scaled(14, scale),
      minWidth: scaled(90, scale),
      paddingHorizontal: scaled(14, scale),
    },
    contractTagText: {
      color: '#7040FF',
      fontSize: scaled(22, scale),
      fontWeight: '500',
      lineHeight: scaled(27, scale),
      ...textBase
    },
    contractTitleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      left: scaled(140, scale),
      position: 'absolute',
      top: scaled(4, scale),
      width: scaled(440, scale)
    },
    contractsCard: {
      backgroundColor: colors.surface,
      borderColor: '#E8EAF1',
      borderRadius: scaled(27, scale),
      borderWidth: 1,
      height: scaled(675, scale),
      left: scaled(28, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(886, scale),
      width: scaled(808, scale)
    },
    deployButton: {
      borderRadius: scaled(13, scale),
      height: scaled(70, scale),
      left: scaled(36, scale),
      overflow: 'hidden',
      position: 'absolute',
      top: scaled(212, scale),
      width: scaled(234, scale)
    },
    deployButtonGradient: {
      alignItems: 'center',
      flexDirection: 'row',
      height: '100%',
      justifyContent: 'center',
      width: '100%'
    },
    deployButtonText: {
      color: '#FFFFFF',
      fontSize: scaled(28, scale),
      fontWeight: '800',
      lineHeight: scaled(36, scale),
      marginLeft: scaled(8, scale),
      ...textBase
    },
    filterButton: {
      alignItems: 'center',
      height: scaled(74, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(22, scale),
      top: scaled(28, scale),
      width: scaled(74, scale)
    },
    filterPill: {
      alignItems: 'center',
      backgroundColor: '#F3F3F4',
      borderRadius: scaled(32, scale),
      height: scaled(58, scale),
      justifyContent: 'center',
      position: 'absolute',
      top: scaled(129, scale),
      width: scaled(136, scale)
    },
    filterPillActive: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderRadius: scaled(32, scale),
      height: scaled(58, scale),
      justifyContent: 'center',
      position: 'absolute',
      top: scaled(129, scale),
      width: scaled(112, scale)
    },
    filterText: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '500',
      lineHeight: scaled(31, scale),
      ...textBase
    },
    filterTextActive: {
      color: '#FFFFFF',
      fontSize: scaled(25, scale),
      fontWeight: '700',
      lineHeight: scaled(31, scale),
      ...textBase
    },
    metricDividerOne: {
      backgroundColor: '#404552',
      height: scaled(80, scale),
      left: scaled(190, scale),
      position: 'absolute',
      top: scaled(64, scale),
      width: 1
    },
    metricDividerTwo: {
      backgroundColor: '#404552',
      height: scaled(80, scale),
      left: scaled(342, scale),
      position: 'absolute',
      top: scaled(64, scale),
      width: 1
    },
    metricLabelOne: {
      color: '#D3D6DF',
      fontSize: scaled(24, scale),
      fontWeight: '500',
      left: scaled(38, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      top: scaled(62, scale),
      ...textBase
    },
    metricLabelThree: {
      color: '#D3D6DF',
      fontSize: scaled(24, scale),
      fontWeight: '500',
      left: scaled(382, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      top: scaled(62, scale),
      ...textBase
    },
    metricLabelTwo: {
      color: '#D3D6DF',
      fontSize: scaled(24, scale),
      fontWeight: '500',
      left: scaled(228, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      top: scaled(62, scale),
      ...textBase
    },
    metricValueOne: {
      color: '#FFFFFF',
      fontSize: scaled(43, scale),
      fontWeight: '800',
      left: scaled(38, scale),
      lineHeight: scaled(52, scale),
      position: 'absolute',
      top: scaled(109, scale),
      ...textBase
    },
    metricValueThree: {
      color: '#FFFFFF',
      fontSize: scaled(28, scale),
      fontWeight: '800',
      left: scaled(382, scale),
      lineHeight: scaled(36, scale),
      position: 'absolute',
      top: scaled(121, scale),
      ...textBase
    },
    metricValueTwo: {
      color: '#FFFFFF',
      fontSize: scaled(43, scale),
      fontWeight: '800',
      left: scaled(228, scale),
      lineHeight: scaled(52, scale),
      position: 'absolute',
      top: scaled(109, scale),
      ...textBase
    },
    pageHeading: {
      height: scaledBelowTopNavigation(281, scale),
      position: 'absolute',
      top: 0,
      width: '100%'
    },
    pageSubtitle: {
      color: colors.textMuted,
      fontSize: scaled(27, scale),
      fontWeight: '400',
      left: scaled(43, scale),
      lineHeight: scaled(35, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(218, scale),
      ...textBase
    },
    pageTitle: {
      color: colors.text,
      fontSize: scaled(46, scale),
      fontWeight: fontWeights.pageTitle,
      left: scaled(43, scale),
      lineHeight: scaled(58, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(146, scale),
      ...textBase
    },
    refreshButton: {
      alignItems: 'center',
      borderColor: '#E5E7EF',
      borderRadius: scaled(22, scale),
      borderWidth: 1,
      flexDirection: 'row',
      height: scaled(75, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(30, scale),
      top: scaled(22, scale),
      width: scaled(355, scale)
    },
    refreshText: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '800',
      lineHeight: scaled(34, scale),
      marginLeft: scaled(14, scale),
      ...textBase
    },
    root: {
      backgroundColor: colors.background,
      flex: 1
    },
    scanDeployButton: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderRadius: scaled(22, scale),
      flexDirection: 'row',
      height: scaled(75, scale),
      justifyContent: 'center',
      left: scaled(30, scale),
      position: 'absolute',
      top: scaled(22, scale),
      width: scaled(366, scale)
    },
    scanDeployText: {
      color: '#FFFFFF',
      fontSize: scaled(27, scale),
      fontWeight: '800',
      lineHeight: scaled(34, scale),
      marginLeft: scaled(14, scale),
      ...textBase
    },
    scrollContent: {
      backgroundColor: colors.background
    },
    scrollView: {
      backgroundColor: colors.background
    },
    searchCard: {
      backgroundColor: colors.surface,
      borderColor: '#E8EAF1',
      borderRadius: scaled(27, scale),
      borderWidth: 1,
      height: scaled(218, scale),
      left: scaled(28, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(641, scale),
      width: scaled(808, scale)
    },
    searchInput: {
      alignItems: 'center',
      backgroundColor: '#F2F2F3',
      borderRadius: scaled(11, scale),
      flexDirection: 'row',
      height: scaled(75, scale),
      left: scaled(29, scale),
      paddingHorizontal: scaled(18, scale),
      position: 'absolute',
      top: scaled(28, scale),
      width: scaled(681, scale)
    },
    searchPlaceholder: {
      color: '#7F8593',
      fontSize: scaled(27, scale),
      fontWeight: '400',
      lineHeight: scaled(34, scale),
      marginLeft: scaled(16, scale),
      ...textBase
    },
    statusDotEnabled: {
      backgroundColor: '#18C772',
      borderRadius: scaled(7, scale),
      height: scaled(14, scale),
      position: 'absolute',
      right: scaled(160, scale),
      top: scaled(48, scale),
      width: scaled(14, scale)
    },
    statusDotWarning: {
      backgroundColor: '#FF8600',
      borderRadius: scaled(7, scale),
      height: scaled(14, scale),
      position: 'absolute',
      right: scaled(160, scale),
      top: scaled(48, scale),
      width: scaled(14, scale)
    },
    summaryArtwork: {
      height: '100%',
      position: 'absolute',
      right: 0,
      top: 0,
      width: scaled(504, scale)
    },
    summaryCard: {
      backgroundColor: colors.black,
      borderRadius: scaled(27, scale),
      height: scaled(336, scale),
      left: scaled(28, scale),
      overflow: 'hidden',
      position: 'absolute',
      top: scaledBelowTopNavigation(281, scale),
      width: scaled(808, scale)
    },
    summaryShade: {
      backgroundColor: '#05050766',
      height: '100%',
      left: 0,
      position: 'absolute',
      top: 0,
      width: '100%'
    }
  });
}
