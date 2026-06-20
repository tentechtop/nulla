import { StyleSheet, TouchableOpacity } from 'react-native';
import { DesignSlice } from '../../components/DesignSlice';
import { homeDesignAssets, homeDesignMetrics } from './designAssets';

export function MarketList() {
  return (
    <DesignSlice
      designHeight={homeDesignMetrics.marketListHeight}
      designWidth={homeDesignMetrics.width}
      source={homeDesignAssets.marketList}
    >
      <TouchableOpacity accessibilityLabel="自选" accessibilityRole="button" style={styles.favoritesTab} />
      <TouchableOpacity accessibilityLabel="主流" accessibilityRole="button" style={styles.mainTab} />
      <TouchableOpacity accessibilityLabel="涨幅榜" accessibilityRole="button" style={styles.gainersTab} />
      <TouchableOpacity accessibilityLabel="跌幅榜" accessibilityRole="button" style={styles.losersTab} />
      <TouchableOpacity accessibilityLabel="24h 成交额" accessibilityRole="button" style={styles.volumeTab} />
      <TouchableOpacity accessibilityLabel="BTC 行情" accessibilityRole="button" style={styles.rowOne} />
      <TouchableOpacity accessibilityLabel="ETH 行情" accessibilityRole="button" style={styles.rowTwo} />
      <TouchableOpacity accessibilityLabel="SOL 行情" accessibilityRole="button" style={styles.rowThree} />
      <TouchableOpacity accessibilityLabel="查看更多" accessibilityRole="button" style={styles.moreButton} />
    </DesignSlice>
  );
}

const styles = StyleSheet.create({
  favoritesTab: {
    height: '12%',
    left: '2%',
    position: 'absolute',
    top: '6%',
    width: '12%'
  },
  mainTab: {
    height: '12%',
    left: '17%',
    position: 'absolute',
    top: '6%',
    width: '12%'
  },
  gainersTab: {
    height: '12%',
    left: '30%',
    position: 'absolute',
    top: '6%',
    width: '14%'
  },
  losersTab: {
    height: '12%',
    left: '45%',
    position: 'absolute',
    top: '6%',
    width: '14%'
  },
  volumeTab: {
    height: '12%',
    left: '60%',
    position: 'absolute',
    top: '6%',
    width: '20%'
  },
  rowOne: {
    height: '13%',
    left: '2%',
    position: 'absolute',
    right: '2%',
    top: '25%'
  },
  rowTwo: {
    height: '13%',
    left: '2%',
    position: 'absolute',
    right: '2%',
    top: '38%'
  },
  rowThree: {
    height: '13%',
    left: '2%',
    position: 'absolute',
    right: '2%',
    top: '51%'
  },
  moreButton: {
    height: '10%',
    left: '35%',
    position: 'absolute',
    top: '82%',
    width: '30%'
  }
});
