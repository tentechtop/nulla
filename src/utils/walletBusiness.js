import { DEFAULT_PUBLIC_RPC_URL } from './chainRpc.js';
import { createDefaultChainClient } from './chainOperations.js';
import { createValidatorDisplayRows } from './validatorStatus.js';
import { formatShortAddress } from './walletSetup.js';

const LAMPORTS_PER_SOL = 1_000_000_000n;

export function createEmptyWalletPortfolio(address = null) {
  return {
    address,
    transparentLamports: 0n,
    privateLamports: 0n,
    totalLamports: 0n,
    availableSolText: formatLamportsAsSol(0n),
    privateSolText: formatLamportsAsSol(0n),
    totalSolText: formatLamportsAsSol(0n),
    tokenLamportsText: formatLamports(0n),
    chain: {
      currentEpoch: 0,
      error: '',
      headHeight: 0,
      headSlot: 0,
      isHealthy: false,
      knownPeerCount: 0,
      rpcURL: DEFAULT_PUBLIC_RPC_URL,
      validatorCount: 0
    },
    dpos: {
      commissionRewardLamports: 0n,
      delegatedLamports: 0n,
      delegatedPendingLamports: 0n,
      delegatedRewardLamports: 0n,
      delegatedUnlockingLamports: 0n,
      selfPendingLamports: 0n,
      selfRewardLamports: 0n,
      selfStakeLamports: 0n,
      selfUnlockingLamports: 0n,
      totalPowerLamports: 0n,
      totalRewardLamports: 0n,
      validatorCount: 0,
      validators: []
    }
  };
}

export async function loadWalletPortfolio(address = null, client = createDefaultChainClient()) {
  const normalizedAddress = typeof address === 'string' && address.trim().length > 0 ? address.trim() : null;
  const [balanceResult, healthResult, nodeStatusResult, validatorSetResult, peerNetworkResult] = await Promise.allSettled([
    normalizedAddress === null ? Promise.resolve(0n) : client.getBalance(normalizedAddress),
    client.getHealth(),
    client.getNodeStatus(),
    client.getValidatorSet(),
    callOptionalPeerNetwork(client)
  ]);
  const transparentLamports = balanceResult.status === 'fulfilled' ? toBigIntLamports(balanceResult.value) : 0n;
  const health = healthResult.status === 'fulfilled' ? healthResult.value : null;
  const nodeStatus = nodeStatusResult.status === 'fulfilled' ? nodeStatusResult.value : null;
  const validators = validatorSetResult.status === 'fulfilled' ? validatorSetResult.value.validators : [];
  const peers = peerNetworkResult.status === 'fulfilled' ? peerNetworkResult.value.peers : [];
  const dpos = createWalletDposSummary(
    validators,
    normalizedAddress,
    peers,
    nodeStatus,
    health,
    peerNetworkResult.status === 'fulfilled'
  );
  const error = firstRejectedMessage([balanceResult, healthResult, nodeStatusResult, validatorSetResult]);
  const validatorCount = safeNumber(nodeStatus?.consensus?.validator_count ?? nodeStatus?.validator_count ?? validators.length);
  const totalLamports = transparentLamports;

  return {
    ...createEmptyWalletPortfolio(normalizedAddress),
    transparentLamports,
    totalLamports,
    availableSolText: formatLamportsAsSol(transparentLamports),
    totalSolText: formatLamportsAsSol(totalLamports),
    tokenLamportsText: formatLamports(transparentLamports),
    chain: {
      currentEpoch: safeNumber(nodeStatus?.epoch_id ?? nodeStatus?.consensus?.epoch_id),
      error,
      headHeight: safeNumber(health?.head_height ?? nodeStatus?.head_height),
      headSlot: safeNumber(health?.head_slot ?? nodeStatus?.head_slot),
      isHealthy: Boolean(health?.ok),
      knownPeerCount: safeNumber(nodeStatus?.known_peer_count),
      rpcURL: client.endpoint ?? DEFAULT_PUBLIC_RPC_URL,
      validatorCount
    },
    dpos
  };
}

