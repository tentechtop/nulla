import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

type SvgIconProps = {
  readonly size: number;
};

export function EyeIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 40 40" width={size}>
      <Path
        d="M4 20C8.2 12.8 13.5 9.2 20 9.2C26.5 9.2 31.8 12.8 36 20C31.8 27.2 26.5 30.8 20 30.8C13.5 30.8 8.2 27.2 4 20Z"
        stroke="#A5ABB8"
        strokeLinejoin="round"
        strokeWidth="3.4"
      />
      <Circle cx="20" cy="20" fill="#A5ABB8" r="4.6" />
    </Svg>
  );
}

export function ChevronRightIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Path d="M18 12L30 24L18 36" stroke="#8A8F9E" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
    </Svg>
  );
}

export function ActionStakeIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 64 64" width={size}>
      <Path d="M32 11L49 18.5V31C49 43.4 41.7 50.4 32 54C22.3 50.4 15 43.4 15 31V18.5L32 11Z" stroke="#050505" strokeLinejoin="round" strokeWidth="3.4" />
      <Path d="M25.5 32.5L30.2 37.2L39 26.8" stroke="#5A52FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.8" />
    </Svg>
  );
}

export function ActionDelegateIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 64 64" width={size}>
      <Circle cx="32" cy="20" r="9" stroke="#050505" strokeWidth="3.6" />
      <Path d="M15 49C18.4 38.8 24.1 33.8 32 33.8C39.9 33.8 45.6 38.8 49 49" stroke="#050505" strokeLinecap="round" strokeWidth="3.6" />
      <Path d="M30 49H47" stroke="#286DFF" strokeLinecap="round" strokeWidth="3.6" />
      <Circle cx="49" cy="49" fill="#8B3DFF" r="4" />
    </Svg>
  );
}

export function ActionClaimIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 64 64" width={size}>
      <Path
        d="M48.5 41.5C44.9 49 36.3 53.1 27.9 50.6C18.1 47.7 12.5 37.3 15.4 27.5C18.3 17.7 28.7 12.1 38.5 15C46.2 17.3 51.3 24.1 51.8 31.6"
        stroke="#050505"
        strokeLinecap="round"
        strokeWidth="3.6"
      />
      <Path d="M33 25V34H40" stroke="#286DFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.8" />
      <Circle cx="48" cy="45" fill="#8B3DFF" r="5" />
    </Svg>
  );
}

export function ActionValidatorIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 64 64" width={size}>
      <Path d="M32 10L49 17.5V30.5C49 43 41.5 50.6 32 54C22.5 50.6 15 43 15 30.5V17.5L32 10Z" stroke="#050505" strokeLinejoin="round" strokeWidth="3.4" />
      <Path
        d="M32 22C27.3 22 23.5 25.8 23.5 30.5C23.5 38 32 43.5 32 43.5C32 43.5 40.5 38 40.5 30.5C40.5 25.8 36.7 22 32 22Z"
        stroke="#376BFF"
        strokeLinejoin="round"
        strokeWidth="3.4"
      />
      <Circle cx="32" cy="30.5" fill="#376BFF" r="3.2" />
    </Svg>
  );
}

export function ValidatorSummaryIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 64 64" width={size}>
      <Path d="M32 8L52 17V31.2C52 45.1 43.8 53.2 32 58C20.2 53.2 12 45.1 12 31.2V17L32 8Z" stroke="#386CFF" strokeLinejoin="round" strokeWidth="4" />
      <Path d="M23.5 32.5L29.5 38.5L41 25.5" stroke="#386CFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
    </Svg>
  );
}

export function SelfStakeIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Path d="M24 7L39 14L24 21L9 14L24 7Z" stroke="#050505" strokeLinejoin="round" strokeWidth="3" />
      <Path d="M9 22L24 29L39 22" stroke="#050505" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      <Path d="M9 30L24 37L39 30" stroke="#050505" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
    </Svg>
  );
}

export function MyDelegateIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Circle cx="24" cy="14.5" r="7.5" stroke="#050505" strokeWidth="3.2" />
      <Path d="M10.5 40C13.2 31.5 17.8 27.2 24 27.2C30.2 27.2 34.8 31.5 37.5 40" stroke="#050505" strokeLinecap="round" strokeWidth="3.2" />
    </Svg>
  );
}

