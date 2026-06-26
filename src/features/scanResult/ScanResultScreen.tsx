import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Image, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CameraView, scanFromURLAsync, type BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { getGlobalHeaderHeight } from '../../components/GlobalHeader';
import { colors, fontFamilies, fontWeights } from '../../theme/tokens';
import { submitRegisterValidatorIdentityTransaction } from '../../utils/chainOperations';
import { JsonRpcClient } from '../../utils/chainRpc';
import { getSystemAddressKind, isSystemAddress } from '../../utils/addressSpec';
import { copyTextToClipboard } from '../../utils/clipboard';
import { isDeployRequestQRCode } from '../../utils/deployRequest';
import { scanImageUriForPayload } from '../../utils/imageQrScan';
import {
  MAX_VALIDATOR_PAIRING_PAYLOAD_LENGTH,
  MINIMUM_VALIDATOR_STAKE_LAMPORTS,
  VALIDATOR_PAIRING_MODE_BOOTSTRAP,
  compactValidatorPairingValue,
  completeValidatorPairing,
  getValidatorPairingStatus,
  isValidatorPairingPayload,
  parseValidatorPairingPayload,
  signBootstrapPairingAuthorization,
  type ValidatorPairingPayload
} from '../validatorPairing/validatorPairing';
import { MAX_SCANNED_SEND_PAYLOAD_LENGTH, parseScannedSendPayload, type ScannedSendDraft } from '../transferFlow';
import { scanResultImages } from './designAssets';
import {
  BackChevronIcon,
  ChevronRightIcon,
  CodeHashIcon,
  CopyContentIcon,
  DeployRequestResultIcon,
  HashVerifiedIcon,
  ImageLibraryIcon,
  NetworkNodesIcon,
  RecentAddressIcon,
  RecentDeployIcon,
  RecentTransferIcon,
  RescanIcon,
  ScanCornerFrameIcon,
  SolAddressResultIcon,
  SourceFileIcon,
  TransferRequestResultIcon,
  UnknownScanResultIcon,
  ValidatorNodeIcon,
  ValidatorPairingIcon,
  WalletLinkIcon
} from './ScanResultSvgIcons';
import { useScanResultResponsiveLayout } from './useScanResultResponsiveLayout';

const TOP_NAVIGATION_DESIGN_HEIGHT = 117;
const MAX_SCAN_PAYLOAD_LENGTH = Math.max(MAX_SCANNED_SEND_PAYLOAD_LENGTH, MAX_VALIDATOR_PAIRING_PAYLOAD_LENGTH);

const recentRows = [
  { key: 'address', icon: 'address', title: '收款地址', detail: 'TGT9QRAu2L...TcZjT5S', time: '18:11:32' },
  { key: 'deploy', icon: 'deploy', title: '部署请求', detail: 'POP 泡泡币（ERC20-like）', time: '18:09:21' },
  { key: 'validator', icon: 'validator', title: '验证者绑定', detail: '节点钱包配对请求', time: '18:02:16' }
] as const;

type ResultIconKey = 'hash' | 'source' | 'network' | 'validator' | 'wallet';
type RecentIconKey = (typeof recentRows)[number]['icon'];
type ScanKind = 'address' | 'deploy' | 'transfer' | 'unknown' | 'validatorPairing' | 'waiting';
type ScanPayloadSource = 'camera' | 'image' | null;
type CameraPermissionRequestSource = 'auto' | 'manual';
type ValidatorPairingBindingState = 'completed' | 'failed' | 'idle' | 'needsSignature' | 'registering';

type ResultRow = {
  readonly icon: ResultIconKey;
  readonly key: string;
  readonly label: string;
  readonly value: string;
};

type ScanSummary = {
  readonly isVerified: boolean;
  readonly kind: ScanKind;
  readonly name: string;
  readonly rows: readonly ResultRow[];
  readonly standard: string;
  readonly tag: string;
  readonly verifiedText: string;
};

type ScanResultScreenProps = {
  readonly bottomPadding?: number;
  readonly currentWalletAddress?: string | null;
  readonly currentWalletSigningSeed?: string | null;
  readonly onBackPress?: () => void;
  readonly onDeployRequest?: (payload: string) => void;
  readonly onEnsureWalletForValidatorPairing?: () => Promise<ValidatorPairingWalletCredential>;
  readonly onSendDraft?: (draft: ScannedSendDraft) => void;
  readonly topPadding?: number;
};

type ValidatorPairingWalletCredential = {
  readonly address: string;
  readonly signingSeed: string;
};

type ValidatorPairingParseState = {
  readonly error: string;
  readonly isPairing: boolean;
  readonly payload: ValidatorPairingPayload | null;
};

function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

function scaledBelowTopNavigation(value: number, scale: number) {
  return scaled(value - TOP_NAVIGATION_DESIGN_HEIGHT, scale);
}

function sanitizeScanPayload(payload: string) {
  // 功能目的：清理扫码输入；实现原因：阻断控制字符和超长内容污染界面。
  return payload.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, MAX_SCAN_PAYLOAD_LENGTH);
}

function compactScanPayload(payload: string) {
  if (payload.length <= 38) {
    return payload;
  }

  return `${payload.slice(0, 18)}...${payload.slice(-16)}`;
}

function getAddressResultText(payload: string | null) {
  if (payload === null || !isSystemAddress(payload)) {
    return { name: '系统地址', standard: 'Address' };
  }

  const addressKind = getSystemAddressKind(payload);
  return addressKind === 'transparent'
    ? { name: 'T 地址', standard: 'T Address' }
    : { name: 'Z 地址', standard: 'Z Address' };
}

function getScanKind(payload: string | null, validatorPairing: ValidatorPairingParseState): ScanKind {
  if (payload === null) {
    return 'waiting';
  }

  if (validatorPairing.isPairing) {
    return 'validatorPairing';
  }

  const sendDraft = parseScannedSendPayload(payload);
  if (sendDraft !== null) {
    return payload === sendDraft.address ? 'address' : 'transfer';
  }

  if (isDeployRequestQRCode(payload) || /^(deploy:|bytecode:)/i.test(payload) || /^[a-f0-9]{32,}$/i.test(payload)) {
    return 'deploy';
  }

  if (/^(transfer:|tx:)/i.test(payload) || /lamports/i.test(payload)) {
    return 'transfer';
  }

  return 'unknown';
}

function parseValidatorPairingScanState(payload: string | null): ValidatorPairingParseState {
  if (payload === null || !isValidatorPairingPayload(payload)) {
    return { error: '', isPairing: false, payload: null };
  }

  try {
    return { error: '', isPairing: true, payload: parseValidatorPairingPayload(payload) };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : '验证者绑定二维码无效',
      isPairing: true,
      payload: null
    };
  }
}

function getValidatorPairingCompletion(value: unknown) {
  if (value === null || typeof value !== 'object') {
    return null;
  }

  return (value as { readonly completed?: unknown }).completed ?? value;
}

