import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getReceiveAddressLayoutMetrics } from './layout';

export function useReceiveAddressResponsiveLayout() {
  const dimensions = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();

  return getReceiveAddressLayoutMetrics(dimensions.width, safeAreaInsets.top, safeAreaInsets.bottom);
}
