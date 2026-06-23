import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors, fontFamilies } from '../theme/tokens';

export type GlobalBottomNavigationWorkspace = 'market' | 'wallet';
export type GlobalBottomTabKey =
  | 'marketContracts'
  | 'marketMore'
  | 'marketOrders'
  | 'marketQuotes'
  | 'marketTrade'
  | 'walletAssets'
  | 'walletDpos'
  | 'walletHome'
  | 'walletPrivacy'
  | 'walletTrade';

type GlobalBottomNavigationProps = {
  readonly activeTab?: GlobalBottomTabKey;
  readonly bottomNavHeight: number;
  readonly bottomNavSliceHeight: number;
  readonly onMarketContractsPress?: () => void;
  readonly onMarketMorePress?: () => void;
  readonly onMarketOrdersPress?: () => void;
  readonly onMarketQuotesPress?: () => void;
  readonly onMarketTradePress?: () => void;
  readonly onWalletAssetsPress?: () => void;
  readonly onWalletDposPress?: () => void;
  readonly onWalletHomePress?: () => void;
  readonly onWalletPrivacyPress?: () => void;
  readonly onWalletTradePress?: () => void;
  readonly scale: number;
  readonly workspace: GlobalBottomNavigationWorkspace;
};

type BottomTabConfig = {
  readonly key: GlobalBottomTabKey;
  readonly label: string;
};

type BottomIconProps = {
  readonly color: string;
  readonly isActive: boolean;
  readonly size: number;
};

const ASSETS_TAB_ICON_PATH =
  'M972.8 395.008L512 51.2 51.2 400.384l35.2256 47.7696 67.4304-49.5616v469.1456c0 32.9728 26.7264 59.6992 59.6992 59.6992h596.8896c32.9728 0 59.6992-26.7264 59.6992-59.6992V390.2464l68.608 51.3024 34.048-46.5408z m-162.3552 472.7296H213.5552V353.28L512 125.7984l298.4448 220.8768v521.0624z';
const webNoFocusOutline = Platform.OS === 'web'
  ? ({ outlineColor: 'transparent', outlineStyle: 'none', outlineWidth: 0 } as unknown as ViewStyle)
  : undefined;

const walletNavigationItems: readonly BottomTabConfig[] = [
  { key: 'walletHome', label: '主页' },
  { key: 'walletTrade', label: '交易' },
  { key: 'walletDpos', label: 'DPoS' },
  { key: 'walletPrivacy', label: '隐私' },
  { key: 'walletAssets', label: '资产' }
];

const marketNavigationItems: readonly BottomTabConfig[] = [
  { key: 'marketQuotes', label: '行情' },
  { key: 'marketTrade', label: '交易' },
  { key: 'marketContracts', label: '合约' },
  { key: 'marketOrders', label: '订单' },
  { key: 'marketMore', label: '更多' }
];

function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

