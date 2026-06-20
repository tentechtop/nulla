import type { ImageSourcePropType } from 'react-native';

export const dposOverviewImages = {
  navAccount: require('../../../assets/images/home/nav-account.png') as ImageSourcePropType,
  navAssets: require('../../../assets/images/home/nav-assets.png') as ImageSourcePropType,
  navContract: require('../../../assets/images/home/nav-contract.png') as ImageSourcePropType,
  navDpos: require('../../../assets/images/home/nav-dpos.png') as ImageSourcePropType,
  navPrivacy: require('../../../assets/images/home/nav-privacy.png') as ImageSourcePropType,
  overviewArtwork: require('../../../design-draft/assets/07-dpos-overview/background-dpos-card-hd.png') as ImageSourcePropType
} as const;
