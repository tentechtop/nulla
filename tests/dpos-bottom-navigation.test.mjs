import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const globalBottomSource = readFileSync(new URL('../src/components/GlobalBottomNavigation.tsx', import.meta.url), 'utf8');
const microsoftLogoSource = readFileSync(new URL('../design-draft/common/logo-microsoft.svg', import.meta.url), 'utf8');
const homeBottomPath = new URL('../src/features/home/BottomNavigation.tsx', import.meta.url);
const homeScreenSource = readFileSync(new URL('../src/features/home/HomeScreen.tsx', import.meta.url), 'utf8');
const scanResultSource = readFileSync(new URL('../src/features/scanResult/ScanResultScreen.tsx', import.meta.url), 'utf8');
const transferSendSource = readFileSync(new URL('../src/features/transferSend/TransferSendScreen.tsx', import.meta.url), 'utf8');
const dposScreenSource = readFileSync(new URL('../src/features/dposOverview/DposOverviewScreen.tsx', import.meta.url), 'utf8');

test('bottom navigation is mounted once at App level', () => {
  assert.match(appSource, /<GlobalBottomNavigation/);
  assert.match(appSource, /bottomNavHeight=\{headerMetrics\.bottomNavHeight\}/);
  assert.match(appSource, /bottomNavSliceHeight=\{headerMetrics\.bottomNavSliceHeight\}/);
  assert.equal(existsSync(homeBottomPath), false);
});

test('feature screens do not mount local bottom navigation components', () => {
  assert.doesNotMatch(homeScreenSource, /<BottomNavigation|function BottomNavigation|const bottomTabs/);
  assert.doesNotMatch(scanResultSource, /<BottomNavigation|function BottomNavigation|const bottomTabs/);
  assert.doesNotMatch(transferSendSource, /<BottomNavigation|function BottomNavigation|const bottomTabs/);
  assert.doesNotMatch(dposScreenSource, /<BottomNavigation|function BottomNavigation|const bottomTabs/);
});

test('DPoS bottom navigation state is driven by the shared route state', () => {
  assert.match(appSource, /currentRoute === 'dposOverview' \? 'dpos' : 'assets'/);
  assert.match(globalBottomSource, /accessibilityState=\{\{ selected: isActive \}\}/);
  assert.match(globalBottomSource, /if \(tab\.key === 'dpos'\)/);
});

test('assets tab icon uses the provided Microsoft logo SVG geometry', () => {
  assert.match(microsoftLogoSource, /viewBox="0 0 1024 1024"/);
  assert.match(microsoftLogoSource, /M932\.693333 762\.026667/);
  assert.match(globalBottomSource, /const ASSETS_TAB_ICON_PATH =/);
  assert.match(globalBottomSource, /M932\.693333 762\.026667/);
  assert.match(globalBottomSource, /viewBox="0 0 1024 1024"/);
  assert.doesNotMatch(globalBottomSource, /M7\.5 24\.8L28 8L48\.5 24\.8V49/);
  assert.doesNotMatch(globalBottomSource, /HOME_BUTTON_ICON_PATHS/);
});