function buildValidatorPairingRestartNotice(value: unknown) {
  const completion = getValidatorPairingCompletion(value);
  if (completion === null || typeof completion !== 'object') {
    return '';
  }

  const restartRequired = Boolean((completion as { readonly restart_required?: unknown; readonly restartRequired?: unknown }).restart_required ?? (completion as { readonly restartRequired?: unknown }).restartRequired);
  return restartRequired ? '，请重启节点使验证者身份生效' : '';
}

function getValidatorPairingStandard(pairingPayload: ValidatorPairingPayload | null) {
  if (pairingPayload === null) {
    return 'PoS';
  }

  if (pairingPayload.chainID.length > 0) {
    return pairingPayload.chainID;
  }

  if (pairingPayload.mode === VALIDATOR_PAIRING_MODE_BOOTSTRAP) {
    return 'Bootstrap Join';
  }

  return 'PoS';
}

function getValidatorPairingStatusText(bindingState: ValidatorPairingBindingState, isBootstrapPairing: boolean) {
  if (bindingState === 'completed') {
    return '已提交绑定';
  }

  if (bindingState === 'registering') {
    return isBootstrapPairing ? '正在授权节点' : '正在注册验证者';
  }

  if (bindingState === 'needsSignature') {
    return '正在确认节点';
  }

  if (bindingState === 'failed') {
    return '需要处理异常';
  }

  return '待确认绑定';
}

function createScanSummary(
  payload: string | null,
  validatorPairing: ValidatorPairingParseState,
  bindingState: ValidatorPairingBindingState,
  currentWalletAddress?: string | null,
  payloadSource: ScanPayloadSource = null
): ScanSummary {
  const kind = getScanKind(payload, validatorPairing);
  const displayValue = payload === null ? '等待二维码进入扫描框' : compactScanPayload(payload);
  const addressResultText = getAddressResultText(payload);
  const firstLabel = kind === 'deploy' ? 'Bytecode Hash' : '扫码内容';
  const recognizedSourceValue = payloadSource === 'image' ? '本地图片识别' : '摄像头扫码';

  if (kind === 'waiting') {
    return {
      isVerified: false,
      kind,
      name: '等待扫码',
      rows: [
        { key: 'payload', icon: 'hash', label: firstLabel, value: displayValue },
        { key: 'source', icon: 'source', label: '来源', value: '摄像头 / 相册' },
        { key: 'network', icon: 'network', label: '网络', value: '自动识别' }
      ],
      standard: 'Camera',
      tag: '实时扫描',
      verifiedText: '等待扫码'
    };
  }

  if (kind === 'validatorPairing') {
    const pairingPayload = validatorPairing.payload;
    const isBootstrapPairing = pairingPayload?.mode === VALIDATOR_PAIRING_MODE_BOOTSTRAP;
    const pairingStandard = getValidatorPairingStandard(pairingPayload);
    const statusText = getValidatorPairingStatusText(bindingState, isBootstrapPairing);

    return {
      isVerified: pairingPayload !== null && !pairingPayload.isExpired && validatorPairing.error.length === 0,
      kind,
      name: '验证者节点绑定',
      rows: [
        {
          key: 'node',
          icon: 'validator',
          label: '节点',
          value: pairingPayload === null ? validatorPairing.error : compactValidatorPairingValue(pairingPayload.nodePeerID, 11, 8)
        },
        {
          key: 'wallet',
          icon: 'wallet',
          label: '钱包',
          value: currentWalletAddress === null || currentWalletAddress === undefined ? '扫码后自动创建' : compactValidatorPairingValue(currentWalletAddress, 10, 8)
        },
        {
          key: 'status',
          icon: 'network',
          label: '状态',
          value: pairingPayload?.isExpired ? '二维码已过期' : statusText
        }
      ],
      standard: pairingStandard,
      tag: '验证者钱包',
      verifiedText: pairingPayload?.isExpired ? '已过期' : validatorPairing.error.length > 0 ? '校验失败' : '节点已校验'
    };
  }

  return {
    isVerified: true,
    kind,
    name: kind === 'address' ? addressResultText.name : kind === 'transfer' ? '交易请求' : kind === 'deploy' ? '合约部署请求' : '扫码内容',
    rows: [
      { key: 'payload', icon: 'hash', label: firstLabel, value: displayValue },
      { key: 'source', icon: 'source', label: '来源', value: recognizedSourceValue },
      { key: 'network', icon: 'network', label: '网络', value: kind === 'unknown' ? '本地识别' : 'SOL Mainnet' }
    ],
    standard: kind === 'deploy' ? 'ERC20-like' : kind === 'address' ? addressResultText.standard : kind === 'transfer' ? 'Lamports' : 'Payload',
    tag: kind === 'address' ? '收款地址' : kind === 'transfer' ? '交易请求' : kind === 'deploy' ? '合约部署请求' : '已识别',
    verifiedText: 'Hash 已校验'
  };
}

async function ensureValidatorPairingWalletCredential(input: {
  readonly currentWalletAddress?: string | null;
  readonly currentWalletSigningSeed?: string | null;
  readonly onEnsureWalletForValidatorPairing?: () => Promise<ValidatorPairingWalletCredential>;
}): Promise<ValidatorPairingWalletCredential> {
  const currentWalletAddress = input.currentWalletAddress?.trim() ?? '';
  const currentWalletSigningSeed = input.currentWalletSigningSeed?.trim() ?? '';

  if (currentWalletAddress.length > 0 && currentWalletSigningSeed.length > 0) {
    return {
      address: currentWalletAddress,
      signingSeed: currentWalletSigningSeed
    };
  }

  if (currentWalletAddress.length > 0) {
    throw new Error('当前钱包未解锁。请重新导入助记词解锁后再绑定验证者节点。');
  }

  if (!input.onEnsureWalletForValidatorPairing) {
    throw new Error('当前没有钱包，且应用未提供自动创建验证者质押钱包入口');
  }

  // 功能目的：无钱包时自动创建本地质押钱包；实现原因：节点扫码绑定不能要求用户先离开流程手动建账。
  return input.onEnsureWalletForValidatorPairing();
}

