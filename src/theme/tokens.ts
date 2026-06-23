import { Platform } from 'react-native';

export const colors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSoft: '#F7F8FC',
  border: '#E8EAF1',
  borderStrong: '#D9DCE7',
  primary: '#1E6BFF',
  primarySoft: '#EAF1FF',
  violet: '#8A4DFF',
  cyan: '#20E5C9',
  black: '#050507',
  blackSoft: '#101116',
  text: '#090A12',
  textMuted: '#6F7486',
  textSoft: '#9AA0AE',
  positive: '#126DFF',
  negative: '#F0162F',
  warning: '#FF7A1A',
  success: '#18C772'
} as const;

export const fontFamilies = {
  system: Platform.select({
    default: 'sans-serif',
    web: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif'
  }) as string
} as const;

export const fontWeights = {
  pageTitle: '700'
} as const;

export const spacing = {
  page: 18,
  card: 20,
  small: 8,
  medium: 12,
  large: 18,
  xlarge: 28
} as const;

export const radius = {
  small: 10,
  medium: 18,
  large: 24,
  xlarge: 30
} as const;

export const typography = {
  brand: 42,
  title: 28,
  section: 25,
  body: 18,
  small: 15,
  tiny: 13
} as const;

export const shadows = {
  card: {
    shadowColor: '#151824',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3
  },
  glow: {
    shadowColor: '#276BFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 5
  }
} as const;

export function dp(value: number) {
  return Math.round(value * 0.5);
}
