import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const chainExplorerSource = readFileSync(new URL('../src/features/chainExplorer/ChainExplorerScreens.tsx', import.meta.url), 'utf8');
const chainRpcTypeSource = readFileSync(new URL('../src/utils/chainRpc.d.ts', import.meta.url), 'utf8');
const blockIconSource = readFileSync(new URL('../src/features/chainExplorer/BlockDetailSvgIcons.tsx', import.meta.url), 'utf8');
const blockDetailSource = chainExplorerSource.slice(
  chainExplorerSource.indexOf('export function BlockDetailScreen'),
  chainExplorerSource.indexOf('export function ChainStatusScreen')
);
const blockTransactionListSource = chainExplorerSource.slice(
  chainExplorerSource.indexOf('function BlockTransactionList'),
  chainExplorerSource.indexOf('function RecentBlockTable')
);

test('block detail uses dedicated native sections and does not mislabel parent slot', () => {
  assert.match(blockDetailSource, /<BlockDetailHero/);
  assert.match(blockDetailSource, /<BlockHashPanel/);
  assert.match(blockDetailSource, /<BlockValidatorPanel block=\{detail\.block\}/);
  assert.match(blockDetailSource, /<BlockRuntimePanel/);
  assert.match(blockDetailSource, /<BlockDetailButtonRow/);
  assert.doesNotMatch(blockDetailSource, /<ExplorerHeroCard/);
  assert.match(blockDetailSource, /<BlockSlotQueryPanel/);
  assert.doesNotMatch(blockDetailSource, /Parent Hash/);
  assert.match(chainExplorerSource, /Parent Slot/);
  assert.match(blockTransactionListSource, /<BlockTransactionRow/);
  assert.doesNotMatch(blockTransactionListSource, /<RecordRow/);
  assert.match(blockIconSource, /BlockDetailIconName/);
  assert.match(blockIconSource, /M20 8L32 14L20 20L8 14L20 8Z/);
  assert.match(blockIconSource, /M14 9H29L37 17V37/);
});

test('block detail recreates the 15 design card hierarchy with native components', () => {
  assert.match(chainExplorerSource, /createBlockFinalityText\(detail\)/);
  assert.match(chainExplorerSource, /Array\.isArray\(transactions\) \? String\(transactions\.length\) : unavailableText/);
  assert.match(chainExplorerSource, /styles\.blockValidatorActionButton/);
  assert.match(chainExplorerSource, /当前区块未返回交易列表/);
  assert.match(chainExplorerSource, /blockTransactionTag/);
  assert.match(chainExplorerSource, /blockTransactionAmountBlock/);
  assert.match(chainExplorerSource, /readLamportsText\(transactionRecord, \['amount_lamports', 'lamports'\]\)/);
  assert.match(chainExplorerSource, /readLamportsText\(transactionRecord, \['fee_lamports', 'fee'\]\)/);
  assert.match(chainExplorerSource, /blockHero: \{[\s\S]*height: scaled\(372, scale\)/);
  assert.match(chainExplorerSource, /blockHeroMetric: \{[\s\S]*minHeight: scaled\(75, scale\)/);
  assert.doesNotMatch(blockDetailSource, /copyMessage\.length > 0/);
});

test('block detail renders real leader fields without fabricating validator data', () => {
  assert.match(chainRpcTypeSource, /readonly leader_address\?: string/);
  assert.match(chainRpcTypeSource, /readonly leader_address_source\?: 'block' \| 'transaction_detail'/);
  assert.match(chainExplorerSource, /readBlockLeaderAddress\(block\)/);
  assert.match(chainExplorerSource, /resolveBlockLeaderFromTransaction\(client, rawBlock\)/);
  assert.match(chainExplorerSource, /client\.getTransaction\(transactionSignature\)/);
  assert.match(chainExplorerSource, /leader_address_source: 'transaction_detail'/);
  assert.match(chainExplorerSource, /当前 RPC 未提供出块者字段/);
  assert.match(chainExplorerSource, /通过 getTransaction 确认出块 leader/);
  assert.match(chainExplorerSource, /styles\.blockValidatorStatusDotSuccess/);
  assert.match(chainExplorerSource, /formatOptionalLamports\(block\.leader_stake_lamports\)/);
  assert.match(chainExplorerSource, /formatBasisPoints\(block\.leader_commission_bps\)/);
  assert.match(chainExplorerSource, /formatOptionalLamports\(block\.base_fee_lamports\)/);
  assert.doesNotMatch(chainExplorerSource, /验证者不可用/);
  assert.doesNotMatch(chainExplorerSource, /当前 RPC getBlock 未返回 leader_address/);
});
