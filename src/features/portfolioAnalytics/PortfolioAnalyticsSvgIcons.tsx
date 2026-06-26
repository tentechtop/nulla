import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type PortfolioAnalyticsIconKey =
  | 'assetKind'
  | 'chevronDown'
  | 'chevronRight'
  | 'claim'
  | 'contract'
  | 'contractRisk'
  | 'cfd'
  | 'diversify'
  | 'eye'
  | 'liquidity'
  | 'private'
  | 'refresh'
  | 'report'
  | 'review'
  | 'risk'
  | 'rwa';

type PortfolioAnalyticsIconProps = {
  readonly color?: string;
  readonly iconKey: PortfolioAnalyticsIconKey;
  readonly size: number;
};

export function PortfolioAnalyticsIcon({ color = '#1E6BFF', iconKey, size }: PortfolioAnalyticsIconProps) {
  if (iconKey === 'eye') {
    return (
      <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
        <Path d="M4 16C7.2 10.8 11.2 8.2 16 8.2C20.8 8.2 24.8 10.8 28 16C24.8 21.2 20.8 23.8 16 23.8C11.2 23.8 7.2 21.2 4 16Z" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
        <Circle cx="16" cy="16" r="4.2" stroke={color} strokeWidth="2.4" />
      </Svg>
    );
  }

  if (iconKey === 'risk') {
    return (
      <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
        <Path d="M16 4L26 8.5V16.4C26 23.1 22 27.3 16 29C10 27.3 6 23.1 6 16.4V8.5L16 4Z" stroke={color} strokeLinejoin="round" strokeWidth="2.4" />
        <Path d="M11.5 16.4L14.5 19.4L21 12.7" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
      </Svg>
    );
  }

  if (iconKey === 'assetKind') {
    return (
      <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
        <Path d="M16 4.5L26 10.2V21.8L16 27.5L6 21.8V10.2L16 4.5Z" stroke={color} strokeLinejoin="round" strokeWidth="2.4" />
        <Path d="M6.5 10.5L16 16L25.5 10.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
        <Path d="M16 16V27" stroke={color} strokeLinecap="round" strokeWidth="2.2" />
      </Svg>
    );
  }

  if (iconKey === 'contract') {
    return (
      <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
        <Path d="M10 7H22C24.2 7 25 7.8 25 10V22C25 24.2 24.2 25 22 25H10C7.8 25 7 24.2 7 22V10C7 7.8 7.8 7 10 7Z" stroke={color} strokeLinejoin="round" strokeWidth="2.4" />
        <Path d="M13 4V9" stroke={color} strokeLinecap="round" strokeWidth="2.2" />
        <Path d="M19 4V9" stroke={color} strokeLinecap="round" strokeWidth="2.2" />
        <Path d="M13 23V28" stroke={color} strokeLinecap="round" strokeWidth="2.2" />
        <Path d="M19 23V28" stroke={color} strokeLinecap="round" strokeWidth="2.2" />
      </Svg>
    );
  }

  if (iconKey === 'private') {
    return (
      <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
        <Path d="M6 17C9.2 12.2 12.5 9.8 16 9.8C19.5 9.8 22.8 12.2 26 17C22.8 21.8 19.5 24.2 16 24.2C12.5 24.2 9.2 21.8 6 17Z" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
        <Path d="M10 9L22 25" stroke={color} strokeLinecap="round" strokeWidth="2.4" />
      </Svg>
    );
  }

  if (iconKey === 'contractRisk' || iconKey === 'rwa' || iconKey === 'review') {
    return (
      <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
        <Path d="M22 6L34 12V23.2C34 31 29.4 36.2 22 38C14.6 36.2 10 31 10 23.2V12L22 6Z" stroke={color} strokeLinejoin="round" strokeWidth="3" />
        {iconKey === 'rwa'
          ? (
            <>
              <Path d="M22 14V30" stroke={color} strokeLinecap="round" strokeWidth="3" />
              <Path d="M15 22H29" stroke={color} strokeLinecap="round" strokeWidth="3" />
            </>
          )
          : <Path d="M18 22L21 25L27 18.5" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />}
      </Svg>
    );
  }

  if (iconKey === 'liquidity') {
    return (
      <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
        <Path d="M14 24C14 15.5 22 8 22 8C22 8 30 15.5 30 24C30 28.9 26.4 33 22 33C17.6 33 14 28.9 14 24Z" stroke={color} strokeLinejoin="round" strokeWidth="3" />
        <Path d="M12 18C8.8 20.4 8 24.5 10 28" stroke={color} strokeLinecap="round" strokeWidth="3" />
        <Path d="M32 18C35.2 20.4 36 24.5 34 28" stroke={color} strokeLinecap="round" strokeWidth="3" />
      </Svg>
    );
  }

  if (iconKey === 'cfd') {
    return (
      <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
        <Path d="M12 31L31 12" stroke={color} strokeLinecap="round" strokeWidth="3" />
        <Path d="M13 21L21 13" stroke={color} strokeLinecap="round" strokeWidth="3" />
        <Path d="M23 31L31 23" stroke={color} strokeLinecap="round" strokeWidth="3" />
        <Circle cx="12" cy="31" r="3" stroke={color} strokeWidth="3" />
        <Circle cx="31" cy="12" r="3" stroke={color} strokeWidth="3" />
      </Svg>
    );
  }

  if (iconKey === 'diversify' || iconKey === 'claim') {
    return (
      <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
        <Path d="M14 12H30C32.2 12 34 13.8 34 16V29C34 31.2 32.2 33 30 33H14C11.8 33 10 31.2 10 29V16C10 13.8 11.8 12 14 12Z" stroke={color} strokeLinejoin="round" strokeWidth="3" />
        {iconKey === 'claim'
          ? (
            <>
              <Path d="M17 12V9H27V12" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
              <Path d="M22 20V28" stroke={color} strokeLinecap="round" strokeWidth="3" />
              <Path d="M18 24L22 28L26 24" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
            </>
          )
          : (
            <>
              <Path d="M16 28H28" stroke={color} strokeLinecap="round" strokeWidth="3" />
              <Path d="M18 20H26" stroke={color} strokeLinecap="round" strokeWidth="3" />
            </>
          )}
      </Svg>
    );
  }

  if (iconKey === 'refresh') {
    return (
      <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
        <Path d="M31.5 15.5C29.2 12.8 25.8 11.2 22 11.2C15.8 11.2 10.8 16.2 10.8 22.4C10.8 28.6 15.8 33.6 22 33.6C26.8 33.6 30.9 30.6 32.5 26.4" stroke={color} strokeLinecap="round" strokeWidth="3" />
        <Path d="M32 8V16H24" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      </Svg>
    );
  }

  if (iconKey === 'report') {
    return (
      <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
        <Path d="M14 7H27L34 14V36C34 37.7 32.7 39 31 39H14C12.3 39 11 37.7 11 36V10C11 8.3 12.3 7 14 7Z" stroke={color} strokeLinejoin="round" strokeWidth="3" />
        <Path d="M27 7V14H34" stroke={color} strokeLinejoin="round" strokeWidth="3" />
        <Path d="M17 24H28" stroke={color} strokeLinecap="round" strokeWidth="3" />
        <Path d="M17 31H25" stroke={color} strokeLinecap="round" strokeWidth="3" />
      </Svg>
    );
  }

  if (iconKey === 'chevronDown') {
    return (
      <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
        <Path d="M9 13L16 20L23 13" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      </Svg>
    );
  }

  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Path d="M12 7L21 16L12 25" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8" />
    </Svg>
  );
}

