export type ScanResultLayoutMetrics = {
  readonly bottomNavHeight: number;
  readonly bottomNavSliceHeight: number;
  readonly contentHeight: number;
  readonly contentWidth: number;
  readonly scale: number;
  readonly topSafeArea: number;
};

export function getScanResultLayoutMetrics(
  viewportWidth: number,
  topSafeArea: number,
  bottomSafeArea: number
): ScanResultLayoutMetrics;
