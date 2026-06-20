import type { ImageSourcePropType } from 'react-native';

export const homeDesignMetrics = {
  width: 852,
  headerHeight: 117,
  assetCardHeight: 584,
  quickActionsHeight: 196,
  statusPanelHeight: 176,
  marketListHeight: 650,
  bottomNavHeight: 123
} as const;

export const homeDesignAssets = {
  header: require('../../../assets/images/home/section-header.png') as ImageSourcePropType,
  assetCard: require('../../../assets/images/home/section-asset-card.png') as ImageSourcePropType,
  quickActions: require('../../../assets/images/home/section-quick-actions.png') as ImageSourcePropType,
  statusPanel: require('../../../assets/images/home/section-status-panel.png') as ImageSourcePropType,
  marketList: require('../../../assets/images/home/section-market-list.png') as ImageSourcePropType,
  bottomNav: require('../../../assets/images/home/section-bottom-nav.png') as ImageSourcePropType
} as const;