export function ScanResultScreen({
  bottomPadding,
  currentWalletAddress,
  currentWalletSigningSeed,
  onBackPress,
  onDeployRequest,
  onEnsureWalletForValidatorPairing,
  onSendDraft,
  topPadding
}: ScanResultScreenProps) {
  const layoutMetrics = useScanResultResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const headerHeight = getGlobalHeaderHeight(layoutMetrics.scale);
  const resolvedBottomPadding = bottomPadding ?? layoutMetrics.bottomNavHeight;
  const resolvedTopPadding = topPadding ?? layoutMetrics.topSafeArea + headerHeight;
  const permissionRequestStartedRef = useRef(false);
  const scanLockRef = useRef(false);
  const [cameraPermission, requestCameraPermission, getCameraPermission] = useCameraPermissions();
  const [cameraError, setCameraError] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isImagePickerBusy, setIsImagePickerBusy] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(true);
  const [imageScanMessage, setImageScanMessage] = useState('');
  const [validatorBindingMessage, setValidatorBindingMessage] = useState('');
  const [validatorBindingState, setValidatorBindingState] = useState<ValidatorPairingBindingState>('idle');
  const [scannedPayload, setScannedPayload] = useState<string | null>(null);
  const [scanPayloadSource, setScanPayloadSource] = useState<ScanPayloadSource>(null);
  const validatorPairing = parseValidatorPairingScanState(scannedPayload);
  const scanSummary = createScanSummary(scannedPayload, validatorPairing, validatorBindingState, currentWalletAddress, scanPayloadSource);

  const requestCameraAccess = useCallback((requestSource: CameraPermissionRequestSource) => {
    if (cameraPermission?.granted) {
      setCameraError('');
      return;
    }

    if (cameraPermission?.canAskAgain === false) {
      setCameraError('相机权限已关闭，请在系统设置中允许 SOL 使用相机');

      if (requestSource === 'manual') {
        void Linking.openSettings().catch((error: unknown) => {
          setCameraError(error instanceof Error ? error.message : '无法打开系统权限设置');
        });
      }

      return;
    }

    if (requestSource === 'auto' && permissionRequestStartedRef.current) {
      return;
    }

    // 功能目的：主动申请运行时相机权限；实现原因：扫码页必须由系统授权后才能打开真实摄像头。
    permissionRequestStartedRef.current = true;
    setCameraError('');
    console.info('[scan-result] camera permission requested', { requestSource });

    void requestCameraPermission()
      .then((nextPermission) => {
        if (!nextPermission.granted) {
          setCameraError(nextPermission.canAskAgain ? '请允许相机权限后继续扫码' : '相机权限已关闭，请在系统设置中允许 SOL 使用相机');
        }

        console.info('[scan-result] camera permission result', {
          canAskAgain: nextPermission.canAskAgain,
          granted: nextPermission.granted,
          status: nextPermission.status
        });
      })
      .catch((error: unknown) => {
        setCameraError(error instanceof Error ? error.message : '相机权限请求失败');
        console.info('[scan-result] camera permission request failed');
      });
  }, [cameraPermission, requestCameraPermission]);

  useEffect(() => {
    requestCameraAccess('auto');
  }, [requestCameraAccess]);

  useEffect(() => {
    // 功能目的：刷新从系统设置返回后的权限；实现原因：用户手动开启相机后需要立即加载预览。
    const appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState !== 'active') {
        return;
      }

      void getCameraPermission().catch((error: unknown) => {
        setCameraError(error instanceof Error ? error.message : '相机权限状态刷新失败');
      });
    });

    return () => {
      appStateSubscription.remove();
    };
  }, [getCameraPermission]);

  useEffect(() => {
    if (cameraPermission?.granted) {
      setCameraError('');
    }
  }, [cameraPermission]);

  const handleConfirmPress = () => {
    if (validatorPairing.isPairing) {
      void handleValidatorPairingConfirm();
      return;
    }

    const sendDraft = scannedPayload === null ? null : parseScannedSendPayload(scannedPayload);

    if (sendDraft !== null && onSendDraft !== undefined) {
      onSendDraft(sendDraft);
      return;
    }

    if (scanSummary.kind === 'deploy' && scannedPayload !== null && onDeployRequest !== undefined) {
      onDeployRequest(scannedPayload);
      return;
    }

    console.info('[scan-result] confirm requested', {
      hasPayload: scannedPayload !== null,
      resultType: scanSummary.kind,
      sendDraftAvailable: sendDraft !== null
    });
  };

  const handleValidatorPairingConfirm = async () => {
    if (validatorPairing.payload === null) {
      setValidatorBindingState('failed');
      setValidatorBindingMessage(validatorPairing.error || '验证者绑定二维码无效');
      return;
    }

    if (validatorPairing.payload.isExpired) {
      setValidatorBindingState('failed');
      setValidatorBindingMessage('二维码已过期，请在节点终端重新生成后再扫码');
      return;
    }

    setValidatorBindingState('needsSignature');
    setValidatorBindingMessage('正在连接节点确认绑定会话');

    try {
      const status = await getValidatorPairingStatus(validatorPairing.payload);
      const state = typeof (status as { state?: unknown })?.state === 'string' ? String((status as { state: string }).state) : 'unknown';

      if (state === 'completed') {
        setValidatorBindingState('completed');
        setValidatorBindingMessage(
          `该节点已完成验证者钱包绑定${buildValidatorPairingRestartNotice(getValidatorPairingCompletion(status))}`
        );
        return;
      }

      const validatorPairingWallet = await ensureValidatorPairingWalletCredential({
        currentWalletAddress,
        currentWalletSigningSeed,
        onEnsureWalletForValidatorPairing
      });
      const currentWalletAddressForPairing = validatorPairingWallet.address;
      const currentWalletSigningSeedForPairing = validatorPairingWallet.signingSeed;

      if (typeof currentWalletSigningSeedForPairing !== 'string' || currentWalletSigningSeedForPairing.trim().length === 0) {
        setValidatorBindingState('failed');
        setValidatorBindingMessage('当前钱包未解锁。请重新导入助记词解锁后再绑定验证者节点。');
        return;
      }

      setValidatorBindingState('registering');
      if (validatorPairing.payload.mode === VALIDATOR_PAIRING_MODE_BOOTSTRAP) {
        setValidatorBindingMessage('节点会话已确认，正在本地签名公网引导加入授权');
        const bootstrapStakerSignature = signBootstrapPairingAuthorization(validatorPairing.payload, {
          signingSeed: currentWalletSigningSeedForPairing,
          stakerAddress: currentWalletAddressForPairing,
          stakeLamports: MINIMUM_VALIDATOR_STAKE_LAMPORTS
        });
        const completionResult = await completeValidatorPairing(validatorPairing.payload, {
          stakerAddress: currentWalletAddressForPairing,
          stakeLamports: MINIMUM_VALIDATOR_STAKE_LAMPORTS,
          bootstrapStakerSignature
        });
        setValidatorBindingState('completed');
        setValidatorBindingMessage(
          `节点加入授权已提交，节点绑定已完成${buildValidatorPairingRestartNotice(completionResult)}。授权 ${bootstrapStakerSignature.slice(0, 8)}...${bootstrapStakerSignature.slice(-8)}`
        );
        return;
      }

      setValidatorBindingMessage('节点会话已确认，正在本地签名并向该节点提交最低质押注册交易');
      const validatorPairingClient = new JsonRpcClient(validatorPairing.payload.rpcURL);
      const walletBalance = await validatorPairingClient.getBalance(currentWalletAddressForPairing);
      if (walletBalance < MINIMUM_VALIDATOR_STAKE_LAMPORTS) {
        throw new Error(`当前钱包余额不足，验证者最低质押需要 ${MINIMUM_VALIDATOR_STAKE_LAMPORTS.toString()} lamports`);
      }
      const registrationResult = await submitRegisterValidatorIdentityTransaction({
        client: validatorPairingClient,
        signingSeed: currentWalletSigningSeedForPairing,
        validatorAddress: validatorPairing.payload.validatorAddress,
        consensusPublicKey: validatorPairing.payload.consensusAddress,
        blsPublicKey: validatorPairing.payload.blsPublicKey,
        peerId: validatorPairing.payload.nodePeerID,
        stakeLamports: String(MINIMUM_VALIDATOR_STAKE_LAMPORTS),
        commissionBps: 0
      });
      const completionResult = await completeValidatorPairing(validatorPairing.payload, {
        stakerAddress: currentWalletAddressForPairing,
        stakeLamports: Number(registrationResult.lamports),
        signature: registrationResult.signature
      });
      setValidatorBindingState('completed');
      setValidatorBindingMessage(
        `验证者注册已提交，节点绑定已完成${buildValidatorPairingRestartNotice(completionResult)}。签名 ${registrationResult.signature.slice(0, 8)}...${registrationResult.signature.slice(-8)}`
      );
    } catch (error: unknown) {
      setValidatorBindingState('failed');
      setValidatorBindingMessage(error instanceof Error ? error.message : '连接验证者节点失败');
    }
  };

  const handleCopyPress = () => {
    if (scannedPayload === null) {
      setCopyMessage('暂无可复制内容');
      return;
    }

    void copyTextToClipboard(scannedPayload, '已复制扫码内容')
      .then((result) => {
        setCopyMessage(result.message);
      })
      .catch((error: unknown) => {
        setCopyMessage(error instanceof Error ? error.message : '复制失败');
      });
  };

  const handleRescanPress = () => {
    scanLockRef.current = false;
    setCameraError('');
    setCopyMessage('');
    setImageScanMessage('');
    setScannedPayload(null);
    setScanPayloadSource(null);
    setIsScannerActive(true);
    setValidatorBindingMessage('');
    setValidatorBindingState('idle');
    console.info('[scan-result] rescan requested');
  };

  const handleShowAllPress = () => {
    console.info('[scan-result] recent history requested');
  };

  const handleRequestCameraPermission = () => {
    requestCameraAccess('manual');
  };

  const handlePickImagePress = async () => {
    if (isImagePickerBusy) {
      return;
    }

    const shouldResumeCameraOnFailure = scannedPayload === null;
    let didScanImagePayload = false;
    scanLockRef.current = true;
    setIsImagePickerBusy(true);
    setIsScannerActive(false);
    setCopyMessage('');
    setValidatorBindingMessage('');
    setValidatorBindingState('idle');
    setImageScanMessage('正在打开相册');

    try {
      const mediaPermission = Platform.OS === 'web' ? { canAskAgain: true, granted: true } : await ImagePicker.requestMediaLibraryPermissionsAsync(false);

      if (!mediaPermission.granted) {
        setImageScanMessage(mediaPermission.canAskAgain ? '请允许访问照片后选择二维码图片' : '照片权限已关闭，请在系统设置中允许 SOL 访问照片');

        if (mediaPermission.canAskAgain === false) {
          void Linking.openSettings().catch((error: unknown) => {
            setImageScanMessage(error instanceof Error ? error.message : '无法打开系统权限设置');
          });
        }

        return;
      }

      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        allowsMultipleSelection: false,
        base64: false,
        exif: false,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1
      });

      if (pickerResult.canceled || pickerResult.assets === null || pickerResult.assets.length === 0) {
        setImageScanMessage('已取消选择图片');
        return;
      }

      const selectedAsset = pickerResult.assets[0];
      setImageScanMessage('正在识别图片二维码');
      const nextPayload = await scanImageUriForPayload(selectedAsset.uri, scanFromURLAsync, sanitizeScanPayload);

      scanLockRef.current = true;
      didScanImagePayload = true;
      setScannedPayload(nextPayload);
      setScanPayloadSource('image');
      setIsScannerActive(false);
      setImageScanMessage('已识别本地图片二维码');
      console.info('[scan-result] image QR scanned', {
        height: selectedAsset.height,
        payloadLength: nextPayload.length,
        width: selectedAsset.width
      });
    } catch (error: unknown) {
      setImageScanMessage(error instanceof Error ? error.message : '图片二维码识别失败');
      console.info('[scan-result] image QR scan failed');
    } finally {
      setIsImagePickerBusy(false);

      if (shouldResumeCameraOnFailure && !didScanImagePayload) {
        scanLockRef.current = false;
        setIsScannerActive(true);
      }
    }
  };

  const handleCameraReady = () => {
    setIsCameraReady(true);
    setCameraError('');
    console.info('[scan-result] camera ready');
  };

  const handleCameraError = (event: { readonly message: string }) => {
    const nextMessage = event.message || '相机启动失败';
    setCameraError(nextMessage);
    console.info('[scan-result] camera mount failed', { message: nextMessage });
  };

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (scanLockRef.current) {
      return;
    }

    const nextPayload = sanitizeScanPayload(result.data);
    if (nextPayload.length === 0) {
      return;
    }

    scanLockRef.current = true;
    setScannedPayload(nextPayload);
    setScanPayloadSource('camera');
    setIsScannerActive(false);
    setImageScanMessage('');
    console.info('[scan-result] barcode scanned', {
      payloadLength: nextPayload.length,
      type: result.type
    });
  };

  return (
    <View style={styles.root}>
      <ScrollView
        bounces={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: resolvedBottomPadding,
            paddingTop: resolvedTopPadding
          }
        ]}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.canvas}>
          <PageHeading onBackPress={onBackPress} scale={layoutMetrics.scale} styles={styles} />
          <ScanPreviewCard
            cameraError={cameraError}
            cameraPermissionCanAskAgain={cameraPermission?.canAskAgain !== false}
            cameraPermissionGranted={cameraPermission?.granted === true}
            isCameraReady={isCameraReady}
            isImagePickerBusy={isImagePickerBusy}
            isScannerActive={isScannerActive}
            onBarcodeScanned={handleBarcodeScanned}
            onCameraError={handleCameraError}
            onCameraReady={handleCameraReady}
            onPickImagePress={handlePickImagePress}
            onRequestCameraPermission={handleRequestCameraPermission}
            scale={layoutMetrics.scale}
            styles={styles}
          />
          <RecognizedResultCard scale={layoutMetrics.scale} scanSummary={scanSummary} styles={styles} />
          <ActionButtons
            confirmLabel={scanSummary.kind === 'validatorPairing' ? '绑定节点' : '继续确认'}
            onConfirmPress={handleConfirmPress}
            onCopyPress={handleCopyPress}
            onRescanPress={handleRescanPress}
            scale={layoutMetrics.scale}
            styles={styles}
          />
          <ScanFeedbackMessage
            copyMessage={copyMessage}
            imageScanMessage={imageScanMessage}
            scale={layoutMetrics.scale}
            styles={styles}
            validatorBindingMessage={validatorBindingMessage}
          />
          <RecentScanCard onShowAllPress={handleShowAllPress} scale={layoutMetrics.scale} styles={styles} />
        </View>
      </ScrollView>
    </View>
  );
}

