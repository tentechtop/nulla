import assert from 'node:assert/strict';
import test from 'node:test';
import { createWalletDposSummary, formatLamportsAsSol, loadWalletPortfolio } from '../src/utils/walletBusiness.js';

const walletAddress = 'TGT9QRAu2Lk6tYvkx4XKpXPCnkguaDbbB7TcZjT5S';

function createValidatorFixture() {
  return [
    {
      account_address: 'T2LDSjHQLR6byGfMBzKyqN6C4Z1twQeLEcqRKic2c',
      commission_bps: 125,
      delegated_lamports: 900,
      delegations: [
        {
          active_stake_lamports: 700,
          delegator_address: walletAddress,
          pending_stake_lamports: 30,
          reward_lamports: 11,
          unlocking_stake_lamports: 40
        }
      ],
      p2p_peer_id: 'peer-a',
      stake_lamports: 1900,
      status: 'active',
      validator_id: 'validator-a'
    },
    {
      account_address: 'T9G3M7uGAvxKXwh3f51HjqzcdjFsARz2tQCm3b3iG',
      commission_bps: 0,
      commission_reward_lamports: 23,
      delegated_lamports: 0,
      self_pending_stake_lamports: 200,
      self_reward_lamports: 17,
      self_stake_lamports: 1000,
      self_unlocking_stake_lamports: 50,
      p2p_peer_id: 'peer-b',
      stake_lamports: 1250,
      staker_address: walletAddress,
      status: 'active',
      validator_id: 'validator-b'
    }
  ];
}

test('wallet dpos summary aggregates self stake and delegations', () => {
  const summary = createWalletDposSummary(createValidatorFixture(), walletAddress);

  assert.equal(summary.selfStakeLamports, 1000n);
  assert.equal(summary.selfPendingLamports, 200n);
  assert.equal(summary.selfUnlockingLamports, 50n);
  assert.equal(summary.selfRewardLamports, 17n);
  assert.equal(summary.commissionRewardLamports, 23n);
  assert.equal(summary.delegatedLamports, 700n);
  assert.equal(summary.delegatedPendingLamports, 30n);
  assert.equal(summary.delegatedUnlockingLamports, 40n);
  assert.equal(summary.delegatedRewardLamports, 11n);
  assert.equal(summary.totalPowerLamports, 2020n);
  assert.equal(summary.totalRewardLamports, 51n);
  assert.equal(summary.validators.length, 2);
  assert.equal(summary.validators[0].reachabilityStatus, 'unknown');
});

test('wallet portfolio loads balance, node status, and validators from rpc client', async () => {
  const client = {
    endpoint: 'http://rpc.test',
    async getBalance(address) {
      assert.equal(address, walletAddress);
      return 1_234_567_890n;
    },
    async getHealth() {
      return { head_height: 77, head_slot: 88, ok: true };
    },
    async getNodeStatus() {
      return {
        consensus: { epoch_id: 6, validator_count: 2 },
        head_height: 77,
        head_slot: 88,
        known_peer_count: 4,
        validator_count: 2
      };
    },
    async getValidatorSet() {
      return { validators: createValidatorFixture() };
    },
    async getPeerNetwork() {
      return {
        local_peer_id: 'rpc-peer',
        peers: [
          { connected: true, latest_slot: 88, peer_id: 'peer-a', validator: true },
          { connected: false, latest_slot: 80, peer_id: 'peer-b', validator: true }
        ]
      };
    }
  };
  const portfolio = await loadWalletPortfolio(walletAddress, client);

  assert.equal(portfolio.availableSolText, '1.234567890');
  assert.equal(portfolio.chain.currentEpoch, 6);
  assert.equal(portfolio.chain.isHealthy, true);
  assert.equal(portfolio.chain.knownPeerCount, 4);
  assert.equal(portfolio.chain.rpcURL, 'http://rpc.test');
  assert.equal(portfolio.dpos.totalPowerLamports, 2020n);
  assert.equal(portfolio.dpos.validators[0].reachabilityStatus, 'online');
  assert.equal(portfolio.dpos.validators[1].reachabilityStatus, 'offline');
  assert.equal(formatLamportsAsSol(5000n), '0.000005000');
});
