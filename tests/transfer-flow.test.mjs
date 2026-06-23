import assert from 'node:assert/strict';
import test from 'node:test';
import { parseScannedSendPayload, sanitizeScannedSendPayload } from '../src/features/transferFlow.js';

const sampleAddress = '3GT9QRAu2LmxmJrLDbLqCmxvWkphX2nTcZjT5S';

test('parseScannedSendPayload accepts plain SOL address payloads', () => {
  const draft = parseScannedSendPayload(sampleAddress);

  assert.equal(draft.address, sampleAddress);
  assert.equal(draft.amount, '');
  assert.equal(draft.sourcePayload, sampleAddress);
});

test('parseScannedSendPayload extracts Solana URI amount as lamports', () => {
  const draft = parseScannedSendPayload(`solana:${sampleAddress}?amount=1.25`);

  assert.equal(draft.address, sampleAddress);
  assert.equal(draft.amount, '1250000000');
});

test('parseScannedSendPayload extracts transfer URI lamports', () => {
  const draft = parseScannedSendPayload(`transfer:${sampleAddress}:5000`);

  assert.equal(draft.address, sampleAddress);
  assert.equal(draft.amount, '5000');
});

test('parseScannedSendPayload extracts JSON send requests', () => {
  const draft = parseScannedSendPayload(JSON.stringify({ to: sampleAddress, lamports: '9000' }));

  assert.equal(draft.address, sampleAddress);
  assert.equal(draft.amount, '9000');
});

test('sanitizeScannedSendPayload removes control characters and rejects unsupported payloads', () => {
  assert.equal(sanitizeScannedSendPayload(`\u0000 ${sampleAddress}\n`), sampleAddress);
  assert.equal(parseScannedSendPayload('https://example.com/not-a-wallet'), null);
});
