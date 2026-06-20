export type TransferSendLayoutMetrics = {
  readonly bottomNavHeight: number;
  readonly bottomNavSliceHeight: number;
  readonly contentHeight: number;
  readonly contentWidth: number;
  readonly scale: number;
  readonly topSafeArea: number;
};

export function getTransferSendLayoutMetrics(
  viewportWidth: number,
  topSafeArea: number,
  bottomSafeArea: number
): TransferSendLayoutMetrics;
