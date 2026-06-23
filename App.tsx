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
import { AccountHomeScreen } from './src/features/accountHome/AccountHomeScreen';
import { ContractsListScreen } from './src/features/contractsList/ContractsListScreen';
import { DposOverviewScreen } from './src/features/dposOverview/DposOverviewScreen';
import { HomeScreen } from './src/features/home/HomeScreen';
import { useHomeResponsiveLayout } from './src/features/home/useHomeResponsiveLayout';
import { MarketHomeScreen } from './src/features/marketHome/MarketHomeScreen';
import { PrivacyHomeScreen } from './src/features/privacyHome/PrivacyHomeScreen';
import { ScanResultScreen } from './src/features/scanResult/ScanResultScreen';
import { TransferSendScreen } from './src/features/transferSend/TransferSendScreen';

const NATIVE_SPLASH_HOLD_MS = 600;

type AppRoute = 'home' | 'transferSend' | 'marketHome' | 'contractsList' | 'dposOverview' | 'privacyHome' | 'accountHome' | 'scanResult';
const INITIAL_ROUTE_STACK: readonly AppRoute[] = ['home'];

function getWorkspaceForRoute(route: AppRoute): GlobalBottomNavigationWorkspace {
  return route === 'marketHome' || route === 'contractsList' ? 'market' : 'wallet';
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
  const routeStackRef = useRef<readonly AppRoute[]>(INITIAL_ROUTE_STACK);
  const [routeStack, setRouteStack] = useState<readonly AppRoute[]>(INITIAL_ROUTE_STACK);
  const currentRoute = routeStack[routeStack.length - 1] ?? 'home';
  const headerMetrics = useHomeResponsiveLayout();
  const headerHeight = getGlobalHeaderHeight(headerMetrics.scale);
  const contentTopPadding = headerMetrics.topSafeArea + headerHeight;
  const activeHeaderWorkspace = getWorkspaceForRoute(currentRoute);
  const activeBottomTab: GlobalBottomTabKey | undefined =
    currentRoute === 'marketHome'
      ? 'marketQuotes'
      : currentRoute === 'contractsList'
        ? 'marketContracts'
        : currentRoute === 'transferSend'
          ? 'walletTrade'
          : currentRoute === 'dposOverview'
            ? 'walletDpos'
            : currentRoute === 'privacyHome'
              ? 'walletPrivacy'
              : currentRoute === 'home'
                ? 'walletHome'
                : undefined;

  const replaceRouteStack = useCallback((nextRouteStack: readonly AppRoute[]) => {
    routeStackRef.current = nextRouteStack;
    setRouteStack(nextRouteStack);
  }, []);

  const openRoute = useCallback((nextRoute: AppRoute) => {
    const currentRouteStack = routeStackRef.current;
    const currentTopRoute = currentRouteStack[currentRouteStack.length - 1] ?? 'home';

    if (currentTopRoute === nextRoute) {
      return;
    }

    if (nextRoute === 'home') {
      replaceRouteStack(INITIAL_ROUTE_STACK);
      return;
    }

    replaceRouteStack([...currentRouteStack, nextRoute]);
  }, [replaceRouteStack]);

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
    // 功能目的：接管 Android 侧滑/返回键；实现原因：单页路由需要先回退应用内历史栈。
    const backSubscription = BackHandler.addEventListener('hardwareBackPress', goBackOneRoute);

    return () => {
      backSubscription.remove();
    };
  }, [goBackOneRoute]);

  const handleOpenTransferSend = () => {
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

  const handleOpenAccountHome = () => {
    openRoute('accountHome');
  };

  const handleOpenScanResult = () => {
    openRoute('scanResult');
  };

  const handleOpenHome = () => {
    openRoute('home');
  };

  const handleBackRoute = () => {
    if (!goBackOneRoute()) {
      openRoute('home');
    }
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
            onSendPress={handleOpenTransferSend}
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
          onWalletAssetsPress={handleOpenHome}
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
  readonly bottomPadding: number;
  readonly currentRoute: AppRoute;
  readonly onBackPress: () => void;
  readonly onScanPress: () => void;
  readonly onSendPress: () => void;
};

function ActiveScreen({
  bottomPadding,
  currentRoute,
  onBackPress,
  onScanPress,
  onSendPress
}: ActiveScreenProps) {
  if (currentRoute === 'home') {
    return <HomeScreen bottomPadding={bottomPadding} onScanPress={onScanPress} onSendPress={onSendPress} topPadding={0} />;
  }

  if (currentRoute === 'transferSend') {
    return <TransferSendScreen bottomPadding={bottomPadding} onBackPress={onBackPress} onScanPress={onScanPress} topPadding={0} />;
  }

  if (currentRoute === 'scanResult') {
    return <ScanResultScreen bottomPadding={bottomPadding} onBackPress={onBackPress} topPadding={0} />;
  }

  if (currentRoute === 'privacyHome') {
    return <PrivacyHomeScreen bottomPadding={bottomPadding} topPadding={0} />;
  }

  if (currentRoute === 'marketHome') {
    return <MarketHomeScreen bottomPadding={bottomPadding} topPadding={0} />;
  }

  if (currentRoute === 'contractsList') {
    return <ContractsListScreen bottomPadding={bottomPadding} topPadding={0} />;
  }

  if (currentRoute === 'accountHome') {
    return <AccountHomeScreen bottomPadding={bottomPadding} topPadding={0} />;
  }

  return <DposOverviewScreen bottomPadding={bottomPadding} topPadding={0} />;
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
