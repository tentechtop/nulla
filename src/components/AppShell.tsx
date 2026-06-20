import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme/tokens';

type AppShellProps = {
  readonly bottomPadding: number;
  readonly children: ReactNode;
  readonly topPadding: number;
};

export function AppShell({ bottomPadding, children, topPadding }: AppShellProps) {
  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: bottomPadding,
            paddingTop: topPadding
          }
        ]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1
  },
  content: {}
});