export function SolTokenIcon({ size }: { readonly size: number }) {
  return (
    <Svg height={size} viewBox="0 0 44 44" width={size}>
      <Circle cx="22" cy="22" fill="#050507" r="22" />
      <Path d="M13 14H31L26 19H8L13 14Z" fill="#22E5D1" />
      <Path d="M8 20.5H26L31 25.5H13L8 20.5Z" fill="#397BFF" />
      <Path d="M13 27H31L26 32H8L13 27Z" fill="#B238FF" />
    </Svg>
  );
}

export function SimpleTokenIcon({
  backgroundColor,
  color,
  label,
  size
}: {
  readonly backgroundColor: string;
  readonly color: string;
  readonly label: string;
  readonly size: number;
}) {
  return (
    <Svg height={size} viewBox="0 0 44 44" width={size}>
      <Circle cx="22" cy="22" fill={backgroundColor} r="22" />
      <Rect fill="rgba(255,255,255,0.18)" height="18" rx="9" width="18" x="13" y="13" />
      <Path d="M22 10V34" stroke={color} strokeLinecap="round" strokeWidth="3" />
      {label === 'A' ? <Path d="M15 29L22 13L29 29M18 24H26" stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" /> : null}
      {label === 'E' ? <Path d="M15 16H29M15 22H26M15 28H29" stroke={color} strokeLinecap="round" strokeWidth="3" /> : null}
    </Svg>
  );
}
