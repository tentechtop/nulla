import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HomeScreen } from './src/features/home/HomeScreen';

const NATIVE_SPLASH_HOLD_MS = 600;

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function App() {
  const nativeSplashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 功能目的：只保留原生静态启动页；实现原因：避免原生页和 React 页切换导致闪烁
    nativeSplashTimerRef.current = setTimeout(() => {
      void SplashScreen.hideAsync().catch(() => undefined);
    }, NATIVE_SPLASH_HOLD_MS);

    return () => {
      if (nativeSplashTimerRef.current !== null) {
        clearTimeout(nativeSplashTimerRef.current);
      }
    };
  }, []);

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
