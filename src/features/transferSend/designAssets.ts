import type { ImageSourcePropType } from 'react-native';

export const transferSendImages = {
  navAccount: require('../../../assets/images/home/nav-account.png') as ImageSourcePropType,
  navAssets: require('../../../assets/images/home/nav-assets.png') as ImageSourcePropType,
  navContract: require('../../../assets/images/home/nav-contract.png') as ImageSourcePropType,
  navDpos: require('../../../assets/images/home/nav-dpos.png') as ImageSourcePropType,
  navPrivacy: require('../../../assets/images/home/nav-privacy.png') as ImageSourcePropType,
  routeArtwork: require('../../../design-draft/assets/02-transfer-send/background-route-artwork-hd.png') as ImageSourcePropType
} as const;
