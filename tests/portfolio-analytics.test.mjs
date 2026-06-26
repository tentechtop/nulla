import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { getPortfolioAnalyticsLayoutMetrics } from '../src/features/portfolioAnalytics/layout.js';

const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const portfolioSource = readFileSync(new URL('../src/features/portfolioAnalytics/PortfolioAnalyticsScreen.tsx', import.meta.url), 'utf8');
const portfolioAssetsSource = readFileSync(new URL('../src/features/portfolioAnalytics/designAssets.ts', import.meta.url), 'utf8');
const portfolioIconsSource = readFileSync(new URL('../src/features/portfolioAnalytics/PortfolioAnalyticsSvgIcons.tsx', import.meta.url), 'utf8');
const portfolioAssetDirectory = new URL('../design-draft/assets/41-portfolio-analytics/', import.meta.url);

test('getPortfolioAnalyticsLayoutMetrics scales the 41 portfolio canvas by viewport width', () => {
  const compact = getPortfolioAnalyticsLayoutMetrics(432, 0, 0);
  const source = getPortfolioAnalyticsLayoutMetrics(864, 0, 0);

  assert.equal(compact.scale, 0.5);
  assert.equal(compact.contentHeight, 730);
  assert.equal(compact.bottomNavSliceHeight, 70);
  assert.equal(source.contentHeight, 1460);
  assert.equal(source.bottomNavSliceHeight, 140);
});

test('portfolio analytics uses generated background and native SVG geometry', () => {
  assert.equal(existsSync(new URL('background-portfolio-hero-hd.png', portfolioAssetDirectory)), true);
  assert.equal(existsSync(new URL('icon-eye.svg', portfolioAssetDirectory)), true);
  assert.equal(existsSync(new URL('icon-risk-contract.svg', portfolioAssetDirectory)), true);
  assert.equal(existsSync(new URL('icon-action-report.svg', portfolioAssetDirectory)), true);
  assert.match(portfolioAssetsSource, /background-portfolio-hero-hd\.png/);
  assert.match(portfolioSource, /loadWalletPortfolio/);
  assert.match(portfolioSource, /new JsonRpcClient\(rpcEndpoint\)/);
  assert.match(portfolioSource, /createPortfolioSnapshot/);
  assert.match(portfolioSource, /总资产 \(SOL\)/);
  assert.match(portfolioSource, /资产分布/);
  assert.match(portfolioSource, /风险敞口/);
  assert.match(portfolioSource, /组合表现 \(SOL\)/);
  assert.match(portfolioSource, /资产持仓/);
  assert.match(portfolioSource, /heroCardModern/);
  assert.match(portfolioSource, /distributionRowModern/);
  assert.match(portfolioSource, /barTrack/);
  assert.match(portfolioSource, /metricMatrix/);
  assert.match(portfolioIconsSource, /PortfolioAnalyticsIcon/);
  assert.match(portfolioIconsSource, /M16 4L26 8\.5V16\.4/);
  assert.doesNotMatch(portfolioSource, /41-portfolio-analytics\.png|SvgXml/);
  assert.doesNotMatch(portfolioSource, /PageHeading|FooterActions|导出报告|刷新组合|配置、风险、收益归因|资产持仓 TOP5|donutChart|heroSparkline/);
  assert.doesNotMatch(portfolioSource, /99,999,958\.218240|67,219,256\.218240|POP|USDT|AAPLx|股票代币|CFD 保证金/);
});

test('wallet assets tab opens portfolio analytics while header account keeps account page', () => {
  assert.match(appSource, /'portfolioAnalytics'/);
  assert.match(appSource, /const handleOpenPortfolioAnalytics = \(\) => \{\s+openRoute\('portfolioAnalytics'\);/);
  assert.match(appSource, /onWalletAssetsPress=\{handleOpenPortfolioAnalytics\}/);
  assert.match(appSource, /onAccountPress=\{handleOpenAccountHome\}/);
  assert.match(appSource, /currentRoute === 'portfolioAnalytics'/);
  assert.match(appSource, /<PortfolioAnalyticsScreen/);
  assert.match(appSource, /rpcEndpoint=\{rpcEndpoint\}/);
});
