export const VALIDATOR_REACHABILITY_STATUS = Object.freeze({
  OFFLINE: 'offline',
  ONLINE: 'online',
  UNKNOWN: 'unknown'
});

export const VALIDATOR_STALE_SLOT_LAG = 128;

export function createValidatorDisplayRows(
  validators,
  peers = [],
  nodeStatus = null,
  health = null,
  networkAvailable = false
) {
  const peerByID = createPeerByID(peers);

  return toArray(validators).map((validator) => ({
    ...validator,
    ...resolveValidatorReachability(validator, peerByID, nodeStatus, health, networkAvailable)
  }));
}

export function countOnlineValidatorRows(validators) {
  return toArray(validators).filter(isValidatorRowOnline).length;
}

export function isValidatorRowOnline(validator) {
  return validator?.reachabilityStatus === VALIDATOR_REACHABILITY_STATUS.ONLINE;
}

function resolveValidatorReachability(validator, peerByID, nodeStatus, health, networkAvailable) {
  const peerID = normalizeText(validator?.p2p_peer_id);

  if (isLocalValidatorOnline(peerID, nodeStatus, health)) {
    return createReachability(VALIDATOR_REACHABILITY_STATUS.ONLINE, '在线', '本机验证者已同步');
  }

  if (!networkAvailable) {
    return createReachability(VALIDATOR_REACHABILITY_STATUS.UNKNOWN, '待检测', 'RPC 未返回 P2P 可达性');
  }

  if (peerID.length === 0) {
    return createReachability(VALIDATOR_REACHABILITY_STATUS.UNKNOWN, '待检测', '缺少 PeerID');
  }

  const peer = peerByID.get(peerID);
  if (!peer) {
    return createReachability(VALIDATOR_REACHABILITY_STATUS.OFFLINE, '离线', 'P2P 未连接');
  }

  if (peer.connected !== true) {
    return createReachability(VALIDATOR_REACHABILITY_STATUS.OFFLINE, '离线', readPeerFailure(peer));
  }

  if (isPeerSlotStale(peer, nodeStatus, health)) {
    return createReachability(VALIDATOR_REACHABILITY_STATUS.OFFLINE, '离线', '同步高度落后');
  }

  return createReachability(VALIDATOR_REACHABILITY_STATUS.ONLINE, '在线', createPeerSlotText(peer));
}

// 功能目的：用 PeerID 建立 O(1) 查询表；实现原因：验证者列表渲染不能在每行线性扫描 peer 集合。
function createPeerByID(peers) {
  const peerByID = new Map();

  for (const peer of toArray(peers)) {
    const peerID = normalizeText(peer?.peer_id);
    if (peerID.length > 0) {
      peerByID.set(peerID, peer);
    }
  }

  return peerByID;
}

function isLocalValidatorOnline(peerID, nodeStatus, health) {
  if (peerID.length === 0 || peerID !== normalizeText(nodeStatus?.peer_id)) {
    return false;
  }

  if (nodeStatus?.validator_enabled === false || nodeStatus?.consensus_enabled === false) {
    return false;
  }

  if (health?.ok !== true || health?.chain_progressing === false) {
    return false;
  }

  return !isHealthHeadStale(health);
}

function isHealthHeadStale(health) {
  const headAgeMillis = toSafeNumber(health?.head_age_millis);
  const staleThresholdMillis = toSafeNumber(health?.head_stale_threshold_millis);

  if (headAgeMillis <= 0 || staleThresholdMillis <= 0) {
    return false;
  }

  return headAgeMillis > staleThresholdMillis;
}

function isPeerSlotStale(peer, nodeStatus, health) {
  const peerSlot = toSafeNumber(peer?.latest_slot);
  const headSlot = toSafeNumber(nodeStatus?.head_slot) || toSafeNumber(health?.head_slot);

  if (peerSlot <= 0 || headSlot <= 0) {
    return false;
  }

  return headSlot - peerSlot > VALIDATOR_STALE_SLOT_LAG;
}

function readPeerFailure(peer) {
  const lastError = normalizeText(peer?.last_error);
  return lastError.length > 0 ? lastError : 'P2P 未连接';
}

function createPeerSlotText(peer) {
  const latestSlot = toSafeNumber(peer?.latest_slot);
  return latestSlot > 0 ? `Slot ${latestSlot}` : 'P2P 已连接';
}

function createReachability(reachabilityStatus, reachabilityLabel, reachabilityDetail) {
  return {
    reachabilityDetail,
    reachabilityLabel,
    reachabilityStatus
  };
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toSafeNumber(value) {
  return Number.isSafeInteger(value) && Number(value) >= 0 ? Number(value) : 0;
}
