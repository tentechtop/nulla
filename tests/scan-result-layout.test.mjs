import assert from 'node:assert/strict';
import test from 'node:test';
import { getScanResultLayoutMetrics } from '../src/features/scanResult/layout.js';

test('getScanResultLayoutMetrics scales the scan result canvas by viewport width', () => {
  const compact = getScanResultLayoutMetrics(426, 0, 0);
  const source = getScanResultLayoutMetrics(852, 0, 0);

  assert.equal(compact.scale, 0.5);
  assert.equal(compact.contentHeight, 846);
  assert.equal(compact.bottomNavSliceHeight, 70);
  assert.equal(source.contentHeight, 1692);
  assert.equal(source.bottomNavSliceHeight, 140);
});

test('getScanResultLayoutMetrics keeps safe areas outside design scale', () => {
  const metrics = getScanResultLayoutMetrics(414, 24, 34);

  assert.equal(metrics.topSafeArea, 24);
  assert.equal(metrics.bottomNavHeight, metrics.bottomNavSliceHeight + 34);
  assert.equal(metrics.contentWidth, 414);
});

test('getScanResultLayoutMetrics rejects unsafe viewport inputs', () => {
  assert.throws(() => getScanResultLayoutMetrics(0, 0, 0), /viewportWidth 必须是正数/);
  assert.throws(() => getScanResultLayoutMetrics(414, -1, 0), /topSafeArea 必须是非负数/);
  assert.throws(() => getScanResultLayoutMetrics(414, 0, Number.NaN), /bottomSafeArea 必须是非负数/);
});
