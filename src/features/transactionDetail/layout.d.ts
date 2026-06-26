export type TransactionDetailLayoutMetrics = {
  readonly bottomNavHeight: number;
  readonly bottomNavSliceHeight: number;
  readonly contentHeight: number;
  readonly contentWidth: number;
  readonly scale: number;
  readonly topSafeArea: number;
};

export function getTransactionDetailLayoutMetrics(
  viewportWidth: number,
  topSafeArea: number,
  bottomSafeArea: number
): TransactionDetailLayoutMetrics;
