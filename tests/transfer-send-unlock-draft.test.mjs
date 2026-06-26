import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const transferSendSource = readFileSync(new URL('../src/features/transferSend/TransferSendScreen.tsx', import.meta.url), 'utf8');

test('locked transfer send preserves draft while importing mnemonic', () => {
  assert.match(transferSendSource, /export type PendingTransferSendDraft/);
  assert.match(transferSendSource, /readonly initialDraft\?: PendingTransferSendDraft \| null;/);
  assert.match(transferSendSource, /readonly onUnlockWalletPress\?: \(draft: PendingTransferSendDraft\) => void;/);
  assert.match(transferSendSource, /setAddress\(sanitizeAddressInput\(initialDraft\.address\)\)/);
  assert.match(transferSendSource, /setAmount\(sanitizeLamportsInput\(initialDraft\.amount\)\)/);
  assert.match(transferSendSource, /setSelectedMode\(initialDraft\.selectedMode\)/);
  assert.match(transferSendSource, /onUnlockWalletPress\(\{ address, amount, selectedMode \}\)/);

  assert.match(appSource, /pendingTransferSendDraft/);
  assert.match(appSource, /const handleOpenWalletImportForTransferSend = \(draft: PendingTransferSendDraft\) => \{[\s\S]*setPendingTransferSendDraft\(draft\);[\s\S]*openRoute\('walletImportMnemonic'\);/);
  assert.match(appSource, /initialDraft=\{pendingTransferSendDraft\}/);
  assert.match(appSource, /onUnlockWalletPress=\{onTransferSendUnlockWalletPress\}/);
  assert.match(appSource, /if \(transferRouteIndex >= 0\) \{[\s\S]*replaceRouteStack\(currentRouteStack\.slice\(0, transferRouteIndex \+ 1\)\);/);
});

test('imported wallets persist signing seed so unlock survives app restart', () => {
  assert.match(appSource, /const \[walletSigningSeeds, setWalletSigningSeeds\] = useState<readonly WalletSigningSeed\[\]>\(\[\]\);/);
  assert.match(appSource, /setWalletSigningSeeds\(persistedWalletState\.signingSeeds\);/);
  assert.match(appSource, /setCurrentWalletSigningSeed\(findWalletSigningSeed\(persistedWalletState\.signingSeeds, persistedWalletState\.currentAddress\)\);/);
  assert.match(appSource, /signingSeeds: walletSigningSeeds/);
  assert.match(appSource, /setWalletSigningSeeds\(\(currentSeeds\) => upsertWalletSigningSeed\(currentSeeds, selectedAccount\.address, importedSigningSeed\)\);/);
  assert.match(appSource, /setCurrentWalletSigningSeed\(findWalletSigningSeed\(walletSigningSeeds, selectedAddress\)\);/);
  assert.match(appSource, /function removeWalletSigningSeed/);
});

test('transfer send blocks submission while balance is still loading', () => {
  assert.match(transferSendSource, /type SendDialogKind = 'balanceLoading'/);
  assert.match(transferSendSource, /if \(isBalanceLoading\) \{[\s\S]*setSendDialogKind\('balanceLoading'\);/);
  assert.match(transferSendSource, /title: '余额同步中'/);
  assert.match(transferSendSource, /余额返回前不会提交交易/);
});

test('transfer send requires explicit confirmation before broadcasting', () => {
  assert.match(transferSendSource, /const \[isSendConfirmVisible, setIsSendConfirmVisible\] = useState\(false\);/);
  assert.match(transferSendSource, /const handlePrimaryAction = \(\) => \{[\s\S]*setIsSendConfirmVisible\(true\);[\s\S]*\};/);
  assert.doesNotMatch(transferSendSource, /const handlePrimaryAction = \(\) => \{[\s\S]{0,220}void handleConfirmSend\(\);/);
  assert.match(transferSendSource, /function TransferConfirmDialog/);
  assert.match(transferSendSource, /visible=\{isSendConfirmVisible\}/);
  assert.match(transferSendSource, /确认并发送/);
  assert.match(transferSendSource, /本地签名 \+ 当前 RPC sendTransaction/);
  assert.match(transferSendSource, /const handleSubmitConfirmedTransfer = \(\) => \{[\s\S]*void handleConfirmSend\(\);/);
});
