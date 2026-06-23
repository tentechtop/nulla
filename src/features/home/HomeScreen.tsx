import { StyleSheet, View } from 'react-native';
import { AppShell } from '../../components/AppShell';
import { getGlobalHeaderHeight } from '../../components/GlobalHeader';
import { colors } from '../../theme/tokens';
import { AssetHeroCard } from './AssetHeroCard';
import { NetworkStatusPanel } from './NetworkStatusPanel';
import { QuickActionBar } from './QuickActionBar';
import { useHomeResponsiveLayout } from './useHomeResponsiveLayout';

type HomeScreenProps = {
  readonly bottomPadding?: number;
  readonly onScanPress?: () => void;
  readonly onSendPress?: () => void;
  readonly topPadding?: number;
};

export function HomeScreen({ bottomPadding, onScanPress, onSendPress, topPadding }: HomeScreenProps) {
  const layoutMetrics = useHomeResponsiveLayout();
  const headerHeight = getGlobalHeaderHeight(layoutMetrics.scale);
  const resolvedBottomPadding = bottomPadding ?? layoutMetrics.bottomNavHeight;
  const resolvedTopPadding = topPadding ?? layoutMetrics.topSafeArea + headerHeight;

  return (
    <View style={styles.root}>
      <AppShell bottomPadding={resolvedBottomPadding} topPadding={resolvedTopPadding}>
        <AssetHeroCard />
        <QuickActionBar onScanPress={onScanPress} onSendPress={onSendPress} />
        <NetworkStatusPanel />
      </AppShell>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1
  }
});
