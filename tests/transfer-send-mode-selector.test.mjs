import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const transferSendSource = readFileSync(new URL('../src/features/transferSend/TransferSendScreen.tsx', import.meta.url), 'utf8');

test('transfer mode selector uses equal-width flow layout', () => {
  assert.match(transferSendSource, /function TransferModeOption/);
  assert.match(transferSendSource, /flexDirection: 'row'/);
  assert.match(transferSendSource, /flex: 1/);
  assert.match(transferSendSource, /modeOptionContentActive/);
});

test('transfer mode selector avoids absolute option coordinates', () => {
  assert.doesNotMatch(transferSendSource, /MODE_OPTION_LEFTS/);
  assert.doesNotMatch(transferSendSource, /modeDividerOne|modeDividerTwo|modeDividerThree/);
  assert.doesNotMatch(transferSendSource, /left: scaled\(MODE_OPTION_LEFTS/);
});
