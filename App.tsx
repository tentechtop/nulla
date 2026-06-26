import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  GlobalBottomNavigation,
  type GlobalBottomNavigationWorkspace,
  type GlobalBottomTabKey
} from './src/components/GlobalBottomNavigation';
import { GlobalHeader, getGlobalHeaderHeight } from './src/components/GlobalHeader';
import { AccountHomeScreen, type RpcEndpointMode } from './src/features/accountHome/AccountHomeScreen';
import {
  BlockDetailScreen,
  ChainStatusScreen,
  ContractDeployConfirmScreen,
  NetworkStatusScreen,
  RpcNodeDetailScreen,
  TransactionHistoryScreen,
  ValidatorDetailStakeScreen,
  ValidatorListScreen,
  type ValidatorOperationMode
} from './src/features/chainExplorer/ChainExplorerScreens';
import { ContractsListScreen } from './src/features/contractsList/ContractsListScreen';
import { DposOverviewScreen } from './src/features/dposOverview/DposOverviewScreen';
import { HomeScreen } from './src/features/home/HomeScreen';
import { useHomeResponsiveLayout } from './src/features/home/useHomeResponsiveLayout';
import { MarketHomeScreen } from './src/features/marketHome/MarketHomeScreen';
import { PortfolioAnalyticsScreen } from './src/features/portfolioAnalytics/PortfolioAnalyticsScreen';
import { PrivacyHomeScreen } from './src/features/privacyHome/PrivacyHomeScreen';
import { ReceiveAddressScreen } from './src/features/receiveAddress/ReceiveAddressScreen';
import { ScanResultScreen } from './src/features/scanResult/ScanResultScreen';
import { TransactionDetailScreen } from './src/features/transactionDetail/TransactionDetailScreen';
import { DEFAULT_TRANSACTION_DETAIL_DATA, type TransactionDetailData } from './src/features/transactionDetail/transactionDetailData';
import { TransferSendScreen, type PendingTransferSendDraft } from './src/features/transferSend/TransferSendScreen';
import type { ScannedSendDraft } from './src/features/transferFlow';
import {
  DEFAULT_LOCAL_RPC_URL,
  DEFAULT_PUBLIC_RPC_URL,
  isLegacyPublicRpcEndpoint,
  normalizeRpcEndpoint
} from './src/utils/chainRpc';
import {
  WalletCreateMnemonicEntryScreen,
  WalletImportMnemonicScreen,
  WalletMnemonicBackupScreen,
  WalletSwitchAccountScreen,
  createEmptyWalletBackupProgress,
  type WalletBackupProgress
} from './src/features/walletSetup/WalletSetupScreens';
import {
  INITIAL_MNEMONIC_WORDS,
  INITIAL_WALLET_ACCOUNTS,
  createMnemonicWords,
  createWalletAccountFromMnemonic,
  getDefaultWalletAccountLabel,
  removeWalletAccount,
  selectWalletAccount,
  upsertWalletAccount,
  type WalletAccount
} from './src/utils/walletSetup';
import { loadPersistedWalletState, savePersistedWalletState, type WalletSigningSeed } from './src/utils/walletPersistence';

const NATIVE_SPLASH_HOLD_MS = 600;

type AppRoute = 'home' | 'transferSend' | 'transactionDetail' | 'marketHome' | 'contractsList' | 'contractDeployConfirm' | 'dposOverview' | 'validatorList' | 'validatorDetailStake' | 'privacyHome' | 'portfolioAnalytics' | 'accountHome' | 'scanResult' | 'receiveAddress' | 'transactionHistory' | 'blockDetail' | 'chainStatus' | 'networkStatus' | 'rpcNodeDetail' | 'walletCreateMnemonicEntry' | 'walletImportMnemonic' | 'walletMnemonicBackup' | 'walletSwitchAccount';
const LAUNCH_ROUTE_STACK: readonly AppRoute[] = ['marketHome'];
const EMPTY_WALLET_ROUTE_STACK: readonly AppRoute[] = ['walletCreateMnemonicEntry'];
const WALLET_HOME_ROUTE_STACK: readonly AppRoute[] = ['home'];
const EMPTY_WALLET_ALLOWED_ROUTES = new Set<AppRoute>(['walletCreateMnemonicEntry', 'walletImportMnemonic', 'walletMnemonicBackup', 'scanResult']);

function getWorkspaceForRoute(route: AppRoute): GlobalBottomNavigationWorkspace {
  return route === 'marketHome' || route === 'contractsList' || route === 'contractDeployConfirm' ? 'market' : 'wallet';
}

function canOpenRouteWithoutWallet(route: AppRoute) {
  return EMPTY_WALLET_ALLOWED_ROUTES.has(route);
}

function resolveRpcEndpoint(mode: RpcEndpointMode, customEndpoint: string) {
  if (mode === 'local') {
    return DEFAULT_LOCAL_RPC_URL;
  }

  if (mode === 'custom') {
    try {
      const normalizedEndpoint = normalizeRpcEndpoint(customEndpoint, '自定义 RPC 地址');
      return isLegacyPublicRpcEndpoint(normalizedEndpoint) ? DEFAULT_PUBLIC_RPC_URL : normalizedEndpoint;
    } catch {
      return DEFAULT_PUBLIC_RPC_URL;
    }
  }

  return DEFAULT_PUBLIC_RPC_URL;
}

function getRpcStatusText(mode: RpcEndpointMode, customEndpoint: string) {
  if (mode !== 'custom') {
    return '已选择';
  }

  try {
    const normalizedEndpoint = normalizeRpcEndpoint(customEndpoint, '自定义 RPC 地址');
    if (isLegacyPublicRpcEndpoint(normalizedEndpoint)) {
      return '已迁移到公网';
    }
    return '已选择';
  } catch (error) {
    return customEndpoint.trim().length === 0 ? '请输入地址' : formatAppError(error);
  }
}

