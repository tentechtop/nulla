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

test('transfer send validates receiver addresses with the shared system spec', () => {
  assert.match(transferSource, /SYSTEM_ADDRESS_MAX_LENGTH/);
  assert.match(transferSource, /isSystemAddress\(address\)/);
  assert.match(transferSource, /placeholder="输入或粘贴 T\/Z 地址"/);
  assert.match(transferSource, /地址格式无效/);
});

test('transfer send detail button opens the transaction detail route', () => {
  assert.match(appSource, /transactionDetail/);
  assert.match(appSource, /handleOpenTransactionDetail/);
  assert.match(appSource, /<TransactionDetailScreen/);
  assert.match(transferSource, /createSubmittedTransactionDetail/);
  assert.match(transferSource, /onDetailPress\?\.\(detailData\)/);
  assert.match(transferSource, /setIsSendResultVisible\(false\)/);
});

test('operation tip dialog uses native SVG icons and design copy', () => {
  assert.match(dialogSource, /function DialogInfoLargeIcon/);
  assert.match(dialogSource, /function StatusProcessingIcon/);
  assert.match(dialogSource, /function EstimatedBlockIcon/);
  assert.match(dialogSource, /const DIALOG_WIDTH = 590/);
  assert.match(dialogSource, /const DIALOG_MAX_WIDTH_PERCENT = '92%'/);
  assert.match(dialogSource, /const DESIGN_VIEWPORT_WIDTH = 852/);
  assert.match(dialogSource, /useWindowDimensions/);
  assert.match(dialogSource, /function getEffectiveDialogScale/);
  assert.match(dialogSource, /viewportWidth \/ DESIGN_VIEWPORT_WIDTH/);
  assert.match(dialogSource, /DialogInfoLargeIcon size=\{scaled\(92, dialogScale\)\}/);
  assert.match(dialogSource, /marginTop: scaled\(32, scale\)/);
  assert.match(dialogSource, /numberOfLines=\{1\} style=\{styles\.statusValue\}/);
  assert.match(dialogSource, /numberOfLines=\{1\} style=\{styles\.blockText\}/);
  assert.match(dialogSource, /交易已提交到公网 RPC，正在等待链上确认。/);
  assert.match(dialogSource, /知道了/);
  assert.match(dialogSource, /查看详情/);
  assert.doesNotMatch(dialogSource, /const DIALOG_LEFT|const DIALOG_TOP|const DIALOG_HEIGHT/);
  assert.doesNotMatch(dialogSource, /position: 'absolute'/);
  assert.doesNotMatch(dialogSource, /Math\.max\(330, scaled\(DIALOG_WIDTH, scale\)\)/);
  assert.doesNotMatch(dialogSource, /16-tip-dialog\.png/);
  assert.doesNotMatch(dialogSource, /SvgXml/);
});
