import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTransactionDetailLayoutMetrics } from './layout';

export function useTransactionDetailResponsiveLayout() {
  const { width } = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();

  return getTransactionDetailLayoutMetrics(width, safeAreaInsets.top, safeAreaInsets.bottom);
}