function formatAppError(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

// 功能目的：集中计算底部高亮入口；实现原因：首页、资产页和查询页属于不同路由，避免按钮接错页面。
function getActiveBottomTabForRoute(route: AppRoute): GlobalBottomTabKey | undefined {
  if (route === 'marketHome') {
    return 'marketQuotes';
  }

  if (route === 'contractsList' || route === 'contractDeployConfirm') {
    return 'marketContracts';
  }

  if (route === 'transferSend') {
    return 'walletTrade';
  }

  if (
    route === 'portfolioAnalytics' ||
    route === 'receiveAddress' ||
    route === 'transactionDetail' ||
    route === 'transactionHistory' ||
    route === 'blockDetail' ||
    route === 'chainStatus' ||
    route === 'networkStatus' ||
    route === 'rpcNodeDetail'
  ) {
    return 'walletAssets';
  }

  if (route === 'dposOverview' || route === 'validatorList' || route === 'validatorDetailStake') {
    return 'walletDpos';
  }

  if (route === 'privacyHome') {
    return 'walletPrivacy';
  }

  if (route === 'home') {
    return 'walletHome';
  }

  return undefined;
}

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const nativeSplashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routeStackRef = useRef<readonly AppRoute[]>(EMPTY_WALLET_ROUTE_STACK);
  const [routeStack, setRouteStack] = useState<readonly AppRoute[]>(EMPTY_WALLET_ROUTE_STACK);
  const [scannedDeployPayload, setScannedDeployPayload] = useState<string | null>(null);
  const [scannedSendDraft, setScannedSendDraft] = useState<ScannedSendDraft | null>(null);
  const [pendingTransferSendDraft, setPendingTransferSendDraft] = useState<PendingTransferSendDraft | null>(null);
  const [transactionDetailData, setTransactionDetailData] = useState<TransactionDetailData>(DEFAULT_TRANSACTION_DETAIL_DATA);
  const [selectedBlockSlot, setSelectedBlockSlot] = useState<number | null>(null);
  const [selectedValidatorAddress, setSelectedValidatorAddress] = useState<string>('');
  const [selectedValidatorOperationMode, setSelectedValidatorOperationMode] = useState<ValidatorOperationMode>('delegate');
  const [selectedRpcMode, setSelectedRpcMode] = useState<RpcEndpointMode>('public');
  const [customRpcEndpoint, setCustomRpcEndpoint] = useState('');
  const [backupProgress, setBackupProgress] = useState<WalletBackupProgress>(() => createEmptyWalletBackupProgress());
  const [isWalletStateLoaded, setIsWalletStateLoaded] = useState(false);
  const [currentWalletAddress, setCurrentWalletAddress] = useState<string | null>(null);
  const [currentWalletSigningSeed, setCurrentWalletSigningSeed] = useState<string | null>(null);
  const [mnemonicWords, setMnemonicWords] = useState<readonly string[]>(INITIAL_MNEMONIC_WORDS);
  const [pendingWalletName, setPendingWalletName] = useState(getDefaultWalletAccountLabel(0));
  const [walletAccounts, setWalletAccounts] = useState<readonly WalletAccount[]>(INITIAL_WALLET_ACCOUNTS);
  const [walletSigningSeeds, setWalletSigningSeeds] = useState<readonly WalletSigningSeed[]>([]);
  const hasWalletAccount = walletAccounts.length > 0;
  const currentRoute = routeStack[routeStack.length - 1] ?? 'marketHome';
  const headerMetrics = useHomeResponsiveLayout();
  const headerHeight = getGlobalHeaderHeight(headerMetrics.scale);
  const contentTopPadding = headerMetrics.topSafeArea + headerHeight;
  const activeHeaderWorkspace = getWorkspaceForRoute(currentRoute);
  const activeBottomTab = getActiveBottomTabForRoute(currentRoute);
  const selectedRpcEndpoint = resolveRpcEndpoint(selectedRpcMode, customRpcEndpoint);
  const rpcStatusText = getRpcStatusText(selectedRpcMode, customRpcEndpoint);

  const replaceRouteStack = useCallback((nextRouteStack: readonly AppRoute[]) => {
    routeStackRef.current = nextRouteStack;
    setRouteStack(nextRouteStack);
  }, []);

  const openRoute = useCallback((nextRoute: AppRoute) => {
    const currentRouteStack = routeStackRef.current;
    const currentTopRoute = currentRouteStack[currentRouteStack.length - 1] ?? 'home';
    const guardedNextRoute = hasWalletAccount || canOpenRouteWithoutWallet(nextRoute) ? nextRoute : 'walletCreateMnemonicEntry';

    if (currentTopRoute === guardedNextRoute) {
      return;
    }

    if (guardedNextRoute === 'home') {
      replaceRouteStack(WALLET_HOME_ROUTE_STACK);
      return;
    }

    replaceRouteStack([...currentRouteStack, guardedNextRoute]);
  }, [hasWalletAccount, replaceRouteStack]);

  const goBackOneRoute = useCallback(() => {
    const currentRouteStack = routeStackRef.current;

    if (currentRouteStack.length <= 1) {
      return false;
    }

    replaceRouteStack(currentRouteStack.slice(0, -1));
    return true;
  }, [replaceRouteStack]);

  useEffect(() => {
    // 功能目的：延迟关闭原生启动页；实现原因：避免原生页和 React 页切换闪烁。
    nativeSplashTimerRef.current = setTimeout(() => {
      void SplashScreen.hideAsync().catch(() => undefined);
    }, NATIVE_SPLASH_HOLD_MS);

    return () => {
      if (nativeSplashTimerRef.current !== null) {
        clearTimeout(nativeSplashTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    // 功能目的：恢复本地钱包账户；实现原因：应用重启后不能把已创建钱包误判为空账户。
    void loadPersistedWalletState()
      .then((persistedWalletState) => {
        if (cancelled) {
          return;
        }

        setWalletAccounts(persistedWalletState.accounts);
        setCurrentWalletAddress(persistedWalletState.currentAddress);
        setWalletSigningSeeds(persistedWalletState.signingSeeds);
        setCurrentWalletSigningSeed(findWalletSigningSeed(persistedWalletState.signingSeeds, persistedWalletState.currentAddress));
        setSelectedRpcMode(persistedWalletState.rpcMode);
        setCustomRpcEndpoint(persistedWalletState.customRpcEndpoint);
        replaceRouteStack(persistedWalletState.accounts.length > 0 ? LAUNCH_ROUTE_STACK : EMPTY_WALLET_ROUTE_STACK);
      })
      .catch((error: unknown) => {
        console.info('[wallet-storage] load failed', {
          message: error instanceof Error ? error.message : 'unknown error'
        });
      })
      .finally(() => {
        if (!cancelled) {
          setIsWalletStateLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [replaceRouteStack]);

  useEffect(() => {
    if (!isWalletStateLoaded) {
      return;
    }

    // 功能目的：持久化本地钱包账户；实现原因：创建、导入、切换、删除后重启应用仍需保留账户。
    void savePersistedWalletState({
      accounts: walletAccounts,
      currentAddress: currentWalletAddress,
      customRpcEndpoint,
      rpcMode: selectedRpcMode,
      signingSeeds: walletSigningSeeds
    }).catch((error: unknown) => {
      console.info('[wallet-storage] save failed', {
        message: error instanceof Error ? error.message : 'unknown error'
      });
    });
  }, [currentWalletAddress, customRpcEndpoint, isWalletStateLoaded, selectedRpcMode, walletAccounts, walletSigningSeeds]);

  useEffect(() => {
    // 功能目的：接管 Android 侧滑/返回键；实现原因：单页路由需要先回退应用内历史栈。
    const backSubscription = BackHandler.addEventListener('hardwareBackPress', goBackOneRoute);

    return () => {
      backSubscription.remove();
    };
  }, [goBackOneRoute]);

  useEffect(() => {
    // 功能目的：强制无钱包状态进入创建页；实现原因：避免空账户时访问市场、账户或切换页形成伪钱包状态。
    const currentRouteStack = routeStackRef.current;
    const currentTopRoute = currentRouteStack[currentRouteStack.length - 1] ?? 'walletCreateMnemonicEntry';

    if (!isWalletStateLoaded) {
      return;
    }

    if (!hasWalletAccount && !canOpenRouteWithoutWallet(currentTopRoute)) {
      replaceRouteStack(EMPTY_WALLET_ROUTE_STACK);
    }
  }, [hasWalletAccount, isWalletStateLoaded, replaceRouteStack]);

  const handleOpenTransferSend = () => {
    setScannedSendDraft(null);
    setPendingTransferSendDraft(null);
    openRoute('transferSend');
  };

  const handleOpenDposOverview = () => {
    openRoute('dposOverview');
  };

  const handleOpenPrivacyHome = () => {
    openRoute('privacyHome');
  };

  const handleOpenMarketHome = () => {
    openRoute('marketHome');
  };

  const handleOpenContractsList = () => {
    openRoute('contractsList');
  };

  const handleOpenContractDeployConfirm = () => {
    setScannedDeployPayload(null);
    openRoute('contractDeployConfirm');
  };

  const handleOpenContractDeployConfirmFromScan = (payload: string) => {
    if (!hasWalletAccount) {
      setScannedDeployPayload(payload);
      openRoute('contractDeployConfirm');
      return;
    }

    const currentRouteStack = routeStackRef.current;
    const currentTopRoute = currentRouteStack[currentRouteStack.length - 1] ?? 'home';
    const baseRouteStack = currentTopRoute === 'scanResult' ? currentRouteStack.slice(0, -1) : currentRouteStack;
    const baseTopRoute = baseRouteStack[baseRouteStack.length - 1];
    const nextRouteStack = baseTopRoute === 'contractDeployConfirm' ? baseRouteStack : [...baseRouteStack, 'contractDeployConfirm' as const];

    setScannedDeployPayload(payload);
    replaceRouteStack(nextRouteStack.length > 0 ? nextRouteStack : ['contractDeployConfirm']);
  };

  const handleOpenAccountHome = () => {
    openRoute('accountHome');
  };

  const handleOpenPortfolioAnalytics = () => {
    openRoute('portfolioAnalytics');
  };

  const handleOpenReceiveAddress = () => {
    openRoute('receiveAddress');
  };

  const handleOpenTransactionHistory = () => {
    openRoute('transactionHistory');
  };

  const handleOpenChainStatus = () => {
    openRoute('chainStatus');
  };

  const handleOpenNetworkStatus = () => {
    openRoute('networkStatus');
  };

  const handleOpenRpcNodeDetail = () => {
    openRoute('rpcNodeDetail');
  };

  const handleOpenBlockDetail = (slot?: number | null) => {
    setSelectedBlockSlot(typeof slot === 'number' && slot > 0 ? slot : null);
    openRoute('blockDetail');
  };

  const handleOpenValidatorList = (operationMode: ValidatorOperationMode = 'delegate') => {
    setSelectedValidatorOperationMode(operationMode);
    openRoute('validatorList');
  };

  const handleOpenValidatorDetailStake = (validatorAddress: string, operationMode: ValidatorOperationMode = selectedValidatorOperationMode) => {
    setSelectedValidatorAddress(validatorAddress);
    setSelectedValidatorOperationMode(operationMode);
    openRoute('validatorDetailStake');
  };

  const handleOpenWalletCreate = () => {
    openRoute('walletCreateMnemonicEntry');
  };

  const handleOpenWalletImport = () => {
    openRoute('walletImportMnemonic');
  };

  const handleOpenWalletImportForTransferSend = (draft: PendingTransferSendDraft) => {
    // 功能目的：保留待签名转账草稿；实现原因：导入助记词解锁会离开发送页，不能丢失用户已输入的交易信息。
    setPendingTransferSendDraft(draft);
    openRoute('walletImportMnemonic');
  };

  const handleOpenMnemonicBackup = () => {
    openRoute('walletMnemonicBackup');
  };

  const handleOpenWalletSwitch = () => {
    openRoute('walletSwitchAccount');
  };

  const handleOpenScanResult = () => {
    openRoute('scanResult');
  };

  const handleRpcModeChange = (mode: RpcEndpointMode) => {
    setSelectedRpcMode(mode);
  };

  const handleCustomRpcEndpointChange = (endpoint: string) => {
    setCustomRpcEndpoint(endpoint);
    setSelectedRpcMode('custom');
  };

  const handleRpcEndpointSelect = (endpoint: string) => {
    try {
      const normalizedEndpoint = normalizeRpcEndpoint(endpoint, 'RPC 节点地址');
      if (normalizedEndpoint === DEFAULT_PUBLIC_RPC_URL || isLegacyPublicRpcEndpoint(normalizedEndpoint)) {
        setCustomRpcEndpoint('');
        setSelectedRpcMode('public');
        return;
      }

      if (normalizedEndpoint === DEFAULT_LOCAL_RPC_URL) {
        setCustomRpcEndpoint('');
        setSelectedRpcMode('local');
        return;
      }

      setCustomRpcEndpoint(normalizedEndpoint);
      setSelectedRpcMode('custom');
    } catch (error) {
      console.info('[rpc-endpoint] select failed', { message: formatAppError(error) });
    }
  };

  const handleOpenTransferSendFromScan = (draft: ScannedSendDraft) => {
    const currentRouteStack = routeStackRef.current;
    const currentTopRoute = currentRouteStack[currentRouteStack.length - 1] ?? 'home';
    const baseRouteStack = currentTopRoute === 'scanResult' ? currentRouteStack.slice(0, -1) : currentRouteStack;
    const baseTopRoute = baseRouteStack[baseRouteStack.length - 1];
    const nextRouteStack = baseTopRoute === 'transferSend' ? baseRouteStack : [...baseRouteStack, 'transferSend' as const];

    setScannedSendDraft(draft);
    setPendingTransferSendDraft(null);
    replaceRouteStack(nextRouteStack.length > 0 ? nextRouteStack : ['transferSend']);
  };

  const handleOpenTransactionDetail = (detailData: TransactionDetailData) => {
    // 功能目的：保存当前交易详情并打开页面；实现原因：详情页需要展示用户本次点击关联的金额和地址。
    setTransactionDetailData(detailData);
    openRoute('transactionDetail');
  };

  const handleOpenHome = () => {
    openRoute('home');
  };

  const handleBackRoute = () => {
    if (!goBackOneRoute()) {
      openRoute('home');
    }
  };

  const handleMnemonicGenerated = (words: readonly string[], walletName: string) => {
    // 功能目的：开启助记词备份状态机；实现原因：生成后必须先完成本机备份再进入本地账户列表。
    setMnemonicWords(words);
    setPendingWalletName(walletName);
    setBackupProgress(createEmptyWalletBackupProgress());
    openRoute('walletMnemonicBackup');
  };

  const handleRegenerateMnemonic = (words: readonly string[]) => {
    // 功能目的：替换当前待备份助记词；实现原因：重新生成后旧校验状态必须失效。
    setMnemonicWords(words);
    setBackupProgress(createEmptyWalletBackupProgress());
  };

  const handleCompleteMnemonicBackup = () => {
    // 功能目的：备份完成后写入本地账户列表；实现原因：账号切换页只能展示已确认可用的钱包。
    const nextProgress = {
      copied: backupProgress.copied,
      completed: true,
      ninthWordVerified: true,
      thirdWordVerified: true
    };
    const nextAccount = createWalletAccountFromMnemonic(mnemonicWords, walletAccounts.length, pendingWalletName);
    const nextAccounts = upsertWalletAccount(walletAccounts, nextAccount);
    const nextSigningSeed = mnemonicWords.join(' ');

    setBackupProgress(nextProgress);
    setWalletAccounts(nextAccounts);
    setCurrentWalletAddress(nextAccount.address);
    setCurrentWalletSigningSeed(nextSigningSeed);
    setWalletSigningSeeds((currentSeeds) => upsertWalletSigningSeed(currentSeeds, nextAccount.address, nextSigningSeed));
    setPendingWalletName(getDefaultWalletAccountLabel(nextAccounts.length));
    replaceRouteStack(['walletSwitchAccount']);
  };

  const handleImportMnemonic = (words: readonly string[]) => {
    // 功能目的：导入已有助记词到本地账户；实现原因：恢复钱包不能重新生成助记词或伪造地址。
    const currentRouteStack = routeStackRef.current;
    const transferRouteIndex = currentRouteStack.lastIndexOf('transferSend');
    const nextProgress = {
      copied: false,
      completed: true,
      ninthWordVerified: true,
      thirdWordVerified: true
    };
    const importedAccount = createWalletAccountFromMnemonic(words, walletAccounts.length);
    const existingAccount = walletAccounts.find((account) => account.address === importedAccount.address);
    const selectedAccount = existingAccount ?? importedAccount;
    const nextAccounts = existingAccount ? walletAccounts : upsertWalletAccount(walletAccounts, importedAccount);
    const importedSigningSeed = words.join(' ');

    setBackupProgress(nextProgress);
    setMnemonicWords([]);
    setPendingWalletName(getDefaultWalletAccountLabel(nextAccounts.length));
    setWalletAccounts(nextAccounts);
    setCurrentWalletAddress(selectedAccount.address);
    setCurrentWalletSigningSeed(importedSigningSeed);
    setWalletSigningSeeds((currentSeeds) => upsertWalletSigningSeed(currentSeeds, selectedAccount.address, importedSigningSeed));

    if (transferRouteIndex >= 0) {
      replaceRouteStack(currentRouteStack.slice(0, transferRouteIndex + 1));
      return;
    }

    setPendingTransferSendDraft(null);
    replaceRouteStack(['walletSwitchAccount']);
  };

  const handleEnsureWalletForValidatorPairing = useCallback(async () => {
    const existingSigningSeed = currentWalletSigningSeed?.trim() || findWalletSigningSeed(walletSigningSeeds, currentWalletAddress);
    if (currentWalletAddress !== null) {
      if (existingSigningSeed === null || existingSigningSeed.length === 0) {
        throw new Error('当前钱包未解锁。请重新导入助记词解锁后再绑定验证者节点。');
      }

      return {
        address: currentWalletAddress,
        signingSeed: existingSigningSeed
      };
    }

    const generatedWords = createMnemonicWords(12);
    const generatedSigningSeed = generatedWords.join(' ');
    const generatedLabel = '验证者质押钱包';
    const generatedAccount = {
      ...createWalletAccountFromMnemonic(generatedWords, walletAccounts.length, generatedLabel),
      status: '待备份'
    };
    const nextAccounts = upsertWalletAccount(walletAccounts, generatedAccount);

    // 功能目的：扫码绑定时自动创建本地质押钱包；实现原因：首次部署节点不应要求用户跳出扫码流程手动建账。
    setMnemonicWords(generatedWords);
    setPendingWalletName(generatedLabel);
    setBackupProgress(createEmptyWalletBackupProgress());
    setWalletAccounts(nextAccounts);
    setCurrentWalletAddress(generatedAccount.address);
    setCurrentWalletSigningSeed(generatedSigningSeed);
    setWalletSigningSeeds((currentSeeds) => upsertWalletSigningSeed(currentSeeds, generatedAccount.address, generatedSigningSeed));

    return {
      address: generatedAccount.address,
      signingSeed: generatedSigningSeed
    };
  }, [currentWalletAddress, currentWalletSigningSeed, walletAccounts, walletSigningSeeds]);

  const handleConfirmWalletSwitch = (address: string) => {
    // 功能目的：切换当前本地钱包；实现原因：切换前必须确认目标地址存在于本地账户列表。
    const selectedAddress = selectWalletAccount(walletAccounts, address);
    setCurrentWalletAddress(selectedAddress);
    setCurrentWalletSigningSeed(findWalletSigningSeed(walletSigningSeeds, selectedAddress));
    openRoute('accountHome');
  };

  const handleRemoveWallet = (address: string) => {
    // 功能目的：移除本地账号记录；实现原因：只删除本机列表，不影响链上资产或私钥来源。
    if (currentWalletAddress === null) {
      throw new Error('无法移除钱包: 当前钱包不存在');
    }

    const result = removeWalletAccount(walletAccounts, address, currentWalletAddress);
    const nextSigningSeeds = removeWalletSigningSeed(walletSigningSeeds, address);
    setWalletAccounts(result.accounts);
    setCurrentWalletAddress(result.currentAddress);
    setWalletSigningSeeds(nextSigningSeeds);
    setCurrentWalletSigningSeed(findWalletSigningSeed(nextSigningSeeds, result.currentAddress));
  };

  return (
    <>
      <StatusBar backgroundColor="#FFFFFF" hidden={false} style="dark" translucent={false} />
      <View style={styles.appRoot}>
        <View collapsable={false} style={[styles.screenLayer, { top: contentTopPadding }]}>
          <ActiveScreen
            bottomPadding={headerMetrics.bottomNavHeight}
            currentRoute={currentRoute}
            onBackPress={handleBackRoute}
            onScanPress={handleOpenScanResult}
            onScannedDeployRequest={handleOpenContractDeployConfirmFromScan}
            onScannedSendDraft={handleOpenTransferSendFromScan}
            onTransactionDetailPress={handleOpenTransactionDetail}
            onAccountHomePress={handleOpenAccountHome}
            onBackupMnemonicPress={handleOpenMnemonicBackup}
            onConfirmWalletSwitch={handleConfirmWalletSwitch}
            onCreateWalletPress={handleOpenWalletCreate}
            onImportMnemonic={handleImportMnemonic}
            onImportWalletPress={handleOpenWalletImport}
            onEnsureWalletForValidatorPairing={handleEnsureWalletForValidatorPairing}
            onTransferSendUnlockWalletPress={handleOpenWalletImportForTransferSend}
            onMnemonicGenerated={handleMnemonicGenerated}
            onRegenerateMnemonic={handleRegenerateMnemonic}
            onRemoveWallet={handleRemoveWallet}
            onReceivePress={handleOpenReceiveAddress}
            onSendPress={handleOpenTransferSend}
            onSwitchAccountPress={handleOpenWalletSwitch}
            onCompleteMnemonicBackup={handleCompleteMnemonicBackup}
            onBlockDetailPress={handleOpenBlockDetail}
            onChainStatusPress={handleOpenChainStatus}
            onContractDeployPress={handleOpenContractDeployConfirm}
            onContractsListPress={handleOpenContractsList}
            onNetworkStatusPress={handleOpenNetworkStatus}
            onRpcEndpointSelect={handleRpcEndpointSelect}
            onRpcNodeDetailPress={handleOpenRpcNodeDetail}
            onTransactionHistoryPress={handleOpenTransactionHistory}
            onValidatorDetailStakePress={handleOpenValidatorDetailStake}
            onValidatorListPress={handleOpenValidatorList}
            backupProgress={backupProgress}
            customRpcEndpoint={customRpcEndpoint}
            currentWalletAddress={currentWalletAddress}
            currentWalletSigningSeed={currentWalletSigningSeed}
            mnemonicWords={mnemonicWords}
            onCustomRpcEndpointChange={handleCustomRpcEndpointChange}
            onRpcModeChange={handleRpcModeChange}
            rpcEndpoint={selectedRpcEndpoint}
            rpcStatusText={rpcStatusText}
            scannedDeployPayload={scannedDeployPayload}
            pendingTransferSendDraft={pendingTransferSendDraft}
            scannedSendDraft={scannedSendDraft}
            selectedBlockSlot={selectedBlockSlot}
            selectedRpcMode={selectedRpcMode}
            selectedValidatorAddress={selectedValidatorAddress}
            selectedValidatorOperationMode={selectedValidatorOperationMode}
            setBackupProgress={setBackupProgress}
            transactionDetailData={transactionDetailData}
            walletAccounts={walletAccounts}
          />
        </View>
        <View collapsable={false} pointerEvents="none" style={[styles.fixedTopNavigationScrim, { height: contentTopPadding }]} />
        <View collapsable={false} style={[styles.fixedGlobalHeader, { top: headerMetrics.topSafeArea }]}>
          <GlobalHeader
            activeWorkspace={activeHeaderWorkspace}
            onAccountPress={handleOpenAccountHome}
            onMarketPress={handleOpenMarketHome}
            onScanPress={handleOpenScanResult}
            onWalletPress={handleOpenHome}
            scale={headerMetrics.scale}
          />
        </View>
        <GlobalBottomNavigation
          activeTab={activeBottomTab}
          bottomNavHeight={headerMetrics.bottomNavHeight}
          bottomNavSliceHeight={headerMetrics.bottomNavSliceHeight}
          onMarketContractsPress={handleOpenContractsList}
          onMarketMorePress={handleOpenMarketHome}
          onMarketOrdersPress={handleOpenMarketHome}
          onMarketQuotesPress={handleOpenMarketHome}
          onMarketTradePress={handleOpenMarketHome}
          onWalletAssetsPress={handleOpenPortfolioAnalytics}
          onWalletDposPress={handleOpenDposOverview}
          onWalletHomePress={handleOpenHome}
          onWalletPrivacyPress={handleOpenPrivacyHome}
          onWalletTradePress={handleOpenTransferSend}
          scale={headerMetrics.scale}
          workspace={activeHeaderWorkspace}
        />
      </View>
    </>
  );
}

type ActiveScreenProps = {
  readonly backupProgress: WalletBackupProgress;
  readonly bottomPadding: number;
  readonly customRpcEndpoint: string;
  readonly currentWalletAddress: string | null;
  readonly currentWalletSigningSeed: string | null;
  readonly currentRoute: AppRoute;
  readonly mnemonicWords: readonly string[];
  readonly onAccountHomePress: () => void;
  readonly onBackPress: () => void;
  readonly onBackupMnemonicPress: () => void;
  readonly onBlockDetailPress: (slot?: number | null) => void;
  readonly onChainStatusPress: () => void;
  readonly onCompleteMnemonicBackup: () => void;
  readonly onConfirmWalletSwitch: (address: string) => void;
  readonly onContractDeployPress: () => void;
  readonly onContractsListPress: () => void;
  readonly onCreateWalletPress: () => void;
  readonly onEnsureWalletForValidatorPairing: () => Promise<{
    readonly address: string;
    readonly signingSeed: string;
  }>;
  readonly onImportMnemonic: (words: readonly string[]) => void;
  readonly onImportWalletPress: () => void;
  readonly onTransferSendUnlockWalletPress: (draft: PendingTransferSendDraft) => void;
  readonly onMnemonicGenerated: (words: readonly string[], walletName: string) => void;
  readonly onNetworkStatusPress: () => void;
  readonly onCustomRpcEndpointChange: (endpoint: string) => void;
  readonly onRegenerateMnemonic: (words: readonly string[]) => void;
  readonly onRemoveWallet: (address: string) => void;
  readonly onRpcEndpointSelect: (endpoint: string) => void;
  readonly onRpcNodeDetailPress: () => void;
  readonly onRpcModeChange: (mode: RpcEndpointMode) => void;
  readonly onReceivePress: () => void;
  readonly onScanPress: () => void;
  readonly onScannedDeployRequest: (payload: string) => void;
  readonly onScannedSendDraft: (draft: ScannedSendDraft) => void;
  readonly onSendPress: () => void;
  readonly onSwitchAccountPress: () => void;
  readonly onTransactionHistoryPress: () => void;
  readonly onTransactionDetailPress: (detailData: TransactionDetailData) => void;
  readonly onValidatorDetailStakePress: (validatorAddress: string, operationMode?: ValidatorOperationMode) => void;
  readonly onValidatorListPress: (operationMode?: ValidatorOperationMode) => void;
  readonly rpcEndpoint: string;
  readonly rpcStatusText: string;
  readonly pendingTransferSendDraft: PendingTransferSendDraft | null;
  readonly scannedDeployPayload: string | null;
  readonly scannedSendDraft: ScannedSendDraft | null;
  readonly selectedBlockSlot: number | null;
  readonly selectedRpcMode: RpcEndpointMode;
  readonly selectedValidatorAddress: string;
  readonly selectedValidatorOperationMode: ValidatorOperationMode;
  readonly setBackupProgress: (progress: WalletBackupProgress) => void;
  readonly transactionDetailData: TransactionDetailData;
  readonly walletAccounts: readonly WalletAccount[];
};

function ActiveScreen({
  backupProgress,
  bottomPadding,
  customRpcEndpoint,
  currentWalletAddress,
  currentWalletSigningSeed,
  currentRoute,
  mnemonicWords,
  onAccountHomePress,
  onBackPress,
  onBackupMnemonicPress,
  onBlockDetailPress,
  onChainStatusPress,
  onCompleteMnemonicBackup,
  onConfirmWalletSwitch,
  onContractDeployPress,
  onContractsListPress,
  onCreateWalletPress,
  onEnsureWalletForValidatorPairing,
  onImportMnemonic,
  onImportWalletPress,
  onTransferSendUnlockWalletPress,
  onMnemonicGenerated,
  onNetworkStatusPress,
  onCustomRpcEndpointChange,
  onRegenerateMnemonic,
  onRemoveWallet,
  onRpcEndpointSelect,
  onRpcNodeDetailPress,
  onRpcModeChange,
  onReceivePress,
  onScanPress,
  onScannedDeployRequest,
  onScannedSendDraft,
  onSendPress,
  onSwitchAccountPress,
  onTransactionDetailPress,
  onTransactionHistoryPress,
  onValidatorDetailStakePress,
  onValidatorListPress,
  rpcEndpoint,
  rpcStatusText,
  pendingTransferSendDraft,
  scannedDeployPayload,
  scannedSendDraft,
  selectedBlockSlot,
  selectedRpcMode,
  selectedValidatorAddress,
  selectedValidatorOperationMode,
  setBackupProgress,
  transactionDetailData,
  walletAccounts
}: ActiveScreenProps) {
  if (currentRoute === 'home') {
    return (
      <HomeScreen
        bottomPadding={bottomPadding}
        currentWalletAddress={currentWalletAddress}
        onChainStatusPress={onChainStatusPress}
        onContractPress={onContractsListPress}
        onNetworkStatusPress={onNetworkStatusPress}
        onReceivePress={onReceivePress}
        onSendPress={onSendPress}
        onStakePress={() => onValidatorListPress('stake')}
        onTransactionHistoryPress={onTransactionHistoryPress}
        onValidatorListPress={onValidatorListPress}
        rpcEndpoint={rpcEndpoint}
        topPadding={0}
      />
    );
  }

  if (currentRoute === 'transferSend') {
    return (
      <TransferSendScreen
        bottomPadding={bottomPadding}
        currentWalletAddress={currentWalletAddress}
        currentWalletSigningSeed={currentWalletSigningSeed}
        initialDraft={pendingTransferSendDraft}
        onBackPress={onBackPress}
        onDetailPress={onTransactionDetailPress}
        onScanPress={onScanPress}
        onUnlockWalletPress={onTransferSendUnlockWalletPress}
        rpcEndpoint={rpcEndpoint}
        scannedDraft={scannedSendDraft}
        topPadding={0}
      />
    );
  }

  if (currentRoute === 'receiveAddress') {
    return (
      <ReceiveAddressScreen
        bottomPadding={bottomPadding}
        currentWalletAddress={currentWalletAddress}
        onBackPress={onBackPress}
        topPadding={0}
      />
    );
  }

  if (currentRoute === 'transactionDetail') {
    return (
      <TransactionDetailScreen
        bottomPadding={bottomPadding}
        detailData={transactionDetailData}
        onBackPress={onBackPress}
        onViewBlockPress={onBlockDetailPress}
        rpcEndpoint={rpcEndpoint}
        topPadding={0}
      />
    );
  }

  if (currentRoute === 'transactionHistory') {
    return (
      <TransactionHistoryScreen
        bottomPadding={bottomPadding}
        currentWalletAddress={currentWalletAddress}
        onBackPress={onBackPress}
        onTransactionDetailPress={onTransactionDetailPress}
        rpcEndpoint={rpcEndpoint}
        topPadding={0}
      />
    );
  }

  if (currentRoute === 'blockDetail') {
    return (
      <BlockDetailScreen
        bottomPadding={bottomPadding}
        initialSlot={selectedBlockSlot}
        onBackPress={onBackPress}
        onTransactionHistoryPress={onTransactionHistoryPress}
        onValidatorListPress={() => onValidatorListPress('delegate')}
        rpcEndpoint={rpcEndpoint}
        topPadding={0}
      />
    );
  }

  if (currentRoute === 'chainStatus') {
    return (
      <ChainStatusScreen
        bottomPadding={bottomPadding}
        onBlockDetailPress={onBlockDetailPress}
        onBackPress={onBackPress}
        onNetworkPress={onNetworkStatusPress}
        onRpcNodePress={onRpcNodeDetailPress}
        rpcEndpoint={rpcEndpoint}
        topPadding={0}
      />
    );
  }

  if (currentRoute === 'networkStatus') {
    return (
      <NetworkStatusScreen
        bottomPadding={bottomPadding}
        onBackPress={onBackPress}
        onRpcEndpointSelect={onRpcEndpointSelect}
        onRpcNodePress={onRpcNodeDetailPress}
        onRpcSwitchPress={onAccountHomePress}
        rpcEndpoint={rpcEndpoint}
        topPadding={0}
      />
    );
  }

  if (currentRoute === 'rpcNodeDetail') {
    return <RpcNodeDetailScreen bottomPadding={bottomPadding} onBackPress={onBackPress} rpcEndpoint={rpcEndpoint} topPadding={0} />;
  }

  if (currentRoute === 'scanResult') {
    return (
      <ScanResultScreen
        bottomPadding={bottomPadding}
        currentWalletAddress={currentWalletAddress}
        currentWalletSigningSeed={currentWalletSigningSeed}
        onBackPress={onBackPress}
        onDeployRequest={onScannedDeployRequest}
        onEnsureWalletForValidatorPairing={onEnsureWalletForValidatorPairing}
        onSendDraft={onScannedSendDraft}
        topPadding={0}
      />
    );
  }

  if (currentRoute === 'privacyHome') {
    return <PrivacyHomeScreen bottomPadding={bottomPadding} topPadding={0} />;
  }

  if (currentRoute === 'portfolioAnalytics') {
    return (
      <PortfolioAnalyticsScreen
        bottomPadding={bottomPadding}
        currentWalletAddress={currentWalletAddress}
        onBackPress={onBackPress}
        rpcEndpoint={rpcEndpoint}
        topPadding={0}
      />
    );
  }

  if (currentRoute === 'marketHome') {
    return <MarketHomeScreen bottomPadding={bottomPadding} topPadding={0} />;
  }

  if (currentRoute === 'contractsList') {
    return <ContractsListScreen bottomPadding={bottomPadding} onDeployPress={onContractDeployPress} topPadding={0} />;
  }

  if (currentRoute === 'contractDeployConfirm') {
    return (
      <ContractDeployConfirmScreen
        bottomPadding={bottomPadding}
        currentWalletAddress={currentWalletAddress}
        currentWalletSigningSeed={currentWalletSigningSeed}
        onBackPress={onBackPress}
        onUnlockWalletPress={onImportWalletPress}
        rpcEndpoint={rpcEndpoint}
        scannedDeployPayload={scannedDeployPayload}
        topPadding={0}
      />
    );
  }

  if (currentRoute === 'dposOverview') {
    return (
      <DposOverviewScreen
        bottomPadding={bottomPadding}
        currentWalletAddress={currentWalletAddress}
        onDelegatePress={() => (selectedValidatorAddress ? onValidatorDetailStakePress(selectedValidatorAddress, 'delegate') : onValidatorListPress('delegate'))}
        onRewardPress={() => onValidatorListPress('delegate')}
        onStakePress={() => (selectedValidatorAddress ? onValidatorDetailStakePress(selectedValidatorAddress, 'stake') : onValidatorListPress('stake'))}
        onValidatorListPress={onValidatorListPress}
        rpcEndpoint={rpcEndpoint}
        topPadding={0}
      />
    );
  }

  if (currentRoute === 'validatorList') {
    return (
      <ValidatorListScreen
        bottomPadding={bottomPadding}
        onBackPress={onBackPress}
        onValidatorPress={(validatorAddress) => onValidatorDetailStakePress(validatorAddress, selectedValidatorOperationMode)}
        rpcEndpoint={rpcEndpoint}
        topPadding={0}
      />
    );
  }

  if (currentRoute === 'validatorDetailStake') {
      return (
        <ValidatorDetailStakeScreen
          bottomPadding={bottomPadding}
          currentWalletAddress={currentWalletAddress}
          currentWalletSigningSeed={currentWalletSigningSeed}
          initialMode={selectedValidatorOperationMode}
          onBackPress={onBackPress}
        onUnlockWalletPress={onImportWalletPress}
        rpcEndpoint={rpcEndpoint}
        topPadding={0}
        validatorAddress={selectedValidatorAddress}
      />
    );
  }

  if (currentRoute === 'accountHome') {
    return (
      <AccountHomeScreen
        bottomPadding={bottomPadding}
        customRpcEndpoint={customRpcEndpoint}
        currentWalletAddress={currentWalletAddress}
        onBackupMnemonicPress={onBackupMnemonicPress}
        onChainStatusPress={onChainStatusPress}
        onCustomRpcEndpointChange={onCustomRpcEndpointChange}
        onRpcNodeDetailPress={onRpcNodeDetailPress}
        onRpcModeChange={onRpcModeChange}
        onSwitchAccountPress={onSwitchAccountPress}
        rpcEndpoint={rpcEndpoint}
        rpcStatusText={rpcStatusText}
        selectedRpcMode={selectedRpcMode}
        topPadding={0}
      />
    );
  }

  if (currentRoute === 'walletCreateMnemonicEntry') {
    return (
      <WalletCreateMnemonicEntryScreen
        bottomPadding={bottomPadding}
        defaultWalletName={getDefaultWalletAccountLabel(walletAccounts.length)}
        onGenerateMnemonic={onMnemonicGenerated}
        onImportWalletPress={onImportWalletPress}
        topPadding={0}
      />
    );
  }

  if (currentRoute === 'walletImportMnemonic') {
    return (
      <WalletImportMnemonicScreen
        bottomPadding={bottomPadding}
        onBackPress={onBackPress}
        onImportMnemonic={onImportMnemonic}
        topPadding={0}
      />
    );
  }

  if (currentRoute === 'walletMnemonicBackup') {
    if (mnemonicWords.length === 0) {
      return (
        <WalletCreateMnemonicEntryScreen
          bottomPadding={bottomPadding}
          defaultWalletName={getDefaultWalletAccountLabel(walletAccounts.length)}
          onGenerateMnemonic={onMnemonicGenerated}
          onImportWalletPress={onImportWalletPress}
          topPadding={0}
        />
      );
    }

    return (
      <WalletMnemonicBackupScreen
        backupProgress={backupProgress}
        bottomPadding={bottomPadding}
        mnemonicWords={mnemonicWords}
        onBackPress={onBackPress}
        onBackupProgressChange={setBackupProgress}
        onCompleteBackup={onCompleteMnemonicBackup}
        onRegenerateMnemonic={onRegenerateMnemonic}
        topPadding={0}
      />
    );
  }

  if (currentRoute === 'walletSwitchAccount') {
    if (currentWalletAddress === null || walletAccounts.length === 0) {
      return (
        <WalletCreateMnemonicEntryScreen
          bottomPadding={bottomPadding}
          defaultWalletName={getDefaultWalletAccountLabel(walletAccounts.length)}
          onGenerateMnemonic={onMnemonicGenerated}
          onImportWalletPress={onImportWalletPress}
          topPadding={0}
        />
      );
    }

    return (
      <WalletSwitchAccountScreen
        backupProgress={backupProgress}
        bottomPadding={bottomPadding}
        currentAddress={currentWalletAddress}
        onBackPress={onBackPress}
        onConfirmSwitch={onConfirmWalletSwitch}
        onCreateWalletPress={onCreateWalletPress}
        onImportWalletPress={onImportWalletPress}
        onRemoveWallet={onRemoveWallet}
        topPadding={0}
        walletAccounts={walletAccounts}
      />
    );
  }

  return <DposOverviewScreen bottomPadding={bottomPadding} currentWalletAddress={currentWalletAddress} onValidatorListPress={onValidatorListPress} topPadding={0} />;
}

function findWalletSigningSeed(signingSeeds: readonly WalletSigningSeed[], address: string | null) {
  if (address === null) {
    return null;
  }

  return signingSeeds.find((seed) => seed.address === address)?.signingSeed ?? null;
}

function upsertWalletSigningSeed(
  signingSeeds: readonly WalletSigningSeed[],
  address: string,
  signingSeed: string
): readonly WalletSigningSeed[] {
  const normalizedSeed = signingSeed.trim();
  const nextSeed = { address, signingSeed: normalizedSeed };
  if (signingSeeds.some((seed) => seed.address === address)) {
    return signingSeeds.map((seed) => (seed.address === address ? nextSeed : seed));
  }

  return [...signingSeeds, nextSeed];
}

function removeWalletSigningSeed(signingSeeds: readonly WalletSigningSeed[], address: string) {
  return signingSeeds.filter((seed) => seed.address !== address);
}

const styles = StyleSheet.create({
  appRoot: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    overflow: 'hidden',
    position: 'relative'
  },
  fixedGlobalHeader: {
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 30
  },
  fixedTopNavigationScrim: {
    backgroundColor: '#FFFFFF',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 20
  },
  screenLayer: {
    backgroundColor: '#FFFFFF',
    bottom: 0,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    zIndex: 0
  }
});
