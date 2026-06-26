import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const chainExplorerSource = readFileSync(new URL('../src/features/chainExplorer/ChainExplorerScreens.tsx', import.meta.url), 'utf8');

const chainStatusSource = chainExplorerSource.slice(
  chainExplorerSource.indexOf('export function ChainStatusScreen'),
  chainExplorerSource.indexOf('function ChainStatusContent')
);
const networkStatusSource = chainExplorerSource.slice(
  chainExplorerSource.indexOf('export function NetworkStatusScreen'),
  chainExplorerSource.indexOf('function NetworkStatusContent')
);
const rpcNodeSource = chainExplorerSource.slice(
  chainExplorerSource.indexOf('export function RpcNodeDetailScreen'),
  chainExplorerSource.indexOf('// 功能目的：承载 RPC 详情专用结构')
);
const validatorListSource = chainExplorerSource.slice(
  chainExplorerSource.indexOf('export function ValidatorListScreen'),
  chainExplorerSource.indexOf('function ValidatorListHero')
);
const validatorStakeSource = chainExplorerSource.slice(
  chainExplorerSource.indexOf('export function ValidatorDetailStakeScreen'),
  chainExplorerSource.indexOf('function ValidatorStakeHero')
);
const contractDeploySource = chainExplorerSource.slice(
  chainExplorerSource.indexOf('export function ContractDeployConfirmScreen'),
  chainExplorerSource.indexOf('function ExplorerShell')
);

test('chain, network, and rpc failure states preserve design structure', () => {
  assert.match(chainStatusSource, /const visibleData = queryState\.data \?\? createUnavailableChainStatusData\(\)/);
  assert.match(chainStatusSource, /<ChainStatusContent/);
  assert.doesNotMatch(chainStatusSource, /<QueryBody state=\{queryState\}/);
  assert.match(networkStatusSource, /const visibleData = queryState\.data \?\? createUnavailableNetworkStatusData\(\)/);
  assert.match(networkStatusSource, /<NetworkStatusContent/);
  assert.doesNotMatch(networkStatusSource, /<QueryBody state=\{queryState\}/);
  assert.match(rpcNodeSource, /const visibleData = queryState\.data \?\? createUnavailableRpcNodeDetailData\(\)/);
  assert.match(rpcNodeSource, /<RpcNodeDetailContent/);
  assert.doesNotMatch(rpcNodeSource, /<QueryBody state=\{queryState\}/);
});

test('validator list and stake detail use dedicated native draft sections', () => {
  assert.match(validatorListSource, /<ValidatorListHero/);
  assert.match(validatorListSource, /<ValidatorSearchPanel/);
  assert.match(validatorListSource, /<ValidatorListCard/);
  assert.match(validatorListSource, /createValidatorDisplayRows/);
  assert.match(validatorListSource, /getPeerNetwork\(\)/);
  assert.match(chainExplorerSource, /selectedFilter === '在线' && isValidatorRowOnline\(validator\)/);
  assert.doesNotMatch(chainExplorerSource, /createDesignValidatorRows/);
  assert.doesNotMatch(chainExplorerSource, /validator\.status === 'active'\)[\s\S]*label="已连接"/);
  assert.match(validatorStakeSource, /<ValidatorStakeHero/);
  assert.match(validatorStakeSource, /<ValidatorStakeMetricStrip/);
  assert.match(validatorStakeSource, /<ValidatorPositionCard/);
  assert.match(validatorStakeSource, /<ValidatorStakeOperationCard/);
  assert.doesNotMatch(validatorStakeSource, /<InputPanel/);
});

test('contract deploy confirm has inputs without repeated submit buttons', () => {
  assert.match(contractDeploySource, /<DeployInputPanel label="请求 ID"/);
  assert.match(contractDeploySource, /label: currentWalletSigningSeed \? '签名并部署' : '导入助记词解锁'/);
  assert.doesNotMatch(contractDeploySource, /buttonLabel=\{currentWalletSigningSeed \? '提交部署' : '导入助记词解锁'\}/);
  assert.doesNotMatch(contractDeploySource, /<InputPanel/);
});

test('block detail restores the slot query panel', () => {
  const blockDetailSource = chainExplorerSource.slice(
    chainExplorerSource.indexOf('export function BlockDetailScreen'),
    chainExplorerSource.indexOf('export function ChainStatusScreen')
  );
  assert.match(blockDetailSource, /<BlockSlotQueryPanel/);
  assert.match(chainExplorerSource, /placeholder="输入 Slot \/ Height 查询区块"/);
});
