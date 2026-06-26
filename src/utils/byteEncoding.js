import { utf8ToBytes } from '@noble/hashes/utils.js';

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64_LOOKUP = buildBase64Lookup();
const UINT64_MAX = BigInt('18446744073709551615');

export { UINT64_MAX };

export function bytesFromBase64(value) {
  const normalizedValue = String(value).replace(/\s/g, '');
  if (normalizedValue.length === 0 || normalizedValue.length % 4 !== 0) {
    throw new Error('base64 数据长度非法');
  }
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalizedValue)) {
    throw new Error('base64 数据包含非法字符');
  }

  const paddingLength = normalizedValue.endsWith('==') ? 2 : normalizedValue.endsWith('=') ? 1 : 0;
  const outputLength = normalizedValue.length / 4 * 3 - paddingLength;
  const output = new Uint8Array(outputLength);
  let outputOffset = 0;

  for (let index = 0; index < normalizedValue.length; index += 4) {
    const first = decodeBase64Char(normalizedValue[index], 'base64 第 1 字节');
    const second = decodeBase64Char(normalizedValue[index + 1], 'base64 第 2 字节');
    const third = normalizedValue[index + 2] === '=' ? 0 : decodeBase64Char(normalizedValue[index + 2], 'base64 第 3 字节');
    const fourth = normalizedValue[index + 3] === '=' ? 0 : decodeBase64Char(normalizedValue[index + 3], 'base64 第 4 字节');
    const triple = (first << 18) | (second << 12) | (third << 6) | fourth;

    if (outputOffset < outputLength) {
      output[outputOffset] = (triple >>> 16) & 0xff;
      outputOffset += 1;
    }
    if (outputOffset < outputLength) {
      output[outputOffset] = (triple >>> 8) & 0xff;
      outputOffset += 1;
    }
    if (outputOffset < outputLength) {
      output[outputOffset] = triple & 0xff;
      outputOffset += 1;
    }
  }

  return output;
}

export function base64FromBytes(bytes) {
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1] ?? 0;
    const third = bytes[index + 2] ?? 0;
    const triple = (first << 16) | (second << 8) | third;
    output += BASE64_ALPHABET[(triple >>> 18) & 0x3f];
    output += BASE64_ALPHABET[(triple >>> 12) & 0x3f];
    output += index + 1 < bytes.length ? BASE64_ALPHABET[(triple >>> 6) & 0x3f] : '=';
    output += index + 2 < bytes.length ? BASE64_ALPHABET[triple & 0x3f] : '=';
  }
  return output;
}

export function concatBytes(chunks) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

export function encodeBytes(value) {
  return concatBytes([encodeUint32LE(value.length), value]);
}

export function encodeString(value) {
  return encodeBytes(utf8ToBytes(value));
}

export function encodeUint16LE(value) {
  if (!Number.isInteger(value) || value < 0 || value > 0xffff) {
    throw new Error('uint16 数值越界');
  }
  return Uint8Array.from([value & 0xff, (value >>> 8) & 0xff]);
}

export function encodeUint32LE(value) {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
    throw new Error('uint32 数值越界');
  }
  return Uint8Array.from([
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff
  ]);
}

export function encodeUint64LE(value) {
  validateUint64(value, 'uint64');
  const encoded = new Uint8Array(8);
  let remaining = value;
  for (let index = 0; index < encoded.length; index += 1) {
    encoded[index] = Number(remaining & 0xffn);
    remaining >>= 8n;
  }
  return encoded;
}

export function validateUint64(value, fieldName) {
  if (typeof value !== 'bigint' || value < 0n || value > UINT64_MAX) {
    throw new Error(`${fieldName} 超出 uint64 范围`);
  }
}

export function checkedAddUint64(left, right, fieldName) {
  const value = left + right;
  validateUint64(value, fieldName);
  return value;
}

export function encodeShortVecLength(length) {
  if (!Number.isInteger(length) || length < 0) {
    throw new Error('short_vec 长度非法');
  }

  const bytes = [];
  let remaining = length;
  for (;;) {
    let current = remaining & 0x7f;
    remaining >>= 7;
    if (remaining === 0) {
      bytes.push(current);
      return Uint8Array.from(bytes);
    }
    current |= 0x80;
    bytes.push(current);
  }
}

function buildBase64Lookup() {
  const lookup = {};
  for (let index = 0; index < BASE64_ALPHABET.length; index += 1) {
    const char = BASE64_ALPHABET[index];
    lookup[char] = index;
  }
  return lookup;
}

function decodeBase64Char(value, fieldName) {
  if (value === undefined || BASE64_LOOKUP[value] === undefined) {
    throw new Error(`${fieldName} 非法`);
  }
  return BASE64_LOOKUP[value];
}
