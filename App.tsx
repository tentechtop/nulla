import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/features/home/HomeScreen';
import { StaticSplash } from './src/features/splash/StaticSplash';

const STATIC_SPLASH_HOLD_MS = 400;

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function App() {
  const [staticSplashVisible, setStaticSplashVisible] = useState(true);
  const staticSplashReadyRef = useRef(false);
  const staticSplashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (staticSplashTimerRef.current === null) {
        return;
      }

      clearTimeout(staticSplashTimerRef.current);
    };
  }, []);

  const handleStaticSplashReady = useCallback(() => {
    if (staticSplashReadyRef.current) {
      return;
    }

    staticSplashReadyRef.current = true;

    // 功能目的：静态停留 0.4 秒后进入首页；实现原因：用户要求无动画但保留短暂品牌露出
    void SplashScreen.hideAsync()
      .catch(() => undefined)
      .finally(() => {
        staticSplashTimerRef.current = setTimeout(() => {
          setStaticSplashVisible(false);
        }, STATIC_SPLASH_HOLD_MS);
      });
  }, []);

  if (staticSplashVisible) {
    return (
      <>
        <StatusBar hidden />
        <StaticSplash onReady={handleStaticSplashReady} />
      </>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar hidden={false} style="dark" />
      <View style={styles.appRoot}>
        <HomeScreen />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appRoot: {
    flex: 1
  }
});
