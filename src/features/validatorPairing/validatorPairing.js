import bs58 from 'bs58';
import { utf8ToBytes } from '@noble/hashes/utils.js';
import nacl from 'tweetnacl';
import { deriveSigningKeyPairFromSeed, isSystemAddress, normalizeRawOrSystemAddress } from '../../utils/addressSpec.js';
import { base64FromBytes } from '../../utils/byteEncoding.js';

const VALIDATOR_PAIRING_PAYLOAD_PREFIX = 'posvalpair:';
const VALIDATOR_PAIRING_MODE_BOOTSTRAP = 'bootstrap_join';
const VALIDATOR_PAIRING_MODE_REGISTER = 'validator_registration';
const MAX_VALIDATOR_PAIRING_PAYLOAD_LENGTH = 4096;
const MINIMUM_VALIDATOR_STAKE_LAMPORTS = 10000000;
const MAX_NETWORK_PORT = 65535;
const SIGNATURE_BYTES = 64;
const BASE58_PATTERN = /^[1-9A-HJ-NP-Za-km-z]+$/;
const COMMON_REQUIRED_STRING_FIELDS = Object.freeze([
  'rpc_url',
  'node_peer_id',
  'validator_address',
  'consensus_address',
  'bls_public_key',
  'token'
]);
const REGISTER_REQUIRED_STRING_FIELDS = Object.freeze([
  'chain_id',
  'chain_identity_hash',
  'genesis_hash'
]);
const BOOTSTRAP_REQUIRED_STRING_FIELDS = Object.freeze([
  'bootstrap_rpc_url',
  'advertised_ip',
  'network'
]);

export {
  MAX_VALIDATOR_PAIRING_PAYLOAD_LENGTH,
  MINIMUM_VALIDATOR_STAKE_LAMPORTS,
  VALIDATOR_PAIRING_MODE_BOOTSTRAP,
  VALIDATOR_PAIRING_MODE_REGISTER,
  VALIDATOR_PAIRING_PAYLOAD_PREFIX
};

export function sanitizeValidatorPairingPayload(payload) {
  if (typeof payload !== 'string') {
    return '';
  }

  return payload.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, MAX_VALIDATOR_PAIRING_PAYLOAD_LENGTH);
}

export function isValidatorPairingPayload(payload) {
  return sanitizeValidatorPairingPayload(payload).startsWith(VALIDATOR_PAIRING_PAYLOAD_PREFIX);
}

export function parseValidatorPairingPayload(payload, nowMs = Date.now()) {
  const sanitizedPayload = sanitizeValidatorPairingPayload(payload);
  if (!sanitizedPayload.startsWith(VALIDATOR_PAIRING_PAYLOAD_PREFIX)) {
    return null;
  }

  const encoded = sanitizedPayload.slice(VALIDATOR_PAIRING_PAYLOAD_PREFIX.length);
  const decodedPayload = decodeBase64RawJSON(encoded);
  const mode = normalizePairingMode(decodedPayload.mode);
  assertPairingPayloadShape(decodedPayload, mode);

  const expiresAtUnixMS = Number(decodedPayload.expires_at_unix_millis);
  return {
    version: decodedPayload.version,
    mode,
    rpcURL: readRequiredString(decodedPayload.rpc_url),
    bootstrapRPCURL: readOptionalString(decodedPayload.bootstrap_rpc_url),
    chainID: readOptionalString(decodedPayload.chain_id),
    chainIdentityHash: readOptionalString(decodedPayload.chain_identity_hash),
    genesisHash: readOptionalString(decodedPayload.genesis_hash),
    nodeName: readOptionalString(decodedPayload.node_name),
    nodePeerID: readRequiredString(decodedPayload.node_peer_id),
    validatorAddress: readRequiredString(decodedPayload.validator_address),
    consensusAddress: readRequiredString(decodedPayload.consensus_address),
    blsPublicKey: readRequiredString(decodedPayload.bls_public_key),
    advertisedIP: readOptionalString(decodedPayload.advertised_ip),
    advertisedPort: normalizeOptionalPositiveInteger(decodedPayload.advertised_port, 'advertised_port'),
    network: readOptionalString(decodedPayload.network),
    registeredAtUnixMS: normalizeOptionalPositiveInteger(decodedPayload.registered_at_unix_millis, 'registered_at_unix_millis'),
    token: readRequiredString(decodedPayload.token),
    expiresAtUnixMS,
    isExpired: expiresAtUnixMS <= nowMs,
    rawPayload: sanitizedPayload
  };
}

