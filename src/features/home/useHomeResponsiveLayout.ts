import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getHomeLayoutMetrics } from './layout';

export function useHomeResponsiveLayout() {
  const { width } = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();

  return getHomeLayoutMetrics(width, safeAreaInsets.top, safeAreaInsets.bottom);
}
