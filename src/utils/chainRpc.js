import { normalizeRawOrSystemAddress } from './addressSpec.js';

export const PUBLIC_VALIDATOR_RPC_URLS = Object.freeze([
  'http://101.35.87.31:8910/',
  'http://101.35.87.31:8911/',
  'http://101.35.87.31:8912/',
  'http://101.35.87.31:8913/'
]);
export const LEGACY_PUBLIC_RPC_URLS = Object.freeze([
  'http://101.35.87.31:8899/'
]);
export const DEFAULT_PUBLIC_RPC_URL = PUBLIC_VALIDATOR_RPC_URLS[0];
export const DEFAULT_LOCAL_RPC_URL = 'http://192.168.121.225:9110/';
const DEFAULT_RPC_TIMEOUT_MILLIS = 8000;
const SEND_TRANSACTION_TIMEOUT_MILLIS = 15000;

export function normalizeRpcEndpoint(endpoint, fieldName = 'RPC 地址') {
  const value = String(endpoint ?? '').replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (value.length === 0 || value.length > 160) {
    throw new Error(`${fieldName}长度无效`);
  }

  let parsedURL;
  try {
    parsedURL = new URL(value);
  } catch {
    throw new Error(`${fieldName}格式无效`);
  }

  if (parsedURL.protocol !== 'http:' && parsedURL.protocol !== 'https:') {
    throw new Error(`${fieldName}仅支持 HTTP 或 HTTPS`);
  }
  if (parsedURL.username.length > 0 || parsedURL.password.length > 0) {
    throw new Error(`${fieldName}不能包含账号密码`);
  }
  if (parsedURL.hostname.length === 0 || parsedURL.search.length > 0 || parsedURL.hash.length > 0) {
    throw new Error(`${fieldName}不能包含查询参数或片段`);
  }
  return parsedURL.toString();
}

export function isLegacyPublicRpcEndpoint(endpoint) {
  try {
    return LEGACY_PUBLIC_RPC_URLS.includes(normalizeRpcEndpoint(endpoint));
  } catch {
    return false;
  }
}

export class JsonRpcClient {
  constructor(endpoint = DEFAULT_PUBLIC_RPC_URL, timeoutMillis = DEFAULT_RPC_TIMEOUT_MILLIS) {
    this.endpoint = normalizeRpcEndpoint(endpoint);
    this.timeoutMillis = timeoutMillis;
    this.sendTransactionTimeoutMillis = Math.max(timeoutMillis, SEND_TRANSACTION_TIMEOUT_MILLIS);
    this.requestId = 1;
  }

  async getHealth() {
    return this.call('getHealth', []);
  }

  async getBalance(address) {
    const responseText = await this.callRaw('getBalance', [normalizeRawOrSystemAddress(address, '余额地址')]);
    return extractBalanceValue(responseText);
  }

  async getAccountType(address) {
    return this.call('getAccountType', [normalizeRawOrSystemAddress(address, '账户地址')]);
  }

  async getLatestBlockhash() {
    return this.call('getLatestBlockhash', []);
  }

  async sendTransaction(encodedTransaction) {
    const signature = await this.call('sendTransaction', [encodedTransaction], this.sendTransactionTimeoutMillis);
    return { signature };
  }

  async getBlock(slot) {
    const normalizedSlot = Number(slot);
    if (!Number.isSafeInteger(normalizedSlot) || normalizedSlot <= 0) {
      throw new Error('Slot 必须是正整数');
    }

    return this.call('getBlock', [normalizedSlot]);
  }

  async getTransaction(signature) {
    return this.call('getTransaction', [String(signature).trim()]);
  }

  async getAddressTransactions(address, limit = 20, cursor = '') {
    return this.call('getAddressTransactions', [
      normalizeRawOrSystemAddress(address, '交易历史地址'),
      limit,
      cursor
    ]);
  }

  async getContractPrograms(limit = 50) {
    return this.call('getContractPrograms', [limit]);
  }

  async getValidatorSet() {
    return this.call('getValidatorSet', []);
  }

  async getNodeStatus() {
    return this.call('getNodeStatus', []);
  }

  async getPeerNetwork() {
    return this.call('getPeerNetwork', []);
  }

  async call(method, params, timeoutMillis = this.timeoutMillis) {
    const responseText = await this.callRaw(method, params, timeoutMillis);
    return decodeResponse(responseText, method);
  }

