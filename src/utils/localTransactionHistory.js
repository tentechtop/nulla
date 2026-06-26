import { normalizeRawOrSystemAddress } from './addressSpec.js';

const LOCAL_TRANSACTION_HISTORY_KEY = 'nulla.transactionHistory.local.v1';
const LOCAL_TRANSACTION_HISTORY_FILE = 'nulla-transaction-history-v1.json';
const MAX_LOCAL_TRANSACTION_RECORDS = 120;
const MAX_SAFE_TEXT_LENGTH = 160;
const BASE58_PATTERN = /^[1-9A-HJ-NP-Za-km-z]+$/;
const VALID_KINDS = new Set([
  'transfer',
  'privacy_deposit',
  'privacy_withdraw',
  'validator_register',
  'validator_commission',
  'stake_deposit',
  'stake_withdraw',
  'slash'
]);
const VALID_DIRECTIONS = new Set(['incoming', 'outgoing']);
const VALID_LOCATIONS = new Set(['block', 'mempool', 'unknown']);
const VALID_STATUSES = new Set(['confirmed', 'finalized', 'pending']);

let localHistoryWriteQueue = Promise.resolve();

export function normalizeLocalTransactionHistory(value) {
  if (value === null || typeof value !== 'object') {
    return [];
  }

  const rawRecords = Array.isArray(value.records) ? value.records : [];
  return rawRecords
    .map(normalizeLocalTransactionItem)
    .filter(Boolean)
    .slice(0, MAX_LOCAL_TRANSACTION_RECORDS);
}

export async function loadLocalTransactionRecords(ownerAddress, readText = readLocalTransactionHistoryText) {
  const normalizedOwnerAddress = normalizeRawOrSystemAddress(ownerAddress, '交易历史钱包地址');
  const text = await readText();
  const history = deserializeLocalTransactionHistory(text ?? '');
  return history
    .filter((item) => item.owner_address === normalizedOwnerAddress)
    .map((item) => item.record);
}

export async function saveLocalTransactionRecord(input, readText = readLocalTransactionHistoryText, writeText = writeLocalTransactionHistoryText) {
  const saveOperation = async () => {
    const nextRecord = createLocalTransactionItem(input);
    const text = await readText();
    const existingRecords = deserializeLocalTransactionHistory(text ?? '');
    const nextRecords = [
      nextRecord,
      ...existingRecords.filter((item) => item.owner_address !== nextRecord.owner_address || item.record.signature !== nextRecord.record.signature)
    ].slice(0, MAX_LOCAL_TRANSACTION_RECORDS);

    await writeText(serializeLocalTransactionHistory(nextRecords));
    return nextRecord.record;
  };

  const queuedSave = localHistoryWriteQueue.then(saveOperation, saveOperation);
  localHistoryWriteQueue = queuedSave.then(() => undefined, () => undefined);
  return queuedSave;
}

export function mergeLocalTransactionRecords(history, localRecords) {
  const recordMap = new Map();

  for (const record of history.records ?? []) {
    recordMap.set(record.signature, record);
  }

  for (const record of localRecords) {
    if (!recordMap.has(record.signature)) {
      recordMap.set(record.signature, record);
    }
  }

  return {
    ...history,
    records: Array.from(recordMap.values()).sort(compareTransactionRecords),
    scope: history.scope.includes('local') ? history.scope : `${history.scope}+local_submitted`
  };
}

function deserializeLocalTransactionHistory(text) {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return [];
  }

  try {
    return normalizeLocalTransactionHistory(JSON.parse(text));
  } catch {
    return [];
  }
}

function serializeLocalTransactionHistory(records) {
  return JSON.stringify({
    records,
    version: 1
  });
}

function createLocalTransactionItem(input) {
  const ownerAddress = normalizeRawOrSystemAddress(input.ownerAddress, '交易历史钱包地址');
  const counterparty = normalizeOptionalAddress(input.counterparty);
  const amountLamports = normalizeLamportsText(input.amountLamports);
  const submittedAt = normalizeTimestamp(input.submitTimeUnixMilli ?? Date.now());
  const status = normalizeEnum(input.status, VALID_STATUSES, 'pending');
  const location = normalizeEnum(input.location, VALID_LOCATIONS, status === 'pending' ? 'mempool' : 'block');
  const finalized = input.finalized === true || status === 'finalized';

  return {
    owner_address: ownerAddress,
    record: {
      amount_lamports: amountLamports,
      block_height: normalizeNonNegativeInteger(input.blockHeight),
      blockhash: safeTrimmedText(input.blockhash, MAX_SAFE_TEXT_LENGTH),
      counterparty,
      direction: normalizeEnum(input.direction, VALID_DIRECTIONS, 'outgoing'),
      finalized,
      kind: normalizeEnum(input.kind, VALID_KINDS, 'transfer'),
      location,
      signature: normalizeSignature(input.signature),
      slot: normalizeNonNegativeInteger(input.slot),
      status,
      submit_time_unix_milli: submittedAt
    }
  };
}

