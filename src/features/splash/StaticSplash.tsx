import { Image, StyleSheet, useWindowDimensions, View } from 'react-native';

type StaticSplashProps = {
  readonly onReady: () => void;
};

const splashLogoSource = require('../../../assets/brand/splash-logo.png');

export function StaticSplash({ onReady }: StaticSplashProps) {
  const { width, height } = useWindowDimensions();
  const shortSide = Math.max(Math.min(width, height), 240);
  const logoCanvasSize = Math.round(Math.min(Math.max(shortSide * 0.56, 188), 240));

  return (
    <View style={styles.root} onLayout={onReady}>
      <Image
        resizeMode="contain"
        source={splashLogoSource}
        style={{ height: logoCanvasSize, width: logoCanvasSize }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    flex: 1,
    justifyContent: 'center'
  }
});
