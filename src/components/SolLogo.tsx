import { StyleSheet, Text, View } from 'react-native';
import { colors, dp } from '../theme/tokens';

type SolLogoProps = {
  readonly size?: number;
  readonly showWordmark?: boolean;
};

export function SolLogo({ size = 36, showWordmark = false }: SolLogoProps) {
  const barWidth = size * 1.38;
  const barHeight = size * 0.24;

  return (
    <View style={styles.container}>
      <View style={[styles.mark, { width: barWidth, height: size }]}>
        <View style={[styles.bar, styles.barTop, { width: barWidth, height: barHeight }]} />
        <View style={[styles.bar, styles.middle, { width: barWidth, height: barHeight }]} />
        <View style={[styles.bar, styles.bottom, { width: barWidth, height: barHeight }]} />
      </View>
      {showWordmark ? <Text style={styles.wordmark}>SOL</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: dp(16)
  },
  mark: {
    justifyContent: 'space-between',
    transform: [{ skewX: '-18deg' }]
  },
  bar: {
    borderRadius: 2
  },
  barTop: {
    backgroundColor: colors.cyan
  },
  middle: {
    alignSelf: 'center',
    backgroundColor: colors.primary
  },
  bottom: {
    alignSelf: 'flex-end',
    backgroundColor: colors.violet
  },
  wordmark: {
    color: colors.text,
    fontSize: dp(38),
    fontWeight: '800',
    letterSpacing: 0
  }
});
