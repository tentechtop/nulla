import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { getContractsListLayoutMetrics } from '../src/features/contractsList/layout.js';

const contractsListSource = readFileSync(new URL('../src/features/contractsList/ContractsListScreen.tsx', import.meta.url), 'utf8');
const contractsAssetsSource = readFileSync(new URL('../src/features/contractsList/designAssets.ts', import.meta.url), 'utf8');
const contractsIconsSource = readFileSync(new URL('../src/features/contractsList/ContractsListSvgIcons.tsx', import.meta.url), 'utf8');

test('getContractsListLayoutMetrics scales the contracts canvas by viewport width', () => {
  const compact = getContractsListLayoutMetrics(432, 0, 0);
  const source = getContractsListLayoutMetrics(864, 0, 0);

  assert.equal(compact.scale, 0.5);
  assert.equal(compact.contentHeight, 795);
  assert.equal(compact.bottomNavSliceHeight, 70);
  assert.equal(source.contentHeight, 1590);
  assert.equal(source.bottomNavSliceHeight, 140);
});

test('getContractsListLayoutMetrics keeps safe areas outside design scale', () => {
  const metrics = getContractsListLayoutMetrics(414, 24, 34);

  assert.equal(metrics.topSafeArea, 24);
  assert.equal(metrics.bottomNavHeight, metrics.bottomNavSliceHeight + 34);
  assert.equal(metrics.contentWidth, 414);
});

test('getContractsListLayoutMetrics rejects unsafe viewport inputs', () => {
  assert.throws(() => getContractsListLayoutMetrics(0, 0, 0), /viewportWidth 必须是正数/);
  assert.throws(() => getContractsListLayoutMetrics(414, -1, 0), /topSafeArea 必须是非负数/);
  assert.throws(() => getContractsListLayoutMetrics(414, 0, Number.NaN), /bottomSafeArea 必须是非负数/);
});

test('contracts list recreates the provided design with native sections and assets', () => {
  assert.match(contractsAssetsSource, /background-contracts-card-hd\.png/);
  assert.match(contractsListSource, /链上合约/);
  assert.match(contractsListSource, /部署、调用、查看资产合约/);
  assert.match(contractsListSource, /已部署合约/);
  assert.match(contractsListSource, /搜索 program address \/ name/);
  assert.match(contractsListSource, /POP 泡泡币/);
  assert.match(contractsListSource, /Core NFT/);
  assert.match(contractsListSource, /Staking Pool/);
  assert.match(contractsListSource, /Privacy Router/);
  assert.match(contractsListSource, /扫码部署请求/);
  assert.match(contractsListSource, /刷新/);
  assert.doesNotMatch(contractsListSource, /05-contracts-list\.png/);
});

test('contracts list uses the supplied SVG icon geometry as component icons', () => {
  assert.match(contractsIconsSource, /RadialGradient/);
  assert.match(contractsIconsSource, /POP/);
  assert.match(contractsIconsSource, /CORE/);
  assert.match(contractsIconsSource, /M48 16L74 27\.5V48/);
  assert.match(contractsIconsSource, /M8 10H36L25 22\.5V33/);
  assert.doesNotMatch(contractsIconsSource, /SvgXml/);
});
