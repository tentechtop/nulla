import assert from 'node:assert/strict';
import test from 'node:test';
import { createMnemonicWords, createWalletAccountFromMnemonic } from '../src/utils/walletSetup.js';
import {
  deserializePersistedWalletState,
  loadPersistedWalletStateWithSecureStore,
  normalizePersistedWalletState,
  savePersistedWalletStateWithSecureStore,
  serializePersistedWalletState
} from '../src/utils/walletPersistence.js';

function testAccount(seedOffset, accountIndex) {
  const bytes = Uint8Array.from(Array.from({ length: 12 }, (_, index) => seedOffset + index));
  return createWalletAccountFromMnemonic(createMnemonicWords(12, bytes), accountIndex);
}

function testMnemonic(seedOffset) {
  const bytes = Uint8Array.from(Array.from({ length: 12 }, (_, index) => seedOffset + index));
  return createMnemonicWords(12, bytes);
}

test('wallet persistence restores accounts and selected address', () => {
  const firstAccount = testAccount(1, 0);
  const secondAccount = testAccount(21, 1);
  const state = normalizePersistedWalletState({
    accounts: [firstAccount, secondAccount],
    currentAddress: secondAccount.address
  });

  assert.equal(state.accounts.length, 2);
  assert.equal(state.currentAddress, secondAccount.address);
  assert.equal(state.rpcMode, 'public');
  assert.equal(state.customRpcEndpoint, '');
});

test('wallet persistence rejects malformed accounts and repairs selection', () => {
  const validAccount = testAccount(41, 0);
  const legacyAccount = { ...validAccount, address: validAccount.address.replace(/^T/, '3') };
  const state = normalizePersistedWalletState({
    accounts: [
      { address: 'bad-address', label: '<script>', status: 'bad', tone: 'main' },
      legacyAccount,
      { ...validAccount, label: `${validAccount.label}\u0000`, tone: 'unknown' }
    ],
    currentAddress: 'missing-address'
  });

  assert.equal(state.accounts.length, 1);
  assert.equal(state.accounts[0].address, validAccount.address);
  assert.equal(state.accounts[0].tone, 'main');
  assert.equal(state.currentAddress, validAccount.address);
});

test('wallet persistence never serializes mnemonic words', () => {
  const account = testAccount(61, 0);
  const serialized = serializePersistedWalletState({
    accounts: [account],
    customRpcEndpoint: 'http://192.168.121.225:9110/',
    currentAddress: account.address,
    mnemonicWords: ['orbit', 'shield', 'copper'],
    rpcMode: 'local'
  });

  assert.doesNotMatch(serialized, /mnemonic|orbit|shield|copper/);
  assert.deepEqual(deserializePersistedWalletState(serialized).accounts, [account]);
  assert.equal(deserializePersistedWalletState(serialized).rpcMode, 'local');
});

test('wallet persistence restores selected rpc mode and custom endpoint', () => {
  const account = testAccount(71, 0);
  const state = normalizePersistedWalletState({
    accounts: [account],
    customRpcEndpoint: 'http://192.168.121.225:9110',
    currentAddress: account.address,
    rpcMode: 'custom'
  });

  assert.equal(state.rpcMode, 'custom');
  assert.equal(state.customRpcEndpoint, 'http://192.168.121.225:9110/');
});

test('wallet persistence migrates retired public rpc endpoint', () => {
  const account = testAccount(75, 0);
  const state = normalizePersistedWalletState({
    accounts: [account],
    customRpcEndpoint: 'http://101.35.87.31:8899',
    currentAddress: account.address,
    rpcMode: 'custom'
  });

  assert.equal(state.rpcMode, 'public');
  assert.equal(state.customRpcEndpoint, '');
});

test('wallet persistence restores signing seed for matching local account', () => {
  const mnemonicWords = testMnemonic(91);
  const signingSeed = mnemonicWords.join(' ');
  const account = createWalletAccountFromMnemonic(mnemonicWords, 0);
  const state = normalizePersistedWalletState({
    accounts: [account],
    currentAddress: account.address,
    signingSeeds: [{ address: account.address, signingSeed }]
  });

  assert.deepEqual(state.signingSeeds, [{ address: account.address, signingSeed }]);
  assert.equal(state.currentAddress, account.address);
});

test('wallet metadata serialization keeps signing seed out of plain json', () => {
  const mnemonicWords = testMnemonic(101);
  const signingSeed = mnemonicWords.join(' ');
  const account = createWalletAccountFromMnemonic(mnemonicWords, 0);
  const serialized = serializePersistedWalletState({
    accounts: [account],
    currentAddress: account.address,
    customRpcEndpoint: '',
    rpcMode: 'public',
    signingSeeds: [{ address: account.address, signingSeed }]
  });

  assert.doesNotMatch(serialized, new RegExp(mnemonicWords[0]));
  assert.doesNotMatch(serialized, /signingSeed|signingSeeds/);
  assert.deepEqual(deserializePersistedWalletState(serialized).signingSeeds, []);
});

test('wallet persistence rejects signing seeds that do not derive the account address', () => {
  const account = testAccount(111, 0);
  const mismatchedSeed = testMnemonic(131).join(' ');
  const state = normalizePersistedWalletState({
    accounts: [account],
    currentAddress: account.address,
    signingSeeds: [
      { address: account.address, signingSeed: mismatchedSeed },
      { address: account.address, signingSeed: 'bad words' },
      { address: 'bad-address', signingSeed: testMnemonic(111).join(' ') }
    ]
  });

  assert.deepEqual(state.signingSeeds, []);
});

test('wallet persistence read and write use injectable storage', async () => {
  const account = testAccount(81, 0);
  let savedText = '';
  let savedSecureText = '';

  await savePersistedWalletStateWithSecureStore(
    { accounts: [account], currentAddress: account.address, customRpcEndpoint: '', rpcMode: 'public', signingSeeds: [] },
    async (text) => {
      savedText = text;
    },
    async (text) => {
      savedSecureText = text;
    }
  );

  const loadedState = await loadPersistedWalletStateWithSecureStore(async () => savedText, async () => savedSecureText);
  assert.equal(loadedState.currentAddress, account.address);
  assert.deepEqual(loadedState.accounts, [account]);
});
