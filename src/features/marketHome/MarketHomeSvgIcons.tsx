import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

type SvgIconProps = {
  readonly size: number;
};

export type MarketActionIconKey = 'futures' | 'orderBook' | 'stockTrade' | 'swap';
export type MarketAssetIconKey = 'AAPLx' | 'BTC' | 'ETH' | 'NAS100' | 'SOL' | 'XAUx';
export type MarketCategoryIconKey = 'cfd' | 'crypto' | 'futures' | 'metal' | 'stockToken';

export function SearchIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
      <Circle cx="19" cy="19" r="11" stroke="#5F6675" strokeWidth="3" />
      <Path d="M27 27L36 36" stroke="#5F6675" strokeLinecap="round" strokeWidth="3" />
    </Svg>
  );
}

export function FilterIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
      <Path d="M8 10H36L25 22.5V33L19 36V22.5L8 10Z" stroke="#5F6675" strokeLinejoin="round" strokeWidth="3" />
    </Svg>
  );
}

export function MarketCategoryIcon({ iconKey, size }: SvgIconProps & { readonly iconKey: MarketCategoryIconKey }) {
  if (iconKey === 'crypto') {
    return <CryptoCategoryIcon size={size} />;
  }

  if (iconKey === 'futures') {
    return <FuturesCategoryIcon size={size} />;
  }

  if (iconKey === 'metal') {
    return <MetalCategoryIcon size={size} />;
  }

  if (iconKey === 'cfd') {
    return <CfdCategoryIcon size={size} />;
  }

  return <StockTokenCategoryIcon size={size} />;
}

export function MarketAssetIcon({ iconKey, size }: SvgIconProps & { readonly iconKey: MarketAssetIconKey }) {
  if (iconKey === 'AAPLx') {
    return <AppleStockIcon size={size} />;
  }

  if (iconKey === 'BTC') {
    return <BitcoinIcon size={size} />;
  }

  if (iconKey === 'ETH') {
    return <EthereumIcon size={size} />;
  }

  if (iconKey === 'NAS100') {
    return <NasdaqIcon size={size} />;
  }

  if (iconKey === 'XAUx') {
    return <GoldIcon size={size} />;
  }

  return <SolanaTokenIcon size={size} />;
}

export function MarketActionIcon({ iconKey, size }: SvgIconProps & { readonly iconKey: MarketActionIconKey }) {
  if (iconKey === 'stockTrade') {
    return <StockTradeIcon size={size} />;
  }

  if (iconKey === 'futures') {
    return <FuturesActionIcon size={size} />;
  }

  if (iconKey === 'orderBook') {
    return <OrderBookIcon size={size} />;
  }

  return <SwapIcon size={size} />;
}

export function ChevronRightIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 40 40" width={size}>
      <Path d="M15 10L25 20L15 30" stroke="#8A8F9E" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.6" />
    </Svg>
  );
}

export function ListMenuIcon({ size }: SvgIconProps) {
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

function CryptoCategoryIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
      <Rect fill="#050507" height="52" rx="14" width="52" x="2" y="2" />
      <Defs>
        <LinearGradient gradientUnits="userSpaceOnUse" id="marketCategoryCryptoGradient" x1="17" x2="42" y1="18" y2="38">
          <Stop stopColor="#20F3C4" />
          <Stop offset="0.5" stopColor="#2F7BFF" />
          <Stop offset="1" stopColor="#9A3DFF" />
        </LinearGradient>
      </Defs>
      <Path d="M20.5 17H42L36.5 23.5H15L20.5 17Z" fill="url(#marketCategoryCryptoGradient)" />
      <Path d="M15 25.5H36.5L42 32H20.5L15 25.5Z" fill="url(#marketCategoryCryptoGradient)" />
      <Path d="M20.5 34H42L36.5 40.5H15L20.5 34Z" fill="url(#marketCategoryCryptoGradient)" />
    </Svg>
  );
}

function StockTokenCategoryIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 40 40" width={size}>
      <Circle cx="20" cy="20" fill="#EEF3FF" r="16" />
      <Path d="M11 24C13.5 18 17.2 16 21.8 20C25.1 22.9 27.8 22.7 31 17" stroke="#4F5CFF" strokeLinecap="round" strokeWidth="3" />
      <Circle cx="11" cy="24" fill="#4F5CFF" r="2.2" />
      <Circle cx="31" cy="17" fill="#4F5CFF" r="2.2" />
    </Svg>
  );
}

function CfdCategoryIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 40 40" width={size}>
      <Circle cx="20" cy="20" fill="#EEF3FF" r="16" />
      <Path d="M11 24C13.5 18 17.2 16 21.8 20C25.1 22.9 27.8 22.7 31 17" stroke="#6A52FF" strokeLinecap="round" strokeWidth="3" />
      <Circle cx="11" cy="24" fill="#6A52FF" r="2.2" />
      <Circle cx="31" cy="17" fill="#6A52FF" r="2.2" />
    </Svg>
  );
}

function FuturesCategoryIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
      <Path d="M12 33V24" stroke="#176BFF" strokeLinecap="round" strokeWidth="3.2" />
      <Path d="M20 33V14" stroke="#176BFF" strokeLinecap="round" strokeWidth="3.2" />
      <Path d="M28 33V20" stroke="#6A52FF" strokeLinecap="round" strokeWidth="3.2" />
      <Path d="M36 33V10" stroke="#6A52FF" strokeLinecap="round" strokeWidth="3.2" />
    </Svg>
  );
}

function MetalCategoryIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
      <Path d="M22 9L31 24H13L22 9Z" stroke="#E0A91B" strokeLinejoin="round" strokeWidth="3" />
      <Path d="M12 24H32L36 35H8L12 24Z" stroke="#E0A91B" strokeLinejoin="round" strokeWidth="3" />
      <Path d="M18 24L16 35" stroke="#E0A91B" strokeWidth="2.4" />
      <Path d="M26 24L28 35" stroke="#E0A91B" strokeWidth="2.4" />
    </Svg>
  );
}

function AppleStockIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 72 72" width={size}>
      <Rect fill="#0B0D12" height="68" rx="14" stroke="#54617A" strokeWidth="2" width="68" x="2" y="2" />
      <Path
        d="M46.2 33.4C46.1 28.8 49.9 26.4 50.1 26.2C47.9 23 44.5 22.6 43.3 22.5C40.4 22.2 37.7 24.2 36.2 24.2C34.7 24.2 32.3 22.5 29.8 22.6C26.5 22.7 23.4 24.5 21.7 27.4C18.2 33.4 20.8 42.3 24.2 47.2C25.8 49.6 27.8 52.2 30.4 52.1C32.9 52 33.8 50.5 36.8 50.5C39.8 50.5 40.6 52.1 43.2 52.1C45.9 52 47.6 49.7 49.2 47.3C51.1 44.6 51.8 41.9 51.8 41.8C51.7 41.8 46.3 39.7 46.2 33.4Z"
        fill="#FFFFFF"
      />
      <Path
        d="M41.4 19.4C42.8 17.8 43.7 15.6 43.4 13.5C41.4 13.6 39 14.9 37.6 16.5C36.3 18 35.2 20.3 35.6 22.3C37.8 22.5 40 21.1 41.4 19.4Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}

function BitcoinIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
      <Circle cx="28" cy="28" fill="#FF9500" r="28" />
      <Path
        d="M33.6 16.7C38 18.2 38.7 24 35.1 26.2C39.9 27.6 39.6 35.5 34.2 37.1L33.1 42H29.8L30.8 37.5H27.9L26.9 42H23.6L24.6 37.5H19L19.7 34.4H22.5L25.3 21.8H22.5L23.2 18.8H28.7L29.7 14H33L32 18.8H34.3L35.3 14H38.6L37.5 19C36.4 18.1 35.2 17.4 33.6 16.7ZM28.5 29.1L27.3 34.4H32.3C35 34.4 35.6 29.1 32.1 29.1H28.5ZM30.1 21.8L29 26.4H33.1C35.7 26.4 36 21.8 32.7 21.8H30.1Z"
        fill="#FFFFFF"
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
        <LinearGradient gradientUnits="userSpaceOnUse" id="marketSolTopBar" x1="17" x2="42" y1="19" y2="19">
          <Stop stopColor="#20F3C4" />
          <Stop offset="1" stopColor="#1B8DFF" />
        </LinearGradient>
        <LinearGradient gradientUnits="userSpaceOnUse" id="marketSolMiddleBar" x1="17" x2="42" y1="28" y2="28">
          <Stop stopColor="#218CFF" />
          <Stop offset="1" stopColor="#465AFF" />
        </LinearGradient>
        <LinearGradient gradientUnits="userSpaceOnUse" id="marketSolBottomBar" x1="17" x2="42" y1="37" y2="37">
          <Stop stopColor="#336DFF" />
          <Stop offset="1" stopColor="#8D43FF" />
        </LinearGradient>
      </Defs>
      <Path d="M20.5 18H42L36.5 24.5H15L20.5 18Z" fill="url(#marketSolTopBar)" />
      <Path d="M15 26.5H36.5L42 33H20.5L15 26.5Z" fill="url(#marketSolMiddleBar)" />
      <Path d="M20.5 35H42L36.5 41.5H15L20.5 35Z" fill="url(#marketSolBottomBar)" />
    </Svg>
  );
}

function GoldIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
      <Circle cx="28" cy="28" fill="#E1B52C" r="28" />
      <Path d="M28 14L38 30H18L28 14Z" stroke="#FFFFFF" strokeLinejoin="round" strokeWidth="3.2" />
      <Path d="M17 30H39L43 42H13L17 30Z" stroke="#FFFFFF" strokeLinejoin="round" strokeWidth="3.2" />
      <Path d="M24 30L22 42" stroke="#FFFFFF" strokeWidth="2.6" />
      <Path d="M32 30L34 42" stroke="#FFFFFF" strokeWidth="2.6" />
    </Svg>
  );
}

function NasdaqIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 56 56" width={size}>
      <Defs>
        <LinearGradient gradientUnits="userSpaceOnUse" id="marketNasdaqGradient" x1="8" x2="48" y1="8" y2="48">
          <Stop stopColor="#1BA8FF" />
          <Stop offset="1" stopColor="#2F5BFF" />
        </LinearGradient>
      </Defs>
      <Circle cx="28" cy="28" fill="url(#marketNasdaqGradient)" r="28" />
      <SvgText fill="#FFFFFF" fontFamily="Arial, Helvetica, sans-serif" fontSize="20" fontWeight="800" textAnchor="middle" x="28" y="36">
        100
      </SvgText>
    </Svg>
  );
}

function SwapIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 64 64" width={size}>
      <Defs>
        <LinearGradient gradientUnits="userSpaceOnUse" id="marketSwapGradient" x1="15" x2="49" y1="16" y2="48">
          <Stop stopColor="#176BFF" />
          <Stop offset="1" stopColor="#8B3DFF" />
        </LinearGradient>
      </Defs>
      <Path d="M17 23H46" stroke="url(#marketSwapGradient)" strokeLinecap="round" strokeWidth="3.8" />
      <Path d="M37 14L46 23L37 32" stroke="url(#marketSwapGradient)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.8" />
      <Path d="M47 41H18" stroke="url(#marketSwapGradient)" strokeLinecap="round" strokeWidth="3.8" />
      <Path d="M27 32L18 41L27 50" stroke="url(#marketSwapGradient)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.8" />
    </Svg>
  );
}

function StockTradeIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 64 64" width={size}>
      <Defs>
        <LinearGradient gradientUnits="userSpaceOnUse" id="marketChartGradient" x1="16" x2="48" y1="48" y2="16">
          <Stop stopColor="#176BFF" />
          <Stop offset="1" stopColor="#4F7DFF" />
        </LinearGradient>
      </Defs>
      <Path d="M16 47L27 36L35 42L48 24" stroke="url(#marketChartGradient)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.8" />
      <Path d="M39 24H48V33" stroke="url(#marketChartGradient)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.8" />
      <Path d="M18 18H24" stroke="#8B3DFF" strokeLinecap="round" strokeWidth="3.4" />
      <Path d="M18 26H30" stroke="#8B3DFF" strokeLinecap="round" strokeWidth="3.4" />
    </Svg>
  );
}

function FuturesActionIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 64 64" width={size}>
      <Path d="M20 48V24" stroke="#176BFF" strokeLinecap="round" strokeWidth="3.6" />
      <Path d="M30 48V16" stroke="#176BFF" strokeLinecap="round" strokeWidth="3.6" />
      <Path d="M42 48V28" stroke="#6A52FF" strokeLinecap="round" strokeWidth="3.6" />
      <Path d="M16 24H24" stroke="#176BFF" strokeLinecap="round" strokeWidth="3.6" />
      <Path d="M26 16H34" stroke="#176BFF" strokeLinecap="round" strokeWidth="3.6" />
      <Path d="M38 28H46" stroke="#6A52FF" strokeLinecap="round" strokeWidth="3.6" />
    </Svg>
  );
}

function OrderBookIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 64 64" width={size}>
      <Path d="M20 10H40L50 20V52C50 53.1 49.1 54 48 54H20C18.9 54 18 53.1 18 52V12C18 10.9 18.9 10 20 10Z" stroke="#176BFF" strokeLinejoin="round" strokeWidth="3.4" />
      <Path d="M40 10V20H50" stroke="#176BFF" strokeLinejoin="round" strokeWidth="3.4" />
      <Path d="M25 29H43" stroke="#050505" strokeLinecap="round" strokeWidth="3" />
      <Path d="M25 38H43" stroke="#050505" strokeLinecap="round" strokeWidth="3" />
      <Path d="M25 47H36" stroke="#050505" strokeLinecap="round" strokeWidth="3" />
    </Svg>
  );
}