  async callRaw(method, params, timeoutMillis = this.timeoutMillis) {
    const id = this.requestId;
    this.requestId += 1;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMillis);
    const startedAt = Date.now();

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: stringifyJsonRpcRequest(id, method, params),
        signal: controller.signal
      });
      const responseText = await readResponseText(response, id, method);
      console.info('[chain-rpc] request completed', { method, duration_ms: Date.now() - startedAt });
      return responseText;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.info('[chain-rpc] request failed', { endpoint: this.endpoint, method, message });
      throw new Error(formatNetworkFailure(method, this.endpoint, message));
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function stringifyJsonRpcRequest(id, method, params) {
  const encodedParams = params.map((param) => encodeJsonRpcParam(param)).join(',');
  return `{"jsonrpc":"2.0","id":${id},"method":${JSON.stringify(method)},"params":[${encodedParams}]}`;
}

export function isMethodUnavailableError(error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return errorMessage.includes('-32601')
    || /method not found/i.test(errorMessage)
    || /method unavailable/i.test(errorMessage);
}

async function readResponseText(response, id, method) {
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const responseText = await response.text();
  const decoded = JSON.parse(responseText);
  if (decoded.id !== id) {
    throw new Error(`RPC ${method} 返回 id 不匹配`);
  }
  if (decoded.error) {
    throw new Error(formatRpcError(method, decoded.error));
  }
  return responseText;
}

function decodeResponse(responseText, method) {
  const decoded = JSON.parse(responseText);
  if (decoded.result === undefined) {
    throw new Error(`RPC ${method} 缺少 result`);
  }
  return decoded.result;
}

function encodeJsonRpcParam(param) {
  if (typeof param === 'bigint') {
    return param.toString();
  }
  return JSON.stringify(param);
}

function extractBalanceValue(responseText) {
  const matched = /"result"\s*:\s*\{\s*"value"\s*:\s*([0-9]+)/.exec(responseText);
  if (!matched?.[1]) {
    throw new Error('RPC getBalance 缺少 result.value');
  }
  return BigInt(matched[1]);
}

function formatRpcError(method, error) {
  const detail = typeof error.data === 'string' && error.data.trim().length > 0 ? `: ${error.data}` : '';
  return `RPC ${method} 错误 ${error.code}: ${error.message}${detail}`;
}

function formatNetworkFailure(method, endpoint, message) {
  if (/latest blockhash expired/i.test(message)) {
    return formatExpiredBlockhashFailure(method, endpoint, message);
  }

  if (method === 'sendTransaction' && isAbortFailure(message)) {
    return `交易提交超时 (${endpoint})：RPC 已接收请求但没有在超时时间内返回。通常是节点正在等待 P2P 广播或上游验证者响应；交易可能已经进入节点 mempool，请先查看交易详情或稍后刷新。`;
  }

  if (message.startsWith(`RPC ${method} 错误`)) {
    return `调用 ${method} 失败 (${endpoint}): ${message}`;
  }

  const cleartextHint = shouldAppendCleartextHint(endpoint, message)
    ? '；如果是真机包，请确认已允许 Android 明文 HTTP，且手机和节点在同一网络'
    : '';
  return `调用 ${method} 失败 (${endpoint}): ${message}${cleartextHint}`;
}

function formatExpiredBlockhashFailure(method, endpoint, message) {
  const slotSummary = parseExpiredBlockhashSlots(message);
  const slotText = slotSummary === ''
    ? ''
    : `（${slotSummary}）`;
  return `当前 RPC 节点无法提交交易：最新区块哈希已过期${slotText}。原因通常是节点停止出块、只读 RPC、未同步或本机 slot 已超过链头；请切换到在线验证者 RPC，或重启并同步本地节点后再试。`;
}

function parseExpiredBlockhashSlots(message) {
  const matched = /head_slot=([0-9]+)\s+current_slot=([0-9]+)\s+last_valid_slot=([0-9]+)/.exec(message);
  if (!matched) {
    return '';
  }
  return `head_slot=${matched[1]} current_slot=${matched[2]} last_valid_slot=${matched[3]}`;
}

function shouldAppendCleartextHint(endpoint, message) {
  return endpoint.startsWith('http://')
    && /Network request failed|Failed to fetch|AbortError|aborted|timeout/i.test(message);
}

function isAbortFailure(message) {
  return /AbortError|aborted|timeout/i.test(message);
}
