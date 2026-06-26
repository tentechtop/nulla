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
  assert.match(dposOverviewSource, /new JsonRpcClient\(rpcEndpoint\)/);
  assert.match(dposOverviewSource, /loadWalletPortfolio\(currentWalletAddress, client\)/);
  assert.match(dposOverviewSource, /createSummaryItems\(portfolio\.dpos, isPortfolioLoading\)/);
  assert.match(dposOverviewSource, /getSensitiveAmountParts\(totalPowerText, 'lamports', isAmountVisible\)/);
  assert.match(dposOverviewSource, /getSensitiveAmountText\(item\.value, isAmountVisible\)/);
  assert.match(dposOverviewSource, /getSensitiveAmountText\(row\.value, isAmountVisible\)/);
  assert.match(dposOverviewSource, /formatLamports\(dpos\.selfStakeLamports\)/);
  assert.match(dposOverviewSource, /formatLamports\(dpos\.delegatedLamports\)/);
  assert.match(dposOverviewSource, /totalAmountParts\.unitText/);
});

test('DPoS overview constrains long validator addresses inside cards', () => {
  assert.match(dposOverviewSource, /<Text ellipsizeMode="middle" numberOfLines=\{1\} style=\{styles\.recommendValue\}>/);
  assert.match(dposOverviewSource, /<Text ellipsizeMode="middle" numberOfLines=\{1\} style=\{styles\.validatorName\}>/);
  assert.match(dposOverviewSource, /recommendValue: \{[\s\S]*width: scaled\(184, scale\)/);
  assert.match(dposOverviewSource, /validatorName: \{[\s\S]*width: scaled\(260, scale\)/);
  assert.match(dposOverviewSource, /validatorMeta: \{[\s\S]*width: scaled\(180, scale\)/);
  assert.match(dposOverviewSource, /validatorCommission: \{[\s\S]*width: scaled\(150, scale\)/);
});

test('DPoS overview renders validator reachability from runtime data', () => {
  assert.match(dposOverviewSource, /reachabilityLabel: validator\.reachabilityLabel/);
  assert.match(dposOverviewSource, /getReachabilityTextStyle\(row\.reachabilityStatus, styles\)/);
  assert.doesNotMatch(dposOverviewSource, /<Text style=\{styles\.onlineText\}>在线<\/Text>/);
});

test('DPoS rewards are displayed as automatic settlement instead of claimable funds', () => {
  assert.match(dposOverviewSource, /\{ key: 'rewardDetails', label: '收益明细' \}/);
  assert.match(dposOverviewSource, /readonly onRewardPress\?: \(\) => void;/);
  assert.match(dposOverviewSource, /label: '累计收益'/);
  assert.match(dposOverviewSource, /status: rewardLamports > 0n \? '已自动到账' : '无收益'/);
  assert.doesNotMatch(dposOverviewSource, /领取收益|待领取收益|可领取/);
});
