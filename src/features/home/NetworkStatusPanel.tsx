import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamilies } from '../../theme/tokens';
import { createEmptyWalletPortfolio, type WalletPortfolio } from '../../utils/walletBusiness';
import { StatusSvgIcon } from './HomeSvgIcons';
import { useHomeResponsiveLayout } from './useHomeResponsiveLayout';

const SECTION_HEIGHT = 176;
const STATUS_COLUMN_LEFTS = [0, 217, 410, 620] as const;
const STATUS_COLUMN_WIDTHS = [217, 193, 210, 196] as const;

type NetworkStatusPanelProps = {
  readonly isLoading?: boolean;
  readonly onChainStatusPress?: () => void;
  readonly onNetworkStatusPress?: () => void;
  readonly onValidatorListPress?: () => void;
  readonly portfolio?: WalletPortfolio;
};

type LiveStatusItem = {
  readonly iconTitle: '节点连接' | '验证者' | '隐私账户' | '网络状态';
  readonly subtitle: string;
  readonly target: 'chain' | 'network' | 'privacy' | 'validator';
  readonly title: string;
  readonly value: string;
};

function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

export function NetworkStatusPanel({
  isLoading = false,
  onChainStatusPress,
  onNetworkStatusPress,
  onValidatorListPress,
  portfolio = createEmptyWalletPortfolio()
}: NetworkStatusPanelProps) {
  const { scale } = useHomeResponsiveLayout();
  const styles = createStyles(scale);
  const liveStatusItems = createLiveStatusItems(portfolio, isLoading);

  const handleStatusPress = (item: LiveStatusItem) => {
    if (item.target === 'validator') {
      onValidatorListPress?.();
      return;
    }

    if (item.target === 'network') {
      onNetworkStatusPress?.();
      return;
    }

    onChainStatusPress?.();
  };

  return (
    <View style={styles.section}>
      <View style={styles.card}>
        <View style={styles.dividerOne} />
        <View style={styles.dividerTwo} />
        <View style={styles.dividerThree} />
        {liveStatusItems.map((item, index) => (
          <StatusCell
            item={item}
            key={item.target}
            left={STATUS_COLUMN_LEFTS[index]}
            onPress={() => handleStatusPress(item)}
            scale={scale}
            styles={styles}
            width={STATUS_COLUMN_WIDTHS[index]}
          />
        ))}
      </View>
    </View>
  );
}

function StatusCell({
  item,
  left,
  onPress,
  scale,
  styles,
  width
}: {
  readonly item: LiveStatusItem;
  readonly left: number;
  readonly onPress: () => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
  readonly width: number;
}) {
  const isNormal = item.value === '正常';

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.statusCell, { left: scaled(left, scale), width: scaled(width, scale) }]}>
      <View style={styles.titleRow}>
        <View style={styles.statusIconSlot}>
          <StatusSvgIcon size={scaled(32, scale)} title={item.iconTitle} />
        </View>
        <Text numberOfLines={1} style={styles.statusTitle}>
          {item.title}
        </Text>
      </View>
      <Text numberOfLines={1} style={isNormal ? styles.normalValue : styles.statusValue}>
        {item.value}
      </Text>
      <Text numberOfLines={1} style={styles.statusSubtitle}>
        {item.subtitle}
      </Text>
    </Pressable>
  );
}

function createLiveStatusItems(portfolio: WalletPortfolio, isLoading: boolean): readonly LiveStatusItem[] {
  const loadingValue = isLoading ? '加载中' : '';

  return [
    {
      iconTitle: '节点连接',
      subtitle: portfolio.chain.rpcURL.replace(/^https?:\/\//, ''),
      target: 'chain',
      title: '节点连接',
      value: loadingValue || (portfolio.chain.isHealthy ? '正常' : '异常')
    },
    {
      iconTitle: '验证者',
      subtitle: `链高 ${portfolio.chain.headHeight}`,
      target: 'validator',
      title: '验证者',
      value: loadingValue || `${portfolio.chain.validatorCount} 个`
    },
    {
      iconTitle: '隐私账户',
      subtitle: portfolio.address ? '当前钱包已连接' : '未选择钱包',
      target: 'privacy',
      title: '隐私账户',
      value: '0 个'
    },
    {
      iconTitle: '网络状态',
      subtitle: `Peer ${portfolio.chain.knownPeerCount} / Slot ${portfolio.chain.headSlot}`,
      target: 'network',
      title: '网络状态',
      value: loadingValue || (portfolio.chain.error ? '异常' : '正常')
    }
  ];
}

function createStyles(scale: number) {
  const textBase = {
    fontFamily: fontFamilies.system,
    includeFontPadding: false
  } as const;

  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: scaled(23, scale),
      borderWidth: 1,
      height: scaled(158, scale),
      left: scaled(18, scale),
      position: 'absolute',
      top: 0,
      width: scaled(816, scale)
    },
    dividerOne: {
      backgroundColor: colors.border,
      height: scaled(116, scale),
      left: scaled(217, scale),
      position: 'absolute',
      top: scaled(28, scale),
      width: 1
    },
    dividerThree: {
      backgroundColor: colors.border,
      height: scaled(116, scale),
      left: scaled(620, scale),
      position: 'absolute',
      top: scaled(28, scale),
      width: 1
    },
    dividerTwo: {
      backgroundColor: colors.border,
      height: scaled(116, scale),
      left: scaled(410, scale),
      position: 'absolute',
      top: scaled(28, scale),
      width: 1
    },
    normalValue: {
      color: colors.primary,
      fontSize: scaled(24, scale),
      fontWeight: '600',
      lineHeight: scaled(29, scale),
      marginTop: scaled(13, scale),
      ...textBase
    },
    section: {
      backgroundColor: colors.background,
      height: scaled(SECTION_HEIGHT, scale),
      paddingTop: scaled(18, scale),
      position: 'relative',
      width: '100%'
    },
    statusCell: {
      height: scaled(150, scale),
      paddingLeft: scaled(28, scale),
      paddingRight: scaled(8, scale),
      paddingTop: scaled(31, scale),
      position: 'absolute',
      top: 0
    },
    statusIconSlot: {
      alignItems: 'center',
      height: scaled(38, scale),
      justifyContent: 'center',
      overflow: 'visible',
      width: scaled(38, scale)
    },
    statusSubtitle: {
      color: colors.textMuted,
      fontSize: scaled(19, scale),
      fontWeight: '400',
      lineHeight: scaled(23, scale),
      marginTop: scaled(9, scale),
      ...textBase
    },
    statusTitle: {
      color: colors.text,
      flexShrink: 1,
      fontSize: scaled(22, scale),
      fontWeight: '600',
      lineHeight: scaled(27, scale),
      marginLeft: scaled(8, scale),
      ...textBase
    },
    statusValue: {
      color: colors.text,
      fontSize: scaled(24, scale),
      fontWeight: '400',
      lineHeight: scaled(29, scale),
      marginTop: scaled(13, scale),
      ...textBase
    },
    titleRow: {
      alignItems: 'center',
      flexDirection: 'row',
      width: '100%'
    }
  });
}
