import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const globalBottomSource = readFileSync(new URL('../src/components/GlobalBottomNavigation.tsx', import.meta.url), 'utf8');
const homeIconSource = readFileSync(new URL('../design-draft/common/home.svg', import.meta.url), 'utf8');
const homeBottomPath = new URL('../src/features/home/BottomNavigation.tsx', import.meta.url);
const homeScreenSource = readFileSync(new URL('../src/features/home/HomeScreen.tsx', import.meta.url), 'utf8');
const marketHomeSource = readFileSync(new URL('../src/features/marketHome/MarketHomeScreen.tsx', import.meta.url), 'utf8');
const privacyHomeSource = readFileSync(new URL('../src/features/privacyHome/PrivacyHomeScreen.tsx', import.meta.url), 'utf8');
const contractsListSource = readFileSync(new URL('../src/features/contractsList/ContractsListScreen.tsx', import.meta.url), 'utf8');
const accountHomeSource = readFileSync(new URL('../src/features/accountHome/AccountHomeScreen.tsx', import.meta.url), 'utf8');
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
  for (const source of [
    homeScreenSource,
    marketHomeSource,
    privacyHomeSource,
    contractsListSource,
    accountHomeSource,
    scanResultSource,
    transferSendSource,
    dposScreenSource
  ]) {
    assert.doesNotMatch(source, /<BottomNavigation|function BottomNavigation|const bottomTabs/);
  }
});

test('wallet workspace bottom navigation uses wallet-specific labels and routes', () => {
  assert.match(globalBottomSource, /export type GlobalBottomNavigationWorkspace = 'market' \| 'wallet'/);
  assert.match(globalBottomSource, /walletNavigationItems/);
  assert.match(globalBottomSource, /label: '主页'/);
  assert.match(globalBottomSource, /label: '交易'/);
  assert.match(globalBottomSource, /label: 'DPoS'/);
  assert.match(globalBottomSource, /label: '隐私'/);
  assert.match(globalBottomSource, /label: '资产'/);
  assert.match(globalBottomSource, /readonly onWalletHomePress\?: \(\) => void;/);
  assert.match(globalBottomSource, /readonly onWalletTradePress\?: \(\) => void;/);
  assert.match(globalBottomSource, /readonly onWalletDposPress\?: \(\) => void;/);
  assert.match(globalBottomSource, /readonly onWalletPrivacyPress\?: \(\) => void;/);
  assert.match(appSource, /currentRoute === 'home'\s+\?\s+'walletHome'/);
  assert.match(appSource, /onWalletHomePress=\{handleOpenHome\}/);
  assert.match(appSource, /onWalletTradePress=\{handleOpenTransferSend\}/);
  assert.match(appSource, /onWalletDposPress=\{handleOpenDposOverview\}/);
  assert.match(appSource, /onWalletPrivacyPress=\{handleOpenPrivacyHome\}/);
});

test('market workspace bottom navigation uses market-specific labels and routes', () => {
  assert.match(globalBottomSource, /marketNavigationItems/);
  assert.match(globalBottomSource, /label: '行情'/);
  assert.match(globalBottomSource, /label: '交易'/);
  assert.match(globalBottomSource, /label: '合约'/);
  assert.match(globalBottomSource, /label: '订单'/);
  assert.match(globalBottomSource, /label: '更多'/);
  assert.match(globalBottomSource, /readonly onMarketQuotesPress\?: \(\) => void;/);
  assert.match(globalBottomSource, /readonly onMarketContractsPress\?: \(\) => void;/);
  assert.match(globalBottomSource, /readonly onMarketOrdersPress\?: \(\) => void;/);
  assert.match(globalBottomSource, /readonly onMarketMorePress\?: \(\) => void;/);
  assert.match(appSource, /currentRoute === 'marketHome'\s+\?\s+'marketQuotes'/);
  assert.match(appSource, /currentRoute === 'contractsList'\s+\?\s+'marketContracts'/);
  assert.match(appSource, /workspace=\{activeHeaderWorkspace\}/);
  assert.match(appSource, /onMarketContractsPress=\{handleOpenContractsList\}/);
  assert.match(appSource, /onMarketOrdersPress=\{handleOpenMarketHome\}/);
  assert.match(appSource, /onMarketMorePress=\{handleOpenMarketHome\}/);
  assert.doesNotMatch(globalBottomSource, /label: '首页'/);
  assert.doesNotMatch(globalBottomSource, /label: '应用'/);
  assert.doesNotMatch(globalBottomSource, /label: '账户'/);
});

test('contract bottom navigation opens and highlights the contracts page', () => {
  assert.match(appSource, /const handleOpenContractsList = \(\) => \{\s+openRoute\('contractsList'\);/);
  assert.match(appSource, /onMarketContractsPress=\{handleOpenContractsList\}/);
  assert.match(appSource, /return <ContractsListScreen bottomPadding=\{bottomPadding\} topPadding=\{0\} \/>/);
});

test('assets tab icon keeps the provided home SVG geometry available', () => {
  assert.match(homeIconSource, /viewBox="0 0 1024 1024"/);
  assert.match(homeIconSource, /M972\.8 395\.008L512 51\.2/);
  assert.match(globalBottomSource, /const ASSETS_TAB_ICON_PATH =/);
  assert.match(globalBottomSource, /M972\.8 395\.008L512 51\.2/);
  assert.match(globalBottomSource, /<Path d=\{ASSETS_TAB_ICON_PATH\} fill=\{color\} \/>/);
  assert.doesNotMatch(globalBottomSource, /SvgXml/);
});
