import { JsonRpcClient, DEFAULT_PUBLIC_RPC_URL, PUBLIC_VALIDATOR_RPC_URLS } from './chainRpc.js';
import {
  buildSignedDelegateTransaction,
  buildSignedDeployContractTransaction,
  buildSignedStakeTransaction,
  buildSignedUndelegateTransaction,
  buildSignedUnstakeTransaction,
  buildSignedUpdateCommissionTransaction,
  buildSignedWithdrawDelegationTransaction,
  buildSignedWithdrawUnstakedTransaction,
  buildSignedRegisterValidatorTransaction,
  buildSignedTransferTransaction,
  parseLamports
} from './chainTransactions.js';

const MINIMUM_VALIDATOR_STAKE_LAMPORTS = 10_000_000n;
const RPC_HEAD_PROGRESS_PROBE_DELAY_MILLIS = 1500;
const RPC_SUBMISSION_VISIBILITY_ATTEMPTS = 3;
const RPC_SUBMISSION_VISIBILITY_DELAY_MILLIS = 250;

export function createDefaultChainClient() {
  return new JsonRpcClient(DEFAULT_PUBLIC_RPC_URL);
}

export async function submitTransferTransaction(input) {
  const signingSeed = requireSigningSeed(input.signingSeed);
  const lamports = parseLamports(input.lamports);
  const client = input.client ?? createDefaultChainClient();
  const submittedTransaction = await signAndSendWithFreshBlockhash(client, (latestBlockhash) => {
    return buildSignedTransferTransaction({
      sourceSeed: signingSeed,
      destinationAddress: input.destinationAddress,
      recentBlockhash: latestBlockhash.blockhash,
      lamports
    });
  });

  return {
    signature: submittedTransaction.result.signature,
    lamports,
    latestBlockhash: submittedTransaction.latestBlockhash,
    rpcEndpoint: submittedTransaction.rpcEndpoint
  };
}

export async function submitStakeTransaction(input) {
  return submitStakeLikeTransaction(input, 'stake');
}

export async function submitDelegateStakeTransaction(input) {
  return submitStakeLikeTransaction(input, 'delegate');
}

export async function submitUnstakeTransaction(input) {
  return submitStakeLikeTransaction(input, 'unstake');
}

export async function submitUndelegateStakeTransaction(input) {
  return submitStakeLikeTransaction(input, 'undelegate');
}

export async function submitWithdrawUnstakedTransaction(input) {
  return submitStakeWithdrawTransaction(input, 'withdrawUnstaked');
}

export async function submitWithdrawDelegationTransaction(input) {
  return submitStakeWithdrawTransaction(input, 'withdrawDelegation');
}

export async function submitRegisterValidatorIdentityTransaction(input) {
  const signingSeed = requireSigningSeed(input.signingSeed);
  const stakeLamports = parseLamports(input.stakeLamports);
  if (stakeLamports < MINIMUM_VALIDATOR_STAKE_LAMPORTS) {
    throw new Error(`验证者初始质押不能低于 ${MINIMUM_VALIDATOR_STAKE_LAMPORTS.toString()} lamports`);
  }

  const client = input.client ?? createDefaultChainClient();
  const submittedTransaction = await signAndSendWithFreshBlockhash(client, (latestBlockhash) => {
    return buildSignedRegisterValidatorTransaction({
      stakerSeed: signingSeed,
      validatorAddress: input.validatorAddress,
      consensusPublicKey: input.consensusPublicKey,
      blsPublicKey: input.blsPublicKey,
      commissionBps: normalizeCommissionBps(input.commissionBps ?? 0),
      peerId: input.peerId,
      recentBlockhash: latestBlockhash.blockhash,
      lamports: stakeLamports
    });
  });

  return {
    signature: submittedTransaction.result.signature,
    lamports: stakeLamports,
    latestBlockhash: submittedTransaction.latestBlockhash,
    rpcEndpoint: submittedTransaction.rpcEndpoint
  };
}