function PageHeading({
  onBackPress,
  scale,
  styles
}: {
  readonly onBackPress?: () => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.pageHeading}>
      <Pressable accessibilityLabel="返回" accessibilityRole="button" onPress={onBackPress} style={styles.backButton}>
        <BackChevronIcon size={scaled(52, scale)} />
      </Pressable>
      <Text style={styles.pageTitle}>扫码</Text>
      <Text style={styles.pageSubtitle}>地址、部署请求、交易请求</Text>
    </View>
  );
}

function ScanPreviewCard({
  cameraError,
  cameraPermissionCanAskAgain,
  cameraPermissionGranted,
  isCameraReady,
  isImagePickerBusy,
  isScannerActive,
  onBarcodeScanned,
  onCameraError,
  onCameraReady,
  onPickImagePress,
  onRequestCameraPermission,
  scale,
  styles
}: {
  readonly cameraError: string;
  readonly cameraPermissionCanAskAgain: boolean;
  readonly cameraPermissionGranted: boolean;
  readonly isCameraReady: boolean;
  readonly isImagePickerBusy: boolean;
  readonly isScannerActive: boolean;
  readonly onBarcodeScanned: (result: BarcodeScanningResult) => void;
  readonly onCameraError: (event: { readonly message: string }) => void;
  readonly onCameraReady: () => void;
  readonly onPickImagePress: () => void;
  readonly onRequestCameraPermission: () => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.scanCard}>
      <Image resizeMode="cover" source={scanResultImages.validatorPairingPlatform} style={styles.scanPlatformArtwork} />
      <LinearGradient
        colors={['#020306EE', '#02030688', '#02030600']}
        end={{ x: 1, y: 0.5 }}
        start={{ x: 0, y: 0.5 }}
        style={styles.scanPlatformShade}
      />
      {cameraPermissionGranted ? (
        <CameraView
          active
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          facing="back"
          onBarcodeScanned={isScannerActive ? onBarcodeScanned : undefined}
          onCameraReady={onCameraReady}
          onMountError={onCameraError}
          style={styles.cameraPreview}
        />
      ) : (
        <View style={styles.cameraStatePanel}>
          <Text style={styles.cameraStateTitle}>需要相机权限</Text>
          <Text style={styles.cameraStateText}>
            {cameraError.length > 0 ? cameraError : '授权后即可实时扫描二维码'}
          </Text>
          <Pressable accessibilityRole="button" onPress={onRequestCameraPermission} style={styles.cameraPermissionButton}>
            <Text style={styles.cameraPermissionText}>{cameraPermissionCanAskAgain ? '开启相机' : '去设置'}</Text>
          </Pressable>
        </View>
      )}
      {cameraPermissionGranted && (!isCameraReady || cameraError.length > 0) ? (
        <View style={styles.cameraStatePanel}>
          <Text style={styles.cameraStateTitle}>{cameraError.length > 0 ? '相机不可用' : '正在启动相机'}</Text>
          <Text style={styles.cameraStateText}>{cameraError.length > 0 ? cameraError : '请保持摄像头权限开启'}</Text>
        </View>
      ) : null}
      <Pressable
        accessibilityLabel="从相册选择二维码图片"
        accessibilityRole="button"
        disabled={isImagePickerBusy}
        onPress={onPickImagePress}
        style={[styles.imagePickerButton, isImagePickerBusy ? styles.imagePickerButtonDisabled : null]}
      >
        <ImageLibraryIcon size={scaled(34, scale)} />
        <Text style={styles.imagePickerButtonText}>{isImagePickerBusy ? '识别中' : '相册'}</Text>
      </Pressable>
      <View style={styles.scanFrameWrap}>
        <ScanCornerFrameIcon size={scaled(570, scale)} />
      </View>
      <Text style={styles.scanHint}>对准二维码</Text>
    </View>
  );
}

