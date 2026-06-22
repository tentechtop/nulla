import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../../components/AppShell';
import { getGlobalHeaderHeight } from '../../components/GlobalHeader';
import { colors, fontFamilies, fontWeights } from '../../theme/tokens';
import { MarketList } from '../home/MarketList';
import { useHomeResponsiveLayout } from '../home/useHomeResponsiveLayout';

type MarketHomeScreenProps = {
  readonly bottomPadding?: number;
  readonly topPadding?: number;
};

function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

export function MarketHomeScreen({ bottomPadding, topPadding }: MarketHomeScreenProps) {
  const layoutMetrics = useHomeResponsiveLayout();
  const headerHeight = getGlobalHeaderHeight(layoutMetrics.scale);
  const resolvedBottomPadding = bottomPadding ?? layoutMetrics.bottomNavHeight;
  const resolvedTopPadding = topPadding ?? layoutMetrics.topSafeArea + headerHeight;
  const styles = createStyles(layoutMetrics.scale);

  return (
    <View style={styles.root}>
      <AppShell bottomPadding={resolvedBottomPadding} topPadding={resolvedTopPadding}>
        <View style={styles.pageHeading}>
          <Text style={styles.pageTitle}>市场</Text>
          <Text style={styles.pageSubtitle}>行情、交易、去中心化市场</Text>
        </View>
        <MarketList />
      </AppShell>
    </View>
  );
}

function createStyles(scale: number) {
  // 功能目的：承载市场工作区首页；实现原因：让行情从钱包资产页解耦，避免资产与市场职责混杂。
  const textBase = {
    fontFamily: fontFamilies.system,
    includeFontPadding: false
  } as const;

  return StyleSheet.create({
    pageHeading: {
      backgroundColor: colors.background,
      height: scaled(150, scale),
      position: 'relative',
      width: '100%'
    },
    pageSubtitle: {
      color: colors.textMuted,
      fontSize: scaled(25, scale),
      fontWeight: '400',
      left: scaled(37, scale),
      lineHeight: scaled(33, scale),
      position: 'absolute',
      top: scaled(86, scale),
      ...textBase
    },
    pageTitle: {
      color: colors.text,
      fontSize: scaled(44, scale),
      fontWeight: fontWeights.pageTitle,
      left: scaled(37, scale),
      lineHeight: scaled(55, scale),
      position: 'absolute',
      top: scaled(18, scale),
      ...textBase
    },
    root: {
      backgroundColor: colors.background,
      flex: 1
    }
  });
}
