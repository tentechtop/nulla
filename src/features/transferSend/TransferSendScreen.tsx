import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FastDialogModal } from '../../components/FastDialogModal';
import { getGlobalHeaderHeight } from '../../components/GlobalHeader';
import { HeaderScanSvgIcon } from '../../components/HeaderSvgIcons';
import { OperationTipDialog } from '../../components/OperationTipDialog';
import { colors, fontFamilies, fontWeights } from '../../theme/tokens';
import { SYSTEM_ADDRESS_MAX_LENGTH, isSystemAddress } from '../../utils/addressSpec';
import { submitTransferTransaction, waitForTransactionFinality, type SubmittedTransactionResult } from '../../utils/chainOperations';
import { JsonRpcClient } from '../../utils/chainRpc';
import { createEmptyWalletPortfolio, formatLamports, formatLamportsAsSol, loadWalletPortfolio, type WalletPortfolio } from '../../utils/walletBusiness';
import { createSubmittedTransactionDetail, type TransactionDetailData } from '../transactionDetail/transactionDetailData';
import type { ScannedSendDraft } from '../transferFlow';
import { transferSendImages } from './designAssets';
import {
  AddressContactIcon,
  BackChevronIcon,
  ChevronRightIcon,
  CurrentRouteIcon,
  InfoIcon,
  RouteMaskIcon,
  RouteShieldIcon
} from './TransferSendSvgIcons';
import { useTransferSendResponsiveLayout } from './useTransferSendResponsiveLayout';

const NETWORK_FEE_LAMPORTS = 5000n;
const TOP_NAVIGATION_DESIGN_HEIGHT = 117;

const modeOptions = [
  { key: 'auto', title: '自动', subtitle: '推荐' },
  { key: 'transparent', title: '透明', subtitle: '速度最快' },
  { key: 'private', title: '隐私', subtitle: '保护隐私' },
  { key: 'privateToTransparent', title: '隐私转透明', subtitle: '跨类型转账' }
] as const;

type ModeOption = (typeof modeOptions)[number];
export type PendingTransferSendDraft = {
  readonly address: string;
  readonly amount: string;
  readonly selectedMode: 'auto' | 'transparent' | 'private' | 'privateToTransparent';
};

type ModeOptionKey = PendingTransferSendDraft['selectedMode'];
type SendDialogKind = 'balanceLoading' | 'insufficientBalance' | 'invalidAddress' | 'invalidAmount' | 'routeReady' | 'submitFailed' | 'submitted' | 'submitting' | 'unsupportedMode' | 'walletLocked';

type TransferSendScreenProps = {
  readonly bottomPadding?: number;
  readonly currentWalletAddress?: string | null;
  readonly currentWalletSigningSeed?: string | null;
  readonly initialDraft?: PendingTransferSendDraft | null;
  readonly onDetailPress?: (detailData: TransactionDetailData) => void;
  readonly onBackPress?: () => void;
  readonly onScanPress?: () => void;
  readonly onUnlockWalletPress?: (draft: PendingTransferSendDraft) => void;
  readonly rpcEndpoint?: string;
  readonly scannedDraft?: ScannedSendDraft | null;
  readonly topPadding?: number;
};

function scaled(value: number, scale: number) {
  return Math.round(value * scale);
}

function scaledBelowTopNavigation(value: number, scale: number) {
  return scaled(value - TOP_NAVIGATION_DESIGN_HEIGHT, scale);
}

function sanitizeAddressInput(nextValue: string) {
  return nextValue.replace(/\s/g, '').slice(0, SYSTEM_ADDRESS_MAX_LENGTH);
}

function sanitizeLamportsInput(nextValue: string) {
  return nextValue.replace(/[^\d]/g, '').slice(0, 18);
}

