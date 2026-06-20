import assert from 'node:assert/strict';
import test from 'node:test';
import { getDposOverviewLayoutMetrics } from '../src/features/dposOverview/layout.js';

test('getDposOverviewLayoutMetrics scales the DPoS canvas by viewport width', () => {
  const compact = getDposOverviewLayoutMetrics(432, 0, 0);
  const source = getDposOverviewLayoutMetrics(864, 0, 0);

  assert.equal(compact.scale, 0.5);
  assert.equal(compact.contentHeight, 798);
  assert.equal(compact.bottomNavSliceHeight, 70);
  assert.equal(source.contentHeight, 1595);
  assert.equal(source.bottomNavSliceHeight, 140);
});

test('getDposOverviewLayoutMetrics keeps bottom safe area separate from design slice', () => {
  const metrics = getDposOverviewLayoutMetrics(414, 24, 34);

  assert.equal(metrics.topSafeArea, 24);
  assert.equal(metrics.bottomNavHeight, metrics.bottomNavSliceHeight + 34);
  assert.equal(metrics.contentWidth, 414);
});

test('getDposOverviewLayoutMetrics rejects unsafe viewport inputs', () => {
  assert.throws(() => getDposOverviewLayoutMetrics(0, 0, 0), /viewportWidth 必须是正数/);
  assert.throws(() => getDposOverviewLayoutMetrics(414, -1, 0), /topSafeArea 必须是非负数/);
  assert.throws(() => getDposOverviewLayoutMetrics(414, 0, Number.NaN), /bottomSafeArea 必须是非负数/);
});
