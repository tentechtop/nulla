import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDposOverviewLayoutMetrics } from './layout';

export function useDposOverviewResponsiveLayout() {
  const { width } = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();

  return getDposOverviewLayoutMetrics(width, safeAreaInsets.top, safeAreaInsets.bottom);
}
