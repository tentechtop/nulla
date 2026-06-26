import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readSource('../App.tsx');
const accountHomeSource = readSource('../src/features/accountHome/AccountHomeScreen.tsx');
const contractsListSource = readSource('../src/features/contractsList/ContractsListScreen.tsx');
const dposOverviewSource = readSource('../src/features/dposOverview/DposOverviewScreen.tsx');
const homeHeroSource = readSource('../src/features/home/AssetHeroCard.tsx');
const marketHomeSource = readSource('../src/features/marketHome/MarketHomeScreen.tsx');
const privacyHomeSource = readSource('../src/features/privacyHome/PrivacyHomeScreen.tsx');
const scanResultSource = readSource('../src/features/scanResult/ScanResultScreen.tsx');
const transactionDetailSource = readSource('../src/features/transactionDetail/TransactionDetailScreen.tsx');
const transferSendSource = readSource('../src/features/transferSend/TransferSendScreen.tsx');
const walletSetupSource = readSource('../src/features/walletSetup/WalletSetupScreens.tsx');

function readSource(relativePath) {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

function getTopNavigationHeight(source) {
  const match = source.match(/const TOP_NAVIGATION_DESIGN_HEIGHT = (\d+);/);

  if (match === null) {
    return 0;
  }

  return Number(match[1]);
}

function getFirstContentGap(source, pattern) {
  const match = source.match(pattern);

  assert.notEqual(match, null);

  const designTop = Number(match[1]);

  return designTop - getTopNavigationHeight(source);
}

test('implemented pages do not duplicate the old top navigation as blank content', () => {
  const pageGaps = [
    getFirstContentGap(accountHomeSource, /pageTitle: \{[\s\S]*?top: scaledBelowTopNavigation\((\d+), scale\)/),
    getFirstContentGap(contractsListSource, /pageTitle: \{[\s\S]*?top: scaledBelowTopNavigation\((\d+), scale\)/),
    getFirstContentGap(dposOverviewSource, /pageTitle: \{[\s\S]*?top: scaled\((\d+), scale\)/),
    getFirstContentGap(marketHomeSource, /searchBar: \{[\s\S]*?top: scaledBelowTopNavigation\((\d+), scale\)/),
    getFirstContentGap(privacyHomeSource, /pageTitle: \{[\s\S]*?top: scaledBelowTopNavigation\((\d+), scale\)/),
    getFirstContentGap(scanResultSource, /pageTitle: \{[\s\S]*?top: scaledBelowTopNavigation\((\d+), scale\)/),
    getFirstContentGap(transferSendSource, /subtitle: \{[\s\S]*?top: scaledBelowTopNavigation\(181, scale\)[\s\S]*?title: \{[\s\S]*?top: scaledBelowTopNavigation\((\d+), scale\)/),
    getFirstContentGap(walletSetupSource, /title="创建钱包" top=\{scaledBelowTopNavigation\((\d+), layoutMetrics\.scale\)\}/),
    getFirstContentGap(walletSetupSource, /title="导入钱包" top=\{scaledBelowTopNavigation\((\d+), layoutMetrics\.scale\)\}/),
    getFirstContentGap(walletSetupSource, /title="备份助记词" top=\{scaledBelowTopNavigation\((\d+), layoutMetrics\.scale\)\}/)
  ];

  assert.match(homeHeroSource, /card: \{[\s\S]*?top: 0/);
  assert.match(transactionDetailSource, /pageHeading: \{/);

  for (const gap of pageGaps) {
    assert.ok(gap >= 0 && gap <= 36, `unexpected top gap: ${gap}`);
  }
});

test('App level layout owns the global header offset for every route', () => {
  const activeScreenSource = appSource.match(/function ActiveScreen\([\s\S]*?const styles = StyleSheet\.create/)?.[0] ?? '';

  assert.match(appSource, /const contentTopPadding = headerMetrics\.topSafeArea \+ headerHeight/);
  assert.match(appSource, /style=\{\[styles\.screenLayer, \{ top: contentTopPadding \}\]\}/);

  for (const screenName of [
    'HomeScreen',
    'TransferSendScreen',
    'TransactionDetailScreen',
    'ScanResultScreen',
    'PrivacyHomeScreen',
    'MarketHomeScreen',
    'ContractsListScreen',
    'AccountHomeScreen',
    'WalletCreateMnemonicEntryScreen',
    'WalletImportMnemonicScreen',
    'WalletMnemonicBackupScreen',
    'WalletSwitchAccountScreen',
    'DposOverviewScreen'
  ]) {
    const screenPattern = new RegExp(`<${screenName}[\\s\\S]*?topPadding=\\{0\\}`);
    assert.match(activeScreenSource, screenPattern);
  }
});
