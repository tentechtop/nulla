import Svg, { Circle, Path, Rect } from 'react-native-svg';

type SvgIconProps = {
  readonly size: number;
};

export function PrivacyEyeIcon({ size }: SvgIconProps) {
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

export function TitleShieldIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 40 40" width={size}>
      <Path d="M20 5L32 10.3V20C32 28.8 26.8 34.3 20 37C13.2 34.3 8 28.8 8 20V10.3L20 5Z" stroke="#4E5CFF" strokeLinejoin="round" strokeWidth="2.6" />
      <Path d="M20 15V24" stroke="#4E5CFF" strokeLinecap="round" strokeWidth="2.6" />
      <Circle cx="20" cy="27.5" fill="#4E5CFF" r="1.8" />
    </Svg>
  );
}

export function CardUnlockIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Rect height="20" rx="3" stroke="#4E6DFF" strokeWidth="2.8" width="25" x="9" y="21" />
      <Path d="M17 21V15C17 10.6 20.6 7 25 7C29 7 32.4 10 32.9 13.8" stroke="#4E6DFF" strokeLinecap="round" strokeWidth="2.8" />
      <Path d="M21.5 31H21.6" stroke="#4E6DFF" strokeLinecap="round" strokeWidth="4" />
    </Svg>
  );
}

export function CardAuditShieldIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Path d="M24 7L37 12.8V23C37 32.6 31.4 38.5 24 41.5C16.6 38.5 11 32.6 11 23V12.8L24 7Z" stroke="#4E6DFF" strokeLinejoin="round" strokeWidth="2.8" />
      <Circle cx="24" cy="22" r="3.2" stroke="#4E6DFF" strokeWidth="2.6" />
      <Path d="M24 25.5V31" stroke="#4E6DFF" strokeLinecap="round" strokeWidth="2.6" />
    </Svg>
  );
}

export function ActionPrivateInIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
      <Path d="M28 10V36" stroke="#176BFF" strokeLinecap="round" strokeWidth="3.4" />
      <Path d="M18 26L28 36L38 26" stroke="#176BFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.4" />
      <Path d="M14 38V44H42V38" stroke="#050505" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />
    </Svg>
  );
}

export function ActionPrivateTransferIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
      <Path d="M18 18C20.7 15.3 24.3 13.8 28.2 13.8C36 13.8 42.3 20.1 42.3 27.9" stroke="#176BFF" strokeLinecap="round" strokeWidth="3.2" />
      <Path d="M38 17.5L42.3 27.9L31.8 23.9" stroke="#176BFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />
      <Path d="M38 38C35.3 40.7 31.7 42.2 27.8 42.2C20 42.2 13.7 35.9 13.7 28.1" stroke="#8B3DFF" strokeLinecap="round" strokeWidth="3.2" />
      <Path d="M18 38.5L13.7 28.1L24.2 32.1" stroke="#8B3DFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />
    </Svg>
  );
}

export function ActionTransparentOutIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
      <Path d="M28 40V14" stroke="#176BFF" strokeLinecap="round" strokeWidth="3.4" />
      <Path d="M18 24L28 14L38 24" stroke="#176BFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.4" />
      <Path d="M14 38V44H42V38" stroke="#050505" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />
    </Svg>
  );
}

export function ActionAuditIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
      <Path d="M25 8L41 15V26.5C41 36.8 35 43.2 25 47C15 43.2 9 36.8 9 26.5V15L25 8Z" stroke="#050505" strokeLinejoin="round" strokeWidth="3.2" />
      <Circle cx="25" cy="26" r="6.5" stroke="#286DFF" strokeWidth="3.2" />
      <Path d="M29.8 30.8L38 39" stroke="#050505" strokeLinecap="round" strokeWidth="3.2" />
    </Svg>
  );
}

export function StatusChartIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Rect height="18" rx="2" stroke="#5A52FF" strokeWidth="2.2" width="22" x="5" y="7" />
      <Path d="M9 20L13.5 15.5L17 18L23 12" stroke="#5A52FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
    </Svg>
  );
}

