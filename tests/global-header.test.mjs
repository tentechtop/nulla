import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const homeHeaderPath = new URL('../src/features/home/HomeHeader.tsx', import.meta.url);
const globalHeaderSource = readFileSync(new URL('../src/components/GlobalHeader.tsx', import.meta.url), 'utf8');
const homeScreenSource = readFileSync(new URL('../src/features/home/HomeScreen.tsx', import.meta.url), 'utf8');
const marketHomeSource = readFileSync(new URL('../src/features/marketHome/MarketHomeScreen.tsx', import.meta.url), 'utf8');
const quickActionBarSource = readFileSync(new URL('../src/features/home/QuickActionBar.tsx', import.meta.url), 'utf8');
const contractsListSource = readFileSync(new URL('../src/features/contractsList/ContractsListScreen.tsx', import.meta.url), 'utf8');
const accountHomeSource = readFileSync(new URL('../src/features/accountHome/AccountHomeScreen.tsx', import.meta.url), 'utf8');
const scanResultSource = readFileSync(new URL('../src/features/scanResult/ScanResultScreen.tsx', import.meta.url), 'utf8');
const transferSendSource = readFileSync(new URL('../src/features/transferSend/TransferSendScreen.tsx', import.meta.url), 'utf8');
const dposOverviewSource = readFileSync(new URL('../src/features/dposOverview/DposOverviewScreen.tsx', import.meta.url), 'utf8');

test('top navigation is provided by one shared GlobalHeader mounted at App level', () => {
  assert.match(globalHeaderSource, /export function GlobalHeader/);
  assert.match(globalHeaderSource, /export function getGlobalHeaderHeight/);
  assert.match(appSource, /import \{ GlobalHeader, getGlobalHeaderHeight \}/);
  assert.match(appSource, /function getWorkspaceForRoute\(route: AppRoute\): GlobalBottomNavigationWorkspace/);
  assert.match(appSource, /const activeHeaderWorkspace = getWorkspaceForRoute\(currentRoute\)/);
  assert.doesNotMatch(appSource, /currentRoute === 'accountHome' \? undefined/);
  assert.match(appSource, /activeWorkspace=\{activeHeaderWorkspace\}/);
  assert.match(appSource, /onAccountPress=\{handleOpenAccountHome\}/);
  assert.match(appSource, /onMarketPress=\{handleOpenMarketHome\}/);
  assert.match(appSource, /onWalletPress=\{handleOpenHome\}/);
  assert.match(globalHeaderSource, /focusable=\{false\}\s+onPress=\{onMarketPress\}\s+style=\{\[isMarketActive \? styles\.activeTab : styles\.marketTab, webNoFocusOutline\]\}/);
  assert.match(globalHeaderSource, /focusable=\{false\}\s+onPress=\{onWalletPress\}\s+style=\{\[isWalletActive \? styles\.activeWalletTab : styles\.walletTab, webNoFocusOutline\]\}/);
  assert.match(globalHeaderSource, />市场<\/Text>/);
  assert.match(globalHeaderSource, />钱包<\/Text>/);
  assert.doesNotMatch(globalHeaderSource, />资产<\/Text>|>合约<\/Text>/);
  assert.doesNotMatch(globalHeaderSource, /segmentedDivider/);
  assert.match(appSource, /<TransferSendScreen bottomPadding=\{bottomPadding\} onBackPress=\{onBackPress\} onScanPress=\{onScanPress\} topPadding=\{0\} \/>/);
  assert.match(appSource, /<ScanResultScreen bottomPadding=\{bottomPadding\} onBackPress=\{onBackPress\} topPadding=\{0\} \/>/);
});

test('feature screens do not mount their own top navigation', () => {
  assert.doesNotMatch(homeScreenSource, /<GlobalHeader/);
  assert.doesNotMatch(marketHomeSource, /<GlobalHeader/);
  assert.doesNotMatch(contractsListSource, /<GlobalHeader/);
  assert.doesNotMatch(accountHomeSource, /<GlobalHeader/);
  assert.doesNotMatch(scanResultSource, /<GlobalHeader/);
  assert.doesNotMatch(transferSendSource, /<GlobalHeader/);
  assert.doesNotMatch(dposOverviewSource, /<GlobalHeader/);
  assert.doesNotMatch(homeScreenSource, /fixedGlobalHeader/);
  assert.doesNotMatch(marketHomeSource, /fixedGlobalHeader/);
  assert.doesNotMatch(contractsListSource, /fixedGlobalHeader/);
  assert.doesNotMatch(accountHomeSource, /fixedGlobalHeader/);
  assert.doesNotMatch(scanResultSource, /fixedGlobalHeader/);
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
  assert.doesNotMatch(appSource, /renderToHardwareTextureAndroid/);
  assert.doesNotMatch(appSource, /elevation: 20|elevation: 30/);
  assert.match(homeScreenSource, /topPadding \?\? layoutMetrics\.topSafeArea \+ headerHeight/);
  assert.match(marketHomeSource, /topPadding \?\? layoutMetrics\.topSafeArea \+ headerHeight/);
  assert.match(contractsListSource, /topPadding \?\? layoutMetrics\.topSafeArea \+ headerHeight/);
  assert.match(accountHomeSource, /topPadding \?\? layoutMetrics\.topSafeArea \+ headerHeight/);
  assert.match(scanResultSource, /topPadding \?\? layoutMetrics\.topSafeArea \+ headerHeight/);
  assert.match(dposOverviewSource, /topPadding \?\? layoutMetrics\.topSafeArea \+ headerHeight/);
  assert.match(transferSendSource, /topPadding \?\? layoutMetrics\.topSafeArea \+ headerHeight/);
  assert.match(scanResultSource, /scaledBelowTopNavigation/);
  assert.match(transferSendSource, /scaledBelowTopNavigation/);
});

