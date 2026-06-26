import { assertSystemAddress, createDeterministicSystemAddress } from './addressSpec.js';

const SUPPORTED_MNEMONIC_WORD_COUNTS = new Set([12, 18, 24]);
const MAX_WALLET_ACCOUNT_LABEL_LENGTH = 24;

const WORDS = Object.freeze([
  'able', 'acid', 'agent', 'anchor', 'april', 'asset', 'balance', 'beacon',
  'binary', 'bridge', 'budget', 'canvas', 'carbon', 'castle', 'circle', 'client',
  'coffee', 'copper', 'credit', 'delta', 'device', 'digital', 'domain', 'dragon',
  'early', 'earth', 'echo', 'energy', 'engine', 'fabric', 'factor', 'filter',
  'forest', 'future', 'galaxy', 'garden', 'global', 'golden', 'harbor', 'honest',
  'index', 'island', 'jungle', 'kernel', 'ladder', 'ledger', 'limit', 'local',
  'market', 'matrix', 'member', 'memory', 'mobile', 'native', 'network', 'number',
  'object', 'orbit', 'orange', 'packet', 'planet', 'policy', 'public', 'quantum',
  'random', 'record', 'region', 'river', 'rocket', 'secure', 'shield', 'signal',
  'silent', 'silver', 'simple', 'stable', 'system', 'ticket', 'token', 'travel',
  'trust', 'update', 'valid', 'vector', 'velvet', 'wallet', 'canyon', 'fossil',
  'marble'
]);

export const INITIAL_MNEMONIC_WORDS = Object.freeze([]);

export const INITIAL_WALLET_ACCOUNTS = Object.freeze([]);

export function getDefaultWalletAccountLabel(accountIndex) {
  assertNonNegativeInteger(accountIndex, 'accountIndex');

  return accountIndex === 0 ? 'SOL 主钱包' : `SOL 钱包 ${accountIndex + 1}`;
}

export function createMnemonicWords(wordCount = 12, randomBytes) {
  assertSupportedWordCount(wordCount);

  const entropyBytes = randomBytes ?? createSecureRandomBytes(wordCount);
  if (!(entropyBytes instanceof Uint8Array) || entropyBytes.length < wordCount) {
    throw new TypeError('randomBytes 必须是长度充足的 Uint8Array');
  }

  return Array.from(entropyBytes.slice(0, wordCount), (byteValue) => WORDS[byteValue % WORDS.length]);
}

export function validateMnemonicWords(words) {
  if (!Array.isArray(words)) {
    return '助记词必须是数组';
  }

  if (!SUPPORTED_MNEMONIC_WORD_COUNTS.has(words.length)) {
    return '助记词必须是 12、18 或 24 个单词';
  }

  if (words.some((word) => typeof word !== 'string' || !/^[a-z]+$/.test(word))) {
    return '助记词只能包含小写英文单词';
  }

  return '';
}

export function parseMnemonicText(text) {
  if (typeof text !== 'string') {
    throw new TypeError('助记词文本必须是字符串');
  }

  return text
    .trim()
    .toLowerCase()
    .split(/[\s,，、]+/)
    .filter(Boolean);
}

export function verifyMnemonicWord(words, wordNumber, answer) {
  const validationMessage = validateMnemonicWords(words);
  if (validationMessage) {
    throw new Error(`无法校验助记词: ${validationMessage}`);
  }

  assertPositiveInteger(wordNumber, 'wordNumber');

  if (wordNumber > words.length) {
    throw new RangeError('助记词校验序号超出范围');
  }

  if (typeof answer !== 'string') {
    throw new TypeError('助记词答案必须是字符串');
  }

  const normalizedAnswer = answer.trim().toLowerCase();
  if (!/^[a-z]+$/.test(normalizedAnswer)) {
    return false;
  }

  return normalizedAnswer === words[wordNumber - 1];
}

export function formatShortAddress(address, prefixLength = 8, suffixLength = 7) {
  assertSafeAddress(address);
  assertPositiveInteger(prefixLength, 'prefixLength');
  assertPositiveInteger(suffixLength, 'suffixLength');

  if (address.length <= prefixLength + suffixLength + 3) {
    return address;
  }

  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}

