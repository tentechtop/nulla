const DESIGN_WIDTH = 852;
const DESIGN_BOTTOM_NAV_HEIGHT = 123;

function assertNonNegativeFinite(value, fieldName) {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${fieldName} 必须是非负数`);
  }
}

function getHomeLayoutMetrics(viewportWidth, topSafeArea, bottomSafeArea) {
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) {
    throw new RangeError('viewportWidth 必须是正数');
  }

  assertNonNegativeFinite(topSafeArea, 'topSafeArea');
  assertNonNegativeFinite(bottomSafeArea, 'bottomSafeArea');

  const scale = viewportWidth / DESIGN_WIDTH;
  const bottomNavSliceHeight = Math.round(DESIGN_BOTTOM_NAV_HEIGHT * scale);

  return {
    bottomNavHeight: bottomNavSliceHeight + bottomSafeArea,
    bottomNavSliceHeight,
    contentWidth: viewportWidth,
    scale,
    topSafeArea
  };
}

exports.getHomeLayoutMetrics = getHomeLayoutMetrics;
