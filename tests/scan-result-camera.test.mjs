import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appConfigSource = readFileSync(new URL('../app.json', import.meta.url), 'utf8');
const androidManifestSource = readFileSync(new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url), 'utf8');
const scanResultSource = readFileSync(new URL('../src/features/scanResult/ScanResultScreen.tsx', import.meta.url), 'utf8');
const scanResultIconsSource = readFileSync(new URL('../src/features/scanResult/ScanResultSvgIcons.tsx', import.meta.url), 'utf8');

test('scan result page uses the real Expo camera QR scanner', () => {
  assert.match(scanResultSource, /import \{ CameraView, type BarcodeScanningResult, useCameraPermissions \} from 'expo-camera'/);
  assert.match(scanResultSource, /<CameraView/);
  assert.match(scanResultSource, /barcodeScannerSettings=\{\{ barcodeTypes: \['qr'\] \}\}/);
  assert.match(scanResultSource, /onBarcodeScanned=\{isScannerActive \? onBarcodeScanned : undefined\}/);
  assert.match(scanResultSource, /sanitizeScanPayload/);
  assert.doesNotMatch(scanResultSource, /scanResultImages\.scanPlatform/);
});

test('scan result page keeps only scan corners over the camera preview', () => {
  assert.match(scanResultSource, /<ScanCornerFrameIcon size=\{scaled\(570, scale\)\} \/>/);
  assert.doesNotMatch(scanResultIconsSource, /M56 208H392|M56 224H392/);
  assert.doesNotMatch(scanResultIconsSource, /strokeOpacity="0\.28"/);
});

test('scan result page shows skeleton content before any payload is scanned', () => {
  assert.match(scanResultSource, /scanSummary\.kind === 'waiting'/);
  assert.match(scanResultSource, /function WaitingResultSkeleton/);
  assert.match(scanResultSource, /styles\.skeletonAvatar/);
  assert.match(scanResultSource, /styles\.skeletonRowValue/);
});

test('camera permissions are configured for native builds', () => {
  assert.match(appConfigSource, /"expo-camera"/);
  assert.match(appConfigSource, /允许 SOL 使用相机扫描二维码。/);
  assert.match(androidManifestSource, /android\.permission\.CAMERA/);
});
