import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const appConfigSource = readFileSync(new URL('../app.json', import.meta.url), 'utf8');
const androidManifestSource = readFileSync(new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url), 'utf8');
const androidNetworkSecuritySource = readFileSync(new URL('../android/app/src/main/res/xml/network_security_config.xml', import.meta.url), 'utf8');
const cleartextHttpPluginSource = readFileSync(new URL('../plugins/withCleartextHttp.js', import.meta.url), 'utf8');
const appSource = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
const scanResultSource = readFileSync(new URL('../src/features/scanResult/ScanResultScreen.tsx', import.meta.url), 'utf8');
const scanResultIconsSource = readFileSync(new URL('../src/features/scanResult/ScanResultSvgIcons.tsx', import.meta.url), 'utf8');

test('scan result page uses the real Expo camera QR scanner', () => {
  assert.match(scanResultSource, /import \{ useCallback, useEffect, useRef, useState \} from 'react'/);
  assert.match(scanResultSource, /import \{ AppState, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View \} from 'react-native'/);
  assert.match(scanResultSource, /import \{ CameraView, scanFromURLAsync, type BarcodeScanningResult, useCameraPermissions \} from 'expo-camera'/);
  assert.match(scanResultSource, /<CameraView/);
  assert.match(scanResultSource, /barcodeScannerSettings=\{\{ barcodeTypes: \['qr'\] \}\}/);
  assert.match(scanResultSource, /onBarcodeScanned=\{isScannerActive \? onBarcodeScanned : undefined\}/);
  assert.match(scanResultSource, /sanitizeScanPayload/);
  assert.doesNotMatch(scanResultSource, /scanResultImages\.scanPlatform/);
});