export async function submitUpdateValidatorCommissionTransaction(input) {
  const signingSeed = requireSigningSeed(input.signingSeed);
  const client = input.client ?? createDefaultChainClient();
  const commissionBps = normalizeCommissionBps(input.commissionBps);
  const submittedTransaction = await signAndSendWithFreshBlockhash(client, (latestBlockhash) => {
    return buildSignedUpdateCommissionTransaction({
      stakerSeed: signingSeed,
      validatorAddress: input.validatorAddress,
      recentBlockhash: latestBlockhash.blockhash,
      commissionBps
    });
  });

  return {
    signature: submittedTransaction.result.signature,
    lamports: 0n,
    latestBlockhash: submittedTransaction.latestBlockhash,
    rpcEndpoint: submittedTransaction.rpcEndpoint
  };
}

export async function submitDeployContractTransaction(input) {
  const signingSeed = requireSigningSeed(input.signingSeed);
  const depositLamports = parseLamports(input.depositLamports);
  const client = input.client ?? createDefaultChainClient();
  const submittedTransaction = await signAndSendWithFreshBlockhash(client, (latestBlockhash) => {
    return buildSignedDeployContractTransaction({
      payerSeed: signingSeed,
      recentBlockhash: latestBlockhash.blockhash,
      bytecodeBase64: input.bytecodeBase64,
      bytecodeHash: input.bytecodeHash,
      depositLamports,
      requestId: input.requestId
    });
  });

  return {
    ...submittedTransaction.signedTransaction,
    signature: submittedTransaction.result.signature,
    latestBlockhash: submittedTransaction.latestBlockhash,
    rpcEndpoint: submittedTransaction.rpcEndpoint
  };
}

export async function waitForTransactionFinality(input) {
  const client = input.client ?? createDefaultChainClient();
  const signature = String(input.signature ?? '').trim();
  const maxAttempts = normalizePositiveInteger(input.maxAttempts ?? 8, 'maxAttempts');
  const delayMillis = normalizePositiveInteger(input.delayMillis ?? 1200, 'delayMillis');

  if (signature.length === 0) {
    throw new Error('交易签名不能为空');
  }

  let latestDetail = null;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    latestDetail = await client.getTransaction(signature);
    if (latestDetail.found && latestDetail.status !== 'pending' && latestDetail.status !== 'not_found') {
      return latestDetail;
    }
    await delay(delayMillis);
  }

  return latestDetail;
}

function requireSigningSeed(signingSeed) {
  if (typeof signingSeed !== 'string' || signingSeed.trim().length === 0) {
    throw new Error('当前钱包未解锁：请先导入或创建助记词后再提交链上交易');
  }
  return signingSeed.trim();
}

async function signAndSendWithFreshBlockhash(client, buildSignedTransaction) {
  const submissionClient = await resolveTransactionSubmissionClient(client);
  let lastError = null;
  for (let attemptIndex = 0; attemptIndex < 2; attemptIndex += 1) {
    const latestBlockhash = await submissionClient.getLatestBlockhash();
    const signedTransaction = buildSignedTransaction(latestBlockhash);
    const encodedTransaction = extractEncodedTransaction(signedTransaction);

    try {
      const result = await submissionClient.sendTransaction(encodedTransaction);
      await ensureSubmittedTransactionVisible(submissionClient, result.signature);
      return {
        result,
        latestBlockhash,
        rpcEndpoint: submissionClient.endpoint,
        signedTransaction
      };
    } catch (error) {
      lastError = error;
      if (attemptIndex > 0 || !isRetryableBlockhashError(error)) {
        throw error;
      }
      console.info('[chain-operations] retrying transaction with fresh blockhash', {
        blockhash: latestBlockhash.blockhash,
        reason: error instanceof Error ? error.message : String(error)
      });
    }
  }
  throw lastError ?? new Error('交易提交失败');
}

async function resolveTransactionSubmissionClient(client) {
  const currentReadiness = await getTransactionSubmissionReadiness(client);
  if (currentReadiness.ready || !currentReadiness.shouldFallback) {
    return client;
  }

  const candidateResults = await Promise.all(PUBLIC_VALIDATOR_RPC_URLS
    .map((rpcUrl) => new JsonRpcClient(rpcUrl, client.timeoutMillis))
    .filter((candidateClient) => candidateClient.endpoint !== client.endpoint)
    .map(async (candidateClient) => ({
      client: candidateClient,
      readiness: await getTransactionSubmissionReadiness(candidateClient)
    })));

  for (const candidateResult of candidateResults) {
    if (candidateResult.readiness.ready) {
      console.info('[chain-operations] switched transaction submission rpc', {
        from: client.endpoint,
        reason: currentReadiness.reason,
        to: candidateResult.client.endpoint
      });
      return candidateResult.client;
    }
  }

  const candidateReasons = candidateResults
    .map((candidateResult) => `${candidateResult.client.endpoint}: ${candidateResult.readiness.reason}`)
    .join('；');
  throw new Error(`当前 RPC 节点不能出块或转发交易：${currentReadiness.reason}；公网验证者 RPC 暂不可用（${candidateReasons}），请切换到在线验证者 RPC 后重试。`);
}

