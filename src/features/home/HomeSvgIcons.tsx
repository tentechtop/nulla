import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop
} from 'react-native-svg';
import type { MarketRow, StatusItem } from '../../data/home';

type SvgIconProps = {
  readonly size: number;
};

type MarketTokenSymbol = MarketRow['symbol'];
type StatusTitle = StatusItem['title'];

export function MarketTokenIcon({ size, symbol }: SvgIconProps & { readonly symbol: MarketTokenSymbol }) {
  if (symbol === 'BTC') {
    return <BitcoinIcon size={size} />;
  }

  if (symbol === 'ETH') {
    return <EthereumIcon size={size} />;
  }

  if (symbol === 'SOL') {
    return <SolanaTokenIcon size={size} />;
  }

  if (symbol === 'XRP') {
    return <XrpIcon size={size} />;
  }

  return <WorldcoinIcon size={size} />;
}

export function StatusSvgIcon({ size, title }: SvgIconProps & { readonly title: StatusTitle }) {
  if (title === '节点连接') {
    return <NodeStatusIcon size={size} />;
  }

  if (title === '验证者') {
    return <ValidatorStatusIcon size={size} />;
  }

  if (title === '隐私账户') {
    return <PrivateAccountStatusIcon size={size} />;
  }

  return <NetworkStatusIcon size={size} />;
}

export function ListMenuSvgIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 40 40" width={size}>
      <Path d="M15 10H34" stroke="#6B7280" strokeLinecap="round" strokeWidth="3" />
      <Path d="M15 20H34" stroke="#6B7280" strokeLinecap="round" strokeWidth="3" />
      <Path d="M15 30H34" stroke="#6B7280" strokeLinecap="round" strokeWidth="3" />
      <Circle cx="7" cy="10" fill="#6B7280" r="2" />
      <Circle cx="7" cy="20" fill="#6B7280" r="2" />
      <Circle cx="7" cy="30" fill="#6B7280" r="2" />
    </Svg>
  );
}

function BitcoinIcon({ size }: SvgIconProps) {
  return (
    <Svg height={size} viewBox="0 0 1024 1024" width={size}>
      <Path
        d="M556.96 535.04L465.12 512l-26.56 106.4L528 640a57.92 57.92 0 0 0 64-40.48 50.72 50.72 0 0 0-35.04-64.48z"
        fill="#F79A28"
      />
      <Path
        d="M512 73.28A438.72 438.72 0 1 0 950.72 512 438.72 438.72 0 0 0 512 73.28z m192.96 372c-8.96 53.92-66.56 71.84-66.56 71.84a102.88 102.88 0 0 1 47.04 118.56c-20.8 83.36-115.04 82.4-139.84 76.16l-37.44-9.44-20 80-49.6-12.48 20-80-32-8-20 80-52-13.12 20-80-97.76-24.32 13.76-55.2 52.96 13.12c4.64 1.28 5.12 0 5.92-4.16s64-256 64-257.76 1.28-4.8-4.32-6.24L353.6 320l12.48-49.76 100.96 25.28 20.8-83.84 48 12-20.8 83.84 38.08 9.44 20.96-83.68 48 11.84-20.96 84.48a256 256 0 0 1 53.6 23.36c21.12 13.76 59.04 38.56 50.24 92.32z"
        fill="#F79A28"
      />
      <Path
        d="M561.44 372.64l-59.2-14.88-25.28 101.44 64.8 16A53.28 53.28 0 0 0 608 438.08c10.56-42.56-36.48-63.04-46.56-65.44z"
        fill="#F79A28"
      />
    </Svg>
  );
}

function EthereumIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
      <Circle cx="28" cy="28" fill="#E7E9EE" r="28" />
      <Path d="M28 7L16 28L28 22.4L40 28L28 7Z" fill="#2D2F36" />
      <Path d="M16 30.2L28 49L40 30.2L28 36.9L16 30.2Z" fill="#20232A" />
      <Path d="M28 22.4L16 28L28 35L40 28L28 22.4Z" fill="#797F8C" />
    </Svg>
  );
}

function SolanaTokenIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
      <Circle cx="28" cy="28" fill="#050507" r="28" />
      <Defs>
        <LinearGradient gradientUnits="userSpaceOnUse" id="tokenSolTop" x1="17" x2="42" y1="19" y2="19">
          <Stop stopColor="#20F3C4" />
          <Stop offset="1" stopColor="#1B8DFF" />
        </LinearGradient>
        <LinearGradient gradientUnits="userSpaceOnUse" id="tokenSolMiddle" x1="17" x2="42" y1="28" y2="28">
          <Stop stopColor="#218CFF" />
          <Stop offset="1" stopColor="#465AFF" />
        </LinearGradient>
        <LinearGradient gradientUnits="userSpaceOnUse" id="tokenSolBottom" x1="17" x2="42" y1="37" y2="37">
          <Stop stopColor="#336DFF" />
          <Stop offset="1" stopColor="#8D43FF" />
        </LinearGradient>
      </Defs>
      <Path d="M20.5 18H42L36.5 24.5H15L20.5 18Z" fill="url(#tokenSolTop)" />
      <Path d="M15 26.5H36.5L42 33H20.5L15 26.5Z" fill="url(#tokenSolMiddle)" />
      <Path d="M20.5 35H42L36.5 41.5H15L20.5 35Z" fill="url(#tokenSolBottom)" />
    </Svg>
  );
}

function XrpIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
      <Circle cx="28" cy="28" fill="#111111" r="28" />
      <Path
        d="M17 17.5C20.8 21.3 24.3 23.2 28 23.2C31.7 23.2 35.2 21.3 39 17.5"
        stroke="#FFFFFF"
        strokeLinecap="round"
        strokeWidth="3.8"
      />
      <Path
        d="M17 38.5C20.8 34.7 24.3 32.8 28 32.8C31.7 32.8 35.2 34.7 39 38.5"
        stroke="#FFFFFF"
        strokeLinecap="round"
        strokeWidth="3.8"
      />
    </Svg>
  );
}

function WorldcoinIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
      <Circle cx="28" cy="28" fill="#050505" r="28" />
      <Circle cx="28" cy="28" r="15" stroke="#FFFFFF" strokeWidth="5" />
      <Path d="M13 28H43" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="5" />
      <Path d="M20 19.5C25.4 23 30.6 23 36 19.5" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="3" />
      <Path d="M20 36.5C25.4 33 30.6 33 36 36.5" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="3" />
    </Svg>
  );
}

function NodeStatusIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Circle cx="16" cy="16" fill="#DCEAFF" r="13" />
      <Circle cx="16" cy="16" fill="#2F7BFF" r="8" />
      <Circle cx="16" cy="16" fill="#78A8FF" r="5" />
    </Svg>
  );
}

function ValidatorStatusIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Path d="M16 3L27 8V15.5C27 23.2 22.3 27.7 16 30C9.7 27.7 5 23.2 5 15.5V8L16 3Z" stroke="#17D976" strokeLinejoin="round" strokeWidth="2.6" />
      <Path d="M11.5 16.5L14.5 19.5L21 12.5" stroke="#17D976" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.6" />
    </Svg>
  );
}

function PrivateAccountStatusIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Rect height="13" rx="2" stroke="#8B3DFF" strokeWidth="2.8" width="16" x="8" y="14" />
      <Path d="M12 14V10C12 7.8 13.8 6 16 6C18.2 6 20 7.8 20 10V14" stroke="#8B3DFF" strokeLinecap="round" strokeWidth="2.8" />
      <Path d="M16 19V22" stroke="#8B3DFF" strokeLinecap="round" strokeWidth="2.8" />
    </Svg>
  );
}

function NetworkStatusIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Circle cx="16" cy="16" fill="#FF7A00" r="3" />
      <Circle cx="8" cy="7" r="3" stroke="#FF7A00" strokeWidth="2.4" />
      <Circle cx="24" cy="7" r="3" stroke="#FF7A00" strokeWidth="2.4" />
      <Circle cx="16" cy="27" r="3" stroke="#FF7A00" strokeWidth="2.4" />
      <Path d="M10.2 9.2L14 14M21.8 9.2L18 14M16 19V24" stroke="#FF7A00" strokeLinecap="round" strokeWidth="2.4" />
    </Svg>
  );
}
