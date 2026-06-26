import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import { bytesFromBase64 } from './byteEncoding.js';

const DEPLOY_REQUEST_TYPE = 'svm_deploy_request';
const DEPLOY_REQUEST_COMPAT_TYPE = 'svm_deploy';
const DEPLOY_REQUEST_TIMEOUT_MILLIS = 8000;
const MAX_DEPLOY_REQUEST_BYTES = 768 * 1024;
const MAX_URL_LENGTH = 512;

export function parseDeployRequestQRCode(value) {
  const trimmedValue = String(value ?? '').trim();
  if (trimmedValue.length === 0) {
    return null;
  }

  const parsedJson = parseJsonObject(trimmedValue);
  if (parsedJson !== null) {
    return parseQRCodeObject(parsedJson);
  }

  if (trimmedValue.startsWith('svm-deploy://')) {
    return parseQRCodeUrl(trimmedValue);
  }

  if (trimmedValue.startsWith('http://') || trimmedValue.startsWith('https://')) {
    return {
      bytecodeHash: '',
      expiresAtUnixMillis: 0,
      requestUrl: validateHttpUrl(trimmedValue, 'request url'),
      type: DEPLOY_REQUEST_TYPE,
      version: 1
    };
  }

  return null;
}

export function isDeployRequestQRCode(value) {
  try {
    return parseDeployRequestQRCode(value) !== null;
  } catch {
    return looksLikeDeployRequest(String(value ?? ''));
  }
}

export async function loadDeployRequestFromQRCode(value, fetchImpl = globalThis.fetch) {
  const qrCode = parseDeployRequestQRCode(value);
  if (qrCode === null) {
    throw new Error('二维码不是 SVM 合约部署请求');
  }

  if (typeof fetchImpl !== 'function') {
    throw new Error('当前环境不支持拉取部署请求');
  }

  const responseText = await fetchTextWithTimeout(qrCode.requestUrl, fetchImpl);
  if (responseText.length > MAX_DEPLOY_REQUEST_BYTES) {
    throw new Error('部署请求过大');
  }

  const rawRequest = parseJsonObject(responseText);
  if (rawRequest === null) {
    throw new Error('部署请求不是合法 JSON');
  }

  return normalizeDeployRequest(rawRequest, qrCode);
}

