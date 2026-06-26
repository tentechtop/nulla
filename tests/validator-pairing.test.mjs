import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MINIMUM_VALIDATOR_STAKE_LAMPORTS,
  VALIDATOR_PAIRING_MODE_BOOTSTRAP,
  VALIDATOR_PAIRING_PAYLOAD_PREFIX,
  buildValidatorPairingCompleteRequest,
  completeValidatorPairing,
  parseValidatorPairingPayload,
  signBootstrapPairingAuthorization
} from '../src/features/validatorPairing/validatorPairing.js';
import { createDeterministicSystemAddress } from '../src/utils/addressSpec.js';

const VALID_BASE58_44 = '3GT9QRAu2LZMkSSdpCEMNigQqSLG5EXy6hYuBTcZjT5S';
const VALID_STAKER_ADDRESS = 'TGT9QRAu2LZMkSSdpCEMNigQqSLG5EXy6hYuBTcZjT5S';
const VALID_CONSENSUS = '4XxXMvtEnXWE25Ftd4eVekA7Z6acsnFiG9g4tSktjnWk';
const VALID_BLS = 'tGH2uJfguiMf2pSN4CuHNXiqrJC29V9spMxrFbySLbFQg9exCLmLongdv8Sh63YpmmkFELjaGodukjpVPHZ1yQ7RkuE67B68iopxEiuDMRLiH33CX4xwCcsg1CFWjWUC1vx';
const VALID_SIGNATURE = '4M1ZRmtBVuTN29oCEbatdPr9RRFyBwRyoRTNfDDskoR2hKy4A8eZZAmREapVPNbymmmNnXVfGTMGagm57thkDVu8';
const VALID_BOOTSTRAP_SIGNING_SEED = 'validator bootstrap signer seed';
const VALID_BOOTSTRAP_STAKER_ADDRESS = createDeterministicSystemAddress(VALID_BOOTSTRAP_SIGNING_SEED);

