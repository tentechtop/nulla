import assert from 'node:assert/strict';
import test from 'node:test';
import { getTransferSendLayoutMetrics } from '../src/features/transferSend/layout.js';

test('getTransferSendLayoutMetrics scales fixed mobile slices by viewport width', () => {
  const standard = getTransferSendLayoutMetrics(432, 0, 0);
  const large = getTransferSendLayoutMetrics(864, 0, 0);

  assert.equal(standard.scale, 0.5);
  assert.equal(standard.contentHeight, 856);
  assert.equal(standard.bottomNavSliceHeight, 70);
  assert.equal(large.contentHeight, 1712);
  assert.equal(large.bottomNavSliceHeight, 140);
});

test('getTransferSendLayoutMetrics reserves safe areas without changing scale', () => {
  const metrics = getTransferSendLayoutMetrics(393, 47, 34);

  assert.equal(metrics.topSafeArea, 47);
  assert.equal(metrics.bottomNavHeight, metrics.bottomNavSliceHeight + 34);
  assert.equal(metrics.contentWidth, 393);
});

test('getTransferSendLayoutMetrics rejects invalid screen boundaries', () => {
  assert.throws(() => getTransferSendLayoutMetrics(0, 0, 0), /viewportWidth 必须是正数/);
  assert.throws(() => getTransferSendLayoutMetrics(393, -1, 0), /topSafeArea 必须是非负数/);
  assert.throws(() => getTransferSendLayoutMetrics(393, 0, Number.NaN), /bottomSafeArea 必须是非负数/);
});