export function GlobalBottomNavigation({
  activeTab,
  bottomNavHeight,
  bottomNavSliceHeight,
  onMarketContractsPress,
  onMarketMorePress,
  onMarketOrdersPress,
  onMarketQuotesPress,
  onMarketTradePress,
  onWalletAssetsPress,
  onWalletDposPress,
  onWalletHomePress,
  onWalletPrivacyPress,
  onWalletTradePress,
  scale,
  workspace
}: GlobalBottomNavigationProps) {
  const styles = createStyles(scale, bottomNavHeight, bottomNavSliceHeight);
  const navigationItems = workspace === 'market' ? marketNavigationItems : walletNavigationItems;

  const handleTabPress = (tabKey: GlobalBottomTabKey) => {
    if (tabKey === 'walletHome') {
      onWalletHomePress?.();
      return;
    }

    if (tabKey === 'walletTrade') {
      onWalletTradePress?.();
      return;
    }

    if (tabKey === 'walletDpos') {
      onWalletDposPress?.();
      return;
    }

    if (tabKey === 'walletPrivacy') {
      onWalletPrivacyPress?.();
      return;
    }

    if (tabKey === 'walletAssets') {
      onWalletAssetsPress?.();
      return;
    }

    if (tabKey === 'marketQuotes') {
      onMarketQuotesPress?.();
      return;
    }

    if (tabKey === 'marketTrade') {
      onMarketTradePress?.();
      return;
    }

    if (tabKey === 'marketContracts') {
      onMarketContractsPress?.();
      return;
    }

    if (tabKey === 'marketOrders') {
      onMarketOrdersPress?.();
      return;
    }

    if (tabKey === 'marketMore') {
      onMarketMorePress?.();
    }
  };

  return (
    <View style={styles.nav}>
      {navigationItems.map((tab, index) => {
        const isActive = activeTab === tab.key;
        const color = isActive ? colors.primary : colors.textMuted;

        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            key={tab.key}
            onPress={() => handleTabPress(tab.key)}
            style={[styles.tab, { left: scaled(index * 170, scale) }, webNoFocusOutline]}
          >
            <BottomTabIcon color={color} isActive={isActive} size={scaled(52, scale)} tabKey={tab.key} />
            <Text style={isActive ? styles.activeLabel : styles.label}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function BottomTabIcon({
  color,
  isActive,
  size,
  tabKey
}: BottomIconProps & {
  readonly tabKey: GlobalBottomTabKey;
}) {
  if (tabKey === 'walletHome') {
    return <HomeTabIcon color={color} isActive={isActive} size={size} />;
  }

  if (tabKey === 'marketTrade') {
    return <MarketTradeTabIcon color={color} size={size} />;
  }

  if (tabKey === 'walletTrade') {
    return <TradeTabIcon color={color} isActive={isActive} size={size} />;
  }

  if (tabKey === 'walletDpos') {
    return <DposTabIcon color={color} isActive={isActive} size={size} />;
  }

  if (tabKey === 'walletPrivacy') {
    return <PrivacyTabIcon color={color} isActive={isActive} size={size} />;
  }

  if (tabKey === 'marketQuotes') {
    return <MarketQuotesTabIcon color={color} size={size} />;
  }

  if (tabKey === 'marketContracts') {
    return <MarketContractTabIcon color={color} size={size} />;
  }

  if (tabKey === 'marketOrders') {
    return <MarketOrdersTabIcon color={color} size={size} />;
  }

  if (tabKey === 'marketMore') {
    return <MarketMoreTabIcon color={color} size={size} />;
  }

  return <AssetsTabIcon color={color} isActive={isActive} size={size} />;
}

function HomeTabIcon({ color, isActive, size }: BottomIconProps) {
  if (isActive) {
    return (
      <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
        <Path d="M9 27.5L28 11L47 27.5V49H35V34H21V49H9V27.5Z" fill={color} />
      </Svg>
    );
  }

  return (
    <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
      <Path d="M9 27.5L28 11L47 27.5V49H35V34H21V49H9V27.5Z" stroke={color} strokeLinejoin="round" strokeWidth="3.6" />
    </Svg>
  );
}

function TradeTabIcon({ color, size }: BottomIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
      <Path d="M12 20H42" stroke={color} strokeLinecap="round" strokeWidth="3.6" />
      <Path d="M34 12L42 20L34 28" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.6" />
      <Path d="M44 36H14" stroke={color} strokeLinecap="round" strokeWidth="3.6" />
      <Path d="M22 28L14 36L22 44" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.6" />
    </Svg>
  );
}

function DposTabIcon({ color, size }: BottomIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
      <Circle cx="28" cy="28" r="17.5" stroke={color} strokeDasharray="7 9" strokeLinecap="round" strokeWidth="4" />
      <Circle cx="28" cy="28" fill={color} r="6.4" />
      <Circle cx="39.5" cy="16.5" fill={color} r="3.2" />
      <Circle cx="16.5" cy="39.5" fill={color} r="3.2" />
    </Svg>
  );
}

function PrivacyTabIcon({ color, isActive, size }: BottomIconProps) {
  if (isActive) {
    return (
      <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
        <Path d="M28 7L46 15V28.4C46 41.3 38.7 48.8 28 53C17.3 48.8 10 41.3 10 28.4V15L28 7Z" fill={color} />
        <Path d="M20.5 28.5L25.8 33.8L36.5 22.5" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
      </Svg>
    );
  }

  return (
    <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
      <Path d="M28 8L45 15.5V28.4C45 41.2 37.6 48.3 28 52C18.4 48.3 11 41.2 11 28.4V15.5L28 8Z" stroke={color} strokeLinejoin="round" strokeWidth="3.6" />
    </Svg>
  );
}

function MarketQuotesTabIcon({ color, size }: Pick<BottomIconProps, 'color' | 'size'>) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Path d="M10 38V27" stroke={color} strokeLinecap="round" strokeWidth="4" />
      <Path d="M20 38V18" stroke={color} strokeLinecap="round" strokeWidth="4" />
      <Path d="M30 38V23" stroke={color} strokeLinecap="round" strokeWidth="4" />
      <Path d="M40 38V12" stroke={color} strokeLinecap="round" strokeWidth="4" />
    </Svg>
  );
}

function MarketTradeTabIcon({ color, size }: Pick<BottomIconProps, 'color' | 'size'>) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Path d="M13 17H35" stroke={color} strokeLinecap="round" strokeWidth="3" />
      <Path d="M28 10L35 17L28 24" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      <Path d="M35 31H13" stroke={color} strokeLinecap="round" strokeWidth="3" />
      <Path d="M20 24L13 31L20 38" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
    </Svg>
  );
}

