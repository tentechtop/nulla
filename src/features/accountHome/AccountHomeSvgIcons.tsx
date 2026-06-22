import Svg, { Circle, Path, Rect } from 'react-native-svg';

type SvgIconProps = {
  readonly size: number;
};

export type WalletIconKey = 'addressQr' | 'backupKey' | 'switchAccount' | 'walletCurrent';
export type SecurityIconKey = 'clear' | 'confirm' | 'lock' | 'sign';

export function CardCopyAddressIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Rect fill="#0B0D12" fillOpacity="0.42" height="40" rx="8" stroke="#FFFFFF" strokeOpacity="0.38" strokeWidth="1.4" width="40" x="4" y="4" />
      <Rect height="20" rx="2.5" stroke="#FFFFFF" strokeWidth="2.4" width="13" x="20" y="12" />
      <Path d="M15 18V34C15 35.1 15.9 36 17 36H28" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
      <Path d="M15 18C15 16.9 15.9 16 17 16H20" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="2.4" />
    </Svg>
  );
}

export function CardAddressQrIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Rect fill="#0B0D12" fillOpacity="0.42" height="40" rx="8" stroke="#FFFFFF" strokeOpacity="0.38" strokeWidth="1.4" width="40" x="4" y="4" />
      <Rect height="8" rx="1.2" stroke="#FFFFFF" strokeWidth="2.4" width="8" x="13" y="13" />
      <Rect height="8" rx="1.2" stroke="#FFFFFF" strokeWidth="2.4" width="8" x="27" y="13" />
      <Rect height="8" rx="1.2" stroke="#FFFFFF" strokeWidth="2.4" width="8" x="13" y="27" />
      <Path d="M27 27H31V31H27V27Z" stroke="#FFFFFF" strokeLinejoin="round" strokeWidth="2.4" />
      <Path d="M35 27V35H27" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" />
      <Path d="M31 35H35" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="2.4" />
    </Svg>
  );
}

export function CardUnlockBadgeIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Rect fill="#20C478" height="15" rx="3" width="17" x="8" y="13" />
      <Path d="M12 13V9.8C12 7.4 13.9 5.5 16.3 5.5C18 5.5 19.5 6.5 20.2 8" stroke="#20C478" strokeLinecap="round" strokeWidth="2.6" />
      <Path d="M16.5 18V22" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="2.4" />
    </Svg>
  );
}

export function WalletRowIcon({ iconKey, size }: SvgIconProps & { readonly iconKey: WalletIconKey }) {
  if (iconKey === 'switchAccount') {
    return <AccountSwitchIcon size={size} />;
  }

  if (iconKey === 'addressQr') {
    return <AddressQrIcon size={size} />;
  }

  if (iconKey === 'backupKey') {
    return <BackupKeyIcon size={size} />;
  }

  return <WalletCurrentIcon size={size} />;
}

export function SecurityRowIcon({ iconKey, size }: SvgIconProps & { readonly iconKey: SecurityIconKey }) {
  if (iconKey === 'confirm') {
    return <SecurityConfirmIcon size={size} />;
  }

  if (iconKey === 'lock') {
    return <SecurityLockIcon size={size} />;
  }

  if (iconKey === 'clear') {
    return <SecurityClearIcon size={size} />;
  }

  return <SecuritySignIcon size={size} />;
}

function WalletCurrentIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
      <Path d="M10 13H32C34.2 13 36 14.8 36 17V32C36 34.2 34.2 36 32 36H10C7.8 36 6 34.2 6 32V16C6 14.3 7.3 13 9 13H31" stroke="#6A52FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8" />
      <Path d="M12 13V9C12 7.9 12.9 7 14 7H32" stroke="#6A52FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8" />
      <Path d="M29 23H38V30H29C27.1 30 25.5 28.4 25.5 26.5C25.5 24.6 27.1 23 29 23Z" stroke="#6A52FF" strokeLinejoin="round" strokeWidth="2.8" />
      <Circle cx="30.5" cy="26.5" fill="#6A52FF" r="1.5" />
    </Svg>
  );
}

function AccountSwitchIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
      <Circle cx="20" cy="15" r="6" stroke="#176BFF" strokeWidth="2.8" />
      <Path d="M8 34C10.5 26.8 14.5 23.2 20 23.2C25.5 23.2 29.5 26.8 32 34" stroke="#176BFF" strokeLinecap="round" strokeWidth="2.8" />
      <Path d="M32 10V18" stroke="#176BFF" strokeLinecap="round" strokeWidth="2.6" />
      <Path d="M28 14H36" stroke="#176BFF" strokeLinecap="round" strokeWidth="2.6" />
    </Svg>
  );
}

function AddressQrIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
      <Rect height="9" rx="1" stroke="#176BFF" strokeWidth="2.8" width="9" x="8" y="8" />
      <Rect height="9" rx="1" stroke="#176BFF" strokeWidth="2.8" width="9" x="27" y="8" />
      <Rect height="9" rx="1" stroke="#176BFF" strokeWidth="2.8" width="9" x="8" y="27" />
      <Path d="M27 27H31V31H27V27Z" stroke="#176BFF" strokeLinejoin="round" strokeWidth="2.8" />
      <Path d="M35 27V36H27" stroke="#176BFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8" />
      <Path d="M21 8V17" stroke="#176BFF" strokeLinecap="round" strokeWidth="2.8" />
      <Path d="M21 27V36" stroke="#176BFF" strokeLinecap="round" strokeWidth="2.8" />
    </Svg>
  );
}

function BackupKeyIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
      <Circle cx="15" cy="28" r="7" stroke="#6A52FF" strokeWidth="2.8" />
      <Path d="M20 23L35 8" stroke="#6A52FF" strokeLinecap="round" strokeWidth="2.8" />
      <Path d="M30 13L35 18" stroke="#6A52FF" strokeLinecap="round" strokeWidth="2.8" />
      <Path d="M26 17L30 21" stroke="#6A52FF" strokeLinecap="round" strokeWidth="2.8" />
    </Svg>
  );
}

export function RpcGlobeIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 64 64" width={size}>
      <Circle cx="32" cy="32" r="23" stroke="#286DFF" strokeWidth="3.4" />
      <Path d="M9 32H55" stroke="#286DFF" strokeLinecap="round" strokeWidth="3.4" />
      <Path d="M32 9C39 15.2 42.5 22.8 42.5 32C42.5 41.2 39 48.8 32 55" stroke="#286DFF" strokeLinecap="round" strokeWidth="3.4" />
      <Path d="M32 9C25 15.2 21.5 22.8 21.5 32C21.5 41.2 25 48.8 32 55" stroke="#286DFF" strokeLinecap="round" strokeWidth="3.4" />
      <Path d="M14 22H50" stroke="#286DFF" strokeLinecap="round" strokeWidth="3.2" />
      <Path d="M14 42H50" stroke="#286DFF" strokeLinecap="round" strokeWidth="3.2" />
    </Svg>
  );
}

function SecuritySignIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 40 40" width={size}>
      <Path d="M20 5L32 10.3V20C32 28.8 26.8 34.3 20 37C13.2 34.3 8 28.8 8 20V10.3L20 5Z" stroke="#6A52FF" strokeLinejoin="round" strokeWidth="2.6" />
      <Path d="M15 23L25 13" stroke="#6A52FF" strokeLinecap="round" strokeWidth="2.6" />
    </Svg>
  );
}

function SecurityConfirmIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 40 40" width={size}>
      <Path d="M20 5L32 10.3V20C32 28.8 26.8 34.3 20 37C13.2 34.3 8 28.8 8 20V10.3L20 5Z" stroke="#176BFF" strokeLinejoin="round" strokeWidth="2.6" />
      <Path d="M14.8 20.5L18.4 24.1L25.8 16.6" stroke="#176BFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8" />
    </Svg>
  );
}

function SecurityLockIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 40 40" width={size}>
      <Rect height="17" rx="3" stroke="#176BFF" strokeWidth="2.8" width="22" x="9" y="17" />
      <Path d="M14 17V12C14 8.7 16.7 6 20 6C23.3 6 26 8.7 26 12V17" stroke="#176BFF" strokeLinecap="round" strokeWidth="2.8" />
      <Path d="M20 23V27" stroke="#176BFF" strokeLinecap="round" strokeWidth="2.8" />
    </Svg>
  );
}

function SecurityClearIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 40 40" width={size}>
      <Path d="M11 13H29" stroke="#FF9500" strokeLinecap="round" strokeWidth="2.8" />
      <Path d="M16 13V9H24V13" stroke="#FF9500" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8" />
      <Rect height="21" rx="2" stroke="#FF9500" strokeWidth="2.8" width="14" x="13" y="13" />
      <Path d="M18 18V29" stroke="#FF9500" strokeLinecap="round" strokeWidth="2.4" />
      <Path d="M22 18V29" stroke="#FF9500" strokeLinecap="round" strokeWidth="2.4" />
    </Svg>
  );
}

export function ChevronRightIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Path d="M12 7L21 16L12 25" stroke="#9BA0AA" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8" />
    </Svg>
  );
}

export function LogoutIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Path d="M20 12H12C10.9 12 10 12.9 10 14V34C10 35.1 10.9 36 12 36H20" stroke="#FF3B30" strokeLinecap="round" strokeWidth="3" />
      <Path d="M22 24H38" stroke="#FF3B30" strokeLinecap="round" strokeWidth="3" />
      <Path d="M32 18L38 24L32 30" stroke="#FF3B30" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
    </Svg>
  );
}
