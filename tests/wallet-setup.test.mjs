import assert from 'node:assert/strict';
import test from 'node:test';
import { SYSTEM_ADDRESS_MAX_LENGTH, SYSTEM_ADDRESS_MIN_LENGTH, isSystemAddress } from '../src/utils/addressSpec.js';
import {
  INITIAL_WALLET_ACCOUNTS,
  createMnemonicWords,
  createWalletAccountFromMnemonic,
  formatShortAddress,
  getDefaultWalletAccountLabel,
  normalizeWalletAccountLabel,
  parseMnemonicText,
  removeWalletAccount,
  sanitizeWalletAccountLabelInput,
  selectWalletAccount,
  upsertWalletAccount,
  verifyMnemonicWord,
  validateMnemonicWords
} from '../src/utils/walletSetup.js';

test('createMnemonicWords creates deterministic words from provided entropy', () => {
  const words = createMnemonicWords(12, Uint8Array.from([57, 70, 17, 44, 84, 77, 35, 87, 88, 67, 72, 86]));
  const middleWords = createMnemonicWords(18, Uint8Array.from([57, 70, 17, 44, 84, 77, 35, 87, 88, 67, 72, 86, 12, 14, 16, 18, 20, 22]));

  assert.deepEqual(words, ['orbit', 'shield', 'copper', 'ladder', 'velvet', 'ticket', 'garden', 'fossil', 'marble', 'river', 'silent', 'canyon']);
  assert.equal(middleWords.length, 18);
  assert.equal(validateMnemonicWords(middleWords), '');
});

test('validateMnemonicWords rejects unsafe mnemonic boundaries', () => {
  assert.equal(validateMnemonicWords(['orbit']), '助记词必须是 12、18 或 24 个单词');
  assert.equal(validateMnemonicWords(['orbit', '<script>']), '助记词必须是 12、18 或 24 个单词');
  assert.throws(() => createMnemonicWords(15), /助记词长度必须是 12、18 或 24/);
});

test('parseMnemonicText accepts pasted import text without generating words', () => {
  const words = parseMnemonicText(` Orbit shield
copper, ladder，velvet、ticket garden fossil marble river silent canyon `);

  assert.deepEqual(words, ['orbit', 'shield', 'copper', 'ladder', 'velvet', 'ticket', 'garden', 'fossil', 'marble', 'river', 'silent', 'canyon']);
  assert.equal(validateMnemonicWords(words), '');
});

test('verifyMnemonicWord requires the exact requested backup word', () => {
  const words = createMnemonicWords(12, Uint8Array.from([57, 70, 17, 44, 84, 77, 35, 87, 88, 67, 72, 86]));

  assert.equal(verifyMnemonicWord(words, 3, 'copper'), true);
  assert.equal(verifyMnemonicWord(words, 3, ' COPPER '), true);
  assert.equal(verifyMnemonicWord(words, 3, 'shield'), false);
  assert.equal(verifyMnemonicWord(words, 9, 'marble'), true);
  assert.equal(verifyMnemonicWord(words, 9, ''), false);
  assert.throws(() => verifyMnemonicWord(words, 13, 'canyon'), /助记词校验序号超出范围/);
});

test('wallet account helpers keep selection and removal explicit', () => {
  const baseAccount = createWalletAccountFromMnemonic(createMnemonicWords(12, Uint8Array.from([12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1])), 0);
  const generatedAccount = createWalletAccountFromMnemonic(createMnemonicWords(12, Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])), 1);
  const accounts = upsertWalletAccount([baseAccount], generatedAccount);

  assert.deepEqual(INITIAL_WALLET_ACCOUNTS, []);
  assert.equal(accounts.length, 2);
  assert.equal(selectWalletAccount(accounts, generatedAccount.address), generatedAccount.address);

  const removed = removeWalletAccount(accounts, generatedAccount.address, generatedAccount.address);
  assert.equal(removed.accounts.length, 1);
  assert.equal(removed.currentAddress, baseAccount.address);
});

test('wallet address is stable when the same mnemonic is imported later', () => {
  const words = createMnemonicWords(12, Uint8Array.from([57, 70, 17, 44, 84, 77, 35, 87, 88, 67, 72, 86]));
  const firstAccount = createWalletAccountFromMnemonic(words, 0);
  const importedAgain = createWalletAccountFromMnemonic(words, 3);

  assert.equal(importedAgain.address, firstAccount.address);
  assert.equal(importedAgain.label, 'SOL 钱包 4');
});

test('wallet account label can be customized before account creation', () => {
  const words = createMnemonicWords(12, Uint8Array.from([57, 70, 17, 44, 84, 77, 35, 87, 88, 67, 72, 86]));
  const customAccount = createWalletAccountFromMnemonic(words, 0, '  冷钱包  一号  ');

  assert.equal(getDefaultWalletAccountLabel(0), 'SOL 主钱包');
  assert.equal(getDefaultWalletAccountLabel(1), 'SOL 钱包 2');
  assert.equal(sanitizeWalletAccountLabelInput('主\n钱包\u0000一号'), '主钱包一号');
  assert.equal(normalizeWalletAccountLabel('  冷钱包  一号  '), '冷钱包 一号');
  assert.equal(customAccount.label, '冷钱包 一号');
  assert.throws(() => normalizeWalletAccountLabel('  \n  '), /钱包名称不能为空/);
});

test('wallet account helpers reject invalid addresses and last-account removal', () => {
  const baseAccount = createWalletAccountFromMnemonic(createMnemonicWords(12, Uint8Array.from([12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1])), 0);

  assert.equal(isSystemAddress(baseAccount.address), true);
  assert.equal(baseAccount.address.startsWith('T'), true);
  assert.equal(baseAccount.address.length >= SYSTEM_ADDRESS_MIN_LENGTH, true);
  assert.equal(baseAccount.address.length <= SYSTEM_ADDRESS_MAX_LENGTH, true);
  assert.match(formatShortAddress(baseAccount.address), /^T.{7}\.\.\..{7}$/);
  assert.throws(() => selectWalletAccount([], 'bad-address'), /钱包地址格式无效/);
  assert.throws(() => selectWalletAccount([], baseAccount.address.replace(/^T/, 't')), /钱包地址格式无效/);
  assert.throws(() => selectWalletAccount([], baseAccount.address.replace(/^T/, '3')), /钱包地址格式无效/);
  assert.throws(
    () => removeWalletAccount([baseAccount], baseAccount.address, baseAccount.address),
    /至少保留一个本地账户/
  );
});
