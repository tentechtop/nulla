import { StyleSheet, TouchableOpacity } from 'react-native';
import { DesignSlice } from '../../components/DesignSlice';
import { homeDesignAssets, homeDesignMetrics } from './designAssets';

export function QuickActionBar() {
  return (
    <DesignSlice
      designHeight={homeDesignMetrics.quickActionsHeight}
      designWidth={homeDesignMetrics.width}
      source={homeDesignAssets.quickActions}
    >
      <TouchableOpacity accessibilityLabel="发送" accessibilityRole="button" style={styles.send} />
      <TouchableOpacity accessibilityLabel="接收" accessibilityRole="button" style={styles.receive} />
      <TouchableOpacity accessibilityLabel="质押" accessibilityRole="button" style={styles.stake} />
      <TouchableOpacity accessibilityLabel="扫码" accessibilityRole="button" style={styles.scan} />
    </DesignSlice>
  );
}

const styles = StyleSheet.create({
  send: {
    bottom: '9%',
    left: '4%',
    position: 'absolute',
    top: '13%',
    width: '22%'
  },
  receive: {
    bottom: '9%',
    left: '27%',
    position: 'absolute',
    top: '13%',
    width: '22%'
  },
  stake: {
    bottom: '9%',
    left: '51%',
    position: 'absolute',
    top: '13%',
    width: '22%'
  },
  scan: {
    bottom: '9%',
    position: 'absolute',
    right: '4%',
    top: '13%',
    width: '22%'
  }
});
