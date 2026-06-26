import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const chainExplorerSource = readFileSync(new URL('../src/features/chainExplorer/ChainExplorerScreens.tsx', import.meta.url), 'utf8');
const transactionScreenSource = chainExplorerSource.slice(
  chainExplorerSource.indexOf('export function TransactionHistoryScreen'),
  chainExplorerSource.indexOf('export function BlockDetailScreen')
);
const transactionRowSource = chainExplorerSource.slice(
  chainExplorerSource.indexOf('function TransactionHistoryRow'),
  chainExplorerSource.indexOf('function ConnectionPath')
);

test('transaction history uses dedicated native hero and grouped rows', () => {
  assert.match(transactionScreenSource, /<TransactionHistoryHero/);
  assert.match(transactionScreenSource, /<TransactionHistoryGroupCard/);
  assert.match(transactionScreenSource, /<TransactionHistoryEmptyCard/);
  assert.doesNotMatch(transactionScreenSource, /<ExplorerHeroCard/);
  assert.doesNotMatch(transactionScreenSource, /<QueryBody state=\{queryState\}/);
  assert.doesNotMatch(transactionScreenSource, /<ExplorerCard actionLabel=\{`共 \$\{group\.records\.length\} 笔`\}/);
  assert.match(chainExplorerSource, /function TransactionHistoryHero/);
  assert.match(chainExplorerSource, /function TransactionHistoryGroupCard/);
  assert.match(chainExplorerSource, /function TransactionHistoryEmptyCard/);
  assert.match(chainExplorerSource, /transactionHeroAccountText/);
  assert.match(chainExplorerSource, /transactionEmptyState/);
  assert.match(transactionRowSource, /transactionAmountBlock/);
  assert.match(transactionRowSource, /transactionStatusLine/);
  assert.doesNotMatch(transactionRowSource, /<RecordRow/);
});
