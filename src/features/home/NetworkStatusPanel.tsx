import { StyleSheet, TouchableOpacity } from 'react-native';
import { DesignSlice } from '../../components/DesignSlice';
import { homeDesignAssets, homeDesignMetrics } from './designAssets';

export function NetworkStatusPanel() {
  return (
    <DesignSlice
      designHeight={homeDesignMetrics.statusPanelHeight}
      designWidth={homeDesignMetrics.width}
      source={homeDesignAssets.statusPanel}
    >
      <TouchableOpacity accessibilityLabel="节点连接" accessibilityRole="button" style={styles.node} />
      <TouchableOpacity accessibilityLabel="验证者" accessibilityRole="button" style={styles.validator} />
      <TouchableOpacity accessibilityLabel="隐私账户" accessibilityRole="button" style={styles.privacy} />
      <TouchableOpacity accessibilityLabel="网络状态" accessibilityRole="button" style={styles.network} />
    </DesignSlice>
  );
}

const styles = StyleSheet.create({
  node: {
    bottom: '10%',
    left: '2%',
    position: 'absolute',
    top: '10%',
    width: '23%'
  },
  validator: {
    bottom: '10%',
    left: '27%',
    position: 'absolute',
    top: '10%',
    width: '22%'
  },
  privacy: {
    bottom: '10%',
    left: '51%',
    position: 'absolute',
    top: '10%',
    width: '22%'
  },
  network: {
    bottom: '10%',
    position: 'absolute',
    right: '2%',
    top: '10%',
    width: '23%'
  }
});
