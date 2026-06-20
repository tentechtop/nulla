import { Image, StyleSheet, View } from 'react-native';

type StaticSplashProps = {
  readonly onReady: () => void;
};

const splashLogoSource = require('../../../assets/brand/splash-logo.png');
const splashLogoAspectRatio = 646 / 97;
const splashLogoWidth = 280;
const splashLogoHeight = Math.round(splashLogoWidth / splashLogoAspectRatio);

export function StaticSplash({ onReady }: StaticSplashProps) {
  return (
    <View style={styles.root} onLayout={onReady}>
      <Image
        resizeMode="contain"
        source={splashLogoSource}
        style={styles.logo}
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
  },
  logo: {
    height: splashLogoHeight,
    width: splashLogoWidth
  }
});
