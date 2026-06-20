import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, fontFamilies } from '../theme/tokens';

export type GlobalBottomTabKey = 'assets' | 'privacy' | 'contract' | 'dpos' | 'account';

type GlobalBottomNavigationProps = {
  readonly activeTab: GlobalBottomTabKey;
  readonly bottomNavHeight: number;
  readonly bottomNavSliceHeight: number;
  readonly onAssetsPress?: () => void;
  readonly onDposPress?: () => void;
  readonly scale: number;
};

type BottomTabConfig = {
  readonly key: GlobalBottomTabKey;
  readonly label: string;
};

type BottomIconProps = {
  readonly color: string;
  readonly size: number;
};

const ASSETS_TAB_ICON_PATH =
  'M63.74 61.16H489.4v425.62H63.74z m470.04 0H959.4v425.62H533.78zM63.74 531.22H489.4v425.6H63.74z m470.04 0H959.4v425.6H533.78z';

const bottomTabs: readonly BottomTabConfig[] = [
  { key: 'assets', label: '资产' },
  { key: 'privacy', label: '隐私' },
  { key: 'contract', label: '合约' },
  { key: 'dpos', label: 'DPoS' },
  { key: 'account', label: '账户' }
];

function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

export function GlobalBottomNavigation({
  activeTab,
  bottomNavHeight,
  bottomNavSliceHeight,
  onAssetsPress,
  onDposPress,
  scale
}: GlobalBottomNavigationProps) {
  const styles = createStyles(scale, bottomNavHeight, bottomNavSliceHeight);

  return (
    <View style={styles.nav}>
      {bottomTabs.map((tab, index) => {
        const isActive = tab.key === activeTab;
        const color = isActive ? colors.primary : colors.textMuted;

        const handlePress = () => {
          if (tab.key === 'assets') {
            onAssetsPress?.();
          }

          if (tab.key === 'dpos') {
            onDposPress?.();
          }
        };

        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            key={tab.key}
            onPress={handlePress}
            style={[styles.tab, { left: scaled(index * 170, scale) }]}
          >
            <BottomTabIcon color={color} size={scaled(52, scale)} tabKey={tab.key} />
            <Text style={isActive ? styles.activeLabel : styles.label}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function BottomTabIcon({
  color,
  size,
  tabKey
}: BottomIconProps & {
  readonly tabKey: GlobalBottomTabKey;
}) {
  if (tabKey === 'assets') {
    return <AssetsTabIcon color={color} size={size} />;
  }

  if (tabKey === 'privacy') {
    return <PrivacyTabIcon color={color} size={size} />;
  }

  if (tabKey === 'contract') {
    return <ContractTabIcon color={color} size={size} />;
  }

  if (tabKey === 'dpos') {
    return <DposTabIcon color={color} size={size} />;
  }

  return <AccountTabIcon color={color} size={size} />;
}

function AssetsTabIcon({ color, size }: BottomIconProps) {
  return (
    <Svg height={size} viewBox="0 0 1024 1024" width={size}>
      <Path d={ASSETS_TAB_ICON_PATH} fill={color} />
    </Svg>
  );
}

function PrivacyTabIcon({ color, size }: BottomIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
      <Path d="M28 8L45 15.5V28.4C45 41.2 37.6 48.3 28 52C18.4 48.3 11 41.2 11 28.4V15.5L28 8Z" stroke={color} strokeLinejoin="round" strokeWidth="3.6" />
    </Svg>
  );
}

function ContractTabIcon({ color, size }: BottomIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
      <Path d="M20 9C15.8 9 13.5 11.6 13.5 16V22C13.5 25.4 11.8 27.6 8.5 28C11.8 28.4 13.5 30.6 13.5 34V40C13.5 44.4 15.8 47 20 47" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.8" />
      <Path d="M36 9C40.2 9 42.5 11.6 42.5 16V22C42.5 25.4 44.2 27.6 47.5 28C44.2 28.4 42.5 30.6 42.5 34V40C42.5 44.4 40.2 47 36 47" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.8" />
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

function AccountTabIcon({ color, size }: BottomIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
      <Circle cx="28" cy="18" r="9" stroke={color} strokeWidth="3.6" />
      <Path d="M12 48C13.8 38.8 19.5 34 28 34C36.5 34 42.2 38.8 44 48" stroke={color} strokeLinecap="round" strokeWidth="3.6" />
    </Svg>
  );
}

function createStyles(scale: number, bottomNavHeight: number, bottomNavSliceHeight: number) {
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
