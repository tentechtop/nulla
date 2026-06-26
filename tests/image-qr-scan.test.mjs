import assert from 'node:assert/strict';
import test from 'node:test';

import {
  IMAGE_QR_BARCODE_TYPES,
  normalizeImageQrScanUri,
  scanImageUriForPayload,
  selectFirstImageQrPayload
} from '../src/utils/imageQrScan.js';

function sanitizePayload(value) {
  return value.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 128);
}

test('image QR scanner validates safe local image URI schemes', () => {
  assert.equal(normalizeImageQrScanUri(' file:///tmp/code.png '), 'file:///tmp/code.png');
  assert.equal(normalizeImageQrScanUri('content://media/external/images/1'), 'content://media/external/images/1');
  assert.equal(normalizeImageQrScanUri('blob:http://localhost/image'), 'blob:http://localhost/image');
  assert.throws(() => normalizeImageQrScanUri('javascript:alert(1)'), /不受支持/);
  assert.throws(() => normalizeImageQrScanUri('file://bad\u0000path'), /控制字符/);
});

test('image QR scanner selects the first sanitized QR payload', () => {
  const payload = selectFirstImageQrPayload(
    [
      { data: '   ' },
      { data: '\u0000 solana:demo-address \n' },
      { data: 'ignored' }
    ],
    sanitizePayload
  );

  assert.equal(payload, 'solana:demo-address');
});

test('image QR scanner delegates to camera image decoding with QR-only types', async () => {
  const payload = await scanImageUriForPayload(
    'file:///tmp/qrcode.png',
    async (imageUri, barcodeTypes) => {
      assert.equal(imageUri, 'file:///tmp/qrcode.png');
      assert.deepEqual(barcodeTypes, [...IMAGE_QR_BARCODE_TYPES]);
      return [{ data: 'transfer:demo?lamports=1', type: 'qr' }];
    },
    sanitizePayload
  );

  assert.equal(payload, 'transfer:demo?lamports=1');
});

test('image QR scanner reports images without QR payloads', async () => {
  await assert.rejects(
    () => scanImageUriForPayload('file:///tmp/no-qr.png', async () => [], sanitizePayload),
    /没有识别到二维码/
  );
});
