import assert from 'node:assert/strict';
import test from 'node:test';
import { getHomeLayoutMetrics } from '../src/features/home/layout.js';

test('getHomeLayoutMetrics scales bottom navigation by viewport width', () => {
  const narrow = getHomeLayoutMetrics(320, 0, 0);
  const standard = getHomeLayoutMetrics(393, 0, 0);
  const large = getHomeLayoutMetrics(430, 0, 0);

  assert.equal(narrow.bottomNavSliceHeight, 46);
  assert.equal(standard.bottomNavSliceHeight, 57);
  assert.equal(large.bottomNavSliceHeight, 62);
});

test('getHomeLayoutMetrics reserves bottom safe area', () => {
  const metrics = getHomeLayoutMetrics(393, 47, 34);

  assert.equal(metrics.topSafeArea, 47);
  assert.equal(metrics.bottomNavHeight, metrics.bottomNavSliceHeight + 34);
});

test('getHomeLayoutMetrics rejects invalid screen boundaries', () => {
  assert.throws(() => getHomeLayoutMetrics(0, 0, 0), /viewportWidth 必须是正数/);
  assert.throws(() => getHomeLayoutMetrics(393, -1, 0), /topSafeArea 必须是非负数/);
  assert.throws(() => getHomeLayoutMetrics(393, 0, Number.NaN), /bottomSafeArea 必须是非负数/);
});
