import type { ImageSourcePropType } from 'react-native';

export const homeAssetImages = {
  heroBackground: require('../../../design-draft/assets/01-assets-home/hero-card-background.png') as ImageSourcePropType,
  brandLogo: require('../../../assets/images/home/brand-logo.png') as ImageSourcePropType,
  headerScan: require('../../../assets/images/home/header-scan.png') as ImageSourcePropType,
  headerAccount: require('../../../assets/images/home/header-account.png') as ImageSourcePropType,
  assetLamports: require('../../../assets/images/home/market-sol.png') as ImageSourcePropType,
  quickSend: require('../../../assets/images/home/quick-send.png') as ImageSourcePropType,
  quickReceive: require('../../../assets/images/home/quick-receive.png') as ImageSourcePropType,
  quickStake: require('../../../assets/images/home/quick-stake.png') as ImageSourcePropType,
  quickScan: require('../../../assets/images/home/quick-scan.png') as ImageSourcePropType,
  statusNode: require('../../../assets/images/home/status-node.png') as ImageSourcePropType,
  statusValidator: require('../../../assets/images/home/status-validator.png') as ImageSourcePropType,
  statusPrivacy: require('../../../assets/images/home/status-privacy.png') as ImageSourcePropType,
  statusNetwork: require('../../../assets/images/home/status-network.png') as ImageSourcePropType,
  tokenBtc: require('../../../assets/images/home/market-btc.png') as ImageSourcePropType,
  tokenEth: require('../../../assets/images/home/market-eth.png') as ImageSourcePropType,
  tokenSol: require('../../../assets/images/home/market-sol.png') as ImageSourcePropType,
  tokenXrp: require('../../../assets/images/home/market-xrp.png') as ImageSourcePropType,
  tokenWld: require('../../../assets/images/home/market-wld.png') as ImageSourcePropType,
  navAssets: require('../../../assets/images/home/nav-assets.png') as ImageSourcePropType,
  navPrivacy: require('../../../assets/images/home/nav-privacy.png') as ImageSourcePropType,
  navContract: require('../../../assets/images/home/nav-contract.png') as ImageSourcePropType,
  navDpos: require('../../../assets/images/home/nav-dpos.png') as ImageSourcePropType,
  navAccount: require('../../../assets/images/home/nav-account.png') as ImageSourcePropType
} as const;
