import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import {
  isDeployRequestQRCode,
  loadDeployRequestFromQRCode,
  parseDeployRequestQRCode,
  postDeployRequestResult
} from '../src/utils/deployRequest.js';

const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const scanResultSource = readFileSync(new URL('../src/features/scanResult/ScanResultScreen.tsx', import.meta.url), 'utf8');
const chainExplorerSource = readFileSync(new URL('../src/features/chainExplorer/ChainExplorerScreens.tsx', import.meta.url), 'utf8');

function createBytecodeFixture() {
  const bytecode = Buffer.from('SVM1-test-bytecode');
  return {
    base64: bytecode.toString('base64'),
    hash: bytesToHex(sha256(bytecode))
  };
}

test('deploy request QR parses and loads verified request body', async () => {
  const bytecode = createBytecodeFixture();
  const expiresAtUnixMillis = Date.now() + 60_000;
  const qrPayload = JSON.stringify({
    type: 'svm_deploy_request',
    version: 1,
    request_url: 'http://127.0.0.1:18080/deploy',
    bytecode_hash: bytecode.hash,
    expires_at_unix_milli: expiresAtUnixMillis
  });
  const fetchImpl = async (url) => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({
      id: 'deploy-1',
      rpc_url: 'http://127.0.0.1:8899',
      result_url: 'http://127.0.0.1:18080/result',
      contract_name: 'POP',
      bytecode_base64: bytecode.base64,
      bytecode_hash: bytecode.hash,
      deposit_lamports: '1000000',
      expires_at_unix_milli: expiresAtUnixMillis,
      manifest: {
        compute_unit_limit: '200000',
        name: 'POP',
        required_syscalls: ['asset_execute'],
        upgrade_authority: 'owner',
        version: 'svm/1'
      }
    })
  });

  assert.equal(isDeployRequestQRCode(qrPayload), true);
  assert.equal(parseDeployRequestQRCode(qrPayload)?.requestUrl, 'http://127.0.0.1:18080/deploy');

  const request = await loadDeployRequestFromQRCode(qrPayload, fetchImpl);
  assert.equal(request.id, 'deploy-1');
  assert.equal(request.contractName, 'POP');
  assert.equal(request.bytecodeHash, bytecode.hash);
  assert.equal(request.depositLamports, 1000000n);
  assert.deepEqual(request.manifest.requiredSyscalls, ['asset_execute']);
});

test('deploy request rejects mismatched bytecode hash', async () => {
  const bytecode = createBytecodeFixture();
  const expiresAtUnixMillis = Date.now() + 60_000;
  const qrPayload = `svm-deploy://request?request_url=${encodeURIComponent('http://127.0.0.1:18080/deploy')}&bytecode_hash=${bytecode.hash}&expires_at_unix_milli=${expiresAtUnixMillis}`;
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({
      id: 'deploy-2',
      rpc_url: 'http://127.0.0.1:8899',
      bytecode_base64: bytecode.base64,
      bytecode_hash: '0'.repeat(64),
      expires_at_unix_milli: expiresAtUnixMillis
    })
  });

  await assert.rejects(
    () => loadDeployRequestFromQRCode(qrPayload, fetchImpl),
    /bytecode hash/
  );
});

test('deploy request result posts normalized callback payload', async () => {
  const bodies = [];
  await postDeployRequestResult(
    {
      resultUrl: 'http://127.0.0.1:18080/result'
    },
    {
      programAddress: 'program',
      signature: 'signature',
      status: 'submitted',
      submittedAtUnixMillis: 123,
      walletAddress: 'wallet'
    },
    async (_url, init) => {
      bodies.push(JSON.parse(init.body));
      return { ok: true, status: 200 };
    }
  );

  assert.deepEqual(bodies[0], {
    program_address: 'program',
    signature: 'signature',
    status: 'submitted',
    submitted_at_unix_millis: 123,
    wallet_address: 'wallet'
  });
});

test('scan deploy request opens deploy confirmation with payload', () => {
  assert.match(scanResultSource, /isDeployRequestQRCode\(payload\)/);
  assert.match(scanResultSource, /readonly onDeployRequest\?: \(payload: string\) => void/);
  assert.match(scanResultSource, /scanSummary\.kind === 'deploy'[\s\S]*onDeployRequest\(scannedPayload\)/);
  assert.match(appSource, /const \[scannedDeployPayload, setScannedDeployPayload\]/);
  assert.match(appSource, /onScannedDeployRequest=\{handleOpenContractDeployConfirmFromScan\}/);
  assert.match(appSource, /scannedDeployPayload=\{scannedDeployPayload\}/);
});

test('deploy confirmation loads request, unlocks wallet, and posts result', () => {
  assert.match(chainExplorerSource, /loadDeployRequestFromQRCode\(scannedDeployPayload\)/);
  assert.match(chainExplorerSource, /postDeployRequestResult\(deployRequest/);
  assert.match(chainExplorerSource, /new JsonRpcClient\(deployRequest\.rpcUrl\)/);
  assert.match(chainExplorerSource, /if \(!currentWalletSigningSeed\) \{[\s\S]*onUnlockWalletPress\(\);/);
  assert.match(chainExplorerSource, /label: currentWalletSigningSeed \? '签名并部署' : '导入助记词解锁'/);
  assert.doesNotMatch(chainExplorerSource, /buttonLabel=\{currentWalletSigningSeed \? '提交部署' : '导入助记词解锁'\}/);
});
