import {
  createWalletAccountFromMnemonic,
  parseMnemonicText,
  selectWalletAccount,
  upsertWalletAccount,
  validateMnemonicWords
} from './walletSetup.js';
import { isLegacyPublicRpcEndpoint, normalizeRpcEndpoint } from './chainRpc.js';

const WALLET_STORAGE_KEY = 'nulla.wallet.state.v1';
const WALLET_STORAGE_FILE = 'nulla-wallet-state-v1.json';
const WALLET_SIGNING_SEEDS_KEY = 'nulla.wallet.signingSeeds.v1';
const MAX_LABEL_LENGTH = 80;
const MAX_STATUS_LENGTH = 80;
const MAX_RPC_ENDPOINT_LENGTH = 160;
const MAX_SIGNING_SEED_LENGTH = 320;
const VALID_ACCOUNT_TONES = new Set(['main', 'trade', 'watch']);
const VALID_RPC_MODES = new Set(['custom', 'local', 'public']);

export const EMPTY_PERSISTED_WALLET_STATE = Object.freeze({
  accounts: Object.freeze([]),
  currentAddress: null,
  customRpcEndpoint: '',
  rpcMode: 'public',
  signingSeeds: Object.freeze([])
});

export function normalizePersistedWalletState(value) {
  if (value === null || typeof value !== 'object') {
    return EMPTY_PERSISTED_WALLET_STATE;
  }

  const accounts = Array.isArray(value.accounts)
    ? value.accounts.map(sanitizeWalletAccount).filter(Boolean)
    : [];
  const uniqueAccounts = dedupeWalletAccounts(accounts);
  const currentAddress = selectPersistedCurrentAddress(value.currentAddress, uniqueAccounts);
  const customRpcEndpoint = sanitizeCustomRpcEndpoint(value.customRpcEndpoint);
  const rpcSelection = migratePersistedRpcSelection(value.rpcMode, customRpcEndpoint);
  const signingSeeds = sanitizeWalletSigningSeeds(value.signingSeeds, uniqueAccounts);

  return {
    accounts: uniqueAccounts,
    currentAddress,
    customRpcEndpoint: rpcSelection.customRpcEndpoint,
    rpcMode: rpcSelection.rpcMode,
    signingSeeds
  };
}

export function serializePersistedWalletState(value) {
  const normalizedState = normalizePersistedWalletState(value);
  return JSON.stringify({
    accounts: normalizedState.accounts,
    currentAddress: normalizedState.currentAddress,
    customRpcEndpoint: normalizedState.customRpcEndpoint,
    rpcMode: normalizedState.rpcMode,
    version: 1
  });
}

export function deserializePersistedWalletState(text) {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return EMPTY_PERSISTED_WALLET_STATE;
  }

  try {
    return normalizePersistedWalletState(JSON.parse(text));
  } catch {
    return EMPTY_PERSISTED_WALLET_STATE;
  }
}

export async function loadPersistedWalletState(readText = readWalletStorageText) {
  return loadPersistedWalletStateWithSecureStore(readText, readWalletSecureText);
}

export async function loadPersistedWalletStateWithSecureStore(readText, readSecureText) {
  const text = await readText();
  const metadataState = deserializePersistedWalletState(text ?? '');
  const secureText = await readSecureText();
  return {
    ...metadataState,
    signingSeeds: deserializePersistedSigningSeeds(secureText ?? '', metadataState.accounts)
  };
}

export async function savePersistedWalletState(state, writeText = writeWalletStorageText) {
  return savePersistedWalletStateWithSecureStore(state, writeText, writeWalletSecureText);
}

export async function savePersistedWalletStateWithSecureStore(state, writeText, writeSecureText) {
  const normalizedState = normalizePersistedWalletState(state);
  await writeText(serializePersistedWalletState(normalizedState));
  await writeSecureText(serializePersistedSigningSeeds(normalizedState.signingSeeds));
}

function serializePersistedSigningSeeds(signingSeeds) {
  return JSON.stringify({
    signingSeeds,
    version: 1
  });
}

function deserializePersistedSigningSeeds(text, accounts) {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return [];
  }

  try {
    const value = JSON.parse(text);
    return sanitizeWalletSigningSeeds(value.signingSeeds, accounts);
  } catch {
    return [];
  }
}

function sanitizeWalletAccount(account) {
  if (account === null || typeof account !== 'object') {
    return null;
  }

  const label = safeTrimmedText(account.label, MAX_LABEL_LENGTH);
  const status = safeTrimmedText(account.status, MAX_STATUS_LENGTH);
  const tone = VALID_ACCOUNT_TONES.has(account.tone) ? account.tone : 'main';
  const candidate = {
    address: typeof account.address === 'string' ? account.address.trim() : '',
    label: label || 'SOL 钱包',
    status: status || '已备份',
    tone
  };

  try {
    return upsertWalletAccount([], candidate)[0] ?? null;
  } catch {
    return null;
  }
}

function dedupeWalletAccounts(accounts) {
  return accounts.reduce((dedupedAccounts, account) => upsertWalletAccount(dedupedAccounts, account), []);
}