export function createWalletDposSummary(
  validators,
  walletAddress = null,
  peers = [],
  nodeStatus = null,
  health = null,
  networkAvailable = false
) {
  const normalizedAddress = typeof walletAddress === 'string' ? walletAddress.trim() : '';
  const displayValidators = createValidatorDisplayRows(validators, peers, nodeStatus, health, networkAvailable);
  let selfStakeLamports = 0n;
  let selfPendingLamports = 0n;
  let selfUnlockingLamports = 0n;
  let selfRewardLamports = 0n;
  let commissionRewardLamports = 0n;
  let delegatedLamports = 0n;
  let delegatedPendingLamports = 0n;
  let delegatedUnlockingLamports = 0n;
  let delegatedRewardLamports = 0n;

  for (const validator of displayValidators) {
    if (validator.staker_address === normalizedAddress) {
      selfStakeLamports += toBigIntLamports(validator.self_stake_lamports ?? validator.stake_lamports);
      selfPendingLamports += toBigIntLamports(validator.self_pending_stake_lamports);
      selfUnlockingLamports += toBigIntLamports(validator.self_unlocking_stake_lamports);
      selfRewardLamports += toBigIntLamports(validator.self_reward_lamports);
      commissionRewardLamports += toBigIntLamports(validator.commission_reward_lamports);
    }

    for (const delegation of validator.delegations ?? []) {
      if (delegation?.delegator_address !== normalizedAddress) {
        continue;
      }
      delegatedLamports += toBigIntLamports(delegation.active_stake_lamports);
      delegatedPendingLamports += toBigIntLamports(delegation.pending_stake_lamports);
      delegatedUnlockingLamports += toBigIntLamports(delegation.unlocking_stake_lamports);
      delegatedRewardLamports += toBigIntLamports(delegation.reward_lamports);
    }
  }

  const totalPowerLamports = selfStakeLamports
    + selfPendingLamports
    + selfUnlockingLamports
    + delegatedLamports
    + delegatedPendingLamports
    + delegatedUnlockingLamports;
  const totalRewardLamports = selfRewardLamports + commissionRewardLamports + delegatedRewardLamports;

  return {
    commissionRewardLamports,
    delegatedLamports,
    delegatedPendingLamports,
    delegatedRewardLamports,
    delegatedUnlockingLamports,
    selfPendingLamports,
    selfRewardLamports,
    selfStakeLamports,
    selfUnlockingLamports,
    totalPowerLamports,
    totalRewardLamports,
    validatorCount: displayValidators.length,
    validators: displayValidators.map(normalizeValidatorSummary)
  };
}

export function normalizeValidatorSummary(validator) {
  const delegatedLamports = toBigIntLamports(validator.delegated_lamports);
  const selfStakeLamports = toBigIntLamports(validator.self_stake_lamports ?? validator.stake_lamports);
  const totalStakeLamports = toBigIntLamports(validator.stake_lamports);

  return {
    accountAddress: String(validator.account_address ?? ''),
    commissionBps: safeNumber(validator.commission_bps),
    delegatedLamports,
    delegatorCount: safeNumber(validator.delegator_count),
    displayName: shortAddress(validator.account_address),
    selfStakeLamports,
    status: String(validator.status ?? 'unknown'),
    totalStakeLamports,
    p2pPeerID: String(validator.p2p_peer_id ?? ''),
    reachabilityDetail: String(validator.reachabilityDetail ?? 'RPC 未返回 P2P 可达性'),
    reachabilityLabel: String(validator.reachabilityLabel ?? '待检测'),
    reachabilityStatus: String(validator.reachabilityStatus ?? 'unknown'),
    validatorID: String(validator.validator_id ?? '')
  };
}

export function formatLamportsAsSol(value) {
  const lamports = toBigIntLamports(value);
  const whole = lamports / LAMPORTS_PER_SOL;
  const fraction = (lamports % LAMPORTS_PER_SOL).toString().padStart(9, '0');
  return `${formatIntegerWithCommas(whole.toString())}.${fraction}`;
}

export function formatLamports(value) {
  return formatIntegerWithCommas(toBigIntLamports(value).toString());
}

export function toBigIntLamports(value) {
  if (typeof value === 'bigint') {
    return value >= 0n ? value : 0n;
  }

  if (Number.isSafeInteger(value) && value >= 0) {
    return BigInt(value);
  }

  if (typeof value === 'string' && /^[0-9]+$/.test(value.trim())) {
    return BigInt(value.trim());
  }

  return 0n;
}

export function splitSolAmount(value) {
  const [integerPart = '0', decimalPart = '000000000'] = String(value).split('.');
  return {
    decimalPart: `.${decimalPart}`,
    integerPart
  };
}

function firstRejectedMessage(results) {
  const rejected = results.find((result) => result.status === 'rejected');
  if (rejected?.status !== 'rejected') {
    return '';
  }
  return rejected.reason instanceof Error ? rejected.reason.message : String(rejected.reason);
}

function callOptionalPeerNetwork(client) {
  if (typeof client.getPeerNetwork === 'function') {
    return client.getPeerNetwork();
  }

  return Promise.reject(new Error('getPeerNetwork 不可用'));
}

function formatIntegerWithCommas(value) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function safeNumber(value) {
  return Number.isFinite(value) && value >= 0 ? Number(value) : 0;
}

function shortAddress(address) {
  try {
    return formatShortAddress(String(address ?? ''), 7, 7);
  } catch {
    return String(address ?? '');
  }
}
