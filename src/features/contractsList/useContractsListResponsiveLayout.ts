import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getContractsListLayoutMetrics } from './layout';

export function useContractsListResponsiveLayout() {
  const { width } = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();

  return getContractsListLayoutMetrics(width, safeAreaInsets.top, safeAreaInsets.bottom);
}
