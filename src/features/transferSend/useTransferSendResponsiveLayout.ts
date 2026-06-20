import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTransferSendLayoutMetrics } from './layout';

export function useTransferSendResponsiveLayout() {
  const { width } = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();

  return getTransferSendLayoutMetrics(width, safeAreaInsets.top, safeAreaInsets.bottom);
}
