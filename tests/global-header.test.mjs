import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const homeHeaderPath = new URL('../src/features/home/HomeHeader.tsx', import.meta.url);
const globalHeaderSource = readFileSync(new URL('../src/components/GlobalHeader.tsx', import.meta.url), 'utf8');
const homeScreenSource = readFileSync(new URL('../src/features/home/HomeScreen.tsx', import.meta.url), 'utf8');
const transferSendSource = readFileSync(new URL('../src/features/transferSend/TransferSendScreen.tsx', import.meta.url), 'utf8');
const dposOverviewSource = readFileSync(new URL('../src/features/dposOverview/DposOverviewScreen.tsx', import.meta.url), 'utf8');

test('top navigation is provided by one shared GlobalHeader mounted at App level', () => {
  assert.match(globalHeaderSource, /export function GlobalHeader/);
  assert.match(globalHeaderSource, /export function getGlobalHeaderHeight/);
  assert.match(appSource, /import \{ GlobalHeader, getGlobalHeaderHeight \}/);
  assert.match(appSource, /<GlobalHeader onAssetsPress=\{handleBackHome\} scale=\{headerMetrics\.scale\} \/>/);
  assert.match(appSource, /<TransferSendScreen bottomPadding=\{bottomPadding\} onBackPress=\{onBackPress\} topPadding=\{0\} \/>/);
});

test('feature screens do not mount their own top navigation', () => {
  assert.doesNotMatch(homeScreenSource, /<GlobalHeader/);
  assert.doesNotMatch(transferSendSource, /<GlobalHeader/);
  assert.doesNotMatch(dposOverviewSource, /<GlobalHeader/);
  assert.doesNotMatch(homeScreenSource, /fixedGlobalHeader/);
  assert.doesNotMatch(transferSendSource, /fixedGlobalHeader/);
  assert.doesNotMatch(dposOverviewSource, /fixedGlobalHeader/);
});

test('top navigation reserves content space without duplicating page components', () => {
  assert.match(appSource, /const contentTopPadding = headerMetrics\.topSafeArea \+ headerHeight/);
  assert.match(appSource, /style=\{\[styles\.screenLayer, \{ top: contentTopPadding \}\]\}/);
  assert.match(appSource, /collapsable=\{false\} style=\{\[styles\.screenLayer/);
  assert.match(appSource, /overflow: 'hidden'/);
  assert.match(appSource, /position: 'absolute'/);
  assert.match(appSource, /fixedTopNavigationScrim, \{ height: contentTopPadding \}/);
  assert.match(appSource, /pointerEvents="none"/);
  assert.match(appSource, /renderToHardwareTextureAndroid/);
  assert.match(homeScreenSource, /topPadding \?\? layoutMetrics\.topSafeArea \+ headerHeight/);
  assert.match(dposOverviewSource, /topPadding \?\? layoutMetrics\.topSafeArea \+ headerHeight/);
  assert.match(transferSendSource, /topPadding \?\? layoutMetrics\.topSafeArea \+ headerHeight/);
  assert.match(transferSendSource, /scaledBelowTopNavigation/);
});

test('feature screens do not keep duplicated top header implementations', () => {
  assert.equal(existsSync(homeHeaderPath), false);
  assert.doesNotMatch(transferSendSource, /activeTopTab|contractTopTab|headerAccountButton|headerScanButton/);
  assert.doesNotMatch(dposOverviewSource, /activeTopTab|contractTopTab|headerAccountButton|headerScanButton/);
  assert.doesNotMatch(dposOverviewSource, /function Header/);
});
