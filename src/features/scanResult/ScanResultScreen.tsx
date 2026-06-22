import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CameraView, type BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { getGlobalHeaderHeight } from '../../components/GlobalHeader';
import { colors, fontFamilies } from '../../theme/tokens';
import {
  BackChevronIcon,
  ChevronRightIcon,
  CodeHashIcon,
  CopyContentIcon,
  HashVerifiedIcon,
  NetworkNodesIcon,
  PopTokenIcon,
  RecentAddressIcon,
  RecentDeployIcon,
  RecentTransferIcon,
  RescanIcon,
  ScanCornerFrameIcon,
  SourceFileIcon
} from './ScanResultSvgIcons';
import { useScanResultResponsiveLayout } from './useScanResultResponsiveLayout';

const TOP_NAVIGATION_DESIGN_HEIGHT = 117;
const MAX_SCAN_PAYLOAD_LENGTH = 256;

const recentRows = [
  { key: 'address', icon: 'address', title: '收款地址', detail: '3GT9QRAu2L...TcZjT5S', time: '18:11:32' },
  { key: 'deploy', icon: 'deploy', title: '部署请求', detail: 'POP 泡泡币（ERC20-like）', time: '18:09:21' },
  { key: 'transfer', icon: 'transfer', title: '交易请求', detail: '转账 1,000,000 lamports', time: '18:05:44' }
] as const;

type ResultIconKey = 'hash' | 'source' | 'network';
type RecentIconKey = (typeof recentRows)[number]['icon'];
type ScanKind = 'address' | 'deploy' | 'transfer' | 'unknown' | 'waiting';
type CameraPermissionRequestSource = 'auto' | 'manual';

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
  readonly onBackPress?: () => void;
  readonly topPadding?: number;
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

function getScanKind(payload: string | null): ScanKind {
  if (payload === null) {
    return 'waiting';
  }

  if (/^(solana:|sol:)/i.test(payload) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(payload)) {
    return 'address';
  }

  if (/^(deploy:|bytecode:)/i.test(payload) || /^[a-f0-9]{32,}$/i.test(payload)) {
    return 'deploy';
  }

  if (/^(transfer:|tx:)/i.test(payload) || /lamports/i.test(payload)) {
    return 'transfer';
  }

  return 'unknown';
}

function createScanSummary(payload: string | null): ScanSummary {
  const kind = getScanKind(payload);
  const displayValue = payload === null ? '等待二维码进入扫描框' : compactScanPayload(payload);
  const firstLabel = kind === 'deploy' ? 'Bytecode Hash' : '扫码内容';

  if (kind === 'waiting') {
    return {
      isVerified: false,
      kind,
      name: '等待扫码',
      rows: [
        { key: 'payload', icon: 'hash', label: firstLabel, value: displayValue },
        { key: 'source', icon: 'source', label: '来源', value: '摄像头' },
        { key: 'network', icon: 'network', label: '网络', value: '自动识别' }
      ],
      standard: 'Camera',
      tag: '实时扫描',
      verifiedText: '等待扫码'
    };
  }

  return {
    isVerified: true,
    kind,
    name: kind === 'address' ? 'SOL 地址' : kind === 'transfer' ? '交易请求' : kind === 'deploy' ? '合约部署请求' : '扫码内容',
    rows: [
      { key: 'payload', icon: 'hash', label: firstLabel, value: displayValue },
      { key: 'source', icon: 'source', label: '来源', value: '摄像头扫码' },
      { key: 'network', icon: 'network', label: '网络', value: kind === 'unknown' ? '本地识别' : 'SOL Mainnet' }
    ],
    standard: kind === 'deploy' ? 'ERC20-like' : kind === 'address' ? 'Address' : kind === 'transfer' ? 'Lamports' : 'Payload',
    tag: kind === 'address' ? '收款地址' : kind === 'transfer' ? '交易请求' : kind === 'deploy' ? '合约部署请求' : '已识别',
    verifiedText: 'Hash 已校验'
  };
}

export function ScanResultScreen({ bottomPadding, onBackPress, topPadding }: ScanResultScreenProps) {
  const layoutMetrics = useScanResultResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const headerHeight = getGlobalHeaderHeight(layoutMetrics.scale);
  const resolvedBottomPadding = bottomPadding ?? layoutMetrics.bottomNavHeight;
  const resolvedTopPadding = topPadding ?? layoutMetrics.topSafeArea + headerHeight;
  const permissionRequestStartedRef = useRef(false);
  const scanLockRef = useRef(false);
  const [cameraPermission, requestCameraPermission, getCameraPermission] = useCameraPermissions();
  const [cameraError, setCameraError] = useState('');
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isScannerActive, setIsScannerActive] = useState(true);
  const [scannedPayload, setScannedPayload] = useState<string | null>(null);
  const scanSummary = createScanSummary(scannedPayload);

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
    console.info('[scan-result] confirm requested', {
      hasPayload: scannedPayload !== null,
      resultType: scanSummary.kind
    });
  };

  const handleCopyPress = () => {
    console.info('[scan-result] copy content requested', {
      hasPayload: scannedPayload !== null,
      payloadLength: scannedPayload?.length ?? 0
    });
  };

  const handleRescanPress = () => {
    scanLockRef.current = false;
    setCameraError('');
    setScannedPayload(null);
    setIsScannerActive(true);
    console.info('[scan-result] rescan requested');
  };

  const handleShowAllPress = () => {
    console.info('[scan-result] recent history requested');
  };

  const handleRequestCameraPermission = () => {
    requestCameraAccess('manual');
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
    setIsScannerActive(false);
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
            isScannerActive={isScannerActive}
            onBarcodeScanned={handleBarcodeScanned}
            onCameraError={handleCameraError}
            onCameraReady={handleCameraReady}
            onRequestCameraPermission={handleRequestCameraPermission}
            scale={layoutMetrics.scale}
            styles={styles}
          />
          <RecognizedResultCard scale={layoutMetrics.scale} scanSummary={scanSummary} styles={styles} />
          <ActionButtons
            onConfirmPress={handleConfirmPress}
            onCopyPress={handleCopyPress}
            onRescanPress={handleRescanPress}
            scale={layoutMetrics.scale}
            styles={styles}
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
  isScannerActive,
  onBarcodeScanned,
  onCameraError,
  onCameraReady,
  onRequestCameraPermission,
  scale,
  styles
}: {
  readonly cameraError: string;
  readonly cameraPermissionCanAskAgain: boolean;
  readonly cameraPermissionGranted: boolean;
  readonly isCameraReady: boolean;
  readonly isScannerActive: boolean;
  readonly onBarcodeScanned: (result: BarcodeScanningResult) => void;
  readonly onCameraError: (event: { readonly message: string }) => void;
  readonly onCameraReady: () => void;
  readonly onRequestCameraPermission: () => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.scanCard}>
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
        <PopTokenIcon size={scaled(116, scale)} />
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

  return <NetworkNodesIcon size={size} />;
}

function ActionButtons({
  onConfirmPress,
  onCopyPress,
  onRescanPress,
  scale,
  styles
}: {
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
              <Text style={styles.confirmButtonText}>继续确认</Text>
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
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0
    },
    cameraStatePanel: {
      alignItems: 'center',
      backgroundColor: '#020306',
      bottom: 0,
      justifyContent: 'center',
      left: 0,
      position: 'absolute',
      right: 0,
      top: 0
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
      fontWeight: '800',
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
