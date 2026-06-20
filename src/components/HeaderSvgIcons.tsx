import Svg, { Circle, Path } from 'react-native-svg';

type SvgIconProps = {
  readonly size: number;
};

export function HeaderScanSvgIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
      <Path d="M10 24V13C10 11.3 11.3 10 13 10H24" stroke="#050505" strokeLinecap="round" strokeWidth="3.2" />
      <Path d="M32 10H43C44.7 10 46 11.3 46 13V24" stroke="#050505" strokeLinecap="round" strokeWidth="3.2" />
      <Path d="M46 32V43C46 44.7 44.7 46 43 46H32" stroke="#050505" strokeLinecap="round" strokeWidth="3.2" />
      <Path d="M24 46H13C11.3 46 10 44.7 10 43V32" stroke="#050505" strokeLinecap="round" strokeWidth="3.2" />
      <Path d="M18 28H38" stroke="#050505" strokeLinecap="round" strokeWidth="4" />
    </Svg>
  );
}

export function HeaderProfileSvgIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Circle cx="24" cy="24" r="21" stroke="#050505" strokeWidth="3.2" />
      <Circle cx="24" cy="18" r="6" stroke="#050505" strokeWidth="3.2" />
      <Path
        d="M12.8 38C15.2 31.8 19 28.8 24 28.8C29 28.8 32.8 31.8 35.2 38"
        stroke="#050505"
        strokeLinecap="round"
        strokeWidth="3.2"
      />
    </Svg>
  );
}
