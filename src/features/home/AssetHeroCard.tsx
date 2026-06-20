import { StyleSheet, TouchableOpacity } from 'react-native';
import { DesignSlice } from '../../components/DesignSlice';
import { homeDesignAssets, homeDesignMetrics } from './designAssets';

export function AssetHeroCard() {
  return (
    <DesignSlice
      designHeight={homeDesignMetrics.assetCardHeight}
      designWidth={homeDesignMetrics.width}
      source={homeDesignAssets.assetCard}
    >
      <TouchableOpacity accessibilityLabel="选择 SOL 币种" accessibilityRole="button" style={styles.currencyButton} />
      <TouchableOpacity accessibilityLabel="查看 LAMPORTS 资产" accessibilityRole="button" style={styles.tokenRow} />
      <TouchableOpacity accessibilityLabel="查看链上合约" accessibilityRole="button" style={styles.contractRow} />
    </DesignSlice>
  );
}

const styles = StyleSheet.create({
  currencyButton: {
    height: '11%',
    position: 'absolute',
    right: '6%',
    top: '5%',
    width: '17%'
  },
  tokenRow: {
    bottom: '16%',
    left: '5%',
    position: 'absolute',
    right: '5%',
    top: '66%'
  },
  contractRow: {
    bottom: '1%',
    left: '5%',
    position: 'absolute',
    right: '5%',
    top: '84%'
  }
});
