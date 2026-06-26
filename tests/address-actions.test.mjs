import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { normalizeClipboardText } from '../src/utils/clipboardText.js';
import { generateQrMatrix, normalizeQrValue } from '../src/utils/qrCode.js';

const addressDialogSource = readFileSync(new URL('../src/components/AddressActionDialog.tsx', import.meta.url), 'utf8');
const qrCodeSource = readFileSync(new URL('../src/utils/qrCode.js', import.meta.url), 'utf8');

test('normalizeClipboardText rejects empty and unsafe values', () => {
  assert.equal(normalizeClipboardText('  3abc  '), '3abc');
  assert.throws(() => normalizeClipboardText(''), /不能为空/);
  assert.throws(() => normalizeClipboardText('abc\u0000def'), /非法控制字符/);
});

test('generateQrMatrix returns a stable QR matrix with quiet zone', () => {
  const address = 'TGT9QRAu2LZMkSSdpCEMNigQqSLG5FXy6hYuBTcZjT5S';
  const firstMatrix = generateQrMatrix(address);
  const secondMatrix = generateQrMatrix(address);

  assert.deepEqual(firstMatrix, secondMatrix);
  assert.equal(firstMatrix.length > 29, true);
  assert.equal(firstMatrix[0].every((moduleValue) => moduleValue === false), true);
  assert.equal(firstMatrix.at(-1).every((moduleValue) => moduleValue === false), true);
  assert.equal(firstMatrix.every((row) => row[0] === false && row.at(-1) === false), true);
  assert.equal(firstMatrix.some((row) => row.some(Boolean)), true);
  assert.match(qrCodeSource, /errorCorrectionLevel: 'H'/);
});

test('normalizeQrValue validates QR payload boundaries', () => {
  assert.equal(normalizeQrValue('  wallet-address  '), 'wallet-address');
  assert.throws(() => normalizeQrValue(''), /不能为空/);
  assert.throws(() => normalizeQrValue('abc\u0001def'), /非法控制字符/);
});

test('address dialog caps desktop scale so actions stay inside the viewport', () => {
  assert.match(addressDialogSource, /const effectiveScale = Math\.min\(scale, 1\)/);
  assert.match(addressDialogSource, /createStyles\(effectiveScale\)/);
});
