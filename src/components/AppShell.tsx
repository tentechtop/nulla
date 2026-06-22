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
      <StatusBar backgroundColor="#FFFFFF" style="dark" translucent={false} />
      <ScrollView
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
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
  content: {
    backgroundColor: colors.background
  },
  scrollView: {
    backgroundColor: colors.background
  }
});