function RecognizedResultCard({
  scale,
  scanSummary,
  styles
}: {
  readonly scale: number;
  readonly scanSummary: ScanSummary;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.resultCard}>
      <Text style={styles.resultTitle}>识别结果</Text>
      <View style={scanSummary.isVerified ? styles.verifiedPill : styles.waitingPill}>
        <HashVerifiedIcon size={scaled(36, scale)} />
        <Text style={scanSummary.isVerified ? styles.verifiedText : styles.waitingText}>{scanSummary.verifiedText}</Text>
      </View>
      {scanSummary.kind === 'waiting' ? (
        <WaitingResultSkeleton scale={scale} styles={styles} />
      ) : (
        <RecognizedResultContent scale={scale} scanSummary={scanSummary} styles={styles} />
      )}
    </View>
  );
}

function RecognizedResultContent({
  scale,
  scanSummary,
  styles
}: {
  readonly scale: number;
  readonly scanSummary: ScanSummary;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <>
      <View style={styles.tokenIconWrap}>
        <ScanResultKindIcon kind={scanSummary.kind} size={scaled(116, scale)} />
      </View>
      <View style={styles.deployTag}>
        <Text style={styles.deployTagText}>{scanSummary.tag}</Text>
      </View>
      <Text style={styles.tokenName}>{scanSummary.name}</Text>
      <View style={styles.tokenStandardPill}>
        <Text style={styles.tokenStandardText}>{scanSummary.standard}</Text>
      </View>
      {scanSummary.rows.map((row, index) => (
        <ResultInfoRow index={index} key={row.key} row={row} scale={scale} styles={styles} />
      ))}
    </>
  );
}

function ScanResultKindIcon({ kind, size }: { readonly kind: ScanKind; readonly size: number }) {
  if (kind === 'address') {
    return <SolAddressResultIcon size={size} />;
  }

  if (kind === 'transfer') {
    return <TransferRequestResultIcon size={size} />;
  }

  if (kind === 'deploy') {
    return <DeployRequestResultIcon size={size} />;
  }

  if (kind === 'validatorPairing') {
    return <ValidatorPairingIcon size={size} />;
  }

  return <UnknownScanResultIcon size={size} />;
}