async function getTransactionSubmissionReadiness(client) {
  try {
    const health = await client.getHealth();
    if (health?.transaction_submission_enabled === true) {
      return { ready: true, reason: 'ready', shouldFallback: false };
    }

    if (health?.transaction_submission_enabled === false) {
      return {
        ready: false,
        reason: health?.transaction_submission_reason ?? 'transaction_submission_disabled',
        shouldFallback: true
      };
    }

    if (health?.chain_progressing === false) {
      return {
        ready: false,
        reason: health?.transaction_submission_reason ?? 'chain_head_not_progressing',
        shouldFallback: true
      };
    }

    if (health?.liveness_production_enabled === true) {
      if (health?.chain_progressing === true) {
        return { ready: true, reason: 'producing', shouldFallback: false };
      }
      const progressReadiness = await probeRpcHeadProgress(client, health);
      if (!progressReadiness.ready) {
        return progressReadiness;
      }
      return { ready: true, reason: 'producing', shouldFallback: false };
    }

    if (health?.liveness_mode === 'rpc_only' || health?.liveness_state === 'disabled') {
      return {
        ready: false,
        reason: health?.liveness_reason ?? health?.liveness_mode ?? 'rpc_only',
        shouldFallback: true
      };
    }

    if (health?.liveness_production_enabled === false) {
      return {
        ready: false,
        reason: health?.liveness_reason ?? 'production_disabled',
        shouldFallback: true
      };
    }

    return { ready: health?.ok !== false, reason: 'health_ok', shouldFallback: false };
  } catch (error) {
    return {
      ready: true,
      reason: error instanceof Error ? error.message : String(error),
      shouldFallback: false
    };
  }
}

async function probeRpcHeadProgress(client, firstHealth) {
  if (!Number.isSafeInteger(firstHealth?.head_height) || !Number.isSafeInteger(firstHealth?.head_slot)) {
    return { ready: true, reason: 'health_ok', shouldFallback: false };
  }

  await delay(RPC_HEAD_PROGRESS_PROBE_DELAY_MILLIS);
  const secondHealth = await client.getHealth();
  if (secondHealth?.transaction_submission_enabled === true || secondHealth?.chain_progressing === true) {
    return { ready: true, reason: 'ready', shouldFallback: false };
  }

  const firstHead = BigInt(firstHealth.head_height);
  const secondHead = BigInt(Number.isSafeInteger(secondHealth?.head_height) ? secondHealth.head_height : firstHealth.head_height);
  const firstSlot = BigInt(firstHealth.head_slot);
  const secondSlot = BigInt(Number.isSafeInteger(secondHealth?.head_slot) ? secondHealth.head_slot : firstHealth.head_slot);
  if (secondHead > firstHead || secondSlot > firstSlot) {
    return { ready: true, reason: 'head_progressed', shouldFallback: false };
  }

  return { ready: false, reason: 'chain_head_not_progressing', shouldFallback: true };
}

async function ensureSubmittedTransactionVisible(client, signature) {
  if (typeof client.getTransaction !== 'function' || typeof signature !== 'string' || signature.length === 0) {
    return;
  }

  for (let attemptIndex = 0; attemptIndex < RPC_SUBMISSION_VISIBILITY_ATTEMPTS; attemptIndex += 1) {
    const detail = await client.getTransaction(signature);
    if (detail?.found && detail?.status !== 'not_found') {
      return;
    }
    if (attemptIndex + 1 < RPC_SUBMISSION_VISIBILITY_ATTEMPTS) {
      await delay(RPC_SUBMISSION_VISIBILITY_DELAY_MILLIS);
    }
  }

  throw new Error(`RPC 已返回签名但交易未进入 mempool 或区块：${signature}`);
}

