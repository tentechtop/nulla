import { StyleSheet, View } from 'react-native';
import { AppShell } from '../../components/AppShell';
import { colors } from '../../theme/tokens';
import { AssetHeroCard } from './AssetHeroCard';
import { BottomNavigation } from './BottomNavigation';
import { HomeHeader } from './HomeHeader';
import { MarketList } from './MarketList';
import { NetworkStatusPanel } from './NetworkStatusPanel';
import { QuickActionBar } from './QuickActionBar';
import { useHomeResponsiveLayout } from './useHomeResponsiveLayout';

export function HomeScreen() {
  const layoutMetrics = useHomeResponsiveLayout();

  return (
    <View style={styles.root}>
      <AppShell bottomPadding={layoutMetrics.bottomNavHeight} topPadding={layoutMetrics.topSafeArea}>
        <HomeHeader />
        <AssetHeroCard />
        <QuickActionBar />
        <NetworkStatusPanel />
        <MarketList />
      </AppShell>
      <BottomNavigation />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1
  }
});
