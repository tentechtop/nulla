import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getScanResultLayoutMetrics } from './layout';

export function useScanResultResponsiveLayout() {
  const { width } = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();

  return getScanResultLayoutMetrics(width, safeAreaInsets.top, safeAreaInsets.bottom);
}
