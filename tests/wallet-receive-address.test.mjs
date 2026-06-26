import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { getReceiveAddressLayoutMetrics } from '../src/features/receiveAddress/layout.js';

const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const quickActionSource = readFileSync(new URL('../src/features/home/QuickActionBar.tsx', import.meta.url), 'utf8');
const homeSource = readFileSync(new URL('../src/features/home/HomeScreen.tsx', import.meta.url), 'utf8');
const receiveAddressSource = readFileSync(new URL('../src/features/receiveAddress/ReceiveAddressScreen.tsx', import.meta.url), 'utf8');

test('receive address layout scales by mobile design width', () => {
  const metrics = getReceiveAddressLayoutMetrics(432, 24, 16);

  assert.equal(metrics.scale, 0.5);
  assert.equal(metrics.contentWidth, 432);
  assert.equal(metrics.contentHeight, 794);
  assert.equal(metrics.bottomNavSliceHeight, 70);
  assert.equal(metrics.bottomNavHeight, 86);
});

test('receive address layout keeps safe areas outside design scale and rejects unsafe inputs', () => {
  const metrics = getReceiveAddressLayoutMetrics(393, 24, 34);

  assert.equal(metrics.topSafeArea, 24);
  assert.equal(metrics.bottomNavHeight, metrics.bottomNavSliceHeight + 34);
  assert.throws(() => getReceiveAddressLayoutMetrics(0, 0, 0), /viewportWidth 必须是正数/);
  assert.throws(() => getReceiveAddressLayoutMetrics(393, -1, 0), /topSafeArea 必须是非负数/);
  assert.throws(() => getReceiveAddressLayoutMetrics(393, 0, Number.NaN), /bottomSafeArea 必须是非负数/);
});

test('wallet quick actions open receive and stake flows', () => {
  assert.match(quickActionSource, /readonly onReceivePress\?: \(\) => void/);
  assert.match(quickActionSource, /readonly onStakePress\?: \(\) => void/);
  assert.match(quickActionSource, /actionKey === 'receive'[\s\S]*onReceivePress\?\.\(\)/);
  assert.match(quickActionSource, /actionKey === 'stake'[\s\S]*onStakePress\?\.\(\)/);
  assert.match(homeSource, /onReceivePress=\{onReceivePress\}/);
  assert.match(homeSource, /onStakePress=\{onStakePress\}/);
});

test('receive address page is routed and uses the current wallet address', () => {
  assert.match(appSource, /'receiveAddress'/);
  assert.match(appSource, /function ActiveScreen/);
  assert.match(appSource, /<ReceiveAddressScreen/);
  assert.match(appSource, /currentWalletAddress=\{currentWalletAddress\}/);
  assert.match(appSource, /onReceivePress=\{handleOpenReceiveAddress\}/);
  assert.match(appSource, /onStakePress=\{\(\) => onValidatorListPress\('stake'\)\}/);
});

test('receive address page generates native QR from runtime address only', () => {
  assert.match(receiveAddressSource, /generateQrMatrix\(address\)/);
  assert.match(receiveAddressSource, /copyTextToClipboard\(address/);
  assert.match(receiveAddressSource, /Share\.share\(\{ message: address/);
  assert.match(receiveAddressSource, /receiveAddressImages\.walletCardBackground/);
  assert.match(receiveAddressSource, /moduleSize = Math\.max\(1, Math\.floor\(size \/ matrixSize\)\)/);
  assert.match(receiveAddressSource, /<LinearGradient colors=\{\['#126DFF', '#8A4DFF'\]\}/);
  assert.match(receiveAddressSource, /walletCard: \{[\s\S]*height: scaled\(704, scale\)/);
  assert.match(receiveAddressSource, /qrFrame: \{[\s\S]*height: scaled\(346, scale\)/);
  assert.match(receiveAddressSource, /shadowOpacity: 0\.04/);
  assert.match(receiveAddressSource, /shadowOpacity: 0\.035/);
  assert.doesNotMatch(receiveAddressSource, /3GT9QRAu2LZM/);
  assert.doesNotMatch(receiveAddressSource, /TcZjT5S/);
  assert.doesNotMatch(receiveAddressSource, /qrLogoBadge|receiveAddressImages\.qrLogo/);
  assert.doesNotMatch(receiveAddressSource, /60-receive-address-redesign\.png/);
  assert.doesNotMatch(receiveAddressSource, /12-receive-address\.png/);
});
