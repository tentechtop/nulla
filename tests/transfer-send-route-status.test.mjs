import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const transferSendSource = readFileSync(new URL('../src/features/transferSend/TransferSendScreen.tsx', import.meta.url), 'utf8');

test('route status label uses fixed layout to avoid Android overlap', () => {
  assert.match(transferSendSource, /<View style=\{styles\.routeStatusTextPanel\}>/);
  assert.match(transferSendSource, /routeStatusGroup: \{[\s\S]*width: scaled\(170, scale\)/);
  assert.match(transferSendSource, /routeStatusDot: \{[\s\S]*flexShrink: 0/);
  assert.match(transferSendSource, /routeStatusTextPanel: \{[\s\S]*backgroundColor: 'rgba\(5, 5, 7, 0\.72\)'/);
  assert.match(transferSendSource, /routeStatusTextPanel: \{[\s\S]*minWidth: scaled\(96, scale\)/);
});
