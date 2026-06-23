import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { getPrivacyHomeLayoutMetrics } from '../src/features/privacyHome/layout.js';

const privacyHomeSource = readFileSync(new URL('../src/features/privacyHome/PrivacyHomeScreen.tsx', import.meta.url), 'utf8');
const privacyAssetsSource = readFileSync(new URL('../src/features/privacyHome/designAssets.ts', import.meta.url), 'utf8');
const privacyIconsSource = readFileSync(new URL('../src/features/privacyHome/PrivacyHomeSvgIcons.tsx', import.meta.url), 'utf8');

test('getPrivacyHomeLayoutMetrics scales the privacy canvas by viewport width', () => {
  const compact = getPrivacyHomeLayoutMetrics(432, 0, 0);
  const source = getPrivacyHomeLayoutMetrics(864, 0, 0);

  assert.equal(compact.scale, 0.5);
  assert.equal(compact.contentHeight, 788);
  assert.equal(compact.bottomNavSliceHeight, 70);
  assert.equal(source.contentHeight, 1576);
  assert.equal(source.bottomNavSliceHeight, 140);
});

test('getPrivacyHomeLayoutMetrics keeps safe areas outside design scale', () => {
  const metrics = getPrivacyHomeLayoutMetrics(414, 24, 34);

  assert.equal(metrics.topSafeArea, 24);
  assert.equal(metrics.bottomNavHeight, metrics.bottomNavSliceHeight + 34);
  assert.equal(metrics.contentWidth, 414);
});

test('getPrivacyHomeLayoutMetrics rejects unsafe viewport inputs', () => {
  assert.throws(() => getPrivacyHomeLayoutMetrics(0, 0, 0), /viewportWidth 必须是正数/);
  assert.throws(() => getPrivacyHomeLayoutMetrics(414, -1, 0), /topSafeArea 必须是非负数/);
  assert.throws(() => getPrivacyHomeLayoutMetrics(414, 0, Number.NaN), /bottomSafeArea 必须是非负数/);
});

test('privacy home recreates the provided design with native sections and assets', () => {
  assert.match(privacyAssetsSource, /background-privacy-card-hd\.png/);
  assert.match(privacyHomeSource, /privacyHomeImages\.privacyCardBackground/);
  assert.match(privacyHomeSource, /隐私账户/);
  assert.match(privacyHomeSource, /隐私可用/);
  assert.match(privacyHomeSource, /getSensitiveAmountParts\('0\.000000', 'SOL', isAmountVisible\)/);
  assert.match(privacyHomeSource, /隐藏隐私金额/);
  assert.match(privacyHomeSource, /balanceAmountRow/);
  assert.match(privacyHomeSource, /隐私状态/);
  assert.match(privacyHomeSource, /隐私路径预览/);
  assert.match(privacyHomeSource, /隐私记录/);
  assert.match(privacyHomeSource, /暂无隐私活动/);
  assert.match(privacyHomeSource, /emptyRecordState/);
  assert.match(privacyHomeSource, /<EmptyPrivacyActivityIcon size=\{scaled\(128, scale\)\}/);
  assert.doesNotMatch(privacyHomeSource, /emptyRecordIcon/);
  assert.doesNotMatch(privacyHomeSource, /03-privacy-home\.png/);
});

test('privacy home uses the supplied SVG icon geometry as component icons', () => {
  assert.match(privacyIconsSource, /M20 5L32 10\.3V20/);
  assert.match(privacyIconsSource, /C8\.2 12\.8 13\.5 9\.2 20 9\.2/);
  assert.match(privacyIconsSource, /M28 10V36/);
  assert.match(privacyIconsSource, /M18 18C20\.7 15\.3/);
  assert.match(privacyIconsSource, /M25 8L41 15V26\.5/);
  assert.match(privacyIconsSource, /M8 10H18C21\.3 10 24 12\.7/);
});