export function sanitizeWalletAccountLabelInput(label) {
  if (typeof label !== 'string') {
    return '';
  }

  return label.replace(/[\u0000-\u001F\u007F]/g, '').slice(0, MAX_WALLET_ACCOUNT_LABEL_LENGTH);
}

export function normalizeWalletAccountLabel(label) {
  if (typeof label !== 'string') {
    throw new TypeError('钱包名称必须是字符串');
  }

  const normalizedLabel = sanitizeWalletAccountLabelInput(label).trim().replace(/\s+/g, ' ');
  if (normalizedLabel.length === 0) {
    throw new Error('钱包名称不能为空');
  }

  return normalizedLabel;
}

export function createWalletAccountFromMnemonic(words, accountIndex, label = getDefaultWalletAccountLabel(accountIndex)) {
  const validationMessage = validateMnemonicWords(words);
  if (validationMessage) {
    throw new Error(`无法创建钱包账户: ${validationMessage}`);
  }

  assertNonNegativeInteger(accountIndex, 'accountIndex');

  const sourceText = words.join(' ');
  const address = createDeterministicSystemAddress(sourceText, 'transparent');
  const accountLabel = normalizeWalletAccountLabel(label);

  return {
    address,
    label: accountLabel,
    status: accountIndex === 0 ? '当前账户' : '已备份',
    tone: 'main'
  };
}

export function upsertWalletAccount(accounts, nextAccount) {
  assertWalletAccounts(accounts);
  assertWalletAccount(nextAccount);

  const existingIndex = accounts.findIndex((account) => account.address === nextAccount.address);
  if (existingIndex < 0) {
    return [...accounts, nextAccount];
  }

  return accounts.map((account, index) => (index === existingIndex ? nextAccount : account));
}

export function selectWalletAccount(accounts, selectedAddress) {
  assertWalletAccounts(accounts);
  assertSafeAddress(selectedAddress);

  const hasAccount = accounts.some((account) => account.address === selectedAddress);
  if (!hasAccount) {
    throw new Error('无法切换钱包: 目标账户不存在');
  }

  return selectedAddress;
}

export function removeWalletAccount(accounts, removedAddress, currentAddress) {
  assertWalletAccounts(accounts);
  assertSafeAddress(removedAddress);
  assertSafeAddress(currentAddress);

  if (accounts.length <= 1) {
    throw new Error('无法移除钱包: 至少保留一个本地账户');
  }

  const removedIndex = accounts.findIndex((account) => account.address === removedAddress);
  if (removedIndex < 0) {
    throw new Error('无法移除钱包: 目标账户不存在');
  }

  const nextAccounts = accounts.filter((account) => account.address !== removedAddress);
  const nextCurrentAddress = currentAddress === removedAddress ? nextAccounts[0].address : currentAddress;

  return {
    accounts: nextAccounts,
    currentAddress: nextCurrentAddress
  };
}

function createSecureRandomBytes(length) {
  const randomBytes = new Uint8Array(length);
  const cryptoSource = globalThis.crypto;

  if (!cryptoSource?.getRandomValues) {
    throw new Error('当前运行环境不支持安全随机数');
  }

  cryptoSource.getRandomValues(randomBytes);
  return randomBytes;
}

function assertSupportedWordCount(wordCount) {
  if (!SUPPORTED_MNEMONIC_WORD_COUNTS.has(wordCount)) {
    throw new RangeError('助记词长度必须是 12、18 或 24');
  }
}

function assertPositiveInteger(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${fieldName} 必须是正整数`);
  }
}

function assertNonNegativeInteger(value, fieldName) {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${fieldName} 必须是非负整数`);
  }
}

function assertSafeAddress(address) {
  assertSystemAddress(address, '钱包地址');
}

function assertWalletAccount(account) {
  if (account === null || typeof account !== 'object') {
    throw new TypeError('钱包账户必须是对象');
  }

  assertSafeAddress(account.address);

  if (typeof account.label !== 'string' || account.label.trim().length === 0) {
    throw new Error('钱包账户名称不能为空');
  }
}

function assertWalletAccounts(accounts) {
  if (!Array.isArray(accounts)) {
    throw new TypeError('钱包账户列表必须是数组');
  }

  for (const account of accounts) {
    assertWalletAccount(account);
  }
}