function MarketContractTabIcon({ color, size }: Pick<BottomIconProps, 'color' | 'size'>) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Path d="M18 8H15C12.8 8 11 9.8 11 12V19C11 21.8 9.8 23.2 7 23.2" stroke={color} strokeLinecap="round" strokeWidth="3" />
      <Path d="M18 40H15C12.8 40 11 38.2 11 36V29C11 26.2 9.8 24.8 7 24.8" stroke={color} strokeLinecap="round" strokeWidth="3" />
      <Path d="M30 8H33C35.2 8 37 9.8 37 12V19C37 21.8 38.2 23.2 41 23.2" stroke={color} strokeLinecap="round" strokeWidth="3" />
      <Path d="M30 40H33C35.2 40 37 38.2 37 36V29C37 26.2 38.2 24.8 41 24.8" stroke={color} strokeLinecap="round" strokeWidth="3" />
    </Svg>
  );
}

function MarketOrdersTabIcon({ color, size }: Pick<BottomIconProps, 'color' | 'size'>) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Path d="M14 7H30L38 15V39C38 40.1 37.1 41 36 41H14C12.9 41 12 40.1 12 39V9C12 7.9 12.9 7 14 7Z" stroke={color} strokeLinejoin="round" strokeWidth="3" />
      <Path d="M30 7V15H38" stroke={color} strokeLinejoin="round" strokeWidth="3" />
      <Path d="M18 24H31" stroke={color} strokeLinecap="round" strokeWidth="3" />
      <Path d="M18 32H28" stroke={color} strokeLinecap="round" strokeWidth="3" />
    </Svg>
  );
}

function MarketMoreTabIcon({ color, size }: Pick<BottomIconProps, 'color' | 'size'>) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Rect height="11" rx="3" stroke={color} strokeWidth="3" width="11" x="10" y="10" />
      <Rect height="11" rx="3" stroke={color} strokeWidth="3" width="11" x="27" y="10" />
      <Rect height="11" rx="3" stroke={color} strokeWidth="3" width="11" x="10" y="27" />
      <Rect height="11" rx="3" stroke={color} strokeWidth="3" width="11" x="27" y="27" />
    </Svg>
  );
}

function AssetsTabIcon({ color, isActive, size }: BottomIconProps) {
  if (isActive) {
    return (
      <Svg height={size} viewBox="0 0 1024 1024" width={size}>
        <Path d={ASSETS_TAB_ICON_PATH} fill={color} />
      </Svg>
    );
  }

  return (
    <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
      <Path d="M14 18H43C46 18 48 20 48 23V41C48 44 46 46 43 46H14C10.7 46 8 43.3 8 40V16C8 12.7 10.7 10 14 10H41" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.6" />
      <Path d="M8 18H44" stroke={color} strokeLinecap="round" strokeWidth="3.6" />
      <Circle cx="39" cy="32" r="3.5" stroke={color} strokeWidth="3" />
    </Svg>
  );
}

function createStyles(scale: number, bottomNavHeight: number, bottomNavSliceHeight: number) {
  // 功能目的：根据工作区切换底部菜单；实现原因：市场与钱包的一层功能不同，不能复用同一组标签。
  const textBase = {
    fontFamily: fontFamilies.system,
    includeFontPadding: false
  } as const;

  return StyleSheet.create({
    activeLabel: {
      color: colors.primary,
      fontSize: scaled(19, scale),
      fontWeight: '500',
      lineHeight: scaled(26, scale),
      marginTop: scaled(8, scale),
      ...textBase
    },
    label: {
      color: colors.textMuted,
      fontSize: scaled(19, scale),
      fontWeight: '400',
      lineHeight: scaled(26, scale),
      marginTop: scaled(8, scale),
      ...textBase
    },
    nav: {
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      borderTopWidth: 1,
      bottom: 0,
      height: bottomNavHeight,
      left: 0,
      position: 'absolute',
      right: 0,
      zIndex: 10
    },
    tab: {
      alignItems: 'center',
      height: bottomNavSliceHeight,
      justifyContent: 'flex-start',
      paddingTop: scaled(20, scale),
      position: 'absolute',
      top: 0,
      width: scaled(170, scale)
    }
  });
}
