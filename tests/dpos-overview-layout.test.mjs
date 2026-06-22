import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { getDposOverviewLayoutMetrics } from '../src/features/dposOverview/layout.js';

const dposOverviewSource = readFileSync(new URL('../src/features/dposOverview/DposOverviewScreen.tsx', import.meta.url), 'utf8');

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

test('DPoS overview supports hiding amounts while preserving lamports units', () => {
  assert.match(dposOverviewSource, /useState\(true\)/);
  assert.match(dposOverviewSource, /隐藏DPoS金额/);
  assert.match(dposOverviewSource, /getSensitiveAmountParts\('10,000,000', 'lamports', isAmountVisible\)/);
  assert.match(dposOverviewSource, /getSensitiveAmountText\(item\.value, isAmountVisible\)/);
  assert.match(dposOverviewSource, /getSensitiveAmountText\(row\.value, isAmountVisible\)/);
  assert.match(dposOverviewSource, /totalAmountParts\.unitText/);
});
