import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const chainExplorerSource = readFileSync(new URL('../src/features/chainExplorer/ChainExplorerScreens.tsx', import.meta.url), 'utf8');
const rpcNodeDetailSource = chainExplorerSource.slice(
  chainExplorerSource.indexOf('export function RpcNodeDetailScreen'),
  chainExplorerSource.indexOf('export function ValidatorListScreen')
);

test('rpc node detail uses dedicated native sections instead of generic cards', () => {
  assert.match(rpcNodeDetailSource, /<RpcNodeDetailContent/);
  assert.match(rpcNodeDetailSource, /<RpcDetailHeroCard/);
  assert.match(rpcNodeDetailSource, /<RpcCapabilityCard/);
  assert.match(rpcNodeDetailSource, /<RpcPerformanceCard/);
  assert.match(rpcNodeDetailSource, /<RpcUpstreamValidatorCard/);
  assert.match(rpcNodeDetailSource, /<RpcSecurityBoundaryCard/);
  assert.match(rpcNodeDetailSource, /<RpcRuntimeLogCard/);
  assert.match(rpcNodeDetailSource, /<RpcDetailActionBar/);
  assert.doesNotMatch(rpcNodeDetailSource, /<ExplorerHeroCard/);
  assert.doesNotMatch(rpcNodeDetailSource, /<ExplorerCard/);
  assert.doesNotMatch(chainExplorerSource, /32-rpc-node-detail\.png/);
});

test('rpc node detail keeps real-data boundaries while matching the design hierarchy', () => {
  assert.match(chainExplorerSource, /background-rpc-node-detail-hd\.png/);
  assert.match(rpcNodeDetailSource, /公网入口 · bootnode-101/);
  assert.match(rpcNodeDetailSource, /节点地址/);
  assert.match(rpcNodeDetailSource, /状态: \{statusText\}/);
  assert.match(rpcNodeDetailSource, /const latencyText = data\.roundTripMs > 0 \? `\$\{data\.roundTripMs\}ms` : unavailableText/);
  assert.match(rpcNodeDetailSource, /延迟: \{latencyText\}/);
  assert.match(rpcNodeDetailSource, /同步高度/);
  assert.match(rpcNodeDetailSource, /当前负载/);
  assert.match(rpcNodeDetailSource, /\{ label: 'QPS', meta: '当前', value: unavailableText \}/);
  assert.match(rpcNodeDetailSource, /\{ label: '拒绝请求', meta: '最近5分钟', value: unavailableText \}/);
  assert.match(rpcNodeDetailSource, /设为当前 RPC/);
  assert.match(rpcNodeDetailSource, /复制节点地址/);
  assert.match(rpcNodeDetailSource, /重新检测/);
  assert.match(chainExplorerSource, /function createRpcSecurityText/);
  assert.match(chainExplorerSource, /function createRpcUpstreamIds/);
});

test('rpc node detail recreates the chart and card styling without heavy shadows', () => {
  assert.match(rpcNodeDetailSource, /<Svg height="100%"/);
  assert.match(rpcNodeDetailSource, /M24 122 C88 112 92 102 120 106/);
  assert.match(chainExplorerSource, /rpcHeroCard: \{[\s\S]*height: scaled\(370, scale\)/);
  assert.match(chainExplorerSource, /rpcSectionCard: \{[\s\S]*shadowOpacity: 0\.035/);
  assert.match(chainExplorerSource, /rpcSectionCard: \{[\s\S]*elevation: 1/);
  assert.match(chainExplorerSource, /rpcPrimaryAction: \{[\s\S]*backgroundColor: colors\.black/);
  assert.match(chainExplorerSource, /rpcMetricStrip: \{[\s\S]*flexDirection: 'row'/);
});
