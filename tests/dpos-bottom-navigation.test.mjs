import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const globalBottomSource = readFileSync(new URL('../src/components/GlobalBottomNavigation.tsx', import.meta.url), 'utf8');
const navAssetsIconSource = readFileSync(new URL('../design-draft/common/nav-assets.svg', import.meta.url), 'utf8');
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
  assert.match(appSource, /route === 'home'\s*\)\s*\{\s*return 'walletHome';/);
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
  assert.match(appSource, /route === 'marketHome'\s*\)\s*\{\s*return 'marketQuotes';/);
  assert.match(appSource, /route === 'contractsList' \|\| route === 'contractDeployConfirm'\)\s*\{\s*return 'marketContracts';/);
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
  assert.match(appSource, /return <ContractsListScreen bottomPadding=\{bottomPadding\} onDeployPress=\{onContractDeployPress\} topPadding=\{0\} \/>/);
});

test('wallet assets bottom navigation opens and highlights portfolio analytics page', () => {
  assert.match(appSource, /const handleOpenAccountHome = \(\) => \{\s+openRoute\('accountHome'\);/);
  assert.match(appSource, /const handleOpenPortfolioAnalytics = \(\) => \{\s+openRoute\('portfolioAnalytics'\);/);
  assert.match(appSource, /onAccountPress=\{handleOpenAccountHome\}/);
  assert.match(appSource, /onWalletAssetsPress=\{handleOpenPortfolioAnalytics\}/);
  assert.match(appSource, /route === 'portfolioAnalytics'/);
  assert.match(appSource, /return 'walletAssets';/);
  assert.doesNotMatch(appSource, /route === 'accountHome'[\s\S]{0,180}return 'walletAssets';/);
  assert.doesNotMatch(appSource, /route === 'walletSwitchAccount'[\s\S]{0,180}return 'walletAssets';/);
  assert.doesNotMatch(appSource, /onWalletAssetsPress=\{handleOpenHome\}/);
});

test('assets tab icon uses simplified single-shape geometry like wallet home', () => {
  assert.match(navAssetsIconSource, /viewBox="0 0 56 56"/);
  assert.match(navAssetsIconSource, /M28 8L46 20V44L28 52L10 44V20L28 8Z/);
  assert.match(globalBottomSource, /function AssetsTabIcon/);
  assert.match(globalBottomSource, /<Path d="M28 8L46 20V44L28 52L10 44V20L28 8Z" fill=\{color\} \/>/);
  assert.match(globalBottomSource, /<Path d="M28 8L46 20V44L28 52L10 44V20L28 8Z" stroke=\{color\} strokeLinejoin="round" strokeWidth="3\.6" \/>/);
  assert.doesNotMatch(globalBottomSource, /<Rect fill=\{color\} height="27"|<Circle cx="38" cy="34"/);
  assert.doesNotMatch(globalBottomSource, /const ASSETS_TAB_ICON_PATH/);
  assert.doesNotMatch(globalBottomSource, /M972\.8 395\.008L512 51\.2/);
  assert.doesNotMatch(globalBottomSource, /SvgXml/);
});

test('DPoS reward details do not route to withdraw principal transactions', () => {
  assert.match(appSource, /onRewardPress=\{\(\) => onValidatorListPress\('delegate'\)\}/);
  assert.doesNotMatch(appSource, /onClaimPress=\{\(\) =>[\s\S]{0,160}withdrawDelegation/);
  assert.doesNotMatch(dposScreenSource, /onClaimPress|领取收益|待领取收益|可领取/);
});
