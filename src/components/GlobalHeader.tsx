import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamilies } from '../theme/tokens';
import { HeaderProfileSvgIcon, HeaderScanSvgIcon } from './HeaderSvgIcons';

export const GLOBAL_HEADER_DESIGN_HEIGHT = 117;
const brandLogo = require('../../assets/images/home/brand-logo.png') as ImageSourcePropType;

type GlobalHeaderTab = 'assets' | 'contract';

type GlobalHeaderProps = {
  readonly activeTab?: GlobalHeaderTab;
  readonly onAccountPress?: () => void;
  readonly onAssetsPress?: () => void;
  readonly onContractPress?: () => void;
  readonly onScanPress?: () => void;
  readonly scale: number;
};

function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

export function getGlobalHeaderHeight(scale: number) {
  return scaled(GLOBAL_HEADER_DESIGN_HEIGHT, scale);
}

export function GlobalHeader({
  activeTab = 'assets',
  onAccountPress,
  onAssetsPress,
  onContractPress,
  onScanPress,
  scale
}: GlobalHeaderProps) {
  const styles = createStyles(scale);
  const isAssetsActive = activeTab === 'assets';
  const isContractActive = activeTab === 'contract';

  return (
    <View style={styles.header}>
      <Image resizeMode="contain" source={brandLogo} style={styles.brandLogo} />
      <View style={styles.segmentedTabs}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: isAssetsActive }}
          onPress={onAssetsPress}
          style={isAssetsActive ? styles.activeTab : styles.assetsTab}
        >
          <Text style={isAssetsActive ? styles.activeTabText : styles.inactiveTabText}>资产</Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: isContractActive }}
          onPress={onContractPress}
          style={isContractActive ? styles.activeContractTab : styles.contractTab}
        >
          <Text style={isContractActive ? styles.activeTabText : styles.inactiveTabText}>合约</Text>
        </Pressable>
      </View>
      <Pressable accessibilityLabel="扫码" accessibilityRole="button" onPress={onScanPress} style={styles.scanButton}>
        <HeaderScanSvgIcon size={scaled(56, scale)} />
      </Pressable>
      <Pressable accessibilityLabel="账户" accessibilityRole="button" onPress={onAccountPress} style={styles.accountButton}>
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
    activeContractTab: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderRadius: scaled(36, scale),
      height: scaled(70, scale),
      justifyContent: 'center',
      left: scaled(152, scale),
      position: 'absolute',
      top: 0,
      width: scaled(174, scale)
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
      width: scaled(174, scale)
    },
    activeTabText: {
      color: '#FFFFFF',
      fontSize: scaled(29, scale),
      fontWeight: '700',
      lineHeight: scaled(34, scale),
      ...textBase
    },
    assetsTab: {
      alignItems: 'center',
      height: scaled(70, scale),
      justifyContent: 'center',
      left: 0,
      position: 'absolute',
      top: 0,
      width: scaled(152, scale)
    },
    brandLogo: {
      height: scaled(48, scale),
      left: scaled(43, scale),
      position: 'absolute',
      top: scaled(39, scale),
      width: scaled(155, scale)
    },
    contractTab: {
      alignItems: 'center',
      height: scaled(70, scale),
      justifyContent: 'center',
      left: scaled(174, scale),
      position: 'absolute',
      top: 0,
      width: scaled(152, scale)
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
      left: scaled(249, scale),
      overflow: 'hidden',
      position: 'absolute',
      top: scaled(25, scale),
      width: scaled(326, scale)
    }
  });
}
