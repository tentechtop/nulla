import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { getWalletSetupLayoutMetrics } from '../src/features/walletSetup/layout.js';

const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const walletSetupSource = readFileSync(new URL('../src/features/walletSetup/WalletSetupScreens.tsx', import.meta.url), 'utf8');
const walletSetupAssetsSource = readFileSync(new URL('../src/features/walletSetup/designAssets.ts', import.meta.url), 'utf8');

test('getWalletSetupLayoutMetrics scales wallet setup screens by viewport width', () => {
  const compact = getWalletSetupLayoutMetrics(426.5, 0, 0);
  const source = getWalletSetupLayoutMetrics(853, 0, 0);

  assert.equal(compact.scale, 0.5);
  assert.equal(compact.contentHeight, 809);
  assert.equal(compact.bottomNavSliceHeight, 70);
  assert.equal(source.contentHeight, 1618);
  assert.equal(source.bottomNavSliceHeight, 140);
});

test('getWalletSetupLayoutMetrics rejects unsafe viewport inputs', () => {
  assert.throws(() => getWalletSetupLayoutMetrics(0, 0, 0), /viewportWidth 必须是正数/);
  assert.throws(() => getWalletSetupLayoutMetrics(414, -1, 0), /topSafeArea 必须是非负数/);
  assert.throws(() => getWalletSetupLayoutMetrics(414, 0, Number.NaN), /bottomSafeArea 必须是非负数/);
});

test('wallet setup pages use generated assets and native controls', () => {
  assert.match(walletSetupAssetsSource, /background-wallet-create-card-hd\.png/);
  assert.match(walletSetupAssetsSource, /background-mnemonic-backup-card-hd\.png/);
  assert.match(walletSetupAssetsSource, /background-wallet-switch-card-hd\.png/);
  assert.match(walletSetupSource, /const WORD_COUNT_OPTIONS = \[12, 18, 24\] as const/);
  assert.match(walletSetupSource, /创建钱包/);
  assert.match(walletSetupSource, /备份助记词/);
  assert.match(walletSetupSource, /切换钱包/);
  assert.match(walletSetupSource, /onGenerateMnemonic/);
  assert.match(walletSetupSource, /onConfirmSwitch/);
  assert.match(walletSetupSource, /accessibilityLabel="钱包名称"/);
  assert.match(walletSetupSource, /accessibilityLabel="清空钱包名称"/);
  assert.match(walletSetupSource, /onGenerateMnemonic\(words, normalizedWalletName\)/);
  assert.match(walletSetupSource, /normalizeWalletAccountLabel\(walletName\)/);
  assert.doesNotMatch(walletSetupSource, /InfoLine label="钱包名称"[\s\S]*value="SOL 主钱包"/);
  assert.doesNotMatch(walletSetupSource, /56-wallet-create-mnemonic-entry\.png|57-wallet-mnemonic-backup-12words\.png|58-wallet-switch-account\.png/);
});

test('wallet setup pages remove the redundant gap below the global header', () => {
  assert.match(walletSetupSource, /const TOP_NAVIGATION_DESIGN_HEIGHT = 177/);
  assert.doesNotMatch(walletSetupSource, /const TOP_NAVIGATION_DESIGN_HEIGHT = 117/);
});

test('App routes account wallet actions into wallet setup flow', () => {
  assert.match(appSource, /const EMPTY_WALLET_ROUTE_STACK: readonly AppRoute\[\] = \['walletCreateMnemonicEntry'\]/);
  assert.match(appSource, /const \[walletAccounts, setWalletAccounts\] = useState<readonly WalletAccount\[\]>\(INITIAL_WALLET_ACCOUNTS\)/);
  assert.match(appSource, /const hasWalletAccount = walletAccounts\.length > 0/);
  assert.match(appSource, /canOpenRouteWithoutWallet/);
  assert.match(appSource, /'walletImportMnemonic'/);
  assert.match(appSource, /EMPTY_WALLET_ALLOWED_ROUTES = new Set<AppRoute>\(\['walletCreateMnemonicEntry', 'walletImportMnemonic', 'walletMnemonicBackup', 'scanResult'\]\)/);
  assert.match(appSource, /!hasWalletAccount && !canOpenRouteWithoutWallet\(currentTopRoute\)/);
  assert.match(appSource, /walletCreateMnemonicEntry/);
  assert.match(appSource, /walletImportMnemonic/);
  assert.match(appSource, /walletMnemonicBackup/);
  assert.match(appSource, /walletSwitchAccount/);
  assert.match(appSource, /handleOpenWalletImport/);
  assert.match(appSource, /handleImportMnemonic/);
  assert.match(appSource, /setMnemonicWords\(\[\]\)/);
  assert.match(appSource, /pendingWalletName/);
  assert.match(appSource, /getDefaultWalletAccountLabel\(walletAccounts\.length\)/);
  assert.match(appSource, /createWalletAccountFromMnemonic\(mnemonicWords, walletAccounts\.length, pendingWalletName\)/);
  assert.match(appSource, /replaceRouteStack\(\['walletSwitchAccount'\]\)/);
  assert.match(appSource, /onBackupMnemonicPress=\{handleOpenMnemonicBackup\}/);
  assert.match(appSource, /onSwitchAccountPress=\{handleOpenWalletSwitch\}/);
  assert.match(appSource, /onImportWalletPress=\{handleOpenWalletImport\}/);
  assert.match(appSource, /currentWalletAddress=\{currentWalletAddress\}/);
});

