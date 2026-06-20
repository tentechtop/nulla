import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GlobalBottomNavigation, type GlobalBottomTabKey } from './src/components/GlobalBottomNavigation';
import { GlobalHeader, getGlobalHeaderHeight } from './src/components/GlobalHeader';
import { DposOverviewScreen } from './src/features/dposOverview/DposOverviewScreen';
import { HomeScreen } from './src/features/home/HomeScreen';
import { useHomeResponsiveLayout } from './src/features/home/useHomeResponsiveLayout';
import { TransferSendScreen } from './src/features/transferSend/TransferSendScreen';

const NATIVE_SPLASH_HOLD_MS = 600;

type AppRoute = 'home' | 'transferSend' | 'dposOverview';

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
  const [currentRoute, setCurrentRoute] = useState<AppRoute>('home');
  const headerMetrics = useHomeResponsiveLayout();
  const headerHeight = getGlobalHeaderHeight(headerMetrics.scale);
  const contentTopPadding = headerMetrics.topSafeArea + headerHeight;
  const activeBottomTab: GlobalBottomTabKey = currentRoute === 'dposOverview' ? 'dpos' : 'assets';

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

  const handleOpenTransferSend = () => {
    setCurrentRoute('transferSend');
  };

  const handleOpenDposOverview = () => {
    setCurrentRoute('dposOverview');
  };

  const handleBackHome = () => {
    setCurrentRoute('home');
  };

  return (
    <>
      <StatusBar hidden={false} style="dark" />
      <View style={styles.appRoot}>
        <View collapsable={false} style={[styles.screenLayer, { top: contentTopPadding }]}>
          <ActiveScreen
            bottomPadding={headerMetrics.bottomNavHeight}
            currentRoute={currentRoute}
            onBackPress={handleBackHome}
            onSendPress={handleOpenTransferSend}
          />
        </View>
        <View
          collapsable={false}
          pointerEvents="none"
          renderToHardwareTextureAndroid
          style={[styles.fixedTopNavigationScrim, { height: contentTopPadding }]}
        />
        <View collapsable={false} renderToHardwareTextureAndroid style={[styles.fixedGlobalHeader, { top: headerMetrics.topSafeArea }]}>
          <GlobalHeader onAssetsPress={handleBackHome} scale={headerMetrics.scale} />
        </View>
        <GlobalBottomNavigation
          activeTab={activeBottomTab}
          bottomNavHeight={headerMetrics.bottomNavHeight}
          bottomNavSliceHeight={headerMetrics.bottomNavSliceHeight}
          onAssetsPress={handleBackHome}
          onDposPress={handleOpenDposOverview}
          scale={headerMetrics.scale}
        />
      </View>
    </>
  );
}

type ActiveScreenProps = {
  readonly bottomPadding: number;
  readonly currentRoute: AppRoute;
  readonly onBackPress: () => void;
  readonly onSendPress: () => void;
};

function ActiveScreen({
  bottomPadding,
  currentRoute,
  onBackPress,
  onSendPress
}: ActiveScreenProps) {
  if (currentRoute === 'home') {
    return <HomeScreen bottomPadding={bottomPadding} onSendPress={onSendPress} topPadding={0} />;
  }

  if (currentRoute === 'transferSend') {
    return <TransferSendScreen bottomPadding={bottomPadding} onBackPress={onBackPress} topPadding={0} />;
  }

  return <DposOverviewScreen bottomPadding={bottomPadding} topPadding={0} />;
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative'
  },
  fixedGlobalHeader: {
    elevation: 30,
    left: 0,
    position: 'absolute',
    right: 0,
    zIndex: 30
  },
  fixedTopNavigationScrim: {
    backgroundColor: '#FFFFFF',
    elevation: 20,
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