function extractEncodedTransaction(signedTransaction) {
  if (typeof signedTransaction === 'string' && signedTransaction.trim().length > 0) {
    return signedTransaction;
  }
  if (typeof signedTransaction?.encodedTransaction === 'string'
    && signedTransaction.encodedTransaction.trim().length > 0) {
    return signedTransaction.encodedTransaction;
  }
  throw new Error('签名交易编码不能为空');
}

function isRetryableBlockhashError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /recent blockhash is not valid|blockhash not found|latest blockhash expired|BlockhashNotFound|TransactionExpiredBlockheightExceeded|block height exceeded|区块哈希已过期|区块哈希无效/i.test(message);
}

async function submitStakeLikeTransaction(input, kind) {
  const signingSeed = requireSigningSeed(input.signingSeed);
  const lamports = parseLamports(input.lamports);
  if (lamports < MINIMUM_VALIDATOR_STAKE_LAMPORTS) {
    throw new Error(`质押金额不能低于 ${MINIMUM_VALIDATOR_STAKE_LAMPORTS.toString()} lamports`);
  }

  const client = input.client ?? createDefaultChainClient();
  const unlockEpoch = kind === 'unstake' || kind === 'undelegate'
    ? await getNextUnlockEpoch(client)
    : 0n;
  const submittedTransaction = await signAndSendWithFreshBlockhash(client, (latestBlockhash) => {
    const transactionInput = {
      stakerSeed: signingSeed,
      validatorAddress: input.validatorAddress,
      recentBlockhash: latestBlockhash.blockhash,
      lamports,
      unlockEpoch
    };
    return buildStakeOperationTransaction(transactionInput, kind);
  });

  return {
    signature: submittedTransaction.result.signature,
    lamports,
    latestBlockhash: submittedTransaction.latestBlockhash,
    rpcEndpoint: submittedTransaction.rpcEndpoint
  };
}

async function submitStakeWithdrawTransaction(input, kind) {
  const signingSeed = requireSigningSeed(input.signingSeed);
  const client = input.client ?? createDefaultChainClient();
  const currentEpoch = await getCurrentEpoch(client);
  const submittedTransaction = await signAndSendWithFreshBlockhash(client, (latestBlockhash) => {
    const transactionInput = {
      stakerSeed: signingSeed,
      validatorAddress: input.validatorAddress,
      recentBlockhash: latestBlockhash.blockhash,
      currentEpoch
    };
    return kind === 'withdrawDelegation'
      ? buildSignedWithdrawDelegationTransaction(transactionInput)
      : buildSignedWithdrawUnstakedTransaction(transactionInput);
  });

  return {
    signature: submittedTransaction.result.signature,
    lamports: 0n,
    latestBlockhash: submittedTransaction.latestBlockhash,
    rpcEndpoint: submittedTransaction.rpcEndpoint
  };
}

function buildStakeOperationTransaction(transactionInput, kind) {
  if (kind === 'delegate') {
    return buildSignedDelegateTransaction(transactionInput);
  }

  if (kind === 'unstake') {
    return buildSignedUnstakeTransaction(transactionInput);
  }

  if (kind === 'undelegate') {
    return buildSignedUndelegateTransaction(transactionInput);
  }

  return buildSignedStakeTransaction(transactionInput);
}

async function getNextUnlockEpoch(client) {
  return (await getCurrentEpoch(client)) + 1n;
}

async function getCurrentEpoch(client) {
  const nodeStatus = await client.getNodeStatus();
  const epochValue = nodeStatus.epoch_id ?? nodeStatus.consensus?.epoch_id;
  if (!Number.isSafeInteger(epochValue) || epochValue < 0) {
    throw new Error('公网 RPC 未返回有效 epoch_id，无法构造撤资交易');
  }
  return BigInt(epochValue);
}

function normalizePositiveInteger(value, fieldName) {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${fieldName} 必须是正整数`);
  }
  return value;
}

function normalizeCommissionBps(value) {
  const normalizedValue = Number(value);
  if (!Number.isSafeInteger(normalizedValue) || normalizedValue < 0 || normalizedValue > 10000) {
    throw new Error('佣金 bps 必须是 0..10000 的整数');
  }
  return normalizedValue;
}

function delay(delayMillis) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMillis);
  });
}
