import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPrivacyHomeLayoutMetrics } from './layout';

export function usePrivacyHomeResponsiveLayout() {
  const { width } = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();

  return getPrivacyHomeLayoutMetrics(width, safeAreaInsets.top, safeAreaInsets.bottom);
}
