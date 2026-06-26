import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Path, Rect, Stop } from 'react-native-svg';

type SvgIconProps = {
  readonly color?: string;
  readonly size: number;
};

export function TransactionBackIcon({ color = '#090A12', size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Path d="M29 10L15 24L29 38" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
    </Svg>
  );
}

export function TransactionCopyIcon({ color = '#7B8191', size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Rect height="17" rx="3" stroke={color} strokeWidth="2.2" width="17" x="10" y="5" />
      <Path d="M7 10.5H6.5C5.1 10.5 4 11.6 4 13V25.5C4 26.9 5.1 28 6.5 28H19C20.4 28 21.5 26.9 21.5 25.5V25" stroke={color} strokeLinecap="round" strokeWidth="2.2" />
    </Svg>
  );
}

export function TransactionSolanaMarkIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 96 96" width={size}>
      <Defs>
        <SvgLinearGradient gradientUnits="userSpaceOnUse" id="txSolanaA" x1="16" x2="80" y1="23" y2="73">
          <Stop stopColor="#23E8C7" />
          <Stop offset="0.5" stopColor="#377BFF" />
          <Stop offset="1" stopColor="#9E35FF" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M23 24H77L67 36H13L23 24Z" fill="url(#txSolanaA)" />
      <Path d="M29 42H83L73 54H19L29 42Z" fill="url(#txSolanaA)" />
      <Path d="M19 60H73L63 72H9L19 60Z" fill="url(#txSolanaA)" />
    </Svg>
  );
}

export function TransactionTypeIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
      <Defs>
        <SvgLinearGradient gradientUnits="userSpaceOnUse" id="txTypeIcon" x1="7" x2="49" y1="8" y2="48">
          <Stop stopColor="#23D9FF" />
          <Stop offset="0.45" stopColor="#315DFF" />
          <Stop offset="1" stopColor="#9A3DFF" />
        </SvgLinearGradient>
      </Defs>
      <Circle cx="28" cy="28" fill="url(#txTypeIcon)" r="24" />
      <Path d="M18 29H36" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="3.2" />
      <Path d="M29 20L38 29L29 38" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />
      <Path d="M18 21L18 37" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="3.2" />
    </Svg>
  );
}

export function TransactionStatusCheckIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Circle cx="16" cy="16" fill="#43D7A0" r="14" />
      <Path d="M9.5 16.2L13.7 20.2L22.6 11.6" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
    </Svg>
  );
}

export function TransactionMetricIcon({ color = '#286EFF', size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Rect height="20" rx="3" stroke={color} strokeWidth="2.3" width="20" x="6" y="6" />
      <Path d="M11 11H21M11 16H21M11 21H17" stroke={color} strokeLinecap="round" strokeWidth="2.3" />
    </Svg>
  );
}

export function TransactionBlockIcon({ color = '#2E3344', size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
      <Path d="M28 6L47 16.5V39.5L28 50L9 39.5V16.5L28 6Z" stroke={color} strokeLinejoin="round" strokeWidth="3" />
      <Path d="M9.8 17L28 27.6L46.2 17" stroke={color} strokeLinejoin="round" strokeWidth="3" />
      <Path d="M28 27.6V49" stroke={color} strokeLinecap="round" strokeWidth="3" />
    </Svg>
  );
}

export function TransactionPersonIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
      <Defs>
        <SvgLinearGradient gradientUnits="userSpaceOnUse" id="txPersonIcon" x1="9" x2="47" y1="9" y2="47">
          <Stop stopColor="#1BE6FF" />
          <Stop offset="0.52" stopColor="#356BFF" />
          <Stop offset="1" stopColor="#9F38FF" />
        </SvgLinearGradient>
      </Defs>
      <Circle cx="28" cy="28" fill="url(#txPersonIcon)" r="24" />
      <Circle cx="28" cy="21" r="6" stroke="#FFFFFF" strokeWidth="3" />
      <Path d="M17.5 39C19.5 33.5 23.2 31 28 31C32.8 31 36.5 33.5 38.5 39" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="3" />
    </Svg>
  );
}

export function TransactionArrowDownIcon({ color = '#B9BEC9', size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Circle cx="16" cy="16" fill="#F0F2F6" r="15" />
      <Path d="M16 8V22" stroke={color} strokeLinecap="round" strokeWidth="2.8" />
      <Path d="M10.5 16.5L16 22L21.5 16.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8" />
    </Svg>
  );
}

export function TransactionFeeIcon({ color = '#151824', size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Circle cx="16" cy="16" r="11" stroke={color} strokeWidth="2.2" />
      <Path d="M12 17.8C12.8 19.3 14.2 20 16.2 20C18.7 20 20 18.9 20 17.2C20 15.6 18.8 15 16.2 14.5C13.9 14.1 12.6 13.4 12.6 11.8C12.6 10.3 13.9 9.2 16 9.2C17.7 9.2 18.9 9.8 19.7 11" stroke={color} strokeLinecap="round" strokeWidth="2.1" />
      <Path d="M16 7.5V22.5" stroke={color} strokeLinecap="round" strokeWidth="2.1" />
    </Svg>
  );
}

export function TransactionChevronRightIcon({ color = '#6F7486', size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Path d="M12 7L21 16L12 25" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8" />
    </Svg>
  );
}
