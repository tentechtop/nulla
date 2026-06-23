import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { getMarketHomeLayoutMetrics } from '../src/features/marketHome/layout.js';

const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const homeScreenSource = readFileSync(new URL('../src/features/home/HomeScreen.tsx', import.meta.url), 'utf8');
const marketAssetsSource = readFileSync(new URL('../src/features/marketHome/designAssets.ts', import.meta.url), 'utf8');
const marketHomeSource = readFileSync(new URL('../src/features/marketHome/MarketHomeScreen.tsx', import.meta.url), 'utf8');
const marketIconsSource = readFileSync(new URL('../src/features/marketHome/MarketHomeSvgIcons.tsx', import.meta.url), 'utf8');

test('getMarketHomeLayoutMetrics scales the 50 market home canvas by viewport width', () => {
  const compact = getMarketHomeLayoutMetrics(426, 0, 0);
  const source = getMarketHomeLayoutMetrics(852, 0, 0);

  assert.equal(compact.scale, 0.5);
  assert.equal(compact.contentHeight, 804);
  assert.equal(compact.bottomNavSliceHeight, 62);
  assert.equal(source.contentHeight, 1607);
  assert.equal(source.bottomNavSliceHeight, 123);
});

test('getMarketHomeLayoutMetrics keeps safe areas outside design scale', () => {
  const metrics = getMarketHomeLayoutMetrics(393, 24, 34);

  assert.equal(metrics.topSafeArea, 24);
  assert.equal(metrics.bottomNavHeight, metrics.bottomNavSliceHeight + 34);
  assert.equal(metrics.contentWidth, 393);
});

test('getMarketHomeLayoutMetrics rejects unsafe viewport inputs', () => {
  assert.throws(() => getMarketHomeLayoutMetrics(0, 0, 0), /viewportWidth 必须是正数/);
  assert.throws(() => getMarketHomeLayoutMetrics(414, -1, 0), /topSafeArea 必须是非负数/);
  assert.throws(() => getMarketHomeLayoutMetrics(414, 0, Number.NaN), /bottomSafeArea 必须是非负数/);
});

test('market workspace recreates the 50 market trading navigation draft with native sections', () => {
  assert.match(appSource, /import \{ MarketHomeScreen \}/);
  assert.match(marketAssetsSource, /background-market-volume-card-hd\.png/);
  assert.match(marketHomeSource, /搜索币种 \/ 股票 \/ 金属 \/ 合约/);
  assert.match(marketHomeSource, /虚拟货币/);
  assert.match(marketHomeSource, /全市场成交额/);
  assert.match(marketHomeSource, /24\.67亿/);
  assert.match(marketHomeSource, /期货合约/);
  assert.match(marketHomeSource, /今日关注/);
  assert.match(marketHomeSource, /XAUx/);
  assert.match(marketHomeSource, /NAS100/);
  assert.match(marketHomeSource, /height: scaled\(1607, scale\)/);
  assert.match(marketHomeSource, /top: scaledBelowTopNavigation\(448, scale\)/);
  assert.match(marketHomeSource, /height: scaled\(297, scale\)/);
  assert.match(marketHomeSource, /top: scaledBelowTopNavigation\(897, scale\)/);
  assert.match(marketHomeSource, /top: scaledBelowTopNavigation\(1236, scale\)/);
  assert.match(marketHomeSource, /top=\{120 \+ index \* 76\}/);
  assert.match(marketHomeSource, /width: scaled\(788, scale\)/);
  assert.doesNotMatch(marketHomeSource, /股票代币交易|代币化证券 · 链上结算|BID|ASK|HeroShieldIcon/);
  assert.doesNotMatch(marketHomeSource, /<MarketList \/>/);
  assert.doesNotMatch(homeScreenSource, /<MarketList \/>/);
  assert.doesNotMatch(marketAssetsSource, /25-stock-token-trading|47-market-stock-token-workspace-draft|50-market-workspace-trading-nav-draft\.png/);
});

test('market home converts supplied 50 draft SVG assets into component geometry', () => {
  assert.match(marketIconsSource, /M8 10H36L25 22\.5V33L19 36V22\.5L8 10Z/);
  assert.match(marketIconsSource, /M20\.5 17H42L36\.5 23\.5H15L20\.5 17Z/);
  assert.match(marketIconsSource, /M28 14L38 30H18L28 14Z/);
  assert.match(marketIconsSource, /M20 48V24/);
  assert.match(marketIconsSource, /M20 10H40L50 20V52/);
  assert.match(marketIconsSource, /M17 23H46/);
  assert.match(marketIconsSource, /SvgText/);
  assert.doesNotMatch(marketIconsSource, /SvgXml/);
});
