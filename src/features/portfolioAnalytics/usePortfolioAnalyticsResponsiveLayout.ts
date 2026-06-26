import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPortfolioAnalyticsLayoutMetrics } from './layout';

export function usePortfolioAnalyticsResponsiveLayout() {
  const { width } = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();

  return getPortfolioAnalyticsLayoutMetrics(width, safeAreaInsets.top, safeAreaInsets.bottom);
}