function WaitingResultSkeleton({
  scale,
  styles
}: {
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  const rowTops = [236, 292, 348] as const;

  return (
    <>
      <View style={styles.skeletonAvatar} />
      <View style={styles.skeletonTag} />
      <View style={styles.skeletonName} />
      <View style={styles.skeletonPill} />
      {rowTops.map((top) => (
        <View key={top} style={[styles.skeletonRow, { top: scaled(top, scale) }]}>
          <View style={styles.skeletonRowIcon} />
          <View style={styles.skeletonRowLabel} />
          <View style={styles.skeletonRowValue} />
        </View>
      ))}
    </>
  );
}

function ResultInfoRow({
  index,
  row,
  scale,
  styles
}: {
  readonly index: number;
  readonly row: ResultRow;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  const rowTop = scaled(236 + index * 56, scale);

  return (
    <View style={[styles.resultInfoRow, { top: rowTop }]}>
      <View style={styles.resultInfoIcon}>
        <ResultRowIcon iconKey={row.icon} size={scaled(38, scale)} />
      </View>
      <Text style={styles.resultInfoLabel}>{row.label}</Text>
      <Text numberOfLines={1} style={styles.resultInfoValue}>{row.value}</Text>
      {row.icon === 'hash' ? (
        <Pressable accessibilityLabel={`复制${row.label}`} accessibilityRole="button" style={styles.inlineCopyButton}>
          <CopyContentIcon size={scaled(34, scale)} />
        </Pressable>
      ) : null}
    </View>
  );
}

function ResultRowIcon({ iconKey, size }: { readonly iconKey: ResultIconKey; readonly size: number }) {
  if (iconKey === 'hash') {
    return <CodeHashIcon size={size} />;
  }

  if (iconKey === 'source') {
    return <SourceFileIcon size={size} />;
  }

  if (iconKey === 'validator') {
    return <ValidatorNodeIcon size={size} />;
  }

  if (iconKey === 'wallet') {
    return <WalletLinkIcon size={size} />;
  }

  return <NetworkNodesIcon size={size} />;
}

function ActionButtons({
  confirmLabel,
  onConfirmPress,
  onCopyPress,
  onRescanPress,
  scale,
  styles
}: {
  readonly confirmLabel: string;
  readonly onConfirmPress: () => void;
  readonly onCopyPress: () => void;
  readonly onRescanPress: () => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.actionRow}>
      <Pressable accessibilityRole="button" onPress={onConfirmPress} style={styles.confirmButtonOuter}>
        {({ pressed }) => (
          <LinearGradient
            colors={['#126DFF', '#7845FF', '#B932FF']}
            end={{ x: 1, y: 0.5 }}
            start={{ x: 0, y: 0.5 }}
            style={pressed ? styles.confirmButtonPressed : styles.confirmButtonGradient}
          >
            <View style={styles.confirmButtonInner}>
              <Text style={styles.confirmButtonText}>{confirmLabel}</Text>
            </View>
          </LinearGradient>
        )}
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onCopyPress} style={styles.copyButton}>
        <CopyContentIcon size={scaled(40, scale)} />
        <Text style={styles.secondaryButtonText}>复制内容</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={onRescanPress} style={styles.rescanButton}>
        <RescanIcon size={scaled(40, scale)} />
        <Text style={styles.secondaryButtonText}>重新扫描</Text>
      </Pressable>
    </View>
  );
}

function ScanFeedbackMessage({
  copyMessage,
  imageScanMessage,
  styles,
  validatorBindingMessage
}: {
  readonly copyMessage: string;
  readonly imageScanMessage: string;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
  readonly validatorBindingMessage: string;
}) {
  const message = validatorBindingMessage || imageScanMessage || copyMessage;

  if (message.length === 0) {
    return null;
  }

  return (
    <View style={styles.feedbackBar}>
      <Text numberOfLines={1} style={styles.feedbackText}>{message}</Text>
    </View>
  );
}

function RecentScanCard({
  onShowAllPress,
  scale,
  styles
}: {
  readonly onShowAllPress: () => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.recentCard}>
      <Text style={styles.recentTitle}>最近扫描</Text>
      <Pressable accessibilityRole="button" onPress={onShowAllPress} style={styles.showAllButton}>
        <Text style={styles.showAllText}>查看全部</Text>
        <ChevronRightIcon size={scaled(32, scale)} />
      </Pressable>
      {recentRows.map((row, index) => (
        <RecentRow index={index} key={row.key} row={row} scale={scale} styles={styles} />
      ))}
    </View>
  );
}

function RecentRow({
  index,
  row,
  scale,
  styles
}: {
  readonly index: number;
  readonly row: (typeof recentRows)[number];
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable accessibilityRole="button" style={[styles.recentRow, { top: scaled(94 + index * 64, scale) }]}>
      <RecentRowIcon iconKey={row.icon} size={scaled(48, scale)} />
      <Text style={styles.recentRowTitle}>{row.title}</Text>
      <Text numberOfLines={1} style={styles.recentRowDetail}>{row.detail}</Text>
      <Text style={styles.recentRowTime}>{row.time}</Text>
      <View style={styles.recentChevron}>
        <ChevronRightIcon size={scaled(32, scale)} />
      </View>
    </Pressable>
  );
}

function RecentRowIcon({ iconKey, size }: { readonly iconKey: RecentIconKey; readonly size: number }) {
  if (iconKey === 'address') {
    return <RecentAddressIcon size={size} />;
  }

  if (iconKey === 'deploy') {
    return <RecentDeployIcon size={size} />;
  }

  if (iconKey === 'validator') {
    return <ValidatorPairingIcon size={size} />;
  }

  return <RecentTransferIcon size={size} />;
}