function createPayload(overrides = {}) {
  const payload = {
    version: 1,
    rpc_url: 'http://192.168.120.223:9110/',
    chain_id: 'devnet',
    chain_identity_hash: 'chain-identity',
    genesis_hash: 'genesis-hash',
    node_name: 'mac-fullnode',
    node_peer_id: 'ACUoPCmqEpqKwwvwMpWmhQJiSs9HDBdr4wWfcWYrV7YQ',
    validator_address: VALID_BASE58_44,
    consensus_address: VALID_CONSENSUS,
    bls_public_key: VALID_BLS,
    token: 'token-token-token-token',
    expires_at_unix_millis: Date.now() + 60000,
    ...overrides
  };

  return VALIDATOR_PAIRING_PAYLOAD_PREFIX + Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

function createBootstrapPayload(overrides = {}) {
  const payload = {
    version: 1,
    mode: VALIDATOR_PAIRING_MODE_BOOTSTRAP,
    rpc_url: 'http://192.168.120.223:9112/',
    bootstrap_rpc_url: 'http://101.35.87.31:8910/',
    node_name: 'validator-win-02',
    node_peer_id: 'ACUoPCmqEpqKwwvwMpWmhQJiSs9HDBdr4wWfcWYrV7YQ',
    validator_address: VALID_BASE58_44,
    consensus_address: VALID_CONSENSUS,
    bls_public_key: VALID_BLS,
    advertised_ip: '192.168.121.225',
    advertised_port: 5109,
    network: 'quic',
    token: 'token-token-token-token',
    registered_at_unix_millis: Date.now(),
    expires_at_unix_millis: Date.now() + 60000,
    ...overrides
  };

  return VALIDATOR_PAIRING_PAYLOAD_PREFIX + Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}

test('parseValidatorPairingPayload decodes posvalpair payload', () => {
  const parsed = parseValidatorPairingPayload(createPayload(), Date.now());

  assert.equal(parsed.rpcURL, 'http://192.168.120.223:9110/');
  assert.equal(parsed.mode, 'validator_registration');
  assert.equal(parsed.validatorAddress, VALID_BASE58_44);
  assert.equal(parsed.consensusAddress, VALID_CONSENSUS);
  assert.equal(parsed.isExpired, false);
});

test('parseValidatorPairingPayload accepts bootstrap join payload without chain id', () => {
  const parsed = parseValidatorPairingPayload(createBootstrapPayload(), Date.now());

  assert.equal(parsed.mode, VALIDATOR_PAIRING_MODE_BOOTSTRAP);
  assert.equal(parsed.chainID, '');
  assert.equal(parsed.bootstrapRPCURL, 'http://101.35.87.31:8910/');
  assert.equal(parsed.advertisedIP, '192.168.121.225');
  assert.equal(parsed.advertisedPort, 5109);
  assert.equal(parsed.network, 'quic');
});

test('parseValidatorPairingPayload still requires chain id for registration payloads', () => {
  assert.throws(() => parseValidatorPairingPayload(createPayload({ chain_id: '' })), /缺少 chain_id/);
});

test('parseValidatorPairingPayload rejects unsafe rpc urls', () => {
  assert.throws(() => parseValidatorPairingPayload(createPayload({ rpc_url: 'file:///tmp/node' })), /只允许 http 或 https/);
  assert.throws(() => parseValidatorPairingPayload(createPayload({ rpc_url: 'http://user:pass@127.0.0.1:9110/' })), /不能包含用户凭据/);
});

test('buildValidatorPairingCompleteRequest requires real registration signature', () => {
  const parsed = parseValidatorPairingPayload(createPayload(), Date.now());

  assert.throws(
    () => buildValidatorPairingCompleteRequest(parsed, { signature: '', stakerAddress: VALID_STAKER_ADDRESS }),
    /注册交易签名无效/
  );
});

test('buildValidatorPairingCompleteRequest requires a system staker address', () => {
  const parsed = parseValidatorPairingPayload(createPayload(), Date.now());

  assert.throws(
    () => buildValidatorPairingCompleteRequest(parsed, { signature: VALID_SIGNATURE, stakerAddress: VALID_BASE58_44 }),
    /验证者钱包地址无效/
  );
  assert.throws(
    () => buildValidatorPairingCompleteRequest(parsed, { signature: VALID_SIGNATURE, stakerAddress: VALID_STAKER_ADDRESS.replace(/^T/, 't') }),
    /验证者钱包地址无效/
  );
});

test('buildValidatorPairingCompleteRequest accepts bootstrap authorization signature', () => {
  const parsed = parseValidatorPairingPayload(createBootstrapPayload(), Date.now());
  const bootstrapStakerSignature = signBootstrapPairingAuthorization(parsed, {
    signingSeed: VALID_BOOTSTRAP_SIGNING_SEED,
    stakerAddress: VALID_BOOTSTRAP_STAKER_ADDRESS
  });

  const request = buildValidatorPairingCompleteRequest(parsed, {
    bootstrapStakerSignature,
    stakerAddress: VALID_BOOTSTRAP_STAKER_ADDRESS
  });

  assert.match(bootstrapStakerSignature, /^[1-9A-HJ-NP-Za-km-z]{80,100}$/);
  assert.equal(bootstrapStakerSignature, signBootstrapPairingAuthorization(parsed, {
    signingSeed: VALID_BOOTSTRAP_SIGNING_SEED,
    stakerAddress: VALID_BOOTSTRAP_STAKER_ADDRESS
  }));
  assert.equal(request.bootstrap_staker_signature, bootstrapStakerSignature);
  assert.equal(request.signature, undefined);
  assert.equal(request.staker_address, VALID_BOOTSTRAP_STAKER_ADDRESS);
});

test('completeValidatorPairing sends completeValidatorPairing rpc request', async () => {
  const parsed = parseValidatorPairingPayload(createPayload(), Date.now());
  let capturedRequest = null;
  const fetchImpl = async (_url, init) => {
    capturedRequest = JSON.parse(init.body);
    return {
      ok: true,
      status: 200,
      async json() {
        return { jsonrpc: '2.0', id: capturedRequest.id, result: { state: 'completed', restart_required: true } };
      }
    };
  };

  const result = await completeValidatorPairing(
    parsed,
    { signature: VALID_SIGNATURE, stakerAddress: VALID_STAKER_ADDRESS },
    fetchImpl
  );

  assert.equal(result.state, 'completed');
  assert.equal(capturedRequest.method, 'completeValidatorPairing');
  assert.equal(capturedRequest.params[0].stake_lamports, MINIMUM_VALIDATOR_STAKE_LAMPORTS);
  assert.equal(capturedRequest.params[0].signature, VALID_SIGNATURE);
  assert.equal(capturedRequest.params[0].staker_address, VALID_STAKER_ADDRESS);
});
