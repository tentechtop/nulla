import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMarketHomeLayoutMetrics } from './layout';

export function useMarketHomeResponsiveLayout() {
  const { width } = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();

  return getMarketHomeLayoutMetrics(width, safeAreaInsets.top, safeAreaInsets.bottom);
}
