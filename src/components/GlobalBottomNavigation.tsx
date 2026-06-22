import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, fontFamilies } from '../theme/tokens';

export type GlobalBottomTabKey = 'assets' | 'privacy' | 'contract' | 'dpos' | 'account';

type GlobalBottomNavigationProps = {
  readonly activeTab: GlobalBottomTabKey;
  readonly bottomNavHeight: number;
  readonly bottomNavSliceHeight: number;
  readonly onAssetsPress?: () => void;
  readonly onDposPress?: () => void;
  readonly onPrivacyPress?: () => void;
  readonly scale: number;
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
  'M932.693333 762.026667q5.973333 0 10.666667 5.12 4.266667 5.546667 4.266667 10.666666t-4.693334 14.08l-13.653333 19.626667-18.346667 22.613333-18.773333 21.333334q-8.96 10.666667-16.213333 17.92l-9.386667 9.813333q-24.746667 22.613333-57.173333 44.373333-32.426667 21.76-68.266667 38.826667-36.693333 17.066667-74.24 27.306667t-71.253333 10.24q-38.4 0-72.106667-11.946667-34.133333-11.946667-63.146667-33.28-29.013333-21.333333-52.053333-49.92-22.613333-28.16-39.253333-61.44-16.213333-32.853333-24.746667-68.266667-8.533333-35.413333-8.533333-71.253333 0-42.666667 13.653333-83.626667 14.08-41.386667 37.12-76.8 5.973333 40.533333 23.466667 75.52 17.493333 34.986667 43.52 64 25.6 29.013333 58.88 51.626667 33.28 23.04 69.973333 38.4 36.693333 15.36 75.52 23.893333 39.253333 8.533333 76.8 8.533334 47.786667 0 93.013333-10.24 45.226667-9.813333 87.893334-30.72l8.533333-4.266667 8.533333-2.133333z m-661.333333-54.186667q0 46.933333 11.52 91.733333 11.52 45.226667 33.28 86.613334 21.76 40.96 52.906667 75.52 31.573333 34.986667 70.826666 59.733333-62.72-8.533333-119.466666-31.573333-56.746667-23.466667-105.813334-58.453334-49.066667-35.413333-88.746666-81.066666-39.253333-45.653333-67.413334-99.413334T15.36 637.44Q0 577.706667 0 514.56q0-34.56 13.653333-63.573333 13.226667-29.013333 35.413334-52.48 22.613333-23.466667 51.2-40.96 28.16-17.066667 57.6-28.16 31.573333-11.52 64-16.64 33.28-5.12 66.133333-5.12 29.866667 0 60.586667 4.266666 30.72 5.12 59.733333 14.933334 29.013333 9.813333 56.32 24.32 26.88 14.933333 49.493333 35.413333-14.933333 0-29.866666 2.986667-14.08 2.986667-27.733334 9.813333v-0.853333q-26.88 11.946667-51.2 31.573333-24.32 19.626667-44.8 44.373333-20.48 24.746667-37.12 53.76-16.213333 28.586667-27.733333 59.306667-11.52 30.293333-17.92 61.44-6.4 30.72-6.4 58.88zM510.293333 2.56q72.533333 0 142.08 16.64 69.546667 16.213333 130.986667 49.066667 61.013333 32.853333 111.786667 82.346666 50.346667 49.493333 84.48 115.2 20.906667 40.106667 32.426666 83.626667 11.946667 42.666667 11.946667 88.746667 0 37.973333-9.813333 72.533333-10.24 34.133333-29.44 63.146667-19.2 29.013333-46.933334 52.053333-27.306667 22.613333-61.866666 37.546667-23.04 10.24-47.36 15.36-24.746667 5.546667-49.493334 5.546666-17.92 0-41.386666-1.28-23.04-1.28-46.933334-5.12-23.466667-4.266667-44.8-11.946666-21.333333-8.106667-35.84-21.333334-5.12-3.84-9.813333-10.24-4.266667-6.826667-4.266667-14.08 0-6.4 6.826667-14.933333 6.826667-8.533333 14.933333-21.333333 8.533333-11.946667 15.36-29.013334 6.826667-17.066667 6.826667-40.533333 0-45.226667-17.066667-83.626667-17.066667-38.826667-45.226666-69.973333-28.16-31.573333-64.853334-54.613333-36.693333-23.466667-76.373333-37.973334-35.84-12.8-73.386667-18.773333-37.12-5.973333-75.093333-5.973333-66.133333 0-130.56 19.2T40.106667 322.133333q30.293333-74.24 77.226666-133.546666 46.933333-58.88 107.52-100.266667Q285.013333 46.933333 357.12 24.746667q72.533333-22.186667 152.746667-22.186667z';
const webNoFocusOutline = Platform.OS === 'web'
  ? ({ outlineColor: 'transparent', outlineStyle: 'none', outlineWidth: 0 } as unknown as ViewStyle)
  : undefined;

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
  onPrivacyPress,
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

          if (tab.key === 'privacy') {
            onPrivacyPress?.();
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
  if (tabKey === 'assets') {
    return <AssetsTabIcon color={color} isActive={isActive} size={size} />;
  }

  if (tabKey === 'privacy') {
    return <PrivacyTabIcon color={color} isActive={isActive} size={size} />;
  }

  if (tabKey === 'contract') {
    return <ContractTabIcon color={color} isActive={isActive} size={size} />;
  }

  if (tabKey === 'dpos') {
    return <DposTabIcon color={color} isActive={isActive} size={size} />;
  }

  return <AccountTabIcon color={color} isActive={isActive} size={size} />;
}

function AssetsTabIcon({ color, size }: BottomIconProps) {
  return (
    <Svg height={size} viewBox="0 0 1024 1024" width={size}>
      <Path d={ASSETS_TAB_ICON_PATH} fill={color} />
    </Svg>
  );
}

function PrivacyTabIcon({ color, isActive, size }: BottomIconProps) {
  if (isActive) {
    return (
      <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
        <Path d="M28 7L46 15V28.4C46 41.3 38.7 48.8 28 53C17.3 48.8 10 41.3 10 28.4V15L28 7Z" fill="#1E6BFF" />
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
