import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const dialogSource = readFileSync(new URL('../src/components/OperationTipDialog.tsx', import.meta.url), 'utf8');
const scanSource = readFileSync(new URL('../src/features/scanResult/ScanResultScreen.tsx', import.meta.url), 'utf8');
const transferSource = readFileSync(new URL('../src/features/transferSend/TransferSendScreen.tsx', import.meta.url), 'utf8');

test('scan result routes parsed QR payloads into transfer send', () => {
  assert.match(scanSource, /parseScannedSendPayload/);
  assert.match(scanSource, /onSendDraft\(sendDraft\)/);
  assert.match(appSource, /handleOpenTransferSendFromScan/);
  assert.match(appSource, /scannedSendDraft/);
});

test('transfer send applies scanned draft and opens result dialog', () => {
  assert.match(transferSource, /scannedDraft/);
  assert.match(transferSource, /setAddress\(sanitizeAddressInput\(scannedDraft\.address\)\)/);
  assert.match(transferSource, /setIsSendResultVisible\(true\)/);
  assert.match(transferSource, /OperationTipDialog/);
});

test('operation tip dialog uses native SVG icons and design copy', () => {
  assert.match(dialogSource, /function DialogInfoLargeIcon/);
  assert.match(dialogSource, /function StatusProcessingIcon/);
  assert.match(dialogSource, /function EstimatedBlockIcon/);
  assert.match(dialogSource, /const DIALOG_LEFT = 161/);
  assert.match(dialogSource, /const DIALOG_TOP = 599/);
  assert.match(dialogSource, /const DIALOG_WIDTH = 535/);
  assert.match(dialogSource, /const DIALOG_HEIGHT = 652/);
  assert.match(dialogSource, /DialogInfoLargeIcon size=\{scaled\(106, scale\)\}/);
  assert.match(dialogSource, /top: scaled\(395, scale\)/);
  assert.match(dialogSource, /top: scaled\(560, scale\)/);
  assert.match(dialogSource, /交易已提交到公网 RPC，正在等待链上确认。/);
  assert.match(dialogSource, /知道了/);
  assert.match(dialogSource, /查看详情/);
  assert.doesNotMatch(dialogSource, /16-tip-dialog\.png/);
  assert.doesNotMatch(dialogSource, /SvgXml/);
});
