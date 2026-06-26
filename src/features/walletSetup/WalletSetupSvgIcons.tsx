import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

type SvgIconProps = {
  readonly size: number;
};

export type WalletSetupIconKey =
  | 'copy'
  | 'document'
  | 'eye'
  | 'globe'
  | 'import'
  | 'lock'
  | 'noScreenshot'
  | 'offline'
  | 'privateLock'
  | 'shield'
  | 'trash'
  | 'warning';

export function WalletSetupIcon({ iconKey, size }: SvgIconProps & { readonly iconKey: WalletSetupIconKey }) {
  if (iconKey === 'document') {
    return <DocumentIcon size={size} />;
  }

  if (iconKey === 'privateLock') {
    return <PrivateLockIcon size={size} />;
  }

  if (iconKey === 'offline') {
    return <OfflineIcon size={size} />;
  }

  if (iconKey === 'noScreenshot') {
    return <NoScreenshotIcon size={size} />;
  }

  if (iconKey === 'warning') {
    return <WarningIcon size={size} />;
  }

  if (iconKey === 'copy') {
    return <CopyIcon size={size} />;
  }

  if (iconKey === 'eye') {
    return <EyeIcon size={size} />;
  }

  if (iconKey === 'globe') {
    return <GlobeIcon size={size} />;
  }

  if (iconKey === 'lock') {
    return <LockIcon size={size} />;
  }

  if (iconKey === 'import') {
    return <ImportIcon size={size} />;
  }

  if (iconKey === 'trash') {
    return <TrashIcon size={size} />;
  }

  return <ShieldIcon size={size} />;
}

export function SolAvatarIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 72 72" width={size}>
      <Circle cx="36" cy="36" fill="#050507" r="36" />
      <Defs>
        <LinearGradient gradientUnits="userSpaceOnUse" id="solGradient" x1="18" x2="55" y1="21" y2="52">
          <Stop stopColor="#18E8D1" />
          <Stop offset="0.52" stopColor="#2672FF" />
          <Stop offset="1" stopColor="#9B43FF" />
        </LinearGradient>
      </Defs>
      <Path d="M22 21H55L49 28H16L22 21Z" fill="url(#solGradient)" />
      <Path d="M16 33H49L55 40H22L16 33Z" fill="url(#solGradient)" />
      <Path d="M22 45H55L49 52H16L22 45Z" fill="url(#solGradient)" />
    </Svg>
  );
}

export function SelectedCheckIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 40 40" width={size}>
      <Circle cx="20" cy="20" fill="#176BFF" r="18" />
      <Path d="M12.5 20.5L17.5 25.5L28.5 14.5" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.4" />
    </Svg>
  );
}

export function BackIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 36 36" width={size}>
      <Path d="M23 7L12 18L23 29" stroke="#090A12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
    </Svg>
  );
}

export function CardCopyIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 64 64" width={size}>
      <Rect fill="#050507" fillOpacity="0.45" height="48" rx="10" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1.6" width="48" x="8" y="8" />
      <Rect height="25" rx="3" stroke="#FFFFFF" strokeWidth="3" width="16" x="30" y="17" />
      <Path d="M21 25V46C21 47.7 22.3 49 24 49H38" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
    </Svg>
  );
}

export function CardQrIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 64 64" width={size}>
      <Rect fill="#050507" fillOpacity="0.45" height="48" rx="10" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1.6" width="48" x="8" y="8" />
      <Rect height="9" rx="1.2" stroke="#FFFFFF" strokeWidth="3" width="9" x="19" y="19" />
      <Rect height="9" rx="1.2" stroke="#FFFFFF" strokeWidth="3" width="9" x="36" y="19" />
      <Rect height="9" rx="1.2" stroke="#FFFFFF" strokeWidth="3" width="9" x="19" y="36" />
      <Path d="M36 36H41V41H36V36Z" stroke="#FFFFFF" strokeLinejoin="round" strokeWidth="3" />
      <Path d="M45 36V45H36" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
    </Svg>
  );
}

export function ChevronRightIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Path d="M12 7L21 16L12 25" stroke="#737A8D" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8" />
    </Svg>
  );
}

export function AddCircleIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
      <Circle cx="22" cy="22" r="13" stroke="#090A12" strokeWidth="2.8" />
      <Path d="M22 15V29" stroke="#090A12" strokeLinecap="round" strokeWidth="2.8" />
      <Path d="M15 22H29" stroke="#090A12" strokeLinecap="round" strokeWidth="2.8" />
    </Svg>
  );
}

function ShieldIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Path d="M24 7L39 13.5V24.2C39 35 32.7 41.2 24 44.5C15.3 41.2 9 35 9 24.2V13.5L24 7Z" stroke="#176BFF" strokeLinejoin="round" strokeWidth="3" />
      <Path d="M17 24.5L21.8 29.2L31.4 19" stroke="#176BFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />
    </Svg>
  );
}

function DocumentIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Path d="M14 7H30L38 15V38C38 39.7 36.7 41 35 41H14C12.3 41 11 39.7 11 38V10C11 8.3 12.3 7 14 7Z" stroke="#13CBB6" strokeLinejoin="round" strokeWidth="3" />
      <Path d="M30 7V15H38" stroke="#13CBB6" strokeLinejoin="round" strokeWidth="3" />
      <Path d="M17 25H31" stroke="#13CBB6" strokeLinecap="round" strokeWidth="2.8" />
      <Path d="M17 32H27" stroke="#13CBB6" strokeLinecap="round" strokeWidth="2.8" />
    </Svg>
  );
}

function PrivateLockIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Rect height="19" rx="3.5" stroke="#8A4DFF" strokeWidth="3" width="26" x="11" y="21" />
      <Path d="M17 21V15C17 11.1 20.1 8 24 8C27.9 8 31 11.1 31 15V21" stroke="#8A4DFF" strokeLinecap="round" strokeWidth="3" />
      <Path d="M24 28V33" stroke="#8A4DFF" strokeLinecap="round" strokeWidth="3" />
    </Svg>
  );
}

function OfflineIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Path d="M8 17C18 8.8 30 8.8 40 17" stroke="#6A52FF" strokeLinecap="round" strokeWidth="3" />
      <Path d="M14 24C20.3 18.8 27.7 18.8 34 24" stroke="#6A52FF" strokeLinecap="round" strokeWidth="3" />
      <Path d="M20 31C22.7 28.8 25.3 28.8 28 31" stroke="#6A52FF" strokeLinecap="round" strokeWidth="3" />
      <Path d="M12 36L36 12" stroke="#6A52FF" strokeLinecap="round" strokeWidth="3.2" />
    </Svg>
  );
}

function NoScreenshotIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Path d="M13 17V14C13 12.3 14.3 11 16 11H20" stroke="#6A52FF" strokeLinecap="round" strokeWidth="3" />
      <Path d="M28 11H32C33.7 11 35 12.3 35 14V17" stroke="#6A52FF" strokeLinecap="round" strokeWidth="3" />
      <Path d="M13 31V34C13 35.7 14.3 37 16 37H20" stroke="#6A52FF" strokeLinecap="round" strokeWidth="3" />
      <Path d="M28 37H32C33.7 37 35 35.7 35 34V31" stroke="#6A52FF" strokeLinecap="round" strokeWidth="3" />
      <Path d="M15 33L33 15" stroke="#6A52FF" strokeLinecap="round" strokeWidth="3.2" />
      <Path d="M17 18C19.4 15.8 21.7 14.8 24 14.8C28.9 14.8 32.8 19 35.5 24" stroke="#6A52FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      <Path d="M26.2 32.8C25.5 33 24.8 33.2 24 33.2C19.1 33.2 15.2 29 12.5 24" stroke="#6A52FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
    </Svg>
  );
}

function WarningIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 40 40" width={size}>
      <Path d="M20 6L35 32H5L20 6Z" stroke="#FF8A00" strokeLinejoin="round" strokeWidth="2.8" />
      <Path d="M20 16V23" stroke="#FF8A00" strokeLinecap="round" strokeWidth="2.8" />
      <Circle cx="20" cy="28" fill="#FF8A00" r="1.7" />
    </Svg>
  );
}

function CopyIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
      <Rect height="19" rx="2.5" stroke="#565B6E" strokeWidth="2.8" width="14" x="18" y="9" />
      <Path d="M12 16V33C12 34.1 12.9 35 14 35H25" stroke="#565B6E" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8" />
    </Svg>
  );
}

function EyeIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
      <Path d="M6 22C10.1 14.5 15.4 10.8 22 10.8C28.6 10.8 33.9 14.5 38 22C33.9 29.5 28.6 33.2 22 33.2C15.4 33.2 10.1 29.5 6 22Z" stroke="#565B6E" strokeLinejoin="round" strokeWidth="2.8" />
      <Circle cx="22" cy="22" r="5.2" stroke="#565B6E" strokeWidth="2.8" />
    </Svg>
  );
}

function GlobeIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Circle cx="24" cy="24" r="16" stroke="#176BFF" strokeWidth="3" />
      <Path d="M8 24H40" stroke="#176BFF" strokeLinecap="round" strokeWidth="3" />
      <Path d="M24 8C29 12.6 31.5 17.9 31.5 24C31.5 30.1 29 35.4 24 40" stroke="#176BFF" strokeLinecap="round" strokeWidth="3" />
      <Path d="M24 8C19 12.6 16.5 17.9 16.5 24C16.5 30.1 19 35.4 24 40" stroke="#176BFF" strokeLinecap="round" strokeWidth="3" />
    </Svg>
  );
}

function LockIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Rect height="19" rx="3.5" stroke="#6A52FF" strokeWidth="3" width="26" x="11" y="21" />
      <Path d="M17 21V15C17 11.1 20.1 8 24 8C27.9 8 31 11.1 31 15V21" stroke="#6A52FF" strokeLinecap="round" strokeWidth="3" />
      <Path d="M24 28V33" stroke="#6A52FF" strokeLinecap="round" strokeWidth="3" />
    </Svg>
  );
}

function ImportIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
      <Path d="M22 8V27" stroke="#090A12" strokeLinecap="round" strokeWidth="2.8" />
      <Path d="M15 20L22 27L29 20" stroke="#090A12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8" />
      <Path d="M11 33V36H33V33" stroke="#090A12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8" />
    </Svg>
  );
}

function TrashIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Path d="M13 16H35" stroke="#FF2D20" strokeLinecap="round" strokeWidth="3" />
      <Path d="M19 16V11H29V16" stroke="#FF2D20" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      <Rect height="24" rx="2.5" stroke="#FF2D20" strokeWidth="3" width="16" x="16" y="16" />
      <Path d="M21 22V34" stroke="#FF2D20" strokeLinecap="round" strokeWidth="2.6" />
      <Path d="M27 22V34" stroke="#FF2D20" strokeLinecap="round" strokeWidth="2.6" />
    </Svg>
  );
}