export function compactValidatorPairingValue(value, prefixLength = 10, suffixLength = 8) {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length <= prefixLength + suffixLength + 3) {
    return trimmedValue;
  }

  return `${trimmedValue.slice(0, prefixLength)}...${trimmedValue.slice(-suffixLength)}`;
}

export async function getValidatorPairingStatus(pairingPayload, fetchImpl = globalThis.fetch) {
  assertParsedPairingPayload(pairingPayload);
  return callValidatorPairingRPC(pairingPayload.rpcURL, 'getValidatorPairing', [], fetchImpl);
}

export async function completeValidatorPairing(pairingPayload, options, fetchImpl = globalThis.fetch) {
  assertParsedPairingPayload(pairingPayload);
  const request = buildValidatorPairingCompleteRequest(pairingPayload, options);
  return callValidatorPairingRPC(pairingPayload.rpcURL, 'completeValidatorPairing', [request], fetchImpl);
}

export function buildValidatorPairingCompleteRequest(pairingPayload, options) {
  assertParsedPairingPayload(pairingPayload);
  if (options === null || typeof options !== 'object') {
    throw new TypeError('绑定参数必须是对象');
  }

  const stakerAddress = String(options.stakerAddress ?? '').trim();
  const stakeLamports = normalizeStakeLamports(options.stakeLamports);
  if (!isSystemAddress(stakerAddress)) {
    throw new Error('验证者钱包地址无效');
  }

  const request = {
    token: pairingPayload.token,
    staker_address: stakerAddress,
    validator_address: pairingPayload.validatorAddress,
    consensus_address: pairingPayload.consensusAddress,
    bls_public_key: pairingPayload.blsPublicKey,
    node_peer_id: pairingPayload.nodePeerID,
    stake_lamports: stakeLamports
  };

  if (pairingPayload.mode === VALIDATOR_PAIRING_MODE_BOOTSTRAP) {
    const bootstrapStakerSignature = String(options.bootstrapStakerSignature ?? '').trim();
    if (!isBase58Length(bootstrapStakerSignature, 32, 128)) {
      throw new Error('引导注册授权签名无效');
    }
    return {
      ...request,
      bootstrap_staker_signature: bootstrapStakerSignature
    };
  }

  const signature = String(options.signature ?? '').trim();
  if (!isBase58Length(signature, 32, 128)) {
    throw new Error('注册交易签名无效');
  }
  return {
    ...request,
    signature
  };
}

export function signBootstrapPairingAuthorization(pairingPayload, options) {
  assertParsedPairingPayload(pairingPayload);
  if (pairingPayload.mode !== VALIDATOR_PAIRING_MODE_BOOTSTRAP) {
    throw new Error('只有引导入网二维码需要本地授权签名');
  }
  if (options === null || typeof options !== 'object') {
    throw new TypeError('授权签名参数必须是对象');
  }

  const signingSeed = String(options.signingSeed ?? '').trim();
  if (signingSeed.length === 0) {
    throw new Error('当前钱包未解锁，无法签名引导授权');
  }

  const stakeLamports = normalizeStakeLamports(options.stakeLamports);
  const rawStakerAddress = normalizeRawOrSystemAddress(options.stakerAddress, '质押钱包地址');
  const signingKeyPair = deriveSigningKeyPairFromSeed(signingSeed);
  if (bs58.encode(signingKeyPair.publicKey) !== rawStakerAddress) {
    throw new Error('当前钱包签名 seed 与质押地址不一致');
  }

  // 功能目的：复刻节点钱包 CLI 的引导授权签名串；实现原因：首次入网节点尚未出块，不能依赖链上注册交易。
  const signBytes = bootstrapPairingSignBytes({
    chainID: pairingPayload.chainID,
    nodeName: pairingPayload.nodeName,
    nodePeerID: pairingPayload.nodePeerID,
    advertisedIP: pairingPayload.advertisedIP,
    advertisedPort: pairingPayload.advertisedPort,
    network: pairingPayload.network,
    stakerAddress: rawStakerAddress,
    validatorAddress: pairingPayload.validatorAddress,
    consensusAddress: pairingPayload.consensusAddress,
    blsPublicKeyBase64: base64FromBootstrapBLSPublicKey(pairingPayload.blsPublicKey),
    stakeLamports,
    commissionBps: 0,
    registeredAtUnixMS: pairingPayload.registeredAtUnixMS
  });
  const signature = nacl.sign.detached(signBytes, signingKeyPair.secretKey);
  if (signature.length !== SIGNATURE_BYTES) {
    throw new Error('引导授权签名长度异常');
  }
  return bs58.encode(signature);
}