export function RewardGiftIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Path d="M10 20H38V39C38 40.1 37.1 41 36 41H12C10.9 41 10 40.1 10 39V20Z" stroke="#050505" strokeLinejoin="round" strokeWidth="3.2" />
      <Path d="M7 14H41V20H7V14Z" stroke="#050505" strokeLinejoin="round" strokeWidth="3.2" />
      <Path d="M24 14V41" stroke="#5A52FF" strokeLinecap="round" strokeWidth="3.2" />
      <Path d="M18.5 14C14.5 14 12.5 11.5 13.5 9.2C14.5 6.8 18.7 8.2 24 14" stroke="#050505" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />
      <Path d="M29.5 14C33.5 14 35.5 11.5 34.5 9.2C33.5 6.8 29.3 8.2 24 14" stroke="#050505" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />
    </Svg>
  );
}

export function CoolingHourglassIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Path d="M14 6H34" stroke="#050505" strokeLinecap="round" strokeWidth="3.2" />
      <Path d="M14 42H34" stroke="#050505" strokeLinecap="round" strokeWidth="3.2" />
      <Path d="M17 8C17 16 21.5 19 24 24C26.5 19 31 16 31 8" stroke="#050505" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />
      <Path d="M17 40C17 32 21.5 29 24 24C26.5 29 31 32 31 40" stroke="#050505" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />
    </Svg>
  );
}

export function SolanaValidatorAvatar({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 64 64" width={size}>
      <Circle cx="32" cy="32" fill="#050507" r="32" />
      <Defs>
        <LinearGradient gradientUnits="userSpaceOnUse" id="dposSolTop" x1="20" x2="48" y1="22" y2="22">
          <Stop stopColor="#20F3C4" />
          <Stop offset="1" stopColor="#1B8DFF" />
        </LinearGradient>
        <LinearGradient gradientUnits="userSpaceOnUse" id="dposSolMiddle" x1="16" x2="44" y1="32" y2="32">
          <Stop stopColor="#218CFF" />
          <Stop offset="1" stopColor="#8D43FF" />
        </LinearGradient>
        <LinearGradient gradientUnits="userSpaceOnUse" id="dposSolBottom" x1="20" x2="48" y1="42" y2="42">
          <Stop stopColor="#8D43FF" />
          <Stop offset="1" stopColor="#20F3C4" />
        </LinearGradient>
      </Defs>
      <Path d="M22 18H48L42 26H16L22 18Z" fill="url(#dposSolTop)" />
      <Path d="M16 28H42L48 36H22L16 28Z" fill="url(#dposSolMiddle)" />
      <Path d="M22 38H48L42 46H16L22 38Z" fill="url(#dposSolBottom)" />
    </Svg>
  );
}

export function VValidatorAvatar({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 64 64" width={size}>
      <Circle cx="32" cy="32" fill="#0B1020" r="32" />
      <Path d="M15 17L30.5 49L49 17H38L30.8 32.5L24.3 17H15Z" fill="#17D883" />
      <Path d="M25.5 17L31 30.8L38 17H49L30.5 49L15 17H25.5Z" fill="#6E4CFF" opacity="0.75" />
      <Path d="M28.5 40L49 17H38L30.8 32.5L28.5 40Z" fill="#12E0C6" />
    </Svg>
  );
}

export function BottomDposActiveIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
      <Circle cx="28" cy="28" r="18" stroke="#1E6BFF" strokeDasharray="8 10" strokeLinecap="round" strokeWidth="4.2" />
      <Circle cx="28" cy="28" fill="#1E6BFF" r="7" />
      <Circle cx="40" cy="16" fill="#1E6BFF" r="3.4" />
      <Circle cx="16" cy="40" fill="#1E6BFF" r="3.4" />
    </Svg>
  );
}

export function BottomAssetsInactiveIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
      <Path
        d="M13 27L28 14L43 27V45C43 46.1 42.1 47 41 47H15C13.9 47 13 46.1 13 45V27Z"
        stroke="#6F7486"
        strokeLinejoin="round"
        strokeWidth="3.4"
      />
      <Path d="M23 47V34H33V47" stroke="#6F7486" strokeLinejoin="round" strokeWidth="3.4" />
    </Svg>
  );
}