function normalizeLocalTransactionItem(item) {
  if (item === null || typeof item !== 'object') {
    return null;
  }

  const record = item.record;
  if (record === null || typeof record !== 'object') {
    return null;
  }

  try {
    return createLocalTransactionItem({
      amountLamports: record.amount_lamports,
      blockHeight: record.block_height,
      blockhash: record.blockhash,
      counterparty: record.counterparty,
      direction: record.direction,
      finalized: record.finalized,
      kind: record.kind,
      location: record.location,
      ownerAddress: item.owner_address,
      signature: record.signature,
      slot: record.slot,
      status: record.status,
      submitTimeUnixMilli: record.submit_time_unix_milli
    });
  } catch {
    return null;
  }
}

function compareTransactionRecords(left, right) {
  const timeDelta = normalizeTimestamp(right.submit_time_unix_milli) - normalizeTimestamp(left.submit_time_unix_milli);
  if (timeDelta !== 0) {
    return timeDelta;
  }

  const slotDelta = normalizeNonNegativeInteger(right.slot) - normalizeNonNegativeInteger(left.slot);
  if (slotDelta !== 0) {
    return slotDelta;
  }

  return normalizeNonNegativeInteger(right.block_height) - normalizeNonNegativeInteger(left.block_height);
}

function normalizeSignature(value) {
  const signature = safeTrimmedText(value, 128);
  if (signature.length < 32 || !BASE58_PATTERN.test(signature)) {
    throw new Error('交易签名格式无效');
  }
  return signature;
}

function normalizeOptionalAddress(value) {
  if (value === undefined || value === null || String(value).trim().length === 0) {
    return undefined;
  }

  return normalizeRawOrSystemAddress(value, '交易对手地址');
}

function normalizeLamportsText(value) {
  const text = typeof value === 'bigint' ? value.toString() : safeTrimmedText(value, 32);
  if (!/^[0-9]+$/.test(text)) {
    throw new Error('交易金额格式无效');
  }

  const amount = BigInt(text);
  if (amount < 0n || amount > 18446744073709551615n) {
    throw new Error('交易金额超出 uint64 范围');
  }
  return amount.toString();
}

function normalizeEnum(value, allowedValues, fallbackValue) {
  return allowedValues.has(value) ? value : fallbackValue;
}

function normalizeNonNegativeInteger(value) {
  const numberValue = Number(value ?? 0);
  if (!Number.isSafeInteger(numberValue) || numberValue < 0) {
    return 0;
  }
  return numberValue;
}

function normalizeTimestamp(value) {
  const numberValue = Number(value ?? 0);
  if (!Number.isSafeInteger(numberValue) || numberValue < 0) {
    return 0;
  }
  return numberValue;
}

function safeTrimmedText(value, maxLength) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return '';
  }

  return String(value).replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLength);
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

async function readLocalTransactionHistoryText() {
  const webStorage = getWebStorage();
  if (webStorage !== null) {
    return webStorage.getItem(LOCAL_TRANSACTION_HISTORY_KEY);
  }

  const fileSystem = await import('expo-file-system');
  const filePath = localTransactionHistoryFilePath(fileSystem);
  const fileInfo = await fileSystem.getInfoAsync(filePath);
  if (!fileInfo.exists) {
    return null;
  }

  return fileSystem.readAsStringAsync(filePath, { encoding: fileSystem.EncodingType?.UTF8 ?? 'utf8' });
}

async function writeLocalTransactionHistoryText(text) {
  const webStorage = getWebStorage();
  if (webStorage !== null) {
    webStorage.setItem(LOCAL_TRANSACTION_HISTORY_KEY, text);
    return;
  }

  const fileSystem = await import('expo-file-system');
  const filePath = localTransactionHistoryFilePath(fileSystem);
  await fileSystem.writeAsStringAsync(filePath, text, { encoding: fileSystem.EncodingType?.UTF8 ?? 'utf8' });
}

function localTransactionHistoryFilePath(fileSystem) {
  if (typeof fileSystem.documentDirectory !== 'string' || fileSystem.documentDirectory.length === 0) {
    throw new Error('交易历史本地存储目录不可用');
  }

  return `${fileSystem.documentDirectory}${LOCAL_TRANSACTION_HISTORY_FILE}`;
}
