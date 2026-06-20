import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, dp, radius, shadows } from '../theme/tokens';

type SectionCardProps = {
  readonly children: ReactNode;
  readonly style?: object;
};

export function SectionCard({ children, style }: SectionCardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.large,
    borderWidth: 1,
    marginHorizontal: dp(18),
    ...shadows.card
  }
});