function selectPersistedCurrentAddress(currentAddress, accounts) {
  if (accounts.length === 0) {
    return null;
  }

  if (typeof currentAddress !== 'string') {
    return accounts[0].address;
  }

  try {
    return selectWalletAccount(accounts, currentAddress.trim());
  } catch {
    return accounts[0].address;
  }
}

function selectPersistedRpcMode(rpcMode, customRpcEndpoint) {
  if (typeof rpcMode !== 'string' || !VALID_RPC_MODES.has(rpcMode)) {
    return 'public';
  }
  if (rpcMode === 'custom' && customRpcEndpoint.length === 0) {
    return 'public';
  }
  return rpcMode;
}

// 功能目的：迁移旧公网入口；实现原因：8899 已下线，避免本地持久化地址覆盖新的公网验证者。
function migratePersistedRpcSelection(rpcMode, customRpcEndpoint) {
  if (isLegacyPublicRpcEndpoint(customRpcEndpoint)) {
    return { customRpcEndpoint: '', rpcMode: 'public' };
  }

  return {
    customRpcEndpoint,
    rpcMode: selectPersistedRpcMode(rpcMode, customRpcEndpoint)
  };
}

function sanitizeWalletSigningSeeds(value, accounts) {
  if (!Array.isArray(value) || accounts.length === 0) {
    return [];
  }

  const accountAddresses = new Set(accounts.map((account) => account.address));
  return value.reduce((safeSeeds, item) => {
    const safeSeed = sanitizeWalletSigningSeed(item, accountAddresses);
    if (safeSeed === null || safeSeeds.some((seed) => seed.address === safeSeed.address)) {
      return safeSeeds;
    }

    return [...safeSeeds, safeSeed];
  }, []);
}

function sanitizeWalletSigningSeed(item, accountAddresses) {
  if (item === null || typeof item !== 'object') {
    return null;
  }

  const address = typeof item.address === 'string' ? item.address.trim() : '';
  if (!accountAddresses.has(address)) {
    return null;
  }

  const words = parseMnemonicText(safeTrimmedText(item.signingSeed, MAX_SIGNING_SEED_LENGTH));
  if (validateMnemonicWords(words)) {
    return null;
  }

  try {
    const accountFromSeed = createWalletAccountFromMnemonic(words, 0);
    if (accountFromSeed.address !== address) {
      return null;
    }

    return { address, signingSeed: words.join(' ') };
  } catch {
    return null;
  }
}

function sanitizeCustomRpcEndpoint(value) {
  const endpoint = safeTrimmedText(value, MAX_RPC_ENDPOINT_LENGTH);
  if (endpoint.length === 0) {
    return '';
  }
  try {
    return normalizeRpcEndpoint(endpoint, '自定义 RPC 地址');
  } catch {
    return '';
  }
}

function safeTrimmedText(value, maxLength) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLength);
}

function getWebStorage() {
  try {
    if (typeof globalThis.localStorage === 'undefined') {
      return null;
    }

    return globalThis.localStorage;
  } catch {
    return null;
  }
}

async function readWalletStorageText() {
  const webStorage = getWebStorage();
  if (webStorage !== null) {
    return webStorage.getItem(WALLET_STORAGE_KEY);
  }

  const fileSystem = await import('expo-file-system');
  const filePath = walletStorageFilePath(fileSystem);
  const fileInfo = await fileSystem.getInfoAsync(filePath);
  if (!fileInfo.exists) {
    return null;
  }

  return fileSystem.readAsStringAsync(filePath, { encoding: fileSystem.EncodingType?.UTF8 ?? 'utf8' });
}

async function writeWalletStorageText(text) {
  const webStorage = getWebStorage();
  if (webStorage !== null) {
    webStorage.setItem(WALLET_STORAGE_KEY, text);
    return;
  }

  const fileSystem = await import('expo-file-system');
  const filePath = walletStorageFilePath(fileSystem);
  await fileSystem.writeAsStringAsync(filePath, text, { encoding: fileSystem.EncodingType?.UTF8 ?? 'utf8' });
}

async function readWalletSecureText() {
  const webStorage = getWebStorage();
  if (webStorage !== null) {
    return webStorage.getItem(WALLET_SIGNING_SEEDS_KEY);
  }

  const secureStore = await import('expo-secure-store');
  return secureStore.getItemAsync(WALLET_SIGNING_SEEDS_KEY);
}

async function writeWalletSecureText(text) {
  const webStorage = getWebStorage();
  if (webStorage !== null) {
    webStorage.setItem(WALLET_SIGNING_SEEDS_KEY, text);
    return;
  }

  const secureStore = await import('expo-secure-store');
  await secureStore.setItemAsync(WALLET_SIGNING_SEEDS_KEY, text);
}

function walletStorageFilePath(fileSystem) {
  if (typeof fileSystem.documentDirectory !== 'string' || fileSystem.documentDirectory.length === 0) {
    throw new Error('钱包本地存储目录不可用');
  }

  return `${fileSystem.documentDirectory}${WALLET_STORAGE_FILE}`;
}
