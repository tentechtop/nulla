import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const tokensSource = readFileSync(new URL('../src/theme/tokens.ts', import.meta.url), 'utf8');
const pageTitleFiles = [
  '../src/features/privacyHome/PrivacyHomeScreen.tsx',
  '../src/features/dposOverview/DposOverviewScreen.tsx',
  '../src/features/accountHome/AccountHomeScreen.tsx',
  '../src/features/scanResult/ScanResultScreen.tsx',
  '../src/features/transferSend/TransferSendScreen.tsx'
];

test('page title font weight is centralized to match the privacy title reference', () => {
  assert.match(tokensSource, /fontWeights = \{\s*pageTitle: '700'/);

  for (const filePath of pageTitleFiles) {
    const source = readFileSync(new URL(filePath, import.meta.url), 'utf8');
    assert.match(source, /fontWeights/);
    assert.match(source, /fontWeight: fontWeights\.pageTitle/);
  }
});
