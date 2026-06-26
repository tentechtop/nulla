export type PortfolioAnalyticsLayoutMetrics = {
  readonly bottomNavHeight: number;
  readonly bottomNavSliceHeight: number;
  readonly contentHeight: number;
  readonly contentWidth: number;
  readonly scale: number;
  readonly topSafeArea: number;
};

export declare function getPortfolioAnalyticsLayoutMetrics(
  viewportWidth: number,
  topSafeArea: number,
  bottomSafeArea: number
): PortfolioAnalyticsLayoutMetrics;
