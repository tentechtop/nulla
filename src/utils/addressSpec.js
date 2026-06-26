import bs58 from 'bs58';
import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';
import nacl from 'tweetnacl';

const SYSTEM_ADDRESS_BODY_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const RAW_PUBLIC_KEY_BYTES = 32;
const TRANSPARENT_ADDRESS_PREFIX = 'T';
const SHIELDED_ADDRESS_PREFIX = 'Z';
const SYSTEM_ADDRESS_MIN_LENGTH = 33;
const SYSTEM_ADDRESS_MAX_LENGTH = 64;

export {
  RAW_PUBLIC_KEY_BYTES,
  SHIELDED_ADDRESS_PREFIX,
  SYSTEM_ADDRESS_BODY_ALPHABET,
  SYSTEM_ADDRESS_MAX_LENGTH,
  SYSTEM_ADDRESS_MIN_LENGTH,
  TRANSPARENT_ADDRESS_PREFIX
};

export const SYSTEM_ADDRESS_BODY_LENGTH = 44;
export const SYSTEM_ADDRESS_TOTAL_LENGTH = SYSTEM_ADDRESS_MAX_LENGTH;

export function isSystemAddress(value) {
  if (typeof value !== 'string') {
    return false;
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length < SYSTEM_ADDRESS_MIN_LENGTH || trimmedValue.length > SYSTEM_ADDRESS_MAX_LENGTH) {
    return false;
  }

  const prefix = trimmedValue[0];
  if (prefix !== TRANSPARENT_ADDRESS_PREFIX && prefix !== SHIELDED_ADDRESS_PREFIX) {
    return false;
  }

  const body = trimmedValue.slice(1);
  if (!isBase58Text(body)) {
    return false;
  }

  try {
    return bs58.decode(body).length === RAW_PUBLIC_KEY_BYTES;
  } catch {
    return false;
  }
}

export function assertSystemAddress(value, fieldName = '钱包地址') {
  if (!isSystemAddress(value)) {
    throw new Error(`${fieldName}格式无效`);
  }
}

export function getSystemAddressKind(address) {
  assertSystemAddress(address);
  return address.trim()[0] === TRANSPARENT_ADDRESS_PREFIX ? 'transparent' : 'shielded';
}

export function stripSystemAddressPrefix(address, fieldName = '钱包地址') {
  assertSystemAddress(address, fieldName);
  return address.trim().slice(1);
}

export function createDeterministicSystemAddress(sourceText, addressKind = 'transparent') {
  const rawPublicKey = deriveRawPublicKeyFromSeed(sourceText);
  const prefix = getAddressPrefix(addressKind);
  return `${prefix}${rawPublicKey}`;
}

export function deriveRawPublicKeyFromSeed(sourceText) {
  const normalizedSourceText = normalizeSeedText(sourceText, '地址种子');
  const seedHash = sha256(utf8ToBytes(normalizedSourceText));
  const keyPair = nacl.sign.keyPair.fromSeed(seedHash);
  return bs58.encode(keyPair.publicKey);
}

export function deriveSigningKeyPairFromSeed(sourceText) {
  const normalizedSourceText = normalizeSeedText(sourceText, '钱包 seed');
  const seedHash = sha256(utf8ToBytes(normalizedSourceText));
  return nacl.sign.keyPair.fromSeed(seedHash);
}

export function normalizeRawOrSystemAddress(value, fieldName = '地址') {
  if (isSystemAddress(value)) {
    return stripSystemAddressPrefix(value, fieldName);
  }

  if (typeof value !== 'string') {
    throw new Error(`${fieldName}格式无效`);
  }

  const trimmedValue = value.trim();
  if (!isBase58Text(trimmedValue)) {
    throw new Error(`${fieldName}格式无效`);
  }

  try {
    const decodedValue = bs58.decode(trimmedValue);
    if (decodedValue.length === RAW_PUBLIC_KEY_BYTES) {
      return bs58.encode(decodedValue);
    }
  } catch {
    throw new Error(`${fieldName}格式无效`);
  }

  throw new Error(`${fieldName}格式无效`);
}

function getAddressPrefix(addressKind) {
  if (addressKind === 'transparent') {
    return TRANSPARENT_ADDRESS_PREFIX;
  }

  if (addressKind === 'shielded') {
    return SHIELDED_ADDRESS_PREFIX;
  }

  throw new RangeError('地址类型只支持 transparent 或 shielded');
}

function normalizeSeedText(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new TypeError(`${fieldName}必须是非空字符串`);
  }

  return value.trim();
}

function isBase58Text(value) {
  if (value.length === 0) {
    return false;
  }

  for (let index = 0; index < value.length; index += 1) {
    if (!SYSTEM_ADDRESS_BODY_ALPHABET.includes(value[index])) {
      return false;
    }
  }
  return true;
}