export async function postDeployRequestResult(request, result, fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('当前环境不支持回传部署结果');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEPLOY_REQUEST_TIMEOUT_MILLIS);

  try {
    const response = await fetchImpl(request.resultUrl, {
      body: JSON.stringify(toWireDeployResult(result)),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
      signal: controller.signal
    });

    if (!response?.ok) {
      throw new Error(`HTTP ${response?.status ?? 0}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeDeployRequest(rawRequest, qrCode) {
  const bytecodeBase64 = requiredString(rawRequest.bytecode_base64 ?? rawRequest.bytecodeBase64, 'bytecode');
  const bytecodeBytes = bytesFromBase64(bytecodeBase64);
  const actualHash = bytesToHex(sha256(bytecodeBytes));
  const bytecodeHash = requiredString(rawRequest.bytecode_hash ?? rawRequest.bytecodeHash, 'bytecode hash').toLowerCase();
  const qrHash = qrCode.bytecodeHash.trim().toLowerCase();
  const expiresAtUnixMillis = numberFromField(
    rawRequest.expires_at_unix_milli ?? rawRequest.expiresAtUnixMillis,
    'expires at'
  );

  validateHash(actualHash, bytecodeHash, '部署请求');
  if (qrHash.length > 0) {
    validateHash(actualHash, qrHash, '二维码');
  }
  if (qrCode.expiresAtUnixMillis > 0 && qrCode.expiresAtUnixMillis !== expiresAtUnixMillis) {
    throw new Error('二维码过期时间与部署请求不一致');
  }
  if (expiresAtUnixMillis <= Date.now()) {
    throw new Error('部署请求已过期');
  }

  return {
    bytecodeBase64,
    bytecodeHash,
    bytecodeLength: bytecodeBytes.length,
    chainId: optionalString(rawRequest.chain_id ?? rawRequest.chainId, ''),
    contractName: optionalString(rawRequest.contract_name ?? rawRequest.contractName, '未命名合约'),
    depositLamports: bigintFromField(rawRequest.deposit_lamports ?? rawRequest.depositLamports ?? 0, 'deploy deposit'),
    expiresAtUnixMillis,
    id: requiredString(rawRequest.id, 'deploy id'),
    manifest: normalizeManifest(rawRequest.manifest, rawRequest.manifest_json ?? rawRequest.manifestJson),
    requestUrl: qrCode.requestUrl,
    resultUrl: optionalString(
      rawRequest.result_url ?? rawRequest.resultUrl,
      `${qrCode.requestUrl.replace(/\/$/, '')}/result`
    ),
    rpcUrl: validateHttpUrl(requiredString(rawRequest.rpc_url ?? rawRequest.rpcUrl, 'rpc url'), 'rpc url')
  };
}

function parseQRCodeObject(value) {
  const type = optionalString(value.type, '');
  if (type !== DEPLOY_REQUEST_TYPE && type !== DEPLOY_REQUEST_COMPAT_TYPE) {
    return null;
  }

  const version = numberFromField(value.version ?? 1, 'deploy qr version');
  if (version !== 1) {
    throw new Error(`不支持的部署二维码版本 ${version}`);
  }

  return {
    bytecodeHash: optionalString(value.bytecode_hash ?? value.bytecodeHash, '').toLowerCase(),
    expiresAtUnixMillis: numberFromField(value.expires_at_unix_milli ?? value.expiresAtUnixMillis ?? 0, 'expires at'),
    requestUrl: validateHttpUrl(requiredString(value.request_url ?? value.requestUrl, 'request url'), 'request url'),
    type: DEPLOY_REQUEST_TYPE,
    version: 1
  };
}

function parseQRCodeUrl(value) {
  const parsedUrl = new URL(value);
  const requestUrl = parsedUrl.searchParams.get('request_url') ?? parsedUrl.searchParams.get('requestUrl') ?? '';

  return {
    bytecodeHash: optionalString(parsedUrl.searchParams.get('bytecode_hash') ?? parsedUrl.searchParams.get('bytecodeHash'), '').toLowerCase(),
    expiresAtUnixMillis: numberFromField(parsedUrl.searchParams.get('expires_at_unix_milli') ?? parsedUrl.searchParams.get('expiresAtUnixMillis') ?? 0, 'expires at'),
    requestUrl: validateHttpUrl(requiredString(requestUrl, 'request url'), 'request url'),
    type: DEPLOY_REQUEST_TYPE,
    version: 1
  };
}

function normalizeManifest(rawManifest, rawManifestJson) {
  const manifest = objectFromManifest(rawManifest, rawManifestJson);

  return {
    computeUnitLimit: optionalString(manifest.compute_unit_limit ?? manifest.computeUnitLimit, ''),
    name: optionalString(manifest.name, ''),
    requiredSyscalls: stringArrayFromField(manifest.required_syscalls ?? manifest.requiredSyscalls),
    upgradeAuthority: optionalString(manifest.upgrade_authority ?? manifest.upgradeAuthority, ''),
    version: optionalString(manifest.version, '')
  };
}

function objectFromManifest(rawManifest, rawManifestJson) {
  if (isObject(rawManifest)) {
    return rawManifest;
  }

  if (typeof rawManifestJson === 'string' && rawManifestJson.trim().length > 0) {
    const parsed = parseJsonObject(rawManifestJson);
    if (parsed !== null) {
      return parsed;
    }
  }

  return {};
}

async function fetchTextWithTimeout(url, fetchImpl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEPLOY_REQUEST_TIMEOUT_MILLIS);

  try {
    const response = await fetchImpl(url, { method: 'GET', signal: controller.signal });
    if (!response?.ok) {
      throw new Error(`HTTP ${response?.status ?? 0}`);
    }
    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

function validateHttpUrl(value, fieldName) {
  const trimmedValue = requiredString(value, fieldName);
  if (trimmedValue.length > MAX_URL_LENGTH) {
    throw new Error(`${fieldName} 过长`);
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(trimmedValue);
  } catch {
    throw new Error(`${fieldName} 格式无效`);
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    throw new Error(`${fieldName} 仅支持 HTTP 或 HTTPS`);
  }
  if (parsedUrl.username.length > 0 || parsedUrl.password.length > 0) {
    throw new Error(`${fieldName} 不能包含账号密码`);
  }

  return parsedUrl.toString();
}

function validateHash(actualHash, expectedHash, sourceName) {
  if (!/^[a-f0-9]{64}$/.test(expectedHash)) {
    throw new Error(`${sourceName} bytecode hash 格式无效`);
  }
  if (actualHash !== expectedHash) {
    throw new Error(`${sourceName} bytecode hash 与字节码不一致`);
  }
}

function parseJsonObject(value) {
  try {
    const parsedValue = JSON.parse(value);
    return isObject(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

function looksLikeDeployRequest(value) {
  const trimmedValue = value.trim();
  return trimmedValue.startsWith('svm-deploy://')
    || trimmedValue.includes(DEPLOY_REQUEST_TYPE)
    || trimmedValue.includes(DEPLOY_REQUEST_COMPAT_TYPE);
}

function requiredString(value, fieldName) {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} 必须是字符串`);
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) {
    throw new Error(`${fieldName} 不能为空`);
  }

  return trimmedValue;
}

function optionalString(value, fallbackValue) {
  if (typeof value !== 'string') {
    return fallbackValue;
  }
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : fallbackValue;
}

function numberFromField(value, fieldName) {
  const numberValue = typeof value === 'string' ? Number(value) : value;
  if (!Number.isSafeInteger(numberValue) || numberValue < 0) {
    throw new Error(`${fieldName} 必须是非负整数`);
  }
  return numberValue;
}

function bigintFromField(value, fieldName) {
  if (typeof value === 'bigint' && value >= 0n) {
    return value;
  }

  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) {
    return BigInt(value);
  }

  if (typeof value === 'string' && /^[0-9]+$/.test(value.trim())) {
    return BigInt(value.trim());
  }

  throw new Error(`${fieldName} 必须是非负整数`);
}

function stringArrayFromField(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function toWireDeployResult(result) {
  if (result.status === 'submitted') {
    return {
      program_address: result.programAddress,
      signature: result.signature,
      status: 'submitted',
      submitted_at_unix_millis: result.submittedAtUnixMillis,
      wallet_address: result.walletAddress
    };
  }

  if (result.status === 'rejected') {
    return {
      reason: result.reason,
      status: 'rejected',
      submitted_at_unix_millis: result.submittedAtUnixMillis,
      wallet_address: result.walletAddress
    };
  }

  return {
    error: result.error,
    status: 'failed',
    submitted_at_unix_millis: result.submittedAtUnixMillis,
    wallet_address: result.walletAddress
  };
}