export function StatusCubeIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Path d="M16 5L25 10V21L16 27L7 21V10L16 5Z" stroke="#050505" strokeLinejoin="round" strokeWidth="2.2" />
      <Path d="M7.5 10.5L16 15.5L24.5 10.5" stroke="#050505" strokeLinejoin="round" strokeWidth="2.2" />
      <Path d="M16 15.5V26.5" stroke="#050505" strokeLinecap="round" strokeWidth="2.2" />
    </Svg>
  );
}

export function StatusNullifierIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Circle cx="16" cy="16" r="8" stroke="#050505" strokeDasharray="3 4" strokeWidth="2.2" />
      <Circle cx="16" cy="16" fill="#050505" r="3" />
    </Svg>
  );
}

export function StatusKeyIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Circle cx="12" cy="19" r="5" stroke="#050505" strokeWidth="2.4" />
      <Path d="M16 15L25 6" stroke="#050505" strokeLinecap="round" strokeWidth="2.4" />
      <Path d="M22 9L26 13" stroke="#050505" strokeLinecap="round" strokeWidth="2.4" />
    </Svg>
  );
}

export function StatusLayersIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Path d="M16 6L26 11L16 16L6 11L16 6Z" stroke="#050505" strokeLinejoin="round" strokeWidth="2.2" />
      <Path d="M6 17L16 22L26 17" stroke="#050505" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
      <Path d="M6 23L16 28L26 23" stroke="#050505" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
    </Svg>
  );
}

export function RoutePreviewIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Path d="M8 10H18C21.3 10 24 12.7 24 16C24 19.3 21.3 22 18 22H8" stroke="#5A52FF" strokeLinecap="round" strokeWidth="2.6" />
      <Circle cx="8" cy="10" fill="white" r="3" stroke="#5A52FF" strokeWidth="2.6" />
      <Circle cx="24" cy="16" fill="white" r="3" stroke="#5A52FF" strokeWidth="2.6" />
      <Circle cx="8" cy="22" fill="white" r="3" stroke="#5A52FF" strokeWidth="2.6" />
    </Svg>
  );
}

export function RouteTransparentNodeIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 36 36" width={size}>
      <Circle cx="18" cy="18" fill="#D9D9DF" r="14" />
      <Path d="M18 4A14 14 0 0 1 18 32V4Z" fill="#FFFFFF" />
      <Circle cx="18" cy="18" r="14" stroke="#9BA0AA" strokeWidth="2" />
    </Svg>
  );
}

export function RoutePrivateNodeIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 36 36" width={size}>
      <Circle cx="18" cy="18" r="13" stroke="#5A52FF" strokeDasharray="4 4" strokeWidth="2.8" />
      <Circle cx="18" cy="18" fill="#5A52FF" r="4" />
    </Svg>
  );
}

export function PrivacyRecordClockIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Circle cx="16" cy="16" r="10" stroke="#5A52FF" strokeWidth="2.4" />
      <Path d="M16 10V16L20 19" stroke="#5A52FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
    </Svg>
  );
}

export function ChevronRightIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Path d="M18 12L30 24L18 36" stroke="#050505" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
    </Svg>
  );
}

export function EmptyPrivacyActivityIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 160 120" width={size}>
      <Path d="M48 48H112L123 65V98C123 103 119 107 114 107H46C41 107 37 103 37 98V65L48 48Z" stroke="#C8CBD4" strokeLinejoin="round" strokeWidth="5" />
      <Path d="M39 66H67L73 78H87L93 66H121" stroke="#C8CBD4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
      <Path d="M64 48L72 33H88L96 48" stroke="#D9DBE2" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
      <Circle cx="39" cy="34" fill="#C8CBD4" r="3" />
      <Circle cx="119" cy="32" fill="#C8CBD4" r="4" />
      <Path d="M30 25V34M25.5 29.5H34.5M126 78V87M121.5 82.5H130.5" stroke="#C8CBD4" strokeLinecap="round" strokeWidth="3" />
    </Svg>
  );
}