export function TransferSendScreen({
  bottomPadding,
  currentWalletAddress,
  currentWalletSigningSeed,
  initialDraft,
  onBackPress,
  onDetailPress,
  onScanPress,
  onUnlockWalletPress,
  rpcEndpoint,
  scannedDraft,
  topPadding
}: TransferSendScreenProps) {
  const layoutMetrics = useTransferSendResponsiveLayout();
  const styles = createStyles(layoutMetrics.scale);
  const headerHeight = getGlobalHeaderHeight(layoutMetrics.scale);
  const resolvedBottomPadding = bottomPadding ?? layoutMetrics.bottomNavHeight;
  const resolvedTopPadding = topPadding ?? layoutMetrics.topSafeArea + headerHeight;
  const [address, setAddress] = useState(() => sanitizeAddressInput(initialDraft?.address ?? ''));
  const [amount, setAmount] = useState(() => sanitizeLamportsInput(initialDraft?.amount ?? ''));
  const [isSendConfirmVisible, setIsSendConfirmVisible] = useState(false);
  const [isSendResultVisible, setIsSendResultVisible] = useState(false);
  const [sendDialogKind, setSendDialogKind] = useState<SendDialogKind>('submitted');
  const [sendErrorMessage, setSendErrorMessage] = useState('');
  const [submittedTransaction, setSubmittedTransaction] = useState<SubmittedTransactionResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMode, setSelectedMode] = useState<ModeOptionKey>(initialDraft?.selectedMode ?? 'auto');
  const [portfolio, setPortfolio] = useState<WalletPortfolio>(() => createEmptyWalletPortfolio(currentWalletAddress));
  const [isBalanceLoading, setIsBalanceLoading] = useState(true);
  const client = useMemo(() => new JsonRpcClient(rpcEndpoint), [rpcEndpoint]);
  const isWalletUnlocked = typeof currentWalletSigningSeed === 'string' && currentWalletSigningSeed.trim().length > 0;

  useEffect(() => {
    let cancelled = false;
    setIsBalanceLoading(true);

    // 功能目的：加载当前钱包真实余额；实现原因：发送页必须用链上余额控制全部按钮和余额校验。
    void loadWalletPortfolio(currentWalletAddress, client)
      .then((nextPortfolio) => {
        if (!cancelled) {
          setPortfolio(nextPortfolio);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const fallbackPortfolio = createEmptyWalletPortfolio(currentWalletAddress);
          setPortfolio({
            ...fallbackPortfolio,
            chain: {
              ...fallbackPortfolio.chain,
              error: error instanceof Error ? error.message : String(error)
            }
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsBalanceLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [client, currentWalletAddress]);

  useEffect(() => {
    if (initialDraft === null || initialDraft === undefined) {
      return;
    }

    // 功能目的：恢复解锁前的发送表单；实现原因：导入助记词会切换页面，必须避免用户重复输入收款地址和数量。
    setAddress(sanitizeAddressInput(initialDraft.address));
    setAmount(sanitizeLamportsInput(initialDraft.amount));
    setSelectedMode(initialDraft.selectedMode);
  }, [initialDraft]);

  useEffect(() => {
    if (scannedDraft === null || scannedDraft === undefined) {
      return;
    }

    // 功能目的：应用扫码发送草稿；实现原因：二维码识别后必须直接进入可确认的发送表单。
    setAddress(sanitizeAddressInput(scannedDraft.address));
    if (scannedDraft.amount.length > 0) {
      setAmount(sanitizeLamportsInput(scannedDraft.amount));
    }
  }, [scannedDraft]);

  const handleAddressChange = (nextValue: string) => {
    setAddress(sanitizeAddressInput(nextValue));
  };

  const handleAmountChange = (nextValue: string) => {
    setAmount(sanitizeLamportsInput(nextValue));
  };

  const handleUseAllBalance = () => {
    const maxTransferLamports = portfolio.transparentLamports > NETWORK_FEE_LAMPORTS
      ? portfolio.transparentLamports - NETWORK_FEE_LAMPORTS
      : 0n;
    setAmount(maxTransferLamports.toString());
  };

  const handleCheckRoute = () => {
    if (!isWalletUnlocked) {
      setSendDialogKind('walletLocked');
      setSendErrorMessage('');
      setIsSendResultVisible(true);
      return;
    }

    if (!isSystemAddress(address)) {
      setSendDialogKind('invalidAddress');
      setSendErrorMessage('');
      setIsSendResultVisible(true);
      return;
    }

    if (!/^[1-9]\d*$/.test(amount)) {
      setSendDialogKind('invalidAmount');
      setSendErrorMessage('');
      setIsSendResultVisible(true);
      return;
    }

    if (selectedMode !== 'auto' && selectedMode !== 'transparent') {
      setSendDialogKind('unsupportedMode');
      setSendErrorMessage('');
      setIsSendResultVisible(true);
      return;
    }

    if (isBalanceLoading) {
      setSendDialogKind('balanceLoading');
      setSendErrorMessage('');
      setIsSendResultVisible(true);
      return;
    }

    const transferLamports = BigInt(amount);
    if (transferLamports + NETWORK_FEE_LAMPORTS > portfolio.transparentLamports) {
      setSendDialogKind('insufficientBalance');
      setSendErrorMessage('');
      setIsSendResultVisible(true);
      return;
    }

    setSendDialogKind('routeReady');
    setSendErrorMessage('');
    setIsSendResultVisible(true);
    console.info('[transfer-send] route check requested', {
      hasAddress: address.length > 0,
      hasAmount: amount.length > 0,
      mode: selectedMode
    });
  };

  const handleUnlockWallet = () => {
    if (onUnlockWalletPress) {
      onUnlockWalletPress({ address, amount, selectedMode });
      return;
    }

    setSendDialogKind('walletLocked');
    setSendErrorMessage('');
    setIsSendResultVisible(true);
  };

  const getBlockedSendDialogKind = (): SendDialogKind | null => {
    if (!isSystemAddress(address)) {
      return 'invalidAddress';
    }

    if (!/^[1-9]\d*$/.test(amount)) {
      return 'invalidAmount';
    }

    if (selectedMode !== 'auto' && selectedMode !== 'transparent') {
      return 'unsupportedMode';
    }

    if (!isWalletUnlocked) {
      return 'walletLocked';
    }

    if (isBalanceLoading) {
      return 'balanceLoading';
    }

    const transferLamports = BigInt(amount);
    return transferLamports + NETWORK_FEE_LAMPORTS > portfolio.transparentLamports ? 'insufficientBalance' : null;
  };

  const showBlockedSendDialog = (kind: SendDialogKind) => {
    setSendDialogKind(kind);
    setSendErrorMessage('');
    setIsSendResultVisible(true);
  };

  const handlePrimaryAction = () => {
    if (!isWalletUnlocked) {
      handleUnlockWallet();
      return;
    }

    const blockedDialogKind = getBlockedSendDialogKind();
    if (blockedDialogKind !== null) {
      showBlockedSendDialog(blockedDialogKind);
      return;
    }

    setIsSendConfirmVisible(true);
    console.info('[transfer-send] confirmation dialog opened', {
      addressLength: address.length,
      amountLength: amount.length,
      mode: selectedMode
    });
  };

  const handleCloseSendConfirm = () => {
    if (isSubmitting) {
      return;
    }

    setIsSendConfirmVisible(false);
  };

  const handleSubmitConfirmedTransfer = () => {
    if (isSubmitting) {
      return;
    }

    setIsSendConfirmVisible(false);
    void handleConfirmSend();
  };

  const handleConfirmSend = async () => {
    if (isSubmitting) {
      return;
    }

    const addressLength = address.length;
    if (!isSystemAddress(address)) {
      setSendDialogKind('invalidAddress');
      setSendErrorMessage('');
      setIsSendResultVisible(true);
      console.info('[transfer-send] invalid receiver address blocked', { addressLength });
      return;
    }

    if (!/^[1-9]\d*$/.test(amount)) {
      setSendDialogKind('invalidAmount');
      setSendErrorMessage('');
      setIsSendResultVisible(true);
      return;
    }

    if (selectedMode !== 'auto' && selectedMode !== 'transparent') {
      setSendDialogKind('unsupportedMode');
      setSendErrorMessage('');
      setIsSendResultVisible(true);
      return;
    }

    if (typeof currentWalletSigningSeed !== 'string' || currentWalletSigningSeed.trim().length === 0) {
      setSendDialogKind('walletLocked');
      setSendErrorMessage('');
      setIsSendResultVisible(true);
      return;
    }

    if (isBalanceLoading) {
      setSendDialogKind('balanceLoading');
      setSendErrorMessage('');
      setIsSendResultVisible(true);
      return;
    }

    const transferLamports = BigInt(amount);
    if (transferLamports + NETWORK_FEE_LAMPORTS > portfolio.transparentLamports) {
      setSendDialogKind('insufficientBalance');
      setSendErrorMessage('');
      setIsSendResultVisible(true);
      return;
    }

    setIsSubmitting(true);
    setSendDialogKind('submitting');
    setSendErrorMessage('');
    setSubmittedTransaction(null);
    setIsSendResultVisible(true);

    try {
      const submittedResult = await submitTransferTransaction({
        client,
        destinationAddress: address,
        lamports: amount,
        signingSeed: currentWalletSigningSeed
      });
      setSubmittedTransaction(submittedResult);
      setSendDialogKind('submitted');
      const finalityClient = submittedResult.rpcEndpoint === undefined || submittedResult.rpcEndpoint === client.endpoint
        ? client
        : new JsonRpcClient(submittedResult.rpcEndpoint);
      void waitForTransactionFinality({
        client: finalityClient,
        maxAttempts: 4,
        signature: submittedResult.signature
      }).catch((error: unknown) => {
        console.info('[transfer-send] finality polling failed', {
          message: error instanceof Error ? error.message : String(error),
          signature: submittedResult.signature
        });
      });
      console.info('[transfer-send] submitted to chain', {
        mode: selectedMode,
        rpcEndpoint: submittedResult.rpcEndpoint,
        signature: submittedResult.signature
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setSendErrorMessage(message);
      setSendDialogKind('submitFailed');
      console.info('[transfer-send] submit failed', { message, mode: selectedMode });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSendResult = () => {
    setIsSendResultVisible(false);
  };

  const handleOpenSendDetail = () => {
    if (sendDialogKind !== 'submitted') {
      setIsSendResultVisible(false);
      return;
    }

    const detailData = createSubmittedTransactionDetail({
      amountLamports: amount,
      mode: selectedMode,
      receiverAddress: address,
      senderAddress: currentWalletAddress,
      signature: submittedTransaction?.signature,
      recentBlockhash: submittedTransaction?.latestBlockhash.blockhash,
      rpcEndpoint: submittedTransaction?.rpcEndpoint ?? client.endpoint,
      slot: submittedTransaction?.latestBlockhash.slot,
      blockHeight: submittedTransaction?.latestBlockhash.height,
      /*
      status: submittedTransaction === null ? '处理中' : '处理中'
      */
      /*
      status: '处理中'
    });

    // 功能目的：进入交易详情页；实现原因：弹窗详情按钮必须打开可复核的交易信息，而不是只打印日志。
    setIsSendResultVisible(false);
      */
      status: '\u5904\u7406\u4e2d'
    });
    setIsSendResultVisible(false);
    onDetailPress?.(detailData);
    console.info('[transfer-send] send detail requested', {
      addressLength: address.length,
      amountLength: amount.length,
      mode: selectedMode
    });
  };

  const sendDialogContent = getSendDialogContent(sendDialogKind, sendErrorMessage);

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
        keyboardShouldPersistTaps="handled"
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.canvas}>
          <Header onBackPress={onBackPress} scale={layoutMetrics.scale} styles={styles} />
          <RouteEstimateCard
            isWalletUnlocked={isWalletUnlocked}
            isBalanceLoading={isBalanceLoading}
            scale={layoutMetrics.scale}
            styles={styles}
            transparentSolText={portfolio.availableSolText}
          />
          <TransferFormCard
            address={address}
            amount={amount}
            availableSolText={portfolio.availableSolText}
            isBalanceLoading={isBalanceLoading}
            onAddressChange={handleAddressChange}
            onAmountChange={handleAmountChange}
            onModeChange={setSelectedMode}
            onScanPress={onScanPress}
            onUseAllBalance={handleUseAllBalance}
            scale={layoutMetrics.scale}
            selectedMode={selectedMode}
            styles={styles}
          />
          <FeeSummaryCard feeLamports={NETWORK_FEE_LAMPORTS} scale={layoutMetrics.scale} styles={styles} />
          <CurrentRouteCard
            isWalletUnlocked={isWalletUnlocked}
            onUnlockWalletPress={handleUnlockWallet}
            scale={layoutMetrics.scale}
            styles={styles}
          />
          <Pressable accessibilityRole="button" onPress={handlePrimaryAction} style={styles.primaryButtonOuter}>
            {({ pressed }) => (
              <View style={pressed ? styles.pressedButtonWrapper : styles.normalButtonWrapper}>
                <LinearGradient
                  colors={['#0B72FF', '#613CFF', '#B332FF']}
                  end={{ x: 1, y: 0.5 }}
                  start={{ x: 0, y: 0.5 }}
                  style={styles.primaryButtonGradient}
                >
                  <View style={styles.primaryButtonInner}>
                    <Text style={styles.primaryButtonText}>{isWalletUnlocked ? '确认发送' : '导入助记词解锁'}</Text>
                  </View>
                </LinearGradient>
              </View>
            )}
          </Pressable>
          <Pressable accessibilityRole="button" onPress={handleCheckRoute} style={styles.checkRouteButton}>
            <Text style={styles.checkRouteText}>检查路由</Text>
          </Pressable>
        </View>
      </ScrollView>
      <TransferConfirmDialog
        address={address}
        amount={amount}
        feeLamports={NETWORK_FEE_LAMPORTS}
        mode={selectedMode}
        onCancel={handleCloseSendConfirm}
        onConfirm={handleSubmitConfirmedTransfer}
        styles={styles}
        visible={isSendConfirmVisible}
      />
      <OperationTipDialog
        blockEstimate={sendDialogContent.blockEstimate}
        message={sendDialogContent.message}
        onClose={handleCloseSendResult}
        onDetailPress={sendDialogKind === 'submitted' ? handleOpenSendDetail : undefined}
        scale={layoutMetrics.scale}
        statusText={sendDialogContent.statusText}
        title={sendDialogContent.title}
        visible={isSendResultVisible}
      />
    </View>
  );
}

function getSendDialogContent(kind: SendDialogKind, errorMessage = '') {
  if (kind === 'invalidAddress') {
    return {
      blockEstimate: 'T/Z 地址',
      message: '收款地址必须是系统地址，并以大写 T 或 Z 开头。',
      statusText: '未提交',
      title: '地址格式无效'
    };
  }

  if (kind === 'invalidAmount') {
    return {
      blockEstimate: '正整数',
      message: '转账数量必须是大于 0 的 lamports 正整数。',
      statusText: '未提交',
      title: '数量格式无效'
    };
  }

  if (kind === 'unsupportedMode') {
    return {
      blockEstimate: '透明转账',
      message: '当前公网链已接入透明转账；隐私转账路由尚未开放提交，避免生成不可执行交易。',
      statusText: '未提交',
      title: '模式暂不可用'
    };
  }

  if (kind === 'walletLocked') {
    return {
      blockEstimate: '需要解锁',
      message: '当前钱包只有地址记录，没有可签名 seed。为避免明文保存助记词，重启后需要重新导入助记词完成本次签名。',
      statusText: '未提交',
      title: '钱包未解锁'
    };
  }

  if (kind === 'balanceLoading') {
    return {
      blockEstimate: '等待余额',
      message: '正在读取当前钱包链上透明余额，余额返回前不会提交交易，避免误判可用金额。',
      statusText: '未提交',
      title: '余额同步中'
    };
  }

  if (kind === 'insufficientBalance') {
    return {
      blockEstimate: '余额不足',
      message: '转账金额加网络费超过当前链上透明余额，请降低金额或等待余额同步后重试。',
      statusText: '未提交',
      title: '余额不足'
    };
  }

  if (kind === 'submitting') {
    return {
      blockEstimate: '正在广播',
      message: '正在获取最新区块哈希、本地签名并提交到公网 RPC。',
      statusText: '提交中',
      title: '正在提交'
    };
  }

  if (kind === 'submitFailed') {
    return {
      blockEstimate: '未上链',
      message: errorMessage || '交易提交失败，请检查钱包是否已解锁、余额和公网 RPC 状态。',
      statusText: '失败',
      title: '提交失败'
    };
  }

  if (kind === 'routeReady') {
    return {
      blockEstimate: '透明直发',
      message: '地址、数量、余额和签名状态已通过本地校验，可以提交到当前 RPC。',
      statusText: '可提交',
      title: '路由检查通过'
    };
  }

  return {
    blockEstimate: undefined,
    message: undefined,
    statusText: undefined,
    title: undefined
  };
}

function getModeOptionTitle(mode: ModeOptionKey) {
  const option = modeOptions.find((item) => item.key === mode);
  return option === undefined ? '自动' : option.title;
}

function createConfirmAmountText(amount: string) {
  if (!/^\d+$/.test(amount)) {
    return '-';
  }

  const lamports = BigInt(amount);
  return `${formatLamports(lamports)} lamports (${formatLamportsAsSol(lamports)} SOL)`;
}

function TransferConfirmDialog({
  address,
  amount,
  feeLamports,
  mode,
  onCancel,
  onConfirm,
  styles,
  visible
}: {
  readonly address: string;
  readonly amount: string;
  readonly feeLamports: bigint;
  readonly mode: ModeOptionKey;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
  readonly styles: ReturnType<typeof createStyles>;
  readonly visible: boolean;
}) {
  const rows = [
    { label: '收款地址', value: address },
    { label: '发送数量', value: createConfirmAmountText(amount) },
    { label: '转账模式', value: getModeOptionTitle(mode) },
    { label: '网络费', value: `${formatLamports(feeLamports)} lamports (${formatLamportsAsSol(feeLamports)} SOL)` },
    { label: '当前路径', value: '透明账户 → 收款账户' },
    { label: '提交方式', value: '本地签名 + 当前 RPC sendTransaction' }
  ] as const;

  return (
    <FastDialogModal onRequestClose={onCancel} visible={visible}>
      <View style={styles.sendConfirmOverlay}>
        <View style={styles.sendConfirmCard}>
          <Text style={styles.sendConfirmTitle}>确认发送</Text>
          <Text style={styles.sendConfirmSubtitle}>请核对交易信息，确认后才会本地签名并广播到当前 RPC。</Text>
          <View style={styles.sendConfirmRows}>
            {rows.map((row) => (
              <View key={row.label} style={styles.sendConfirmRow}>
                <Text style={styles.sendConfirmLabel}>{row.label}</Text>
                <Text numberOfLines={row.label === '收款地址' ? 3 : 2} style={styles.sendConfirmValue}>{row.value}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.sendConfirmRiskText}>链上交易提交后不可撤回，请确认地址和数量无误。</Text>
          <View style={styles.sendConfirmButtonRow}>
            <Pressable accessibilityRole="button" onPress={onCancel} style={styles.sendConfirmCancelButton}>
              <Text style={styles.sendConfirmCancelText}>取消</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={onConfirm} style={styles.sendConfirmSubmitButton}>
              {({ pressed }) => (
                <LinearGradient
                  colors={['#0B72FF', '#613CFF', '#B332FF']}
                  end={{ x: 1, y: 0.5 }}
                  start={{ x: 0, y: 0.5 }}
                  style={pressed ? styles.sendConfirmSubmitBorderPressed : styles.sendConfirmSubmitBorder}
                >
                  <View style={styles.sendConfirmSubmitInner}>
                    <Text style={styles.sendConfirmSubmitText}>确认并发送</Text>
                  </View>
                </LinearGradient>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </FastDialogModal>
  );
}

function Header({
  onBackPress,
  scale,
  styles
}: {
  readonly onBackPress?: () => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityLabel="返回" accessibilityRole="button" onPress={onBackPress} style={styles.backButton}>
        <BackChevronIcon size={scaled(48, scale)} />
      </Pressable>
      <Text style={styles.title}>发送</Text>
      <Text style={styles.subtitle}>透明 / 隐私自动路由</Text>
    </View>
  );
}

function RouteEstimateCard({
  isWalletUnlocked,
  isBalanceLoading,
  scale,
  styles,
  transparentSolText
}: {
  readonly isWalletUnlocked: boolean;
  readonly isBalanceLoading: boolean;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
  readonly transparentSolText: string;
}) {
  const balanceText = isBalanceLoading ? '加载中' : transparentSolText;

  return (
    <View style={styles.routeCard}>
      <Image resizeMode="cover" source={transferSendImages.routeArtwork} style={styles.routeArtwork} />
      <LinearGradient
        colors={['#050507', '#050507F2', '#05050700']}
        end={{ x: 1, y: 0.5 }}
        start={{ x: 0, y: 0.5 }}
        style={styles.routeArtworkShade}
      />
      <Text style={styles.routeTitle}>路由预估</Text>
      <View style={styles.routeTitleInfoIcon}>
        <InfoIcon size={scaled(25, scale)} />
      </View>
      <View style={styles.routeStatusGroup}>
        <View style={isWalletUnlocked ? styles.routeStatusDot : styles.routeStatusDotWarning} />
        <View style={styles.routeStatusTextPanel}>
          <Text style={styles.routeStatusText}>{isWalletUnlocked ? '可发送' : '待解锁'}</Text>
        </View>
      </View>

      <View style={styles.transparentIcon}>
        <RouteShieldIcon size={scaled(64, scale)} />
      </View>
      <Text style={styles.transparentLabel}>透明余额</Text>
      <Text style={styles.transparentAmount}>{balanceText}</Text>
      <Text style={styles.transparentSymbol}>SOL</Text>

      <View style={styles.privateIcon}>
        <RouteMaskIcon size={scaled(64, scale)} />
      </View>
      <Text style={styles.privateLabel}>隐私可用</Text>
      <Text style={styles.privateAmount}>0.000000</Text>
      <Text style={styles.privateSymbol}>SOL</Text>

      <View style={styles.routeDivider} />
      <Text style={styles.routeStrategyLabel}>{isWalletUnlocked ? '路由策略' : '签名状态'}</Text>
      <LinearGradient
        colors={['#15DFF0', '#993DFF']}
        end={{ x: 1, y: 0.5 }}
        start={{ x: 0, y: 0.5 }}
        style={styles.routeStrategyPillBorder}
      >
        <View style={styles.routeStrategyPillInner}>
          <Text style={styles.routeStrategyPillText}>{isWalletUnlocked ? '自动选择' : '需助记词'}</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function TransferFormCard({
  address,
  amount,
  availableSolText,
  isBalanceLoading,
  onAddressChange,
  onAmountChange,
  onModeChange,
  onScanPress,
  onUseAllBalance,
  scale,
  selectedMode,
  styles
}: {
  readonly address: string;
  readonly amount: string;
  readonly availableSolText: string;
  readonly isBalanceLoading: boolean;
  readonly onAddressChange: (nextValue: string) => void;
  readonly onAmountChange: (nextValue: string) => void;
  readonly onModeChange: (nextValue: ModeOptionKey) => void;
  readonly onScanPress?: () => void;
  readonly onUseAllBalance: () => void;
  readonly scale: number;
  readonly selectedMode: ModeOptionKey;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  const balanceText = isBalanceLoading ? '加载中' : availableSolText;

  return (
    <View style={styles.formCard}>
      <Text style={styles.addressLabel}>收款地址</Text>
      <View style={styles.addressInputBox}>
        <TextInput
          accessibilityLabel="收款地址"
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={SYSTEM_ADDRESS_MAX_LENGTH}
          onChangeText={onAddressChange}
          placeholder="输入或粘贴 T/Z 地址"
          placeholderTextColor="#9AA0AE"
          selectionColor={colors.primary}
          style={styles.addressInputText}
          underlineColorAndroid="transparent"
          value={address}
        />
        <Pressable accessibilityLabel="选择联系人" accessibilityRole="button" style={styles.addressContactButton}>
          <AddressContactIcon size={scaled(48, scale)} />
        </Pressable>
        <View style={styles.addressActionDivider} />
        <Pressable accessibilityLabel="扫码输入地址" accessibilityRole="button" onPress={onScanPress} style={styles.addressScanButton}>
          <HeaderScanSvgIcon size={scaled(48, scale)} />
        </Pressable>
      </View>

      <Text style={styles.amountLabel}>数量（lamports）</Text>
      <View style={styles.amountInputBox}>
        <TextInput
          accessibilityLabel="转账数量"
          keyboardType="number-pad"
          maxLength={18}
          onChangeText={onAmountChange}
          placeholder="请输入数量"
          placeholderTextColor="#9AA0AE"
          selectionColor={colors.primary}
          style={styles.amountInputText}
          underlineColorAndroid="transparent"
          value={amount}
        />
        <Text style={styles.amountSymbol}>SOL</Text>
        <Pressable accessibilityRole="button" onPress={onUseAllBalance} style={styles.useAllButton}>
          <Text style={styles.useAllText}>全部</Text>
        </Pressable>
      </View>
      <Text style={styles.availableText}>可用 {balanceText} SOL</Text>

      <Text style={styles.modeLabel}>转账模式</Text>
      <View style={styles.modeSegmented}>
        {modeOptions.map((option, index) => {
          const isSelected = selectedMode === option.key;

          return (
            <TransferModeOption
              index={index}
              isSelected={isSelected}
              key={option.key}
              onModeChange={onModeChange}
              option={option}
              styles={styles}
            />
          );
        })}
      </View>
    </View>
  );
}

function TransferModeOption({
  index,
  isSelected,
  onModeChange,
  option,
  styles
}: {
  readonly index: number;
  readonly isSelected: boolean;
  readonly onModeChange: (mode: ModeOptionKey) => void;
  readonly option: ModeOption;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      onPress={() => onModeChange(option.key)}
      style={styles.modeOption}
    >
      {index > 0 && !isSelected ? <View style={styles.modeOptionDivider} /> : null}
      <View style={isSelected ? styles.modeOptionContentActive : styles.modeOptionContent}>
        <Text style={isSelected ? styles.modeTitleActive : styles.modeTitle}>{option.title}</Text>
        <Text style={isSelected ? styles.modeSubtitleActive : styles.modeSubtitle}>{option.subtitle}</Text>
      </View>
    </Pressable>
  );
}

function FeeSummaryCard({
  feeLamports,
  scale,
  styles
}: {
  readonly feeLamports: bigint;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.feeCard}>
      <View style={styles.feeDividerLeft} />
      <View style={styles.feeDividerRight} />
      <Text style={styles.networkFeeLabel}>网络费</Text>
      <Text style={styles.networkFeeValue}>{formatLamportsAsSol(feeLamports)} <Text style={styles.feeSymbol}>SOL</Text></Text>
      <Text style={styles.networkFeeSub}>({formatLamports(feeLamports)} lamports)</Text>
      <Text style={styles.computeLabel}>compute</Text>
      <View style={styles.computeInfoIcon}>
        <InfoIcon size={scaled(22, scale)} />
      </View>
      <Text style={styles.computeValue}>200,000 CU</Text>
      <Text style={styles.computeSub}>(~0.000004 SOL)</Text>
      <Text style={styles.confirmLabel}>预计确认</Text>
      <Text style={styles.confirmValue}>~1.5 秒</Text>
      <Text style={styles.confirmSub}>（约 1 个区块）</Text>
    </View>
  );
}

function CurrentRouteCard({
  isWalletUnlocked,
  onUnlockWalletPress,
  scale,
  styles
}: {
  readonly isWalletUnlocked: boolean;
  readonly onUnlockWalletPress: () => void;
  readonly scale: number;
  readonly styles: ReturnType<typeof createStyles>;
}) {
  const title = isWalletUnlocked ? '当前路径：透明账户 → 收款账户' : '钱包未解锁：需要导入助记词签名';
  const subtitle = isWalletUnlocked ? '自动路由 | 透明直发' : '本机只保存地址记录，不保存 seed 明文';

  return (
    <Pressable accessibilityRole={isWalletUnlocked ? undefined : 'button'} onPress={isWalletUnlocked ? undefined : onUnlockWalletPress} style={styles.currentRouteCard}>
      <View style={styles.currentRouteIcon}>
        <CurrentRouteIcon height={scaled(48, scale)} width={scaled(128, scale)} />
      </View>
      <Text style={isWalletUnlocked ? styles.currentRouteTitle : styles.currentRouteTitleWarning}>{title}</Text>
      <Text style={styles.currentRouteSub}>{subtitle}</Text>
      <View style={styles.currentRouteChevron}>
        <ChevronRightIcon size={scaled(42, scale)} />
      </View>
    </Pressable>
  );
}

function createStyles(scale: number) {
  const textBase = {
    fontFamily: fontFamilies.system,
    includeFontPadding: false
  } as const;

  return StyleSheet.create({
    addressActionDivider: {
      backgroundColor: '#E6E8EF',
      height: scaled(44, scale),
      left: scaled(656, scale),
      position: 'absolute',
      top: scaled(24, scale),
      width: 1
    },
    addressContactButton: {
      alignItems: 'center',
      height: scaled(64, scale),
      justifyContent: 'center',
      left: scaled(582, scale),
      position: 'absolute',
      top: scaled(14, scale),
      width: scaled(64, scale)
    },
    addressInputBox: {
      borderColor: '#E5E7EF',
      borderRadius: scaled(21, scale),
      borderWidth: 1,
      height: scaled(94, scale),
      left: scaled(30, scale),
      position: 'absolute',
      top: scaled(75, scale),
      width: scaled(752, scale)
    },
    addressInputText: {
      color: colors.text,
      fontSize: scaled(25, scale),
      height: scaled(92, scale),
      left: scaled(28, scale),
      lineHeight: scaled(34, scale),
      padding: 0,
      position: 'absolute',
      top: 0,
      width: scaled(520, scale),
      ...textBase
    },
    addressLabel: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '600',
      left: scaled(30, scale),
      lineHeight: scaled(33, scale),
      position: 'absolute',
      top: scaled(31, scale),
      ...textBase
    },
    addressScanButton: {
      alignItems: 'center',
      height: scaled(64, scale),
      justifyContent: 'center',
      left: scaled(670, scale),
      position: 'absolute',
      top: scaled(14, scale),
      width: scaled(64, scale)
    },
    amountInputBox: {
      borderColor: '#E5E7EF',
      borderRadius: scaled(21, scale),
      borderWidth: 1,
      height: scaled(92, scale),
      left: scaled(30, scale),
      position: 'absolute',
      top: scaled(248, scale),
      width: scaled(752, scale)
    },
    amountInputText: {
      color: colors.text,
      fontSize: scaled(25, scale),
      height: scaled(90, scale),
      left: scaled(28, scale),
      lineHeight: scaled(34, scale),
      padding: 0,
      position: 'absolute',
      top: 0,
      width: scaled(510, scale),
      ...textBase
    },
    amountLabel: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '600',
      left: scaled(30, scale),
      lineHeight: scaled(33, scale),
      position: 'absolute',
      top: scaled(205, scale),
      ...textBase
    },
    amountSymbol: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '500',
      lineHeight: scaled(34, scale),
      position: 'absolute',
      right: scaled(112, scale),
      top: scaled(29, scale),
      ...textBase
    },
    availableText: {
      color: '#7C828F',
      fontSize: scaled(22, scale),
      fontWeight: '400',
      left: scaled(30, scale),
      lineHeight: scaled(28, scale),
      position: 'absolute',
      top: scaled(361, scale),
      ...textBase
    },
    backButton: {
      alignItems: 'center',
      height: scaled(64, scale),
      justifyContent: 'center',
      left: scaled(32, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(132, scale),
      width: scaled(56, scale)
    },
    canvas: {
      backgroundColor: colors.background,
      height: scaledBelowTopNavigation(1712, scale),
      position: 'relative',
      width: '100%'
    },
    checkRouteButton: {
      alignItems: 'center',
      height: scaled(58, scale),
      justifyContent: 'center',
      left: scaled(314, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(1648, scale),
      width: scaled(236, scale)
    },
    checkRouteText: {
      color: colors.primary,
      fontSize: scaled(25, scale),
      fontWeight: '600',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    computeInfoIcon: {
      left: scaled(415, scale),
      position: 'absolute',
      top: scaled(31, scale)
    },
    computeLabel: {
      color: colors.textMuted,
      fontSize: scaled(22, scale),
      fontWeight: '400',
      left: scaled(314, scale),
      lineHeight: scaled(28, scale),
      position: 'absolute',
      top: scaled(31, scale),
      ...textBase
    },
    computeSub: {
      color: colors.textMuted,
      fontSize: scaled(21, scale),
      fontWeight: '400',
      left: scaled(314, scale),
      lineHeight: scaled(28, scale),
      position: 'absolute',
      top: scaled(101, scale),
      ...textBase
    },
    computeValue: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '700',
      left: scaled(314, scale),
      lineHeight: scaled(34, scale),
      position: 'absolute',
      top: scaled(67, scale),
      ...textBase
    },
    sendConfirmOverlay: {
      alignItems: 'center',
      backgroundColor: 'rgba(6, 8, 14, 0.62)',
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: scaled(24, scale)
    },
    sendConfirmCard: {
      backgroundColor: colors.surface,
      borderRadius: scaled(26, scale),
      maxWidth: '92%',
      padding: scaled(30, scale),
      shadowColor: '#070A12',
      shadowOffset: { width: 0, height: scaled(16, scale) },
      shadowOpacity: 0.2,
      shadowRadius: scaled(32, scale),
      width: scaled(760, scale),
      elevation: 16
    },
    sendConfirmTitle: {
      color: colors.text,
      fontSize: scaled(34, scale),
      fontWeight: '900',
      lineHeight: scaled(42, scale),
      textAlign: 'center',
      ...textBase
    },
    sendConfirmSubtitle: {
      color: colors.textMuted,
      fontSize: scaled(22, scale),
      fontWeight: '400',
      lineHeight: scaled(30, scale),
      marginTop: scaled(14, scale),
      textAlign: 'center',
      ...textBase
    },
    sendConfirmRows: {
      backgroundColor: '#F7F8FC',
      borderRadius: scaled(20, scale),
      marginTop: scaled(24, scale),
      paddingHorizontal: scaled(20, scale),
      paddingVertical: scaled(12, scale)
    },
    sendConfirmRow: {
      borderBottomColor: '#E4E7EF',
      borderBottomWidth: 1,
      flexDirection: 'row',
      minHeight: scaled(62, scale),
      paddingVertical: scaled(13, scale)
    },
    sendConfirmLabel: {
      color: colors.textMuted,
      flexShrink: 0,
      fontSize: scaled(21, scale),
      fontWeight: '500',
      lineHeight: scaled(29, scale),
      width: scaled(150, scale),
      ...textBase
    },
    sendConfirmValue: {
      color: colors.text,
      flex: 1,
      flexShrink: 1,
      fontSize: scaled(22, scale),
      fontWeight: '700',
      lineHeight: scaled(30, scale),
      ...textBase
    },
    sendConfirmRiskText: {
      color: colors.warning,
      fontSize: scaled(20, scale),
      fontWeight: '600',
      lineHeight: scaled(28, scale),
      marginTop: scaled(18, scale),
      textAlign: 'center',
      ...textBase
    },
    sendConfirmButtonRow: {
      flexDirection: 'row',
      gap: scaled(16, scale),
      marginTop: scaled(24, scale)
    },
    sendConfirmCancelButton: {
      alignItems: 'center',
      borderColor: '#D7DAE4',
      borderRadius: scaled(19, scale),
      borderWidth: 1,
      flex: 0.8,
      height: scaled(74, scale),
      justifyContent: 'center'
    },
    sendConfirmCancelText: {
      color: colors.text,
      fontSize: scaled(24, scale),
      fontWeight: '800',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    sendConfirmSubmitButton: {
      flex: 1.2,
      height: scaled(74, scale)
    },
    sendConfirmSubmitBorder: {
      borderRadius: scaled(20, scale),
      height: '100%',
      padding: scaled(2, scale),
      width: '100%'
    },
    sendConfirmSubmitBorderPressed: {
      borderRadius: scaled(20, scale),
      height: '100%',
      opacity: 0.82,
      padding: scaled(2, scale),
      width: '100%'
    },
    sendConfirmSubmitInner: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderRadius: scaled(18, scale),
      flex: 1,
      justifyContent: 'center'
    },
    sendConfirmSubmitText: {
      color: '#FFFFFF',
      fontSize: scaled(24, scale),
      fontWeight: '900',
      lineHeight: scaled(32, scale),
      ...textBase
    },
    confirmLabel: {
      color: colors.textMuted,
      fontSize: scaled(22, scale),
      fontWeight: '400',
      left: scaled(621, scale),
      lineHeight: scaled(28, scale),
      position: 'absolute',
      top: scaled(31, scale),
      ...textBase
    },
    confirmSub: {
      color: colors.textMuted,
      fontSize: scaled(21, scale),
      fontWeight: '400',
      left: scaled(621, scale),
      lineHeight: scaled(28, scale),
      position: 'absolute',
      top: scaled(101, scale),
      ...textBase
    },
    confirmValue: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '700',
      left: scaled(621, scale),
      lineHeight: scaled(34, scale),
      position: 'absolute',
      top: scaled(67, scale),
      ...textBase
    },
    currentRouteCard: {
      backgroundColor: colors.surface,
      borderColor: '#E5E7EF',
      borderRadius: scaled(26, scale),
      borderWidth: 1,
      height: scaled(116, scale),
      left: scaled(26, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(1386, scale),
      width: scaled(812, scale)
    },
    currentRouteChevron: {
      alignItems: 'center',
      height: scaled(54, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(30, scale),
      top: scaled(31, scale),
      width: scaled(54, scale)
    },
    currentRouteIcon: {
      left: scaled(54, scale),
      position: 'absolute',
      top: scaled(34, scale)
    },
    currentRouteSub: {
      color: colors.textMuted,
      fontSize: scaled(23, scale),
      fontWeight: '400',
      left: scaled(194, scale),
      lineHeight: scaled(30, scale),
      position: 'absolute',
      top: scaled(72, scale),
      ...textBase
    },
    currentRouteTitle: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '600',
      left: scaled(194, scale),
      lineHeight: scaled(32, scale),
      position: 'absolute',
      top: scaled(28, scale),
      ...textBase
    },
    currentRouteTitleWarning: {
      color: colors.warning,
      fontSize: scaled(25, scale),
      fontWeight: '700',
      left: scaled(194, scale),
      lineHeight: scaled(32, scale),
      position: 'absolute',
      top: scaled(28, scale),
      ...textBase
    },
    feeCard: {
      backgroundColor: colors.surface,
      borderColor: '#E5E7EF',
      borderRadius: scaled(26, scale),
      borderWidth: 1,
      height: scaled(153, scale),
      left: scaled(26, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(1215, scale),
      width: scaled(812, scale)
    },
    feeDividerLeft: {
      backgroundColor: '#E0E3EB',
      height: scaled(91, scale),
      left: scaled(260, scale),
      position: 'absolute',
      top: scaled(31, scale),
      width: 1
    },
    feeDividerRight: {
      backgroundColor: '#E0E3EB',
      height: scaled(91, scale),
      left: scaled(555, scale),
      position: 'absolute',
      top: scaled(31, scale),
      width: 1
    },
    feeSymbol: {
      fontSize: scaled(23, scale),
      fontWeight: '400',
      lineHeight: scaled(30, scale)
    },
    formCard: {
      backgroundColor: colors.surface,
      borderColor: '#E5E7EF',
      borderRadius: scaled(26, scale),
      borderWidth: 1,
      height: scaled(579, scale),
      left: scaled(26, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(618, scale),
      width: scaled(812, scale)
    },
    header: {
      height: scaledBelowTopNavigation(215, scale),
      position: 'absolute',
      top: 0,
      width: '100%'
    },
    modeLabel: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '600',
      left: scaled(30, scale),
      lineHeight: scaled(33, scale),
      position: 'absolute',
      top: scaled(414, scale),
      ...textBase
    },
    modeOption: {
      alignItems: 'center',
      flex: 1,
      height: '100%',
      justifyContent: 'center',
      minWidth: 0,
      position: 'relative'
    },
    modeOptionContent: {
      alignItems: 'center',
      height: '100%',
      justifyContent: 'center',
      paddingHorizontal: scaled(4, scale),
      width: '100%'
    },
    modeOptionContentActive: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderRadius: scaled(16, scale),
      height: '100%',
      justifyContent: 'center',
      paddingHorizontal: scaled(4, scale),
      width: '100%'
    },
    modeOptionDivider: {
      backgroundColor: '#E5E7EF',
      height: scaled(66, scale),
      left: 0,
      position: 'absolute',
      top: scaled(9, scale),
      width: 1
    },
    modeSegmented: {
      alignItems: 'stretch',
      borderColor: '#E5E7EF',
      borderRadius: scaled(21, scale),
      borderWidth: 1,
      flexDirection: 'row',
      height: scaled(92, scale),
      left: scaled(30, scale),
      overflow: 'hidden',
      padding: scaled(4, scale),
      position: 'absolute',
      top: scaled(455, scale),
      width: scaled(752, scale)
    },
    modeSubtitle: {
      color: colors.textMuted,
      fontSize: scaled(19, scale),
      fontWeight: '400',
      lineHeight: scaled(25, scale),
      marginTop: scaled(6, scale),
      ...textBase
    },
    modeSubtitleActive: {
      color: colors.primary,
      fontSize: scaled(19, scale),
      fontWeight: '500',
      lineHeight: scaled(25, scale),
      marginTop: scaled(6, scale),
      ...textBase
    },
    modeTitle: {
      color: colors.text,
      fontSize: scaled(25, scale),
      fontWeight: '700',
      lineHeight: scaled(31, scale),
      ...textBase
    },
    modeTitleActive: {
      color: '#FFFFFF',
      fontSize: scaled(25, scale),
      fontWeight: '700',
      lineHeight: scaled(31, scale),
      ...textBase
    },
    networkFeeLabel: {
      color: colors.textMuted,
      fontSize: scaled(22, scale),
      fontWeight: '400',
      left: scaled(43, scale),
      lineHeight: scaled(28, scale),
      position: 'absolute',
      top: scaled(31, scale),
      ...textBase
    },
    networkFeeSub: {
      color: colors.textMuted,
      fontSize: scaled(21, scale),
      fontWeight: '400',
      left: scaled(43, scale),
      lineHeight: scaled(28, scale),
      position: 'absolute',
      top: scaled(101, scale),
      ...textBase
    },
    networkFeeValue: {
      color: colors.text,
      fontSize: scaled(27, scale),
      fontWeight: '700',
      left: scaled(43, scale),
      lineHeight: scaled(34, scale),
      position: 'absolute',
      top: scaled(67, scale),
      ...textBase
    },
    normalButtonWrapper: {
      height: '100%',
      width: '100%'
    },
    pressedButtonWrapper: {
      height: '100%',
      opacity: 0.82,
      width: '100%'
    },
    primaryButtonGradient: {
      borderRadius: scaled(22, scale),
      height: '100%',
      padding: scaled(3, scale),
      width: '100%'
    },
    primaryButtonInner: {
      alignItems: 'center',
      backgroundColor: colors.black,
      borderRadius: scaled(19, scale),
      flex: 1,
      justifyContent: 'center',
      overflow: 'hidden'
    },
    primaryButtonOuter: {
      height: scaled(96, scale),
      left: scaled(28, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(1534, scale),
      width: scaled(808, scale)
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: scaled(31, scale),
      fontWeight: '800',
      lineHeight: scaled(38, scale),
      ...textBase
    },
    privateAmount: {
      color: '#F8FAFF',
      fontSize: scaled(30, scale),
      fontWeight: '700',
      left: scaled(99, scale),
      lineHeight: scaled(37, scale),
      position: 'absolute',
      top: scaled(224, scale),
      ...textBase
    },
    privateIcon: {
      left: scaled(30, scale),
      position: 'absolute',
      top: scaled(187, scale)
    },
    privateLabel: {
      color: '#B6BAC5',
      fontSize: scaled(24, scale),
      fontWeight: '400',
      left: scaled(99, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      top: scaled(186, scale),
      ...textBase
    },
    privateSymbol: {
      color: '#B6BAC5',
      fontSize: scaled(24, scale),
      fontWeight: '400',
      left: scaled(255, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      top: scaled(229, scale),
      ...textBase
    },
    root: {
      backgroundColor: colors.background,
      flex: 1
    },
    routeArtwork: {
      height: scaled(604, scale),
      left: scaled(357, scale),
      position: 'absolute',
      top: scaled(-54, scale),
      width: scaled(453, scale)
    },
    routeArtworkShade: {
      height: '100%',
      left: scaled(255, scale),
      position: 'absolute',
      top: 0,
      width: scaled(410, scale)
    },
    routeCard: {
      backgroundColor: colors.black,
      borderRadius: scaled(27, scale),
      height: scaled(369, scale),
      left: scaled(26, scale),
      overflow: 'hidden',
      position: 'absolute',
      top: scaledBelowTopNavigation(227, scale),
      width: scaled(812, scale)
    },
    routeDivider: {
      backgroundColor: '#343844',
      height: 1,
      left: scaled(30, scale),
      position: 'absolute',
      top: scaled(277, scale),
      width: scaled(472, scale)
    },
    routeStatusDot: {
      backgroundColor: '#15D979',
      borderRadius: scaled(7, scale),
      flexShrink: 0,
      height: scaled(14, scale),
      marginRight: scaled(10, scale),
      width: scaled(14, scale)
    },
    routeStatusDotWarning: {
      backgroundColor: colors.warning,
      borderRadius: scaled(7, scale),
      flexShrink: 0,
      height: scaled(14, scale),
      marginRight: scaled(10, scale),
      width: scaled(14, scale)
    },
    routeStatusGroup: {
      alignItems: 'center',
      elevation: 3,
      flexDirection: 'row',
      height: scaled(42, scale),
      justifyContent: 'flex-end',
      position: 'absolute',
      right: scaled(34, scale),
      top: scaled(26, scale),
      width: scaled(170, scale),
      zIndex: 3
    },
    routeStatusTextPanel: {
      alignItems: 'center',
      backgroundColor: 'rgba(5, 5, 7, 0.72)',
      borderRadius: scaled(14, scale),
      height: scaled(36, scale),
      justifyContent: 'center',
      minWidth: scaled(96, scale),
      paddingHorizontal: scaled(8, scale)
    },
    routeStatusText: {
      color: '#FFFFFF',
      fontSize: scaled(25, scale),
      fontWeight: '500',
      lineHeight: scaled(32, scale),
      textAlign: 'center',
      ...textBase
    },
    routeStrategyLabel: {
      color: '#B6BAC5',
      fontSize: scaled(24, scale),
      fontWeight: '400',
      left: scaled(30, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      top: scaled(310, scale),
      ...textBase
    },
    routeStrategyPillBorder: {
      borderRadius: scaled(22, scale),
      height: scaled(40, scale),
      left: scaled(142, scale),
      padding: scaled(2, scale),
      position: 'absolute',
      top: scaled(301, scale),
      width: scaled(132, scale)
    },
    routeStrategyPillInner: {
      alignItems: 'center',
      backgroundColor: '#151722',
      borderRadius: scaled(20, scale),
      flex: 1,
      justifyContent: 'center'
    },
    routeStrategyPillText: {
      color: '#B3B7C4',
      fontSize: scaled(21, scale),
      fontWeight: '500',
      lineHeight: scaled(26, scale),
      ...textBase
    },
    routeTitle: {
      color: '#B6BAC5',
      fontSize: scaled(24, scale),
      fontWeight: '500',
      left: scaled(30, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      top: scaled(34, scale),
      ...textBase
    },
    routeTitleInfoIcon: {
      left: scaled(137, scale),
      position: 'absolute',
      top: scaled(35, scale)
    },
    scrollContent: {
      backgroundColor: colors.background
    },
    scrollView: {
      backgroundColor: colors.background
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: scaled(22, scale),
      fontWeight: '400',
      left: scaled(111, scale),
      lineHeight: scaled(28, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(181, scale),
      ...textBase
    },
    title: {
      color: colors.text,
      fontSize: scaled(41, scale),
      fontWeight: fontWeights.pageTitle,
      left: scaled(111, scale),
      lineHeight: scaled(49, scale),
      position: 'absolute',
      top: scaledBelowTopNavigation(126, scale),
      ...textBase
    },
    transparentAmount: {
      color: '#F8FAFF',
      fontSize: scaled(30, scale),
      fontWeight: '700',
      left: scaled(99, scale),
      lineHeight: scaled(37, scale),
      position: 'absolute',
      top: scaled(129, scale),
      ...textBase
    },
    transparentIcon: {
      left: scaled(30, scale),
      position: 'absolute',
      top: scaled(92, scale)
    },
    transparentLabel: {
      color: '#B6BAC5',
      fontSize: scaled(24, scale),
      fontWeight: '400',
      left: scaled(99, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      top: scaled(91, scale),
      ...textBase
    },
    transparentSymbol: {
      color: '#B6BAC5',
      fontSize: scaled(24, scale),
      fontWeight: '400',
      left: scaled(390, scale),
      lineHeight: scaled(31, scale),
      position: 'absolute',
      top: scaled(134, scale),
      ...textBase
    },
    useAllButton: {
      alignItems: 'center',
      height: scaled(58, scale),
      justifyContent: 'center',
      position: 'absolute',
      right: scaled(17, scale),
      top: scaled(17, scale),
      width: scaled(72, scale)
    },
    useAllText: {
      color: colors.primary,
      fontSize: scaled(25, scale),
      fontWeight: '500',
      lineHeight: scaled(32, scale),
      ...textBase
    }
  });
}
