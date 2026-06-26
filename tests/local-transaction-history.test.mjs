import assert from 'node:assert/strict';
import test from 'node:test';
import {
  loadLocalTransactionRecords,
  mergeLocalTransactionRecords,
  saveLocalTransactionRecord
} from '../src/utils/localTransactionHistory.js';

const walletAddress = '4vgAxQAXeKXhyrJyQ5XDXzr1wR92NaS631GEkDjdhRn9';
const validatorAddress = 'FWQwmnVe7VUicjatmWh1eRvLr1Bbiky6w9LrVGyTNDex';
const signature = '3fL6kUDFEsngJMCPBnUWKijYvDhAXNXgmbiKGTMmxo6mBrdXeCAf57hvCkua3te94YiRJVRqxvbRdvj3ZmDuvu8U';

function createMemoryStorage() {
  let text = '';
  return {
    read: async () => text,
    write: async (nextText) => {
      text = nextText;
    }
  };
}

test('local transaction history updates submitted DPoS records without duplicates', async () => {
  const storage = createMemoryStorage();

  const pendingRecord = await saveLocalTransactionRecord({
    amountLamports: 20000000n,
    blockHeight: 4800,
    blockhash: 'AcGJdkxQTA8K2s7PVh5nYX8skMXXNpoW7GDy93sRSghB',
    counterparty: validatorAddress,
    kind: 'stake_deposit',
    location: 'mempool',
    ownerAddress: walletAddress,
    signature,
    slot: 5100,
    status: 'pending',
    submitTimeUnixMilli: 1000
  }, storage.read, storage.write);

  assert.equal(pendingRecord.status, 'pending');
  assert.equal(pendingRecord.location, 'mempool');

  await saveLocalTransactionRecord({
    amountLamports: '20000000',
    blockHeight: 4832,
    blockhash: '93wAQ9aBpR2CvLaDwhCQ51yebPWBwjMwyVkwUfPza3A2',
    counterparty: validatorAddress,
    finalized: true,
    kind: 'stake_deposit',
    location: 'block',
    ownerAddress: walletAddress,
    signature,
    slot: 5174,
    status: 'finalized',
    submitTimeUnixMilli: 2000
  }, storage.read, storage.write);

  const records = await loadLocalTransactionRecords(walletAddress, storage.read);
  assert.equal(records.length, 1);
  assert.equal(records[0].signature, signature);
  assert.equal(records[0].status, 'finalized');
  assert.equal(records[0].slot, 5174);
  assert.equal(records[0].amount_lamports, '20000000');
});

test('local transaction history merges with RPC history and keeps RPC duplicate as source of truth', () => {
  const rpcRecord = {
    amount_lamports: '12345678',
    block_height: 2131,
    blockhash: '561wZjSW6Qh5HScLtDrv7kn3eo6xxAMsKL4HJRkSEyMr',
    counterparty: 'CW9KjhQv74431eZrabc9kXbCP1X4PX369gScgaDn3WXZ',
    direction: 'outgoing',
    finalized: true,
    kind: 'transfer',
    location: 'block',
    signature: '3pWQKk7nF9GgvpC54Rk5ccxWkicjC7Z2RWNeCwehJpkaJMTYvCCvtdnEqPYJnt9D1XRJ76P26uPNx1KWWKD2aYzC',
    slot: 2249,
    status: 'finalized',
    submit_time_unix_milli: 0
  };
  const localDposRecord = {
    amount_lamports: '20000000',
    block_height: 4832,
    blockhash: '93wAQ9aBpR2CvLaDwhCQ51yebPWBwjMwyVkwUfPza3A2',
    counterparty: validatorAddress,
    direction: 'outgoing',
    finalized: true,
    kind: 'stake_deposit',
    location: 'block',
    signature,
    slot: 5174,
    status: 'finalized',
    submit_time_unix_milli: 2000
  };
  const duplicateLocalRecord = {
    ...rpcRecord,
    amount_lamports: '1',
    submit_time_unix_milli: 3000
  };

  const mergedHistory = mergeLocalTransactionRecords({
    address: walletAddress,
    has_more: false,
    records: [rpcRecord],
    scope: 'transparent_balance_changes_only'
  }, [localDposRecord, duplicateLocalRecord]);

  assert.equal(mergedHistory.records.length, 2);
  assert.equal(mergedHistory.records[0].signature, signature);
  assert.equal(mergedHistory.records[1].amount_lamports, '12345678');
  assert.equal(mergedHistory.scope, 'transparent_balance_changes_only+local_submitted');
});
