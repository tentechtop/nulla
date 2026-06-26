import assert from 'node:assert/strict';
import test from 'node:test';
import bs58 from 'bs58';
import { base64FromBytes, bytesFromBase64 } from '../src/utils/byteEncoding.js';
import {
  createDeterministicSystemAddress,
  deriveRawPublicKeyFromSeed,
  normalizeRawOrSystemAddress
} from '../src/utils/addressSpec.js';
import {
  DEFAULT_PUBLIC_RPC_URL,
  JsonRpcClient,
  LEGACY_PUBLIC_RPC_URLS,
  PUBLIC_VALIDATOR_RPC_URLS,
  isLegacyPublicRpcEndpoint,
  normalizeRpcEndpoint,
  stringifyJsonRpcRequest
} from '../src/utils/chainRpc.js';
import {
  buildSignedDelegateTransaction,
  buildSignedRegisterValidatorTransaction,
  buildSignedUndelegateTransaction,
  buildSignedUnstakeTransaction,
  buildSignedUpdateCommissionTransaction,
  buildSignedWithdrawDelegationTransaction,
  buildSignedWithdrawUnstakedTransaction,
  buildSignedTransferTransaction,
  parseLamports
} from '../src/utils/chainTransactions.js';
import { submitTransferTransaction } from '../src/utils/chainOperations.js';

test('system addresses unwrap to raw 32 byte chain public keys', () => {
  const address = createDeterministicSystemAddress('chain operation wallet', 'transparent');
  const rawPublicKey = normalizeRawOrSystemAddress(address);

  assert.equal(address.startsWith('T'), true);
  assert.equal(bs58.decode(rawPublicKey).length, 32);
  assert.equal(normalizeRawOrSystemAddress(rawPublicKey), rawPublicKey);
});

test('signed transfer transaction is base64 encoded with one signature', () => {
  const destinationAddress = createDeterministicSystemAddress('chain operation receiver', 'transparent');
  const recentBlockhash = deriveRawPublicKeyFromSeed('chain operation blockhash');
  const encodedTransaction = buildSignedTransferTransaction({
    sourceSeed: 'chain operation sender seed',
    destinationAddress,
    recentBlockhash,
    lamports: 5000n
  });
  const transactionBytes = bytesFromBase64(encodedTransaction);

  assert.equal(base64FromBytes(transactionBytes), encodedTransaction);
  assert.equal(transactionBytes[0], 1);
  assert.equal(transactionBytes.length > 160, true);
});

test('signed stake lifecycle transactions are base64 encoded', () => {
  const validatorAddress = createDeterministicSystemAddress('chain operation validator', 'transparent');
  const recentBlockhash = deriveRawPublicKeyFromSeed('chain operation stake blockhash');
  const stakeInput = {
    stakerSeed: 'chain operation staker seed',
    validatorAddress,
    recentBlockhash,
    lamports: 10_000_000n
  };
  const encodedTransactions = [
    buildSignedDelegateTransaction(stakeInput),
    buildSignedUnstakeTransaction({ ...stakeInput, unlockEpoch: 2n }),
    buildSignedUndelegateTransaction({ ...stakeInput, unlockEpoch: 2n }),
    buildSignedWithdrawUnstakedTransaction({
      stakerSeed: stakeInput.stakerSeed,
      validatorAddress,
      recentBlockhash,
      currentEpoch: 3n
    }),
    buildSignedWithdrawDelegationTransaction({
      stakerSeed: stakeInput.stakerSeed,
      validatorAddress,
      recentBlockhash,
      currentEpoch: 3n
    }),
    buildSignedUpdateCommissionTransaction({
      stakerSeed: stakeInput.stakerSeed,
      validatorAddress,
      recentBlockhash,
      commissionBps: 250
    })
  ];

  for (const encodedTransaction of encodedTransactions) {
    const transactionBytes = bytesFromBase64(encodedTransaction);
    assert.equal(base64FromBytes(transactionBytes), encodedTransaction);
    assert.equal(transactionBytes[0], 1);
    assert.equal(transactionBytes.length > 170, true);
  }
});