function assertPairingPayloadShape(decodedPayload, mode) {
  if (decodedPayload === null || typeof decodedPayload !== 'object' || Array.isArray(decodedPayload)) {
    throw new Error('验证者绑定二维码内容不是对象');
  }

  if (decodedPayload.version !== 1) {
    throw new Error('验证者绑定二维码版本不支持');
  }

  assertRequiredStringFields(decodedPayload, COMMON_REQUIRED_STRING_FIELDS);
  if (mode === VALIDATOR_PAIRING_MODE_BOOTSTRAP) {
    assertRequiredStringFields(decodedPayload, BOOTSTRAP_REQUIRED_STRING_FIELDS);
    assertPositiveInteger(decodedPayload.advertised_port, 'advertised_port');
    assertPositiveInteger(decodedPayload.registered_at_unix_millis, 'registered_at_unix_millis');
    validatePairingRPCURL(decodedPayload.bootstrap_rpc_url);
  } else {
    assertRequiredStringFields(decodedPayload, REGISTER_REQUIRED_STRING_FIELDS);
  }

  validatePairingRPCURL(decodedPayload.rpc_url);
  assertBase58Field(decodedPayload.validator_address, 'validator_address', 32, 64);
  assertBase58Field(decodedPayload.consensus_address, 'consensus_address', 32, 64);
  assertBase58Field(decodedPayload.bls_public_key, 'bls_public_key', 80, 192);

  const expiresAtUnixMS = Number(decodedPayload.expires_at_unix_millis);
  if (!Number.isSafeInteger(expiresAtUnixMS) || expiresAtUnixMS <= 0) {
    throw new Error('验证者绑定二维码过期时间无效');
  }
}

function assertRequiredStringFields(decodedPayload, fieldNames) {
  for (const fieldName of fieldNames) {
    if (typeof decodedPayload[fieldName] !== 'string' || decodedPayload[fieldName].trim().length === 0) {
      throw new Error(`验证者绑定二维码缺少 ${fieldName}`);
    }
  }
}

function assertParsedPairingPayload(pairingPayload) {
  if (pairingPayload === null || typeof pairingPayload !== 'object') {
    throw new TypeError('验证者绑定 payload 无效');
  }

  if (pairingPayload.isExpired) {
    throw new Error('验证者绑定二维码已过期');
  }
}

function normalizePairingMode(value) {
  const mode = readOptionalString(value);
  if (mode.length === 0) {
    return VALIDATOR_PAIRING_MODE_REGISTER;
  }
  if (mode === VALIDATOR_PAIRING_MODE_REGISTER || mode === VALIDATOR_PAIRING_MODE_BOOTSTRAP) {
    return mode;
  }
  throw new Error('验证者绑定二维码模式不支持');
}

function validatePairingRPCURL(rawURL) {
  let parsedURL;
  try {
    parsedURL = new URL(String(rawURL).trim());
  } catch {
    throw new Error('验证者绑定 RPC 地址无效');
  }

  if (parsedURL.protocol !== 'http:' && parsedURL.protocol !== 'https:') {
    throw new Error('验证者绑定 RPC 只允许 http 或 https');
  }

  if (parsedURL.username.length > 0 || parsedURL.password.length > 0) {
    throw new Error('验证者绑定 RPC 不能包含用户凭据');
  }

  if (parsedURL.search.length > 0 || parsedURL.hash.length > 0) {
    throw new Error('验证者绑定 RPC 不能包含 query 或 fragment');
  }

  if (parsedURL.hostname.trim().length === 0) {
    throw new Error('验证者绑定 RPC 主机不能为空');
  }
}

function assertBase58Field(value, fieldName, minLength, maxLength) {
  if (!isBase58Length(String(value).trim(), minLength, maxLength)) {
    throw new Error(`验证者绑定二维码 ${fieldName} 格式无效`);
  }
}

