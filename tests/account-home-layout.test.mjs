import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { getAccountHomeLayoutMetrics } from '../src/features/accountHome/layout.js';

const accountHomeSource = readFileSync(new URL('../src/features/accountHome/AccountHomeScreen.tsx', import.meta.url), 'utf8');
const accountAssetsSource = readFileSync(new URL('../src/features/accountHome/designAssets.ts', import.meta.url), 'utf8');
const accountIconsSource = readFileSync(new URL('../src/features/accountHome/AccountHomeSvgIcons.tsx', import.meta.url), 'utf8');

test('getAccountHomeLayoutMetrics scales the account canvas by viewport width', () => {
  const compact = getAccountHomeLayoutMetrics(432, 0, 0);
  const source = getAccountHomeLayoutMetrics(864, 0, 0);

  assert.equal(compact.scale, 0.5);
  assert.equal(compact.contentHeight, 788);
  assert.equal(compact.bottomNavSliceHeight, 70);
  assert.equal(source.contentHeight, 1576);
  assert.equal(source.bottomNavSliceHeight, 140);
});

test('getAccountHomeLayoutMetrics keeps safe areas outside design scale', () => {
  const metrics = getAccountHomeLayoutMetrics(414, 24, 34);

  assert.equal(metrics.topSafeArea, 24);
  assert.equal(metrics.bottomNavHeight, metrics.bottomNavSliceHeight + 34);
  assert.equal(metrics.contentWidth, 414);
});

test('getAccountHomeLayoutMetrics rejects unsafe viewport inputs', () => {
  assert.throws(() => getAccountHomeLayoutMetrics(0, 0, 0), /viewportWidth 必须是正数/);
  assert.throws(() => getAccountHomeLayoutMetrics(414, -1, 0), /topSafeArea 必须是非负数/);
  assert.throws(() => getAccountHomeLayoutMetrics(414, 0, Number.NaN), /bottomSafeArea 必须是非负数/);
});

test('account home recreates the provided design with native sections and assets', () => {
  assert.match(accountAssetsSource, /background-account-card-hd\.png/);
  assert.match(accountHomeSource, /账户/);
  assert.match(accountHomeSource, /钱包、RPC、安全/);
  assert.match(accountHomeSource, /当前账户/);
  assert.match(accountHomeSource, /3GT9QRA\.\.\.TcZjT5S/);
  assert.match(accountHomeSource, /钱包管理/);
  assert.match(accountHomeSource, /导出地址二维码/);
  assert.match(accountHomeSource, /RPC 节点/);
  assert.match(accountHomeSource, /http:\/\/101\.35\.87\.31:8899/);
  assert.match(accountHomeSource, /安全设置/);
  assert.match(accountHomeSource, /退出当前账户/);
  assert.doesNotMatch(accountHomeSource, /10-account\.png/);
});

test('account home uses supplied SVG geometry as component icons', () => {
  assert.match(accountIconsSource, /M10 13H32C34\.2 13/);
  assert.match(accountIconsSource, /M27 27H31V31H27V27Z/);
  assert.match(accountIconsSource, /M20 5L32 10\.3V20/);
  assert.match(accountIconsSource, /M20 12H12C10\.9 12/);
  assert.doesNotMatch(accountIconsSource, /SvgXml/);
});

test('account summary status row keeps unlock badge and RPC state on one baseline', () => {
  const unlockBadgeBlock = accountHomeSource.match(/unlockBadge: \{[\s\S]*?\n    \}/)?.[0] ?? '';
  const rpcDotBlock = accountHomeSource.match(/rpcDot: \{[\s\S]*?\n    \}/)?.[0] ?? '';

  assert.match(accountHomeSource, /<View style=\{styles\.summaryStatusRow\}>/);
  assert.match(accountHomeSource, /<View style=\{styles\.summaryRpcStatus\}>/);
  assert.match(unlockBadgeBlock, /minWidth: scaled\(132, scale\)/);
  assert.doesNotMatch(unlockBadgeBlock, /position: 'absolute'|left:|top:/);
  assert.doesNotMatch(rpcDotBlock, /position: 'absolute'|left:|top:/);
});