test('wallet import screen restores from pasted mnemonic instead of generating one', () => {
  assert.match(walletSetupSource, /WalletImportMnemonicScreen/);
  assert.match(walletSetupSource, /title="导入钱包"/);
  assert.match(walletSetupSource, /12\/18\/24 词/);
  assert.match(walletSetupSource, /wordCount === 12 \|\| wordCount === 18 \|\| wordCount === 24/);
  assert.match(walletSetupSource, /parseMnemonicText\(mnemonicText\)/);
  assert.match(walletSetupSource, /validateMnemonicWords\(words\)/);
  assert.match(walletSetupSource, /onImportMnemonic\(words\)/);
  assert.match(walletSetupSource, /accessibilityLabel="输入已有钱包助记词"/);
  assert.match(walletSetupSource, /不会生成新助记词/);
  assert.match(walletSetupSource, /导入钱包/);
  assert.doesNotMatch(walletSetupSource, /export function WalletImportMnemonicScreen[\s\S]*createMnemonicWordsWithSystemRandom[\s\S]*export function WalletMnemonicBackupScreen/);
});

test('wallet setup copy and QR controls are wired to runtime handlers', () => {
  assert.match(walletSetupSource, /AddressActionDialog/);
  assert.match(walletSetupSource, /copyTextToClipboard\(selectedAccount\.address, '地址已复制'\)/);
  assert.match(walletSetupSource, /copyTextToClipboard\(mnemonicWords\.join\(' '\), '助记词已复制，请只保存到离线介质'\)/);
  assert.match(walletSetupSource, /getRandomBytesAsync/);
  assert.match(walletSetupSource, /createMnemonicWords\(wordCount, randomBytes\)/);
  assert.doesNotMatch(walletSetupSource, /createMnemonicWords\(wordCount\)/);
  assert.match(walletSetupSource, /onCopyPress=\{handleCopyCurrentAddress\}/);
  assert.match(walletSetupSource, /onQrPress=\{handleShowCurrentQr\}/);
  assert.match(walletSetupSource, /onPress=\{onCopyPress\}/);
  assert.match(walletSetupSource, /onPress=\{onQrPress\}/);
});

test('wallet backup verification requires typed mnemonic input', () => {
  assert.match(walletSetupSource, /MnemonicVerifyDialog/);
  assert.match(walletSetupSource, /TextInput/);
  assert.match(walletSetupSource, /getMnemonicBackupLayout\(mnemonicWords\.length\)/);
  assert.match(walletSetupSource, /contentOffsetDesign/);
  assert.match(walletSetupSource, /canvasHeight=\{scaled\(mnemonicBackupLayout\.canvasHeightDesign, layoutMetrics\.scale\)\}/);
  assert.match(walletSetupSource, /resolveMnemonicWordCount\(mnemonicWords\.length\)/);
  assert.match(walletSetupSource, /verifyMnemonicWord\(mnemonicWords, activeVerifyWordNumber, verifyAnswer\)/);
  assert.match(walletSetupSource, /setIsMnemonicHidden\(true\)/);
  assert.match(walletSetupSource, /onVerifyWordPress=\{handleOpenVerifyWord\}/);
  assert.match(walletSetupSource, /getVerifyProgressPatch\(activeVerifyWordNumber\)/);
  assert.match(walletSetupSource, /第 \$\{activeVerifyWordNumber\} 词不正确，请重新核对/);
  assert.doesNotMatch(walletSetupSource, /thirdWordVerified: !backupProgress\.thirdWordVerified/);
  assert.doesNotMatch(walletSetupSource, /ninthWordVerified: !backupProgress\.ninthWordVerified/);
});

test('wallet switch screen keeps action buttons inside the designed mobile safe area', () => {
  assert.match(walletSetupSource, /height: scaled\(1618, scale\)/);
  assert.match(walletSetupSource, /right: scaled\(26, scale\)/);
  assert.doesNotMatch(walletSetupSource, /right: scaled\(6, scale\)/);
  assert.match(walletSetupSource, /account\.status === '当前账户' \? '已备份' : account\.status/);
  assert.match(walletSetupSource, /account=\{selectedAccount\}/);
  assert.match(walletSetupSource, /label=\{isSelectedCurrentAccount \? '当前钱包' : '待切换钱包'\}/);
  assert.match(walletSetupSource, /address=\{selectedAccount\.address\}/);
});