function createStyles(scale: number) {
  // 功能目的：按设计稿坐标生成样式；实现原因：扫码页要求移动端视觉一比一还原。
  const textBase = {
    fontFamily: fontFamilies.system,
    includeFontPadding: false
  } as const;

  return StyleSheet.create({
    actionRow: {
      height: scaled(86, scale),
      left: scaled(27, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(1254, scale),
      width: scaled(798, scale)
    },
    backButton: {
      alignItems: 'center',
      height: scaled(64, scale),
      justifyContent: 'center',
      left: scaled(29, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(126, scale),
      width: scaled(64, scale)
    },
    canvas: {
      backgroundColor: colors.background,
      height: scaledBelowTopNavigation(1692, scale),
      position: 'relative',
      width: '100%'
    },
    cameraPermissionButton: {
      alignItems: 'center',
      borderColor: '#6B72FF',
      borderRadius: scaled(18, scale),
      borderWidth: 1,
      height: scaled(48, scale),
      justifyContent: 'center',
      marginTop: scaled(18, scale),
      width: scaled(150, scale)
    },
    cameraPermissionText: {
      color: '#FFFFFF',
      fontSize: scaled(22, scale),
      fontWeight: '700',
      lineHeight: scaled(28, scale),
      ...textBase
    },
    cameraPreview: {
      borderRadius: scaled(22, scale),
      height: scaled(396, scale),
      left: scaled(176, scale),
      overflow: 'hidden',
      position: 'absolute',
      top: scaled(58, scale),
      width: scaled(446, scale)
    },
    cameraStatePanel: {
      alignItems: 'center',
      backgroundColor: '#020306D9',
      borderColor: '#30374D',
      borderRadius: scaled(22, scale),
      borderWidth: 1,
      height: scaled(396, scale),
      justifyContent: 'center',
      left: scaled(176, scale),
      position: 'absolute',
      top: scaled(58, scale),
      width: scaled(446, scale)
    },
    cameraStateText: {
      color: '#9AA0AE',
      fontSize: scaled(22, scale),
      fontWeight: '400',
      lineHeight: scaled(29, scale),
      marginTop: scaled(12, scale),
      maxWidth: scaled(560, scale),
      textAlign: 'center',
      ...textBase
    },
    cameraStateTitle: {
      color: '#FFFFFF',
      fontSize: scaled(28, scale),
      fontWeight: '800',
      lineHeight: scaled(36, scale),
      textAlign: 'center',
      ...textBase
    },
    confirmButtonGradient: {
      borderRadius: scaled(24, scale),
      height: '100%',
      padding: scaled(3, scale),
      width: '100%'
    },
    confirmButtonInner: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderRadius: scaled(21, scale),
      flex: 1,
      justifyContent: 'center'
    },
    confirmButtonOuter: {
      height: scaled(86, scale),
      left: 0,
      position: 'absolute',
      top: 0,
      width: scaled(296, scale)
    },
    confirmButtonPressed: {
      borderRadius: scaled(24, scale),
      height: '100%',
      opacity: 0.84,
      padding: scaled(3, scale),
      width: '100%'
    },
    confirmButtonText: {
      color: '#FFFFFF',
      fontSize: scaled(30, scale),
      fontWeight: '800',
      lineHeight: scaled(39, scale),
      ...textBase
    },
    copyButton: {
      alignItems: 'center',
      borderColor: '#050505',
      borderRadius: scaled(23, scale),
      borderWidth: 1.4,
      flexDirection: 'row',
      height: scaled(86, scale),
      justifyContent: 'center',
      left: scaled(321, scale),
      position: 'absolute',
      top: 0,
      width: scaled(224, scale)
    },
    feedbackBar: {
      alignItems: 'center',
      height: scaled(24, scale),
      justifyContent: 'center',
      left: scaled(27, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(1228, scale),
      width: scaled(798, scale)
    },
    feedbackText: {
      color: '#6F7486',
      fontSize: scaled(18, scale),
      fontWeight: '500',
      lineHeight: scaled(23, scale),
      textAlign: 'center',
      width: '100%',
      ...textBase
    },
    deployTag: {
      alignItems: 'center',
      borderColor: '#305BFF',
      borderRadius: scaled(10, scale),
      borderWidth: 1.4,
      height: scaled(45, scale),
      justifyContent: 'center',
      left: scaled(181, scale),
      position: 'absolute',
      top: scaled(96, scale),
      width: scaled(174, scale)
    },
    deployTagText: {
      color: '#305BFF',
      fontSize: scaled(23, scale),
      fontWeight: '700',
      lineHeight: scaled(30, scale),
      ...textBase
    },
    inlineCopyButton: {
      alignItems: 'center',
      height: scaled(48, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(22, scale),
      top: scaled(-9, scale),
      width: scaled(48, scale)
    },
    imagePickerButton: {
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.16)',
      borderColor: 'rgba(255, 255, 255, 0.32)',
      borderRadius: scaled(18, scale),
      borderWidth: 1,
      flexDirection: 'row',
      height: scaled(58, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(31, scale),
      top: scaled(29, scale),
      width: scaled(156, scale)
    },
    imagePickerButtonDisabled: {
      opacity: 0.62
    },
    imagePickerButtonText: {
      color: '#FFFFFF',
      fontSize: scaled(22, scale),
      fontWeight: '800',
      lineHeight: scaled(29, scale),
      marginLeft: scaled(8, scale),
      ...textBase
    },
    pageHeading: {
      height: scaledBelowTopNavigation(218, scale),
      position: 'absolute',
      top: 0,
      width: '100%'
    },
    pageSubtitle: {
      color: '#6F7486',
      fontSize: scaled(25, scale),
      fontWeight: '400',
      left: scaled(107, scale),
      lineHeight: scaled(33, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(184, scale),
      ...textBase
    },
    pageTitle: {
      color: colors.text,
      fontSize: scaled(42, scale),
      fontWeight: fontWeights.pageTitle,
      left: scaled(106, scale),
      lineHeight: scaled(51, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(127, scale),
      ...textBase
    },
    recentCard: {
      backgroundColor: colors.surface,
      borderColor: '#E8EAF1',
      borderRadius: scaled(28, scale),
      borderWidth: 1,
      height: scaled(294, scale),
      left: scaled(27, scale),
      position: 'absolute',
      shadowColor: '#151824',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.05,
      shadowRadius: 18,
      top: scaledBelowTopNavigation(1368, scale),
      width: scaled(798, scale),
      elevation: 2
    },
    recentChevron: {
      alignItems: 'center',
      height: scaled(44, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(24, scale),
      top: scaled(2, scale),
      width: scaled(44, scale)
    },
    recentRow: {
      alignItems: 'center',
      flexDirection: 'row',
      height: scaled(50, scale),
      left: scaled(32, scale),
      position: 'absolute',
      width: scaled(748, scale)
    },
    recentRowDetail: {
      color: '#747987',
      fontSize: scaled(22, scale),
      fontWeight: '400',
      left: scaled(222, scale),
      lineHeight: scaled(29, scale),
      position: 'absolute',
      width: scaled(350, scale),
      ...textBase
    },
    recentRowTime: {
      color: '#6F7486',
      fontSize: scaled(22, scale),
      fontWeight: '400',
      lineHeight: scaled(29, scale),
      position: 'absolute',
      right: scaled(70, scale),
      textAlign: 'right',
      width: scaled(100, scale),
      ...textBase
    },
    recentRowTitle: {
      color: colors.text,
      fontSize: scaled(24, scale),
      fontWeight: '700',
      left: scaled(68, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      ...textBase
    },
    recentTitle: {
      color: colors.text,
      fontSize: scaled(26, scale),
      fontWeight: '800',
      left: scaled(34, scale),
      lineHeight: scaled(34, scale),
      position: 'absolute',
      top: scaled(36, scale),
      ...textBase
    },
    rescanButton: {
      alignItems: 'center',
      borderColor: '#050505',
      borderRadius: scaled(23, scale),
      borderWidth: 1.4,
      flexDirection: 'row',
      height: scaled(86, scale),
      justifyContent: 'center',
      left: scaled(570, scale),
      position: 'absolute',
      top: 0,
      width: scaled(224, scale)
    },
    resultCard: {
      backgroundColor: colors.surface,
      borderColor: '#E8EAF1',
      borderRadius: scaled(28, scale),
      borderWidth: 1,
      height: scaled(414, scale),
      left: scaled(27, scale),
      position: 'absolute',
      shadowColor: '#151824',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.07,
      shadowRadius: 18,
      top: scaledBelowTopNavigation(812, scale),
      width: scaled(798, scale),
      elevation: 3
    },
    resultInfoIcon: {
      alignItems: 'center',
      height: scaled(44, scale),
      justifyContent: 'center',
      left: 0,
      position: 'absolute',
      top: scaled(-7, scale),
      width: scaled(44, scale)
    },
    resultInfoLabel: {
      color: colors.text,
      fontSize: scaled(22, scale),
      fontWeight: '500',
      left: scaled(60, scale),
      lineHeight: scaled(29, scale),
      position: 'absolute',
      top: 0,
      ...textBase
    },
    resultInfoRow: {
      height: scaled(44, scale),
      left: scaled(38, scale),
      position: 'absolute',
      width: scaled(742, scale)
    },
    resultInfoValue: {
      color: '#181B26',
      fontSize: scaled(22, scale),
      fontWeight: '400',
      left: scaled(295, scale),
      lineHeight: scaled(29, scale),
      position: 'absolute',
      top: 0,
      width: scaled(395, scale),
      ...textBase
    },
    resultTitle: {
      color: colors.text,
      fontSize: scaled(26, scale),
      fontWeight: '800',
      left: scaled(33, scale),
      lineHeight: scaled(34, scale),
      position: 'absolute',
      top: scaled(36, scale),
      ...textBase
    },
    root: {
      backgroundColor: colors.background,
      flex: 1
    },
    scanCard: {
      backgroundColor: '#020306',
      borderRadius: scaled(29, scale),
      height: scaled(560, scale),
      left: scaled(27, scale),
      overflow: 'hidden',
      position: 'absolute',
      top: scaledBelowTopNavigation(228, scale),
      width: scaled(798, scale)
    },
    scanFrameWrap: {
      left: scaled(114, scale),
      position: 'absolute',
      top: scaled(-5, scale)
    },
    scanHint: {
      color: '#FFFFFF',
      fontSize: scaled(26, scale),
      fontWeight: '800',
      left: 0,
      lineHeight: scaled(34, scale),
      position: 'absolute',
      right: 0,
      textAlign: 'center',
      top: scaled(490, scale),
      ...textBase
    },
    scanPlatformArtwork: {
      height: '100%',
      left: 0,
      opacity: 0.9,
      position: 'absolute',
      top: 0,
      width: '100%'
    },
    scanPlatformShade: {
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0
    },
    scrollContent: {
      backgroundColor: colors.background
    },
    scrollView: {
      backgroundColor: colors.background
    },
    secondaryButtonText: {
      color: '#050505',
      fontSize: scaled(25, scale),
      fontWeight: '700',
      lineHeight: scaled(32, scale),
      marginLeft: scaled(14, scale),
      ...textBase
    },
    showAllButton: {
      alignItems: 'center',
      flexDirection: 'row',
      height: scaled(52, scale),
      justifyContent: 'flex-end',
      position: 'absolute',
      right: scaled(32, scale),
      top: scaled(27, scale),
      width: scaled(160, scale)
    },
    showAllText: {
      color: colors.primary,
      fontSize: scaled(20, scale),
      fontWeight: '700',
      lineHeight: scaled(27, scale),
      ...textBase
    },
    skeletonAvatar: {
      backgroundColor: '#EEF2F8',
      borderRadius: scaled(18, scale),
      height: scaled(116, scale),
      left: scaled(33, scale),
      position: 'absolute',
      top: scaled(98, scale),
      width: scaled(116, scale)
    },
    skeletonName: {
      backgroundColor: '#E7EBF3',
      borderRadius: scaled(12, scale),
      height: scaled(32, scale),
      left: scaled(181, scale),
      position: 'absolute',
      top: scaled(170, scale),
      width: scaled(206, scale)
    },
    skeletonPill: {
      backgroundColor: '#F0E9FF',
      borderRadius: scaled(18, scale),
      height: scaled(34, scale),
      left: scaled(410, scale),
      position: 'absolute',
      top: scaled(169, scale),
      width: scaled(132, scale)
    },
    skeletonRow: {
      height: scaled(44, scale),
      left: scaled(38, scale),
      position: 'absolute',
      width: scaled(742, scale)
    },
    skeletonRowIcon: {
      backgroundColor: '#E6EAF2',
      borderRadius: scaled(10, scale),
      height: scaled(28, scale),
      left: scaled(8, scale),
      position: 'absolute',
      top: 0,
      width: scaled(28, scale)
    },
    skeletonRowLabel: {
      backgroundColor: '#E7EBF3',
      borderRadius: scaled(10, scale),
      height: scaled(24, scale),
      left: scaled(60, scale),
      position: 'absolute',
      top: scaled(2, scale),
      width: scaled(150, scale)
    },
    skeletonRowValue: {
      backgroundColor: '#F0F3F8',
      borderRadius: scaled(10, scale),
      height: scaled(24, scale),
      left: scaled(295, scale),
      position: 'absolute',
      top: scaled(2, scale),
      width: scaled(330, scale)
    },
    skeletonTag: {
      backgroundColor: '#EDF2FF',
      borderRadius: scaled(10, scale),
      height: scaled(40, scale),
      left: scaled(181, scale),
      position: 'absolute',
      top: scaled(100, scale),
      width: scaled(174, scale)
    },
    tokenIconWrap: {
      left: scaled(33, scale),
      position: 'absolute',
      top: scaled(98, scale)
    },
    tokenName: {
      color: '#11131C',
      fontSize: scaled(30, scale),
      fontWeight: '800',
      left: scaled(181, scale),
      lineHeight: scaled(39, scale),
      position: 'absolute',
      top: scaled(168, scale),
      ...textBase
    },
    tokenStandardPill: {
      alignItems: 'center',
      backgroundColor: '#F0E9FF',
      borderRadius: scaled(19, scale),
      height: scaled(38, scale),
      justifyContent: 'center',
      left: scaled(397, scale),
      position: 'absolute',
      top: scaled(169, scale),
      width: scaled(148, scale)
    },
    tokenStandardText: {
      color: '#7641FF',
      fontSize: scaled(22, scale),
      fontWeight: '700',
      lineHeight: scaled(29, scale),
      ...textBase
    },
    verifiedPill: {
      alignItems: 'center',
      backgroundColor: '#F7FAF8',
      borderRadius: scaled(23, scale),
      flexDirection: 'row',
      height: scaled(46, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(32, scale),
      top: scaled(31, scale),
      width: scaled(190, scale)
    },
    verifiedText: {
      color: '#18A55E',
      fontSize: scaled(21, scale),
      fontWeight: '500',
      lineHeight: scaled(28, scale),
      marginLeft: scaled(10, scale),
      ...textBase
    },
    waitingPill: {
      alignItems: 'center',
      backgroundColor: '#F0F4FF',
      borderRadius: scaled(23, scale),
      flexDirection: 'row',
      height: scaled(46, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(32, scale),
      top: scaled(31, scale),
      width: scaled(166, scale)
    },
    waitingText: {
      color: colors.primary,
      fontSize: scaled(21, scale),
      fontWeight: '500',
      lineHeight: scaled(28, scale),
      marginLeft: scaled(10, scale),
      ...textBase
    }
  });
}
