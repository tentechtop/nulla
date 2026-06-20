import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

type SvgIconProps = {
  readonly size: number;
};

type WideSvgIconProps = {
  readonly height: number;
  readonly width: number;
};

export function BackChevronIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Path d="M30 12L18 24L30 36" stroke="#050505" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
    </Svg>
  );
}

export function ChevronRightIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Path d="M18 12L30 24L18 36" stroke="#050505" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
    </Svg>
  );
}

export function InfoIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Circle cx="16" cy="16" r="13" stroke="#9AA0AE" strokeWidth="3" />
      <Path d="M16 14V23" stroke="#9AA0AE" strokeLinecap="round" strokeWidth="3" />
      <Circle cx="16" cy="9.5" fill="#9AA0AE" r="1.8" />
    </Svg>
  );
}

export function AddressContactIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Circle cx="24" cy="13.5" r="5.5" stroke="#050505" strokeWidth="3.2" />
      <Path
        d="M13 32.5C14.9 26.7 18.6 23.8 24 23.8C29.4 23.8 33.1 26.7 35 32.5"
        stroke="#050505"
        strokeLinecap="round"
        strokeWidth="3.2"
      />
      <Path
        d="M11.5 37.5V34.5C11.5 33.4 12.4 32.5 13.5 32.5H17"
        stroke="#050505"
        strokeLinecap="round"
        strokeWidth="3.2"
      />
      <Path
        d="M36.5 37.5V34.5C36.5 33.4 35.6 32.5 34.5 32.5H31"
        stroke="#050505"
        strokeLinecap="round"
        strokeWidth="3.2"
      />
      <Circle cx="34.5" cy="27.5" r="3.5" stroke="#050505" strokeWidth="2.8" />
    </Svg>
  );
}

export function CurrentRouteIcon({ height, width }: WideSvgIconProps) {
  return (
    <Svg fill="none" height={height} viewBox="0 0 128 48" width={width}>
      <Defs>
        <LinearGradient gradientUnits="userSpaceOnUse" id="routeLine" x1="24" x2="104" y1="24" y2="24">
          <Stop stopColor="#0B72FF" />
          <Stop offset="1" stopColor="#9A3DFF" />
        </LinearGradient>
      </Defs>
      <Path d="M24 24H104" stroke="url(#routeLine)" strokeLinecap="round" strokeWidth="4" />
      <Circle cx="24" cy="24" fill="white" r="9" stroke="#0B72FF" strokeWidth="4" />
      <Circle cx="104" cy="24" fill="white" r="9" stroke="#9A3DFF" strokeWidth="4" />
    </Svg>
  );
}

export function RouteMaskIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 64 64" width={size}>
      <Circle cx="32" cy="32" r="27" stroke="#8B3DFF" strokeWidth="2.4" />
      <Path
        d="M17.5 27.2C17.5 24.9 19.4 23.2 21.7 23.6L30.3 25.1C31.4 25.3 32.6 25.3 33.7 25.1L42.3 23.6C44.6 23.2 46.5 24.9 46.5 27.2V31.2C46.5 38.7 40.1 43.1 34.2 38.5L32 36.8L29.8 38.5C23.9 43.1 17.5 38.7 17.5 31.2V27.2Z"
        stroke="#8B3DFF"
        strokeLinejoin="round"
        strokeWidth="3.2"
      />
      <Path d="M22.5 30.6C26 29.2 28.4 29.8 30 32.4" stroke="#8B3DFF" strokeLinecap="round" strokeWidth="3.2" />
      <Path d="M41.5 30.6C38 29.2 35.6 29.8 34 32.4" stroke="#8B3DFF" strokeLinecap="round" strokeWidth="3.2" />
    </Svg>
  );
}

export function RouteShieldIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 64 64" width={size}>
      <Circle cx="32" cy="32" r="27" stroke="#0B72FF" strokeWidth="2.4" />
      <Path
        d="M32 18L43 23V31.3C43 39.1 38.5 43.8 32 46.5C25.5 43.8 21 39.1 21 31.3V23L32 18Z"
        stroke="#0B72FF"
        strokeLinejoin="round"
        strokeWidth="3.2"
      />
    </Svg>
  );
}
