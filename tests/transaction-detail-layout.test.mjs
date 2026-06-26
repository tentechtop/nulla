import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { getTransactionDetailLayoutMetrics } from '../src/features/transactionDetail/layout.js';
import {
  DEFAULT_TRANSACTION_DETAIL_DATA,
  createSubmittedTransactionDetail,
  createTransactionDetailFromRpc
} from '../src/features/transactionDetail/transactionDetailData.js';

const detailSource = readFileSync(new URL('../src/features/transactionDetail/TransactionDetailScreen.tsx', import.meta.url), 'utf8');
const dataSource = readFileSync(new URL('../src/features/transactionDetail/transactionDetailData.js', import.meta.url), 'utf8');
const assetsSource = readFileSync(new URL('../src/features/transactionDetail/designAssets.ts', import.meta.url), 'utf8');
const iconsSource = readFileSync(new URL('../src/features/transactionDetail/TransactionDetailSvgIcons.tsx', import.meta.url), 'utf8');

test('getTransactionDetailLayoutMetrics scales the transaction detail canvas', () => {
  const compact = getTransactionDetailLayoutMetrics(426, 0, 0);
  const source = getTransactionDetailLayoutMetrics(852, 0, 0);

  assert.equal(compact.scale, 0.5);
  assert.equal(compact.contentHeight, 800);
  assert.equal(compact.bottomNavSliceHeight, 62);
  assert.equal(source.contentHeight, 1599);
  assert.equal(source.bottomNavSliceHeight, 123);
});

test('getTransactionDetailLayoutMetrics keeps safe areas outside design scale', () => {
  const metrics = getTransactionDetailLayoutMetrics(393, 47, 34);

  assert.equal(metrics.topSafeArea, 47);
  assert.equal(metrics.bottomNavHeight, metrics.bottomNavSliceHeight + 34);
  assert.equal(metrics.contentWidth, 393);
});

test('getTransactionDetailLayoutMetrics rejects unsafe viewport inputs', () => {
  assert.throws(() => getTransactionDetailLayoutMetrics(0, 0, 0), /viewportWidth/);
  assert.throws(() => getTransactionDetailLayoutMetrics(393, -1, 0), /topSafeArea/);
  assert.throws(() => getTransactionDetailLayoutMetrics(393, 0, Number.NaN), /bottomSafeArea/);
});

test('transaction detail page uses native sections and supplied visual assets', () => {
  assert.match(assetsSource, /background-block-detail-card-hd\.png/);
  assert.match(dataSource, /透明转账/);
  assert.match(detailSource, /Signature/);
  assert.match(detailSource, /Instruction Count/);
  assert.match(detailSource, /createTransactionDetailFromRpc/);
  assert.match(detailSource, /function FeeBreakdownCard/);
  assert.match(iconsSource, /function TransactionSolanaMarkIcon/);
  assert.match(iconsSource, /function TransactionBlockIcon/);
  assert.doesNotMatch(detailSource, /14-transaction-detail\.png/);
  assert.doesNotMatch(detailSource, /SvgXml/);
});

test('submitted transaction detail carries form amount and addresses into the page', () => {
  const detail = createSubmittedTransactionDetail({
    amountLamports: '1000000',
    mode: 'privateToTransparent',
    receiverAddress: 'ZfVME5d1V9auappzpxETWDaCNPqB7IQxT4kLmN8oR2yF',
    senderAddress: 'TGT9QRAu2LZMkSSdpCEMNigQqSLG5FXy6hYuBTcZjT5S'
  });

  assert.equal(DEFAULT_TRANSACTION_DETAIL_DATA.status, 'Finalized');
  assert.equal(detail.amountLamports, '1,000,000');
  assert.equal(detail.transactionType, '隐私转透明');
  assert.equal(detail.receiverAddress, 'ZfVME5d1V9auappzpxETWDaCNPqB7IQxT4kLmN8oR2yF');
  assert.equal(detail.senderAddress, 'TGT9QRAu2LZMkSSdpCEMNigQqSLG5FXy6hYuBTcZjT5S');
});

test('submitted transaction detail does not replace empty form fields with sample addresses', () => {
  const detail = createSubmittedTransactionDetail({
    amountLamports: '',
    mode: 'auto',
    receiverAddress: '',
    senderAddress: null
  });

  assert.equal(detail.amountLamports, '0');
  assert.equal(detail.receiverAddress, '');
  assert.equal(detail.senderAddress, '');
});

test('rpc transaction detail replaces submitted placeholders with live mempool data', () => {
  const submitted = createSubmittedTransactionDetail({
    amountLamports: '123456',
    mode: 'transparent',
    receiverAddress: 'TCW9KjhQv74431eZrabc9kXbCP1X4PX369gScgTQAbCd',
    rpcEndpoint: 'http://101.35.87.31:8910/',
    senderAddress: 'T4vgAxQAXeKXhyrJyQ5XDXzr1wR92NaS631GEkDjdhRn9',
    signature: '34LdL648981D6KEi19vg5serYi1fTPf8cdbz2WDQVsHqBpGgce7nnRDhzPVCYhYizYUcmCTBe9VGyZtoWh1eKnAA'
  });
  const liveDetail = createTransactionDetailFromRpc({
    account_addresses: [
      '4vgAxQAXeKXhyrJyQ5XDXzr1wR92NaS631GEkDjdhRn9',
      'CW9KjhQv74431eZrabc9kXbCP1X4PX369gScgTQAbCd'
    ],
    base_fee_lamports: 5000,
    block_height: 0,
    burned_fee_lamports: 2500,
    fee_lamports: 5000,
    finalized: false,
    found: true,
    instruction_count: 1,
    leader_fee_lamports: 2500,
    location: 'mempool',
    prioritization_fee_lamports: 0,
    recent_blockhash: 'GW1k7ZhAvF8SMMUmDjhY1cxpL93NXqsYMas6VXoNXJ8D',
    sender: '4vgAxQAXeKXhyrJyQ5XDXzr1wR92NaS631GEkDjdhRn9',
    signature: submitted.signature,
    slot: 0,
    status: 'pending',
    submit_time_unix_milli: 1782302254929,
    writable_addresses: ['4vgAxQAXeKXhyrJyQ5XDXzr1wR92NaS631GEkDjdhRn9']
  }, submitted);

  assert.equal(liveDetail.amountLamports, '123,456');
  assert.equal(liveDetail.location, 'mempool');
  assert.equal(liveDetail.status, '处理中');
  assert.equal(liveDetail.slot, '-');
  assert.equal(liveDetail.blockHeight, '-');
  assert.equal(liveDetail.submitTime.includes('2024-05-20'), false);
  assert.equal(liveDetail.baseFeeLamports, '5,000');
  assert.equal(liveDetail.priorityFeeLamports, '0');
  assert.equal(liveDetail.burnedFeeLamports, '2,500');
  assert.equal(liveDetail.leaderFeeLamports, '2,500');
  assert.equal(liveDetail.instructions[0].name, 'rpc_transaction');
});
