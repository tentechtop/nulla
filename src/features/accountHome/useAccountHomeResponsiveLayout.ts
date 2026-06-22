import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAccountHomeLayoutMetrics } from './layout';

export function useAccountHomeResponsiveLayout() {
  const { width } = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();

  return getAccountHomeLayoutMetrics(width, safeAreaInsets.top, safeAreaInsets.bottom);
}