function isBase58Length(value, minLength, maxLength) {
  return typeof value === 'string' && value.length >= minLength && value.length <= maxLength && BASE58_PATTERN.test(value);
}

function normalizeStakeLamports(value) {
  const normalizedValue = value === undefined || value === null ? MINIMUM_VALIDATOR_STAKE_LAMPORTS : Number(value);
  if (!Number.isSafeInteger(normalizedValue) || normalizedValue < MINIMUM_VALIDATOR_STAKE_LAMPORTS) {
    throw new Error('验证者质押数量低于最低要求');
  }

  return normalizedValue;
}

function readRequiredString(value) {
  return String(value).trim();
}

function readOptionalString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function assertPositiveInteger(value, fieldName) {
  const normalizedValue = Number(value);
  if (!Number.isSafeInteger(normalizedValue) || normalizedValue <= 0) {
    throw new Error(`验证者绑定二维码 ${fieldName} 必须是正整数`);
  }
  if (fieldName === 'advertised_port' && normalizedValue > MAX_NETWORK_PORT) {
    throw new Error('验证者绑定二维码 advertised_port 超出端口范围');
  }
}

function normalizeOptionalPositiveInteger(value, fieldName) {
  if (value === undefined || value === null || value === '') {
    return 0;
  }
  assertPositiveInteger(value, fieldName);
  return Number(value);
}

function base64FromBootstrapBLSPublicKey(publicKey) {
  try {
    return base64FromBytes(bs58.decode(String(publicKey).trim()));
  } catch {
    throw new Error('验证者 BLS 公钥格式无效');
  }
}

function bootstrapPairingSignBytes(input) {
  return utf8ToBytes([
    'pos-bootstrap-register-v1',
    input.chainID,
    input.nodeName,
    input.nodePeerID,
    input.advertisedIP,
    String(input.advertisedPort),
    input.network,
    input.stakerAddress,
    input.validatorAddress,
    input.consensusAddress,
    input.blsPublicKeyBase64,
    String(input.stakeLamports),
    String(input.commissionBps),
    String(input.registeredAtUnixMS)
  ].map((value) => String(value).trim()).join('\n'));
}

async function callValidatorPairingRPC(rpcURL, method, params, fetchImpl) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('当前运行环境不支持网络请求');
  }

  const requestBody = {
    jsonrpc: '2.0',
    id: Date.now(),
    method,
    params
  };
  const response = await fetchImpl(rpcURL, {
    body: JSON.stringify(requestBody),
    headers: { 'content-type': 'application/json' },
    method: 'POST'
  });

  if (!response || typeof response.ok !== 'boolean') {
    throw new Error('验证者节点 RPC 响应无效');
  }

  if (!response.ok) {
    throw new Error(`验证者节点 RPC HTTP ${response.status}`);
  }

  const decoded = await response.json();
  if (decoded?.error) {
    const message = decoded.error.message || '验证者节点 RPC 返回错误';
    throw new Error(message);
  }

  return decoded?.result;
}

function decodeBase64RawJSON(encoded) {
  const decodedText = decodeBase64RawToText(encoded);
  try {
    return JSON.parse(decodedText);
  } catch {
    throw new Error('验证者绑定二维码 JSON 无效');
  }
}

function decodeBase64RawToText(encoded) {
  if (typeof encoded !== 'string' || encoded.length === 0 || !/^[A-Za-z0-9_-]+$/.test(encoded)) {
    throw new Error('验证者绑定二维码编码无效');
  }

  const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const paddingLength = (4 - (normalized.length % 4)) % 4;
  return bytesToText(decodeBase64ToBytes(normalized + '='.repeat(paddingLength)));
}

function decodeBase64ToBytes(encoded) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const bytes = [];
  let buffer = 0;
  let bits = 0;

  for (const char of encoded.replace(/=+$/, '')) {
    const value = alphabet.indexOf(char);
    if (value < 0) {
      throw new Error('验证者绑定二维码编码无效');
    }

    buffer = (buffer << 6) | value;
    bits += 6;

    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }

  return new Uint8Array(bytes);
}

function bytesToText(bytes) {
  if (typeof TextDecoder === 'function') {
    return new TextDecoder().decode(bytes);
  }

  let output = '';
  for (const byte of bytes) {
    output += String.fromCharCode(byte);
  }
  return decodeURIComponent(escape(output));
}
