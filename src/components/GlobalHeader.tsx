import { Image, ImageSourcePropType, Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, fontFamilies } from '../theme/tokens';
import { HeaderProfileSvgIcon, HeaderScanSvgIcon } from './HeaderSvgIcons';

export const GLOBAL_HEADER_DESIGN_HEIGHT = 117;
const brandLogo = require('../../assets/images/home/brand-logo.png') as ImageSourcePropType;
const webNoFocusOutline = Platform.OS === 'web'
  ? ({ outlineColor: 'transparent', outlineStyle: 'none', outlineWidth: 0 } as unknown as ViewStyle)
  : undefined;

type GlobalHeaderWorkspace = 'market' | 'wallet';

type GlobalHeaderProps = {
  readonly activeWorkspace?: GlobalHeaderWorkspace;
  readonly onAccountPress?: () => void;
  readonly onMarketPress?: () => void;
  readonly onScanPress?: () => void;
  readonly onWalletPress?: () => void;
  readonly scale: number;
};

function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

export function getGlobalHeaderHeight(scale: number) {
  return scaled(GLOBAL_HEADER_DESIGN_HEIGHT, scale);
}

export function GlobalHeader({
  activeWorkspace = 'wallet',
  onAccountPress,
  onMarketPress,
  onScanPress,
  onWalletPress,
  scale
}: GlobalHeaderProps) {
  const styles = createStyles(scale);
  const isMarketActive = activeWorkspace === 'market';
  const isWalletActive = activeWorkspace === 'wallet';

  return (
    <View style={styles.header}>
      <Image resizeMode="contain" source={brandLogo} style={styles.brandLogo} />
      <View style={styles.segmentedTabs}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: isMarketActive }}
          focusable={false}
          onPress={onMarketPress}
          style={[isMarketActive ? styles.activeTab : styles.marketTab, webNoFocusOutline]}
        >
          <Text style={isMarketActive ? styles.activeTabText : styles.inactiveTabText}>市场</Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: isWalletActive }}
          focusable={false}
          onPress={onWalletPress}
          style={[isWalletActive ? styles.activeWalletTab : styles.walletTab, webNoFocusOutline]}
        >
          <Text style={isWalletActive ? styles.activeTabText : styles.inactiveTabText}>钱包</Text>
        </Pressable>
      </View>
      <Pressable accessibilityLabel="扫码" accessibilityRole="button" focusable={false} onPress={onScanPress} style={[styles.scanButton, webNoFocusOutline]}>
        <HeaderScanSvgIcon size={scaled(56, scale)} />
      </Pressable>
      <Pressable accessibilityLabel="账户" accessibilityRole="button" focusable={false} onPress={onAccountPress} style={[styles.accountButton, webNoFocusOutline]}>
        <HeaderProfileSvgIcon size={scaled(48, scale)} />
      </Pressable>
    </View>
  );
}

function createStyles(scale: number) {
  const textBase = {
    fontFamily: fontFamilies.system,
    includeFontPadding: false
  } as const;

  return StyleSheet.create({
    accountButton: {
      alignItems: 'center',
      height: scaled(70, scale),
      justifyContent: 'center',
      left: scaled(766, scale),
      position: 'absolute',
      top: scaled(25, scale),
      width: scaled(70, scale)
    },
    activeWalletTab: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderRadius: scaled(36, scale),
      height: scaled(70, scale),
      justifyContent: 'center',
      left: scaled(163, scale),
      position: 'absolute',
      top: 0,
      width: scaled(163, scale)
    },
    activeTab: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderRadius: scaled(36, scale),
      height: scaled(70, scale),
      justifyContent: 'center',
      left: 0,
      position: 'absolute',
      top: 0,
      width: scaled(163, scale)
    },
    activeTabText: {
      color: '#FFFFFF',
      fontSize: scaled(29, scale),
      fontWeight: '700',
      lineHeight: scaled(34, scale),
      ...textBase
    },
    marketTab: {
      alignItems: 'center',
      height: scaled(70, scale),
      justifyContent: 'center',
      left: 0,
      position: 'absolute',
      top: 0,
      width: scaled(163, scale)
    },
    brandLogo: {
      height: scaled(44, scale),
      left: scaled(31, scale),
      position: 'absolute',
      top: scaled(32, scale),
      width: scaled(136, scale)
    },
    walletTab: {
      alignItems: 'center',
      height: scaled(70, scale),
      justifyContent: 'center',
      left: scaled(163, scale),
      position: 'absolute',
      top: 0,
      width: scaled(163, scale)
    },
    header: {
      backgroundColor: colors.background,
      height: getGlobalHeaderHeight(scale),
      position: 'relative',
      width: '100%'
    },
    inactiveTabText: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '600',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    scanButton: {
      alignItems: 'center',
      height: scaled(70, scale),
      justifyContent: 'center',
      left: scaled(676, scale),
      position: 'absolute',
      top: scaled(25, scale),
      width: scaled(70, scale)
    },
    segmentedTabs: {
      backgroundColor: colors.surface,
      borderColor: colors.borderStrong,
      borderRadius: scaled(36, scale),
      borderWidth: 1,
      height: scaled(70, scale),
      left: scaled(262, scale),
      overflow: 'hidden',
      position: 'absolute',
      top: scaled(25, scale),
      width: scaled(326, scale)
    }
  });
}
