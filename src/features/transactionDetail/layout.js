const DESIGN_WIDTH = 852;
const DESIGN_CONTENT_HEIGHT = 1599;
const DESIGN_BOTTOM_NAV_HEIGHT = 123;

function assertNonNegativeFinite(value, fieldName) {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${fieldName} 必须是非负数`);
  }
}

function getTransactionDetailLayoutMetrics(viewportWidth, topSafeArea, bottomSafeArea) {
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) {
    throw new RangeError('viewportWidth 必须是正数');
  }

  assertNonNegativeFinite(topSafeArea, 'topSafeArea');
  assertNonNegativeFinite(bottomSafeArea, 'bottomSafeArea');

  const scale = viewportWidth / DESIGN_WIDTH;
  const bottomNavSliceHeight = Math.round(DESIGN_BOTTOM_NAV_HEIGHT * scale);
  const contentHeight = Math.round(DESIGN_CONTENT_HEIGHT * scale);

  return {
    bottomNavHeight: bottomNavSliceHeight + bottomSafeArea,
    bottomNavSliceHeight,
    contentHeight,
    contentWidth: viewportWidth,
    scale,
    topSafeArea
  };
}

exports.getTransactionDetailLayoutMetrics = getTransactionDetailLayoutMetrics;
