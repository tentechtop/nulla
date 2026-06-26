import { isSystemAddress } from '../utils/addressSpec.js';

const MAX_SCANNED_SEND_PAYLOAD_LENGTH = 512;
const ADDRESS_FIELD_NAMES = ['address', 'to', 'recipient', 'receiver', 'account'];
const AMOUNT_FIELD_NAMES = ['lamports', 'amount', 'value'];

export { MAX_SCANNED_SEND_PAYLOAD_LENGTH };

export function sanitizeScannedSendPayload(payload) {
  if (typeof payload !== 'string') {
    return '';
  }

  return payload.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, MAX_SCANNED_SEND_PAYLOAD_LENGTH);
}

export function parseScannedSendPayload(payload) {
  const sanitizedPayload = sanitizeScannedSendPayload(payload);
  if (sanitizedPayload.length === 0) {
    return null;
  }

  const jsonDraft = parseJsonSendPayload(sanitizedPayload);
  if (jsonDraft !== null) {
    return withSourcePayload(jsonDraft, sanitizedPayload);
  }

  const uriDraft = parseUriSendPayload(sanitizedPayload);
  if (uriDraft !== null) {
    return withSourcePayload(uriDraft, sanitizedPayload);
  }

  if (isSystemAddress(sanitizedPayload)) {
    return withSourcePayload({ address: sanitizedPayload, amount: '' }, sanitizedPayload);
  }

  return null;
}

function parseJsonSendPayload(payload) {
  if (!payload.startsWith('{')) {
    return null;
  }

  let decoded;
  try {
    decoded = JSON.parse(payload);
  } catch {
    return null;
  }

  if (decoded === null || typeof decoded !== 'object' || Array.isArray(decoded)) {
    return null;
  }

  const address = readFirstStringField(decoded, ADDRESS_FIELD_NAMES);
  if (!isSupportedAddress(address)) {
    return null;
  }

  const amountField = readFirstAmountField(decoded);
  return {
    address,
    amount: amountField === null ? '' : normalizeAmountValue(amountField.value, amountField.fieldName)
  };
}

function parseUriSendPayload(payload) {
  let workingPayload = payload;
  const schemeMatch = /^([a-z][a-z0-9+.-]*):/i.exec(workingPayload);
  if (schemeMatch !== null) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme !== 'sol' && scheme !== 'solana' && scheme !== 'transfer') {
      return null;
    }
    workingPayload = workingPayload.slice(schemeMatch[0].length).replace(/^\/+/, '');
  }

  const [body, query = ''] = splitOnce(workingPayload, '?');
  const queryParams = parseQueryParams(query.length > 0 ? query : body.includes('=') ? body : '');
  const addressFromQuery = readFirstParam(queryParams, ADDRESS_FIELD_NAMES);
  const amountField = readFirstAmountParam(queryParams);
  const bodyParts = splitBodyAddressAndAmount(body.includes('=') ? '' : body);
  const address = addressFromQuery || bodyParts.address;

  if (!isSupportedAddress(address)) {
    return null;
  }

  return {
    address,
    amount: amountField === null ? bodyParts.amount : normalizeAmountValue(amountField.value, amountField.fieldName)
  };
}

function withSourcePayload(draft, sourcePayload) {
  return {
    address: draft.address,
    amount: draft.amount,
    sourcePayload
  };
}

function splitOnce(value, delimiter) {
  const delimiterIndex = value.indexOf(delimiter);
  if (delimiterIndex < 0) {
    return [value, ''];
  }

  return [value.slice(0, delimiterIndex), value.slice(delimiterIndex + delimiter.length)];
}

function splitBodyAddressAndAmount(body) {
  const trimmedBody = body.trim();
  if (trimmedBody.length === 0) {
    return { address: '', amount: '' };
  }

  for (const delimiter of [':', '|', ',', ';']) {
    const delimiterIndex = trimmedBody.indexOf(delimiter);
    if (delimiterIndex > 0) {
      return {
        address: trimmedBody.slice(0, delimiterIndex).trim(),
        amount: normalizeAmountValue(trimmedBody.slice(delimiterIndex + 1), 'lamports')
      };
    }
  }

  return { address: trimmedBody, amount: '' };
}

function parseQueryParams(query) {
  const params = new Map();
  if (query.length === 0) {
    return params;
  }

  for (const pair of query.split('&')) {
    const [rawKey, rawValue = ''] = splitOnce(pair, '=');
    const key = safeDecode(rawKey).trim().toLowerCase();
    if (key.length === 0) {
      continue;
    }
    params.set(key, safeDecode(rawValue).trim());
  }

  return params;
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
}

function readFirstStringField(source, fieldNames) {
  for (const fieldName of fieldNames) {
    const value = source[fieldName];
    if (typeof value === 'string') {
      return value.trim();
    }
  }

  return '';
}

function readFirstAmountField(source) {
  for (const fieldName of AMOUNT_FIELD_NAMES) {
    const value = source[fieldName];
    if (typeof value === 'string' || typeof value === 'number') {
      return { fieldName, value: String(value) };
    }
  }

  return null;
}

function readFirstParam(params, fieldNames) {
  for (const fieldName of fieldNames) {
    const value = params.get(fieldName);
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return '';
}

function readFirstAmountParam(params) {
  for (const fieldName of AMOUNT_FIELD_NAMES) {
    const value = params.get(fieldName);
    if (typeof value === 'string' && value.trim().length > 0) {
      return { fieldName, value };
    }
  }

  return null;
}

function isSupportedAddress(address) {
  return typeof address === 'string' && isSystemAddress(address.trim());
}

function normalizeAmountValue(value, fieldName) {
  const normalizedValue = String(value).trim();
  if (normalizedValue.length === 0) {
    return '';
  }

  if (fieldName === 'lamports') {
    return normalizedValue.replace(/[^\d]/g, '').slice(0, 18);
  }

  if (/^\d+(\.\d{1,9})?$/.test(normalizedValue)) {
    const [whole, fraction = ''] = normalizedValue.split('.');
    const lamports = `${whole}${fraction.padEnd(9, '0')}`.replace(/^0+(?=\d)/, '');
    return lamports.slice(0, 18);
  }

  return normalizedValue.replace(/[^\d]/g, '').slice(0, 18);
}
