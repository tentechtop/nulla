import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const chainExplorerSource = readFileSync(new URL('../src/features/chainExplorer/ChainExplorerScreens.tsx', import.meta.url), 'utf8');

test('validator stake operations route locked wallets to mnemonic import', () => {
  assert.match(chainExplorerSource, /readonly onUnlockWalletPress\?: \(\) => void/);
  assert.match(chainExplorerSource, /if \(!currentWalletSigningSeed\) \{[\s\S]*if \(onUnlockWalletPress\) \{[\s\S]*onUnlockWalletPress\(\);/);
  assert.match(chainExplorerSource, /const submitLabel = currentWalletSigningSeed \? createValidatorOperationSubmitLabel\(mode\) : '导入助记词解锁'/);
  assert.match(chainExplorerSource, /<ValidatorStakeOperationCard/);
  assert.match(appSource, /<ValidatorDetailStakeScreen[\s\S]*onUnlockWalletPress=\{onImportWalletPress\}/);
});
