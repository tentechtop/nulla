import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getWalletSetupLayoutMetrics } from './layout';

export function useWalletSetupResponsiveLayout() {
  const windowDimensions = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();

  return getWalletSetupLayoutMetrics(windowDimensions.width, safeAreaInsets.top, safeAreaInsets.bottom);
}