test('signed validator registration transaction accepts commission bps', () => {
  const validatorAddress = createDeterministicSystemAddress('register validator account', 'transparent');
  const recentBlockhash = deriveRawPublicKeyFromSeed('register validator blockhash');
  const encodedTransaction = buildSignedRegisterValidatorTransaction({
    stakerSeed: 'register validator staker seed',
    validatorAddress,
    consensusPublicKey: deriveRawPublicKeyFromSeed('register validator consensus'),
    blsPublicKey: bs58.encode(Uint8Array.from(Array.from({ length: 96 }, (_, index) => index + 1))),
    commissionBps: 350,
    peerId: 'peer-register-validator',
    recentBlockhash,
    lamports: 10_000_000n
  });
  const transactionBytes = bytesFromBase64(encodedTransaction);

  assert.equal(base64FromBytes(transactionBytes), encodedTransaction);
  assert.equal(transactionBytes[0], 1);
  assert.equal(transactionBytes.length > 260, true);
  assert.throws(() => buildSignedUpdateCommissionTransaction({
    stakerSeed: 'bad commission staker seed',
    validatorAddress,
    recentBlockhash,
    commissionBps: 10001
  }), /commission bps/);
});

test('lamports parsing enforces positive uint64 values', () => {
  assert.equal(parseLamports('5000'), 5000n);
  assert.throws(() => parseLamports('0'), /正整数/);
  assert.throws(() => parseLamports('-1'), /正整数/);
  assert.throws(() => parseLamports('18446744073709551616'), /uint64/);
});

test('json rpc request serializes bigint params without quotes', () => {
  const request = stringifyJsonRpcRequest(7, 'sendAmount', ['addr', 5000n]);

  assert.match(request, /"method":"sendAmount"/);
  assert.match(request, /"params":\["addr",5000\]/);
});

test('rpc endpoint normalization accepts http nodes and rejects unsafe urls', () => {
  assert.equal(normalizeRpcEndpoint('http://192.168.121.225:9110'), 'http://192.168.121.225:9110/');
  assert.throws(() => normalizeRpcEndpoint('ftp://192.168.1.2:8899'), /HTTP/);
  assert.throws(() => normalizeRpcEndpoint('http://user:pass@192.168.1.2:8899'), /账号密码/);
  assert.throws(() => normalizeRpcEndpoint('http://192.168.1.2:8899/?x=1'), /查询参数/);
});

test('public rpc defaults to the public validator cluster', () => {
  assert.deepEqual(PUBLIC_VALIDATOR_RPC_URLS, [
    'http://101.35.87.31:8910/',
    'http://101.35.87.31:8911/',
    'http://101.35.87.31:8912/',
    'http://101.35.87.31:8913/'
  ]);
  assert.equal(DEFAULT_PUBLIC_RPC_URL, PUBLIC_VALIDATOR_RPC_URLS[0]);
  assert.deepEqual(LEGACY_PUBLIC_RPC_URLS, ['http://101.35.87.31:8899/']);
  assert.equal(isLegacyPublicRpcEndpoint('http://101.35.87.31:8899'), true);
  assert.equal(isLegacyPublicRpcEndpoint(DEFAULT_PUBLIC_RPC_URL), false);
});

test('sendTransaction uses a longer timeout than normal reads', () => {
  const client = new JsonRpcClient('http://192.168.121.225:9110/', 8000);

  assert.equal(client.timeoutMillis, 8000);
  assert.equal(client.sendTransactionTimeoutMillis, 15000);
});