test('scan result page requests camera permission automatically before opening camera', () => {
  assert.match(scanResultSource, /const permissionRequestStartedRef = useRef\(false\)/);
  assert.match(scanResultSource, /const \[cameraPermission, requestCameraPermission, getCameraPermission\] = useCameraPermissions\(\)/);
  assert.match(scanResultSource, /const requestCameraAccess = useCallback/);
  assert.match(scanResultSource, /requestCameraAccess\('auto'\)/);
  assert.match(scanResultSource, /void requestCameraPermission\(\)/);
  assert.match(scanResultSource, /Linking\.openSettings\(\)/);
  assert.match(scanResultSource, /AppState\.addEventListener\('change'/);
  assert.match(scanResultSource, /getCameraPermission\(\)/);
  assert.match(scanResultSource, /onRequestCameraPermission=\{handleRequestCameraPermission\}/);
});

test('scan result page can pick a local image and decode a QR code from it', () => {
  assert.match(scanResultSource, /import \* as ImagePicker from 'expo-image-picker'/);
  assert.match(scanResultSource, /scanImageUriForPayload/);
  assert.match(scanResultSource, /Platform\.OS === 'web' \? \{ canAskAgain: true, granted: true \} : await ImagePicker\.requestMediaLibraryPermissionsAsync\(false\)/);
  assert.match(scanResultSource, /ImagePicker\.launchImageLibraryAsync/);
  assert.match(scanResultSource, /mediaTypes: ImagePicker\.MediaTypeOptions\.Images/);
  assert.match(scanResultSource, /scanImageUriForPayload\(selectedAsset\.uri, scanFromURLAsync, sanitizeScanPayload\)/);
  assert.match(scanResultSource, /onPickImagePress=\{handlePickImagePress\}/);
  assert.match(scanResultSource, /ImageLibraryIcon/);
  assert.match(scanResultSource, /本地图片识别/);
});

test('scan result card uses semantic icons for each recognized QR type', () => {
  assert.match(scanResultSource, /function ScanResultKindIcon/);
  assert.match(scanResultSource, /kind === 'address'[\s\S]*SolAddressResultIcon/);
  assert.match(scanResultSource, /kind === 'transfer'[\s\S]*TransferRequestResultIcon/);
  assert.match(scanResultSource, /kind === 'deploy'[\s\S]*DeployRequestResultIcon/);
  assert.match(scanResultSource, /kind === 'validatorPairing'[\s\S]*ValidatorPairingIcon/);
  assert.match(scanResultSource, /UnknownScanResultIcon/);
  assert.doesNotMatch(scanResultSource, /<PopTokenIcon/);
  assert.match(scanResultIconsSource, /export function SolAddressResultIcon/);
  assert.match(scanResultIconsSource, /export function DeployRequestResultIcon/);
  assert.match(scanResultIconsSource, /export function TransferRequestResultIcon/);
});

test('scan result page keeps only scan corners over the camera preview', () => {
  assert.match(scanResultSource, /<ScanCornerFrameIcon size=\{scaled\(570, scale\)\} \/>/);
  assert.doesNotMatch(scanResultIconsSource, /M56 208H392|M56 224H392/);
  assert.doesNotMatch(scanResultIconsSource, /strokeOpacity="0\.28"/);
});

test('scan result page supports validator wallet pairing payloads', () => {
  assert.match(scanResultSource, /isValidatorPairingPayload/);
  assert.match(scanResultSource, /parseValidatorPairingPayload/);
  assert.match(scanResultSource, /getValidatorPairingStatus/);
  assert.match(scanResultSource, /signBootstrapPairingAuthorization/);
  assert.match(scanResultSource, /VALIDATOR_PAIRING_MODE_BOOTSTRAP/);
  assert.match(scanResultSource, /submitRegisterValidatorIdentityTransaction/);
  assert.match(scanResultSource, /new JsonRpcClient\(validatorPairing\.payload\.rpcURL\)/);
  assert.match(scanResultSource, /ensureValidatorPairingWalletCredential/);
  assert.match(scanResultSource, /onEnsureWalletForValidatorPairing/);
  assert.match(scanResultSource, /validatorPairingClient\.getBalance\(currentWalletAddressForPairing\)/);
  assert.match(scanResultSource, /当前钱包余额不足，验证者最低质押需要/);
  assert.match(scanResultSource, /client: validatorPairingClient/);
  assert.match(scanResultSource, /completeValidatorPairing/);
  assert.match(scanResultSource, /currentWalletSigningSeed/);
  assert.match(scanResultSource, /MINIMUM_VALIDATOR_STAKE_LAMPORTS/);
  assert.match(scanResultSource, /正在本地签名公网引导加入授权/);
  assert.match(scanResultSource, /节点加入授权已提交，节点绑定已完成/);
  assert.match(scanResultSource, /正在本地签名并向该节点提交最低质押注册交易/);
  assert.match(scanResultSource, /验证者注册已提交，节点绑定已完成/);
  assert.match(scanResultSource, /scanResultImages\.validatorPairingPlatform/);
  assert.match(scanResultSource, /ValidatorPairingIcon/);
  assert.match(scanResultSource, /绑定节点/);
  assert.doesNotMatch(scanResultSource, /SvgXml/);
  assert.doesNotMatch(scanResultSource, /13-scan-result\.png/);
});

test('validator pairing auto creates a local staking wallet when none exists', () => {
  assert.match(appSource, /const handleEnsureWalletForValidatorPairing = useCallback/);
  assert.match(appSource, /createMnemonicWords\(12\)/);
  assert.match(appSource, /const generatedLabel = '验证者质押钱包'/);
  assert.match(appSource, /setCurrentWalletSigningSeed\(generatedSigningSeed\)/);
  assert.match(appSource, /upsertWalletSigningSeed\(currentSeeds, generatedAccount\.address, generatedSigningSeed\)/);
  assert.match(appSource, /onEnsureWalletForValidatorPairing=\{handleEnsureWalletForValidatorPairing\}/);
  assert.match(scanResultSource, /扫码后自动创建/);
  assert.doesNotMatch(scanResultSource, /请先创建或选择钱包，再绑定验证者节点/);
});

test('scan result page shows skeleton content before any payload is scanned', () => {
  assert.match(scanResultSource, /scanSummary\.kind === 'waiting'/);
  assert.match(scanResultSource, /function WaitingResultSkeleton/);
  assert.match(scanResultSource, /styles\.skeletonAvatar/);
  assert.match(scanResultSource, /styles\.skeletonRowValue/);
});

test('camera permissions are configured for native builds', () => {
  assert.match(appConfigSource, /"expo-camera"/);
  assert.match(appConfigSource, /"expo-image-picker"/);
  assert.match(appConfigSource, /"\.\/plugins\/withCleartextHttp"/);
  assert.match(appConfigSource, /允许 SOL 使用相机扫描二维码。/);
  assert.match(appConfigSource, /允许 SOL 选择包含二维码的图片用于扫码识别。/);
  assert.match(appConfigSource, /"usesCleartextTraffic": true/);
  assert.match(androidManifestSource, /android\.permission\.CAMERA/);
  assert.match(androidManifestSource, /android:usesCleartextTraffic="true"/);
  assert.match(androidManifestSource, /android:networkSecurityConfig="@xml\/network_security_config"/);
  assert.match(androidNetworkSecuritySource, /cleartextTrafficPermitted="true"/);
  assert.match(cleartextHttpPluginSource, /withAndroidManifest/);
  assert.match(cleartextHttpPluginSource, /withDangerousMod/);
  assert.match(cleartextHttpPluginSource, /withInfoPlist/);
  assert.match(cleartextHttpPluginSource, /android:usesCleartextTraffic/);
  assert.match(cleartextHttpPluginSource, /android:networkSecurityConfig/);
  assert.match(cleartextHttpPluginSource, /cleartextTrafficPermitted="true"/);
  assert.match(cleartextHttpPluginSource, /NSAllowsArbitraryLoads/);
  assert.match(cleartextHttpPluginSource, /NSAllowsLocalNetworking/);
});
