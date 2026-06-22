import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText
} from 'react-native-svg';

type SvgIconProps = {
  readonly size: number;
};

export type ContractIconKey = 'coreNft' | 'pop' | 'privacyRouter' | 'stakingPool';

export function DeployContractIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 64 64" width={size}>
      <Defs>
        <LinearGradient gradientUnits="userSpaceOnUse" id="deployButton" x1="4" x2="60" y1="8" y2="56">
          <Stop stopColor="#27B4FF" />
          <Stop offset="1" stopColor="#A93DFF" />
        </LinearGradient>
      </Defs>
      <Rect fill="url(#deployButton)" height="48" rx="13" width="56" x="4" y="8" />
      <Path d="M32 19L44 26V40L32 47L20 40V26L32 19Z" stroke="#FFFFFF" strokeLinejoin="round" strokeWidth="2.8" />
      <Path d="M20.5 26.5L32 33.2L43.5 26.5" stroke="#FFFFFF" strokeLinejoin="round" strokeWidth="2.8" />
      <Path d="M32 33V46" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="2.8" />
    </Svg>
  );
}

export function SearchIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
      <Circle cx="19" cy="19" r="11" stroke="#7B8494" strokeWidth="3" />
      <Path d="M27 27L36 36" stroke="#7B8494" strokeLinecap="round" strokeWidth="3" />
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

export function ScanDeployIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Path d="M10 18V11C10 10.4 10.4 10 11 10H18" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="3" />
      <Path d="M30 10H37C37.6 10 38 10.4 38 11V18" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="3" />
      <Path d="M38 30V37C38 37.6 37.6 38 37 38H30" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="3" />
      <Path d="M18 38H11C10.4 38 10 37.6 10 37V30" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="3" />
      <Path d="M16 24H32" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="3" />
    </Svg>
  );
}

export function RefreshIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
      <Path
        d="M32.5 17.5C30.9 13.8 27.2 11.2 22.8 11.2C16.9 11.2 12.2 15.9 12.2 21.8C12.2 27.7 16.9 32.4 22.8 32.4C27 32.4 30.6 29.9 32.3 26.4"
        stroke="#050505"
        strokeLinecap="round"
        strokeWidth="3.2"
      />
      <Path d="M33 10.5V17.8H25.7" stroke="#050505" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />
    </Svg>
  );
}

export function ContractIcon({ iconKey, size }: SvgIconProps & { readonly iconKey: ContractIconKey }) {
  if (iconKey === 'coreNft') {
    return <CoreNftIcon size={size} />;
  }

  if (iconKey === 'stakingPool') {
    return <StakingPoolIcon size={size} />;
  }

  if (iconKey === 'privacyRouter') {
    return <PrivacyRouterIcon size={size} />;
  }

  return <PopContractIcon size={size} />;
}

function PopContractIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 96 96" width={size}>
      <Defs>
        <RadialGradient cx="0" cy="0" gradientTransform="translate(66 70) rotate(-138) scale(78)" gradientUnits="userSpaceOnUse" id="popBg" r="1">
          <Stop stopColor="#1E7BFF" />
          <Stop offset="0.43" stopColor="#070B20" />
          <Stop offset="1" stopColor="#020308" />
        </RadialGradient>
        <LinearGradient gradientUnits="userSpaceOnUse" id="popBubble" x1="16" x2="76" y1="76" y2="24">
          <Stop stopColor="#823DFF" />
          <Stop offset="0.55" stopColor="#167CFF" />
          <Stop offset="1" stopColor="#6EFFF1" />
        </LinearGradient>
      </Defs>
      <Rect fill="url(#popBg)" height="88" rx="16" width="88" x="4" y="4" />
      <SvgText fill="#9E62FF" fontFamily="Arial, Helvetica, sans-serif" fontSize="31" fontWeight="900" x="38" y="46">
        POP
      </SvgText>
      <Circle cx="27" cy="68" fill="url(#popBubble)" r="13" stroke="#9B63FF" strokeWidth="2" />
      <Circle cx="58" cy="72" fill="url(#popBubble)" r="14" stroke="#8B63FF" strokeWidth="2" />
      <Circle cx="73" cy="55" fill="url(#popBubble)" opacity="0.9" r="9" />
      <Circle cx="74" cy="22" fill="#536BFF" r="5" />
    </Svg>
  );
}

function CoreNftIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 96 96" width={size}>
      <Defs>
        <RadialGradient cx="0" cy="0" gradientTransform="translate(48 68) scale(70)" gradientUnits="userSpaceOnUse" id="coreBg" r="1">
          <Stop stopColor="#162B7A" />
          <Stop offset="1" stopColor="#020308" />
        </RadialGradient>
        <LinearGradient gradientUnits="userSpaceOnUse" id="coreCube" x1="24" x2="72" y1="26" y2="76">
          <Stop stopColor="#27F0FF" />
          <Stop offset="0.5" stopColor="#315BFF" />
          <Stop offset="1" stopColor="#B13DFF" />
        </LinearGradient>
      </Defs>
      <Rect fill="url(#coreBg)" height="88" rx="16" width="88" x="4" y="4" />
      <SvgText fill="#FFFFFF" fontFamily="Arial, Helvetica, sans-serif" fontSize="20" fontWeight="900" textAnchor="middle" x="48" y="25">
        CORE
      </SvgText>
      <Path d="M48 32L70 44V69L48 82L26 69V44L48 32Z" stroke="url(#coreCube)" strokeLinejoin="round" strokeWidth="2.8" />
      <Path d="M26 44L48 57L70 44" stroke="url(#coreCube)" strokeWidth="2.8" />
      <Path d="M48 57V82" stroke="url(#coreCube)" strokeWidth="2.8" />
      <Path d="M36 38L60 75M60 38L36 75" opacity="0.9" stroke="#7A3DFF" strokeWidth="1.8" />
    </Svg>
  );
}

function StakingPoolIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 96 96" width={size}>
      <Defs>
        <RadialGradient cx="0" cy="0" gradientTransform="translate(48 54) scale(64)" gradientUnits="userSpaceOnUse" id="stakingBg" r="1">
          <Stop stopColor="#10296A" />
          <Stop offset="1" stopColor="#020308" />
        </RadialGradient>
        <LinearGradient gradientUnits="userSpaceOnUse" id="stakingRing" x1="24" x2="72" y1="26" y2="80">
          <Stop stopColor="#16F4C2" />
          <Stop offset="0.5" stopColor="#236EFF" />
          <Stop offset="1" stopColor="#A83DFF" />
        </LinearGradient>
      </Defs>
      <Rect fill="url(#stakingBg)" height="88" rx="16" width="88" x="4" y="4" />
      <Ellipse cx="48" cy="30" rx="26" ry="8" stroke="url(#stakingRing)" strokeWidth="3" />
      <Path d="M22 30V60C22 64.4 33.6 68 48 68C62.4 68 74 64.4 74 60V30" stroke="url(#stakingRing)" strokeWidth="3" />
      <Ellipse cx="48" cy="45" opacity="0.9" rx="26" ry="8" stroke="#4C5CFF" strokeWidth="3" />
      <Ellipse cx="48" cy="60" opacity="0.9" rx="26" ry="8" stroke="#8B3DFF" strokeWidth="3" />
    </Svg>
  );
}

function PrivacyRouterIcon({ size }: SvgIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 96 96" width={size}>
      <Defs>
        <RadialGradient cx="0" cy="0" gradientTransform="translate(48 48) scale(70)" gradientUnits="userSpaceOnUse" id="privacyRouterBg" r="1">
          <Stop stopColor="#121A5E" />
          <Stop offset="1" stopColor="#020308" />
        </RadialGradient>
        <LinearGradient gradientUnits="userSpaceOnUse" id="privacyRouterShield" x1="24" x2="72" y1="16" y2="80">
          <Stop stopColor="#176BFF" />
          <Stop offset="1" stopColor="#A33DFF" />
        </LinearGradient>
      </Defs>
      <Rect fill="url(#privacyRouterBg)" height="88" rx="16" width="88" x="4" y="4" />
      <Path d="M48 16L74 27.5V48C74 65.6 63.5 76.4 48 84C32.5 76.4 22 65.6 22 48V27.5L48 16Z" stroke="url(#privacyRouterShield)" strokeLinejoin="round" strokeWidth="4" />
      <Rect fill="#10182C" height="22" rx="4" stroke="#6B57FF" strokeWidth="3" width="26" x="35" y="43" />
      <Path d="M40 43V37C40 32.6 43.6 29 48 29C52.4 29 56 32.6 56 37V43" stroke="#6B57FF" strokeLinecap="round" strokeWidth="3" />
      <Circle cx="48" cy="54" fill="#1C91FF" r="3" />
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