test('feature screens do not keep duplicated top header implementations', () => {
  assert.equal(existsSync(homeHeaderPath), false);
  assert.doesNotMatch(marketHomeSource, /activeTopTab|contractTopTab|headerAccountButton|headerScanButton/);
  assert.doesNotMatch(scanResultSource, /activeTopTab|contractTopTab|headerAccountButton|headerScanButton/);
  assert.doesNotMatch(transferSendSource, /activeTopTab|contractTopTab|headerAccountButton|headerScanButton/);
  assert.doesNotMatch(dposOverviewSource, /activeTopTab|contractTopTab|headerAccountButton|headerScanButton/);
  assert.doesNotMatch(contractsListSource, /activeTopTab|contractTopTab|headerAccountButton|headerScanButton/);
  assert.doesNotMatch(accountHomeSource, /activeTopTab|contractTopTab|headerAccountButton|headerScanButton/);
  assert.doesNotMatch(dposOverviewSource, /function Header/);
});

test('global scan actions route to the scan result page', () => {
  assert.match(appSource, /type AppRoute = 'home' \| 'transferSend' \| 'marketHome' \| 'contractsList' \| 'dposOverview' \| 'privacyHome' \| 'accountHome' \| 'scanResult'/);
  assert.match(appSource, /const handleOpenScanResult = \(\) => \{\s+openRoute\('scanResult'\);/);
  assert.match(homeScreenSource, /<QuickActionBar onScanPress=\{onScanPress\} onSendPress=\{onSendPress\} \/>/);
  assert.match(quickActionBarSource, /if \(actionKey === 'scan'\) \{\s+onScanPress\?\.\(\);/);
});

test('android side back returns to the previous app route before exiting', () => {
  assert.match(appSource, /import \{ BackHandler, StyleSheet, View \} from 'react-native'/);
  assert.match(appSource, /const routeStackRef = useRef<readonly AppRoute\[\]>\(INITIAL_ROUTE_STACK\)/);
  assert.match(appSource, /const \[routeStack, setRouteStack\] = useState<readonly AppRoute\[\]>\(INITIAL_ROUTE_STACK\)/);
  assert.match(appSource, /const currentRoute = routeStack\[routeStack\.length - 1\] \?\? 'home'/);
  assert.match(appSource, /BackHandler\.addEventListener\('hardwareBackPress', goBackOneRoute\)/);
  assert.match(appSource, /currentRouteStack\.slice\(0, -1\)/);
  assert.match(appSource, /if \(currentRouteStack\.length <= 1\) \{\s+return false;/);
});

test('app background is pinned to white across react and native shells', () => {
  const appShellSource = readFileSync(new URL('../src/components/AppShell.tsx', import.meta.url), 'utf8');
  const androidStyleSource = readFileSync(new URL('../android/app/src/main/res/values/styles.xml', import.meta.url), 'utf8');

  assert.match(appSource, /<StatusBar backgroundColor="#FFFFFF" hidden=\{false\} style="dark" translucent=\{false\} \/>/);
  assert.match(appSource, /appRoot: \{\s+backgroundColor: '#FFFFFF'/);
  assert.match(appShellSource, /<StatusBar backgroundColor="#FFFFFF" style="dark" translucent=\{false\} \/>/);
  assert.match(androidStyleSource, /<item name="android:windowBackground">#FFFFFF<\/item>/);
  assert.match(androidStyleSource, /<item name="android:navigationBarColor">#FFFFFF<\/item>/);
  assert.match(androidStyleSource, /<item name="android:forceDarkAllowed">false<\/item>/);
});

test('scrolling screens keep the content plane the same white as the global header', () => {
  const appShellSource = readFileSync(new URL('../src/components/AppShell.tsx', import.meta.url), 'utf8');

  for (const source of [appShellSource, transferSendSource, scanResultSource, dposOverviewSource, contractsListSource, accountHomeSource]) {
    assert.match(source, /overScrollMode="never"/);
    assert.match(source, /style=\{styles\.scrollView\}/);
    assert.match(source, /scrollView: \{\s+backgroundColor: colors\.background/);
  }

  for (const source of [transferSendSource, scanResultSource, dposOverviewSource, contractsListSource, accountHomeSource]) {
    assert.match(source, /canvas: \{\s+backgroundColor: colors\.background/);
  }
});

test('send page address scan button opens the real scanner route', () => {
  assert.match(transferSendSource, /readonly onScanPress\?: \(\) => void;/);
  assert.match(transferSendSource, /export function TransferSendScreen\(\{ bottomPadding, onBackPress, onScanPress, topPadding \}/);
  assert.match(transferSendSource, /onScanPress=\{onScanPress\}/);
  assert.match(transferSendSource, /accessibilityLabel="扫码输入地址" accessibilityRole="button" onPress=\{onScanPress\}/);
});
