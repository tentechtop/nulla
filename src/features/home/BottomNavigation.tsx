import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { DesignSlice } from '../../components/DesignSlice';
import { homeDesignAssets, homeDesignMetrics } from './designAssets';
import { useHomeResponsiveLayout } from './useHomeResponsiveLayout';

export function BottomNavigation() {
  const layoutMetrics = useHomeResponsiveLayout();

  return (
    <View style={[styles.nav, { height: layoutMetrics.bottomNavHeight }]}>
      <DesignSlice
        designHeight={homeDesignMetrics.bottomNavHeight}
        designWidth={homeDesignMetrics.width}
        source={homeDesignAssets.bottomNav}
      >
        <TouchableOpacity accessibilityLabel="资产" accessibilityRole="tab" style={styles.assets} />
        <TouchableOpacity accessibilityLabel="隐私" accessibilityRole="tab" style={styles.privacy} />
        <TouchableOpacity accessibilityLabel="合约" accessibilityRole="tab" style={styles.contract} />
        <TouchableOpacity accessibilityLabel="DPoS" accessibilityRole="tab" style={styles.dpos} />
        <TouchableOpacity accessibilityLabel="账户" accessibilityRole="tab" style={styles.account} />
      </DesignSlice>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0
  },
  assets: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: '20%'
  },
  privacy: {
    bottom: 0,
    left: '20%',
    position: 'absolute',
    top: 0,
    width: '20%'
  },
  contract: {
    bottom: 0,
    left: '40%',
    position: 'absolute',
    top: 0,
    width: '20%'
  },
  dpos: {
    bottom: 0,
    left: '60%',
    position: 'absolute',
    top: 0,
    width: '20%'
  },
  account: {
    bottom: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '20%'
  }
});
