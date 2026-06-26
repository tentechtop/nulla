export type ReceiveAddressLayoutMetrics = {
  readonly bottomNavHeight: number;
  readonly bottomNavSliceHeight: number;
  readonly contentHeight: number;
  readonly contentWidth: number;
  readonly scale: number;
  readonly topSafeArea: number;
};

export function getReceiveAddressLayoutMetrics(
  viewportWidth: number,
  topSafeArea: number,
  bottomSafeArea: number
): ReceiveAddressLayoutMetrics;
