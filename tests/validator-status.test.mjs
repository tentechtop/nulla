import assert from 'node:assert/strict';
import test from 'node:test';
import {
  countOnlineValidatorRows,
  createValidatorDisplayRows,
  VALIDATOR_STALE_SLOT_LAG
} from '../src/utils/validatorStatus.js';

function createValidator(peerID = 'peer-a') {
  return {
    account_address: 'TValidatorAddress1111111111111111111111111',
    commission_bps: 0,
    consensus_public_key: 'consensus-a',
    p2p_peer_id: peerID,
    stake_lamports: 10000000,
    status: 'active',
    validator_id: 'validator-a'
  };
}

test('active validators are offline when their peers are disconnected', () => {
  const rows = createValidatorDisplayRows(
    [createValidator('peer-a'), createValidator('peer-b')],
    [
      { connected: false, latest_slot: 100, peer_id: 'peer-a', validator: true },
      { connected: false, latest_slot: 100, peer_id: 'peer-b', validator: true }
    ],
    { head_slot: 100, peer_id: 'rpc-peer' },
    { ok: true, head_slot: 100 },
    true
  );

  assert.equal(countOnlineValidatorRows(rows), 0);
  assert.deepEqual(rows.map((row) => row.reachabilityStatus), ['offline', 'offline']);
});

test('missing peer network never marks validators online', () => {
  const rows = createValidatorDisplayRows(
    [createValidator('peer-a')],
    [],
    { head_slot: 100, peer_id: 'rpc-peer' },
    { ok: true, head_slot: 100 },
    false
  );

  assert.equal(rows[0].reachabilityStatus, 'unknown');
  assert.equal(rows[0].reachabilityLabel, '待检测');
  assert.equal(countOnlineValidatorRows(rows), 0);
});

test('local rpc validator is online only when health is progressing', () => {
  const onlineRows = createValidatorDisplayRows(
    [createValidator('local-peer')],
    [],
    { consensus_enabled: true, head_slot: 100, peer_id: 'local-peer', validator_enabled: true },
    { chain_progressing: true, ok: true },
    false
  );
  const staleRows = createValidatorDisplayRows(
    [createValidator('local-peer')],
    [],
    { consensus_enabled: true, head_slot: 100, peer_id: 'local-peer', validator_enabled: true },
    { chain_progressing: false, ok: true },
    false
  );

  assert.equal(onlineRows[0].reachabilityStatus, 'online');
  assert.equal(staleRows[0].reachabilityStatus, 'unknown');
});

test('connected peers that lag too far behind are not online', () => {
  const rows = createValidatorDisplayRows(
    [createValidator('peer-a')],
    [{ connected: true, latest_slot: 100, peer_id: 'peer-a', validator: true }],
    { head_slot: 100 + VALIDATOR_STALE_SLOT_LAG + 1, peer_id: 'rpc-peer' },
    { ok: true, head_slot: 100 + VALIDATOR_STALE_SLOT_LAG + 1 },
    true
  );

  assert.equal(rows[0].reachabilityStatus, 'offline');
  assert.equal(rows[0].reachabilityDetail, '同步高度落后');
});
