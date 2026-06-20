import { StyleSheet, TouchableOpacity } from 'react-native';
import { DesignSlice } from '../../components/DesignSlice';
import { homeDesignAssets, homeDesignMetrics } from './designAssets';

export function HomeHeader() {
  return (
    <DesignSlice
      designHeight={homeDesignMetrics.headerHeight}
      designWidth={homeDesignMetrics.width}
      source={homeDesignAssets.header}
    >
      <TouchableOpacity accessibilityLabel="资产" accessibilityRole="button" style={styles.assetsTab} />
      <TouchableOpacity accessibilityLabel="合约" accessibilityRole="button" style={styles.contractTab} />
      <TouchableOpacity accessibilityLabel="扫码" accessibilityRole="button" style={styles.scanButton} />
      <TouchableOpacity accessibilityLabel="账户" accessibilityRole="button" style={styles.accountButton} />
    </DesignSlice>
  );
}

const styles = StyleSheet.create({
  assetsTab: {
    bottom: '18%',
    left: '29%',
    position: 'absolute',
    top: '20%',
    width: '21%'
  },
  contractTab: {
    bottom: '18%',
    left: '50%',
    position: 'absolute',
    top: '20%',
    width: '18%'
  },
  scanButton: {
    bottom: '22%',
    position: 'absolute',
    right: '12%',
    top: '23%',
    width: '8%'
  },
  accountButton: {
    bottom: '18%',
    position: 'absolute',
    right: '3%',
    top: '18%',
    width: '8%'
  }
});