test('getBlock validates slot before sending rpc request', async () => {
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error('fetch should not be called');
  };

  try {
    const client = new JsonRpcClient('http://192.168.121.225:9110/');
    await assert.rejects(() => client.getBlock(0), /Slot 必须是正整数/);
    await assert.rejects(() => client.getBlock(1.5), /Slot 必须是正整数/);
    await assert.rejects(() => client.getBlock(Number.NaN), /Slot 必须是正整数/);
    assert.equal(fetchCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('aborted sendTransaction reports submit timeout instead of http permission hint', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('Aborted');
  };

  try {
    const client = new JsonRpcClient('http://192.168.121.225:9110/');
    await assert.rejects(
      () => client.sendTransaction('encoded'),
      (error) => {
        const message = error instanceof Error ? error.message : String(error);
        assert.match(message, /交易提交超时/);
        assert.match(message, /mempool/);
        assert.doesNotMatch(message, /Android/);
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('expired latest blockhash errors explain stale rpc state without http hint', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => ({
    ok: true,
    async text() {
      return JSON.stringify({
        error: {
          code: -32603,
          data: 'get latest blockhash: posnode: latest blockhash expired: head_slot=90645 current_slot=296324 last_valid_slot=90795',
          message: 'internal error'
        },
        id: 1,
        jsonrpc: '2.0'
      });
    }
  });

  try {
    const client = new JsonRpcClient('http://192.168.121.225:9110/');
    await assert.rejects(
      () => client.getLatestBlockhash(),
      (error) => {
        const message = error instanceof Error ? error.message : String(error);
        assert.match(message, /最新区块哈希已过期/);
        assert.match(message, /head_slot=90645 current_slot=296324 last_valid_slot=90795/);
        assert.match(message, /节点停止出块、只读 RPC、未同步/);
        assert.doesNotMatch(message, /Android 明文 HTTP/);
        return true;
      }
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('submitted transfer retries with a fresh blockhash when sendTransaction reports expiry', async () => {
  const blockhashes = [
    deriveRawPublicKeyFromSeed('retry transfer stale blockhash'),
    deriveRawPublicKeyFromSeed('retry transfer fresh blockhash')
  ];
  let blockhashIndex = 0;
  const submittedTransactions = [];
  const client = {
    async getLatestBlockhash() {
      const blockhash = blockhashes[blockhashIndex];
      blockhashIndex += 1;
      return {
        blockhash,
        height: blockhashIndex,
        last_valid_block_height: blockhashIndex + 150,
        last_valid_slot: blockhashIndex + 150,
        slot: blockhashIndex
      };
    },
    async sendTransaction(encodedTransaction) {
      submittedTransactions.push(encodedTransaction);
      if (submittedTransactions.length === 1) {
        throw new Error('RPC sendTransaction 错误 -32603: internal error: send transaction: posnode: recent blockhash is not valid');
      }
      return { signature: 'retry-transfer-signature' };
    }
  };

  const result = await submitTransferTransaction({
    client,
    destinationAddress: createDeterministicSystemAddress('retry transfer destination', 'transparent'),
    lamports: '5000',
    signingSeed: 'retry transfer signing seed'
  });

  assert.equal(result.signature, 'retry-transfer-signature');
  assert.equal(result.latestBlockhash.blockhash, blockhashes[1]);
  assert.equal(submittedTransactions.length, 2);
  assert.notEqual(submittedTransactions[0], submittedTransactions[1]);
});

test('submitted transfer switches away from rpc-only nodes before signing', async () => {
  const originalFetch = globalThis.fetch;
  const publicBlockhash = deriveRawPublicKeyFromSeed('public validator fallback blockhash');
  const rpcCalls = [];
  globalThis.fetch = async (url, options) => {
    const request = JSON.parse(String(options.body));
    rpcCalls.push({ method: request.method, url: String(url) });

    const resultByMethod = {
      getHealth: {
        chain_progressing: true,
        finalized_height: 777,
        head_height: 779,
        head_slot: 301445,
        liveness_mode: 'producing',
        liveness_production_enabled: true,
        liveness_state: 'ready',
        mempool_size: 0,
        ok: true,
        transaction_submission_enabled: true,
        transaction_submission_reason: 'ready'
      },
      getLatestBlockhash: {
        blockhash: publicBlockhash,
        height: 779,
        last_valid_block_height: 929,
        last_valid_slot: 301595,
        slot: 301445
      },
      getTransaction: {
        found: true,
        location: 'mempool',
        status: 'pending'
      },
      sendTransaction: 'public-fallback-signature'
    };

    return {
      ok: true,
      async text() {
        return JSON.stringify({
          id: request.id,
          jsonrpc: '2.0',
          result: resultByMethod[request.method]
        });
      }
    };
  };

  const localRpcOnlyClient = {
    endpoint: 'http://192.168.121.225:9110/',
    timeoutMillis: 8000,
    async getHealth() {
      return {
        finalized_height: 0,
        head_height: 0,
        head_slot: 0,
        liveness_mode: 'rpc_only',
        liveness_production_enabled: false,
        liveness_reason: 'consensus_disabled',
        liveness_state: 'disabled',
        mempool_size: 0,
        ok: true
      };
    },
    async getLatestBlockhash() {
      throw new Error('local rpc-only blockhash should not be used for submission');
    },
    async sendTransaction() {
      throw new Error('local rpc-only send should not be used for submission');
    }
  };

  try {
    const result = await submitTransferTransaction({
      client: localRpcOnlyClient,
      destinationAddress: createDeterministicSystemAddress('public fallback transfer destination', 'transparent'),
      lamports: '5000',
      signingSeed: 'public fallback transfer signing seed'
    });

    assert.equal(result.signature, 'public-fallback-signature');
    assert.equal(result.latestBlockhash.blockhash, publicBlockhash);
    assert.equal(result.rpcEndpoint, PUBLIC_VALIDATOR_RPC_URLS[0]);
    assert.equal(rpcCalls.filter((call) => call.method === 'getHealth').length, PUBLIC_VALIDATOR_RPC_URLS.length);
    assert.deepEqual(
      rpcCalls
        .filter((call) => call.url === PUBLIC_VALIDATOR_RPC_URLS[0])
        .map((call) => call.method),
      ['getHealth', 'getLatestBlockhash', 'sendTransaction', 'getTransaction']
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('submitted transfer rejects public validators whose head is not progressing', async () => {
  const originalFetch = globalThis.fetch;
  const rpcCalls = [];
  globalThis.fetch = async (url, options) => {
    const request = JSON.parse(String(options.body));
    rpcCalls.push({ method: request.method, url: String(url) });
    return {
      ok: true,
      async text() {
        return JSON.stringify({
          id: request.id,
          jsonrpc: '2.0',
          result: {
            finalized_height: 2130,
            head_height: 2132,
            head_slot: 303226,
            liveness_mode: 'producing',
            liveness_production_enabled: true,
            liveness_state: 'ready',
            mempool_size: 0,
            ok: true
          }
        });
      }
    };
  };

  const localRpcOnlyClient = {
    endpoint: 'http://192.168.121.225:9110/',
    timeoutMillis: 8000,
    async getHealth() {
      return {
        finalized_height: 0,
        head_height: 0,
        head_slot: 0,
        liveness_mode: 'rpc_only',
        liveness_production_enabled: false,
        liveness_reason: 'consensus_disabled',
        liveness_state: 'disabled',
        mempool_size: 0,
        ok: true
      };
    },
    async getLatestBlockhash() {
      throw new Error('stale public validators should not be used for blockhash');
    },
    async sendTransaction() {
      throw new Error('stale public validators should not receive transactions');
    }
  };

  try {
    await assert.rejects(
      () => submitTransferTransaction({
        client: localRpcOnlyClient,
        destinationAddress: createDeterministicSystemAddress('stale public transfer destination', 'transparent'),
        lamports: '5000',
        signingSeed: 'stale public transfer signing seed'
      }),
      /chain_head_not_progressing|公网验证者 RPC 暂不可用/
    );
    assert.equal(rpcCalls.some((call) => call.method === 'sendTransaction'), false);
    assert.equal(rpcCalls.some((call) => call.method === 'getLatestBlockhash'), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('submitted transfer rejects signatures that are not visible on the submission rpc', async () => {
  const blockhash = deriveRawPublicKeyFromSeed('invisible signature blockhash');
  let transactionLookups = 0;
  const client = {
    endpoint: 'http://101.35.87.31:8910/',
    async getHealth() {
      return {
        chain_progressing: true,
        finalized_height: 2,
        head_height: 3,
        head_slot: 4,
        liveness_mode: 'producing',
        liveness_production_enabled: true,
        mempool_size: 0,
        ok: true,
        transaction_submission_enabled: true
      };
    },
    async getLatestBlockhash() {
      return {
        blockhash,
        height: 3,
        last_valid_block_height: 153,
        last_valid_slot: 154,
        slot: 4
      };
    },
    async sendTransaction() {
      return { signature: 'invisible-signature' };
    },
    async getTransaction(signature) {
      transactionLookups += 1;
      assert.equal(signature, 'invisible-signature');
      return { found: false, status: 'not_found' };
    }
  };

  await assert.rejects(
    () => submitTransferTransaction({
      client,
      destinationAddress: createDeterministicSystemAddress('invisible signature destination', 'transparent'),
      lamports: '5000',
      signingSeed: 'invisible signature signing seed'
    }),
    /交易未进入 mempool 或区块/
  );
  assert.equal(transactionLookups, 3);
});

test('submitted transfer does not retry non blockhash business failures', async () => {
  let blockhashCalls = 0;
  let sendCalls = 0;
  const client = {
    async getLatestBlockhash() {
      blockhashCalls += 1;
      return {
        blockhash: deriveRawPublicKeyFromSeed('non retry transfer blockhash'),
        height: 1,
        last_valid_block_height: 151,
        last_valid_slot: 151,
        slot: 1
      };
    },
    async sendTransaction() {
      sendCalls += 1;
      throw new Error('RPC sendTransaction 错误 -32603: internal error: send transaction: posnode: preflight transaction failed: instruction 0: stake: staker mismatch');
    }
  };

  await assert.rejects(
    () => submitTransferTransaction({
      client,
      destinationAddress: createDeterministicSystemAddress('non retry transfer destination', 'transparent'),
      lamports: '5000',
      signingSeed: 'non retry transfer signing seed'
    }),
    /staker mismatch/
  );
  assert.equal(blockhashCalls, 1);
  assert.equal(sendCalls, 1);
});
