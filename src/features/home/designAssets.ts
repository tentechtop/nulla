import type { ImageSourcePropType } from 'react-native';

export const homeAssetImages = {
  heroBackground: require('../../../design-draft/assets/01-assets-home/hero-card-background.png') as ImageSourcePropType,
  lamportsTokenIcon: require('../../../design-draft/common/Size=96, Color=color@2x.png') as ImageSourcePropType,
  quickSend: require('../../../assets/images/home/quick-send.png') as ImageSourcePropType,
  quickReceive: require('../../../assets/images/home/quick-receive.png') as ImageSourcePropType,
  quickStake: require('../../../assets/images/home/quick-stake.png') as ImageSourcePropType,
  quickScan: require('../../../assets/images/home/quick-scan.png') as ImageSourcePropType,
  navAssets: require('../../../assets/images/home/nav-assets.png') as ImageSourcePropType,
  navPrivacy: require('../../../assets/images/home/nav-privacy.png') as ImageSourcePropType,
  navContract: require('../../../assets/images/home/nav-contract.png') as ImageSourcePropType,
  navDpos: require('../../../assets/images/home/nav-dpos.png') as ImageSourcePropType,
  navAccount: require('../../../assets/images/home/nav-account.png') as ImageSourcePropType
} as const;
