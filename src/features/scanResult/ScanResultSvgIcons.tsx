import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText
} from 'react-native-svg';

type SquareIconProps = {
  readonly size: number;
};

type ScanFrameProps = {
  readonly size: number;
};

export function BackChevronIcon({ size }: SquareIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Path d="M30 11.5L17.5 24L30 36.5" stroke="#050505" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.5" />
    </Svg>
  );
}

export function HashVerifiedIcon({ size }: SquareIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 36 36" width={size}>
      <Path d="M18 4.5L28.5 9V17.1C28.5 24.8 24 29.4 18 32C12 29.4 7.5 24.8 7.5 17.1V9L18 4.5Z" stroke="#28B36B" strokeLinejoin="round" strokeWidth="2.6" />
      <Path d="M13.2 18.1L16.4 21.3L23.1 14.7" stroke="#28B36B" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.8" />
    </Svg>
  );
}

export function CopyContentIcon({ size }: SquareIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
      <Rect height="17" rx="3" stroke="#050505" strokeWidth="3" width="17" x="15" y="10" />
      <Path d="M12 17H10C8.9 17 8 17.9 8 19V34C8 35.1 8.9 36 10 36H25C26.1 36 27 35.1 27 34V32" stroke="#050505" strokeLinecap="round" strokeWidth="3" />
    </Svg>
  );
}

export function RescanIcon({ size }: SquareIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
      <Path d="M32.5 17.5C30.9 13.8 27.2 11.2 22.8 11.2C16.9 11.2 12.2 15.9 12.2 21.8C12.2 27.7 16.9 32.4 22.8 32.4C27 32.4 30.6 29.9 32.3 26.4" stroke="#050505" strokeLinecap="round" strokeWidth="3.2" />
      <Path d="M33 10.5V17.8H25.7" stroke="#050505" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />
    </Svg>
  );
}

export function ImageLibraryIcon({ size }: SquareIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
      <Rect height="25" rx="5.5" stroke="#FFFFFF" strokeWidth="3" width="29" x="7.5" y="9.5" />
      <Circle cx="29" cy="17" fill="#FFFFFF" r="3" />
      <Path d="M10 31L18.2 22.8C19.3 21.7 21 21.7 22.1 22.8L26.2 26.9L28.2 24.9C29.2 23.9 30.8 23.9 31.8 24.9L36 29.1" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
    </Svg>
  );
}

export function PopTokenIcon({ size }: SquareIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 96 96" width={size}>
      <Defs>
        <SvgLinearGradient gradientUnits="userSpaceOnUse" id="scanResultPopCard" x1="10" x2="86" y1="10" y2="86">
          <Stop stopColor="#6EA8FF" />
          <Stop offset="0.45" stopColor="#F064C8" />
          <Stop offset="1" stopColor="#FFE36E" />
        </SvgLinearGradient>
        <RadialGradient cx="0" cy="0" gradientTransform="translate(31 30) rotate(45) scale(55)" gradientUnits="userSpaceOnUse" id="scanResultPopGlow" r="1">
          <Stop stopColor="#8FFFF1" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Rect fill="url(#scanResultPopCard)" height="88" rx="18" width="88" x="4" y="4" />
      <Rect fill="url(#scanResultPopGlow)" height="88" opacity="0.65" rx="18" width="88" x="4" y="4" />
      <Circle cx="68" cy="28" fill="#6DF0E7" opacity="0.9" r="6" />
      <Circle cx="22" cy="32" fill="#7BF4E8" opacity="0.75" r="5" />
      <Circle cx="78" cy="62" fill="#8A5CFF" opacity="0.7" r="4" />
      <SvgText
        fill="#FFFFFF"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="31"
        fontWeight="900"
        letterSpacing="0"
        stroke="#FF6D86"
        strokeWidth="2.2"
        textAnchor="middle"
        x="48"
        y="59"
      >
        POP
      </SvgText>
    </Svg>
  );
}

export function SolAddressResultIcon({ size }: SquareIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 96 96" width={size}>
      <Defs>
        <SvgLinearGradient gradientUnits="userSpaceOnUse" id="scanResultAddressBg" x1="16" x2="80" y1="14" y2="82">
          <Stop stopColor="#24E0CF" />
          <Stop offset="0.48" stopColor="#326CFF" />
          <Stop offset="1" stopColor="#8A46FF" />
        </SvgLinearGradient>
        <SvgLinearGradient gradientUnits="userSpaceOnUse" id="scanResultAddressBars" x1="28" x2="70" y1="30" y2="66">
          <Stop stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#DDE7FF" />
        </SvgLinearGradient>
      </Defs>
      <Rect fill="url(#scanResultAddressBg)" height="76" rx="22" width="76" x="10" y="10" />
      <Path d="M31 32H68L62 39H25L31 32Z" fill="url(#scanResultAddressBars)" />
      <Path d="M25 45H62L68 52H31L25 45Z" fill="url(#scanResultAddressBars)" opacity="0.92" />
      <Path d="M31 58H68L62 65H25L31 58Z" fill="url(#scanResultAddressBars)" opacity="0.84" />
      <Circle cx="68" cy="25" fill="#5EF2DD" r="5" />
      <Circle cx="27" cy="71" fill="#9B67FF" r="4.5" />
    </Svg>
  );
}

export function DeployRequestResultIcon({ size }: SquareIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 96 96" width={size}>
      <Defs>
        <SvgLinearGradient gradientUnits="userSpaceOnUse" id="scanResultDeployBg" x1="17" x2="79" y1="14" y2="82">
          <Stop stopColor="#8B3DFF" />
          <Stop offset="0.55" stopColor="#3D63FF" />
          <Stop offset="1" stopColor="#11C7D6" />
        </SvgLinearGradient>
      </Defs>
      <Rect fill="url(#scanResultDeployBg)" height="76" rx="22" width="76" x="10" y="10" />
      <Path d="M35 38L25 48L35 58" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
      <Path d="M61 38L71 48L61 58" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
      <Path d="M55 31L41 65" stroke="#DDFDFF" strokeLinecap="round" strokeWidth="5" />
      <Circle cx="70" cy="25" fill="#68F1E7" r="5" />
    </Svg>
  );
}

export function TransferRequestResultIcon({ size }: SquareIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 96 96" width={size}>
      <Defs>
        <SvgLinearGradient gradientUnits="userSpaceOnUse" id="scanResultTransferBg" x1="16" x2="80" y1="16" y2="80">
          <Stop stopColor="#18C87A" />
          <Stop offset="0.52" stopColor="#2F82FF" />
          <Stop offset="1" stopColor="#7652FF" />
        </SvgLinearGradient>
      </Defs>
      <Rect fill="url(#scanResultTransferBg)" height="76" rx="22" width="76" x="10" y="10" />
      <Path d="M28 38H61" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="5" />
      <Path d="M55 30L63 38L55 46" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
      <Path d="M68 59H35" stroke="#DDFDFF" strokeLinecap="round" strokeWidth="5" />
      <Path d="M41 51L33 59L41 67" stroke="#DDFDFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
    </Svg>
  );
}

export function UnknownScanResultIcon({ size }: SquareIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 96 96" width={size}>
      <Defs>
        <SvgLinearGradient gradientUnits="userSpaceOnUse" id="scanResultUnknownBg" x1="14" x2="82" y1="14" y2="82">
          <Stop stopColor="#697386" />
          <Stop offset="1" stopColor="#252B3A" />
        </SvgLinearGradient>
      </Defs>
      <Rect fill="url(#scanResultUnknownBg)" height="76" rx="22" width="76" x="10" y="10" />
      <Path d="M40 34L28 48L40 62" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
      <Path d="M56 34L68 48L56 62" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5" />
      <Path d="M53 30L43 66" stroke="#C8D0DF" strokeLinecap="round" strokeWidth="5" />
    </Svg>
  );
}

export function ValidatorPairingIcon({ size }: SquareIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 96 96" width={size}>
      <Defs>
        <SvgLinearGradient gradientUnits="userSpaceOnUse" id="scanResultValidatorPairingBg" x1="15" x2="82" y1="14" y2="82">
          <Stop stopColor="#0EDBD2" />
          <Stop offset="0.48" stopColor="#2E6BFF" />
          <Stop offset="1" stopColor="#9D3DFF" />
        </SvgLinearGradient>
      </Defs>
      <Rect fill="url(#scanResultValidatorPairingBg)" height="76" rx="22" width="76" x="10" y="10" />
      <Path d="M27 35H57.5C60.1 35 62.2 37.1 62.2 39.7V56.3C62.2 58.9 60.1 61 57.5 61H27C24.4 61 22.3 58.9 22.3 56.3V39.7C22.3 37.1 24.4 35 27 35Z" stroke="#FFFFFF" strokeLinejoin="round" strokeWidth="4.2" />
      <Path d="M68.2 34.5L76.2 39.5V56.5L68.2 61.5" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.2" />
      <Path d="M34.5 47.9L40.3 53.6L51.8 42.4" stroke="#54F2DA" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4.6" />
      <Circle cx="70" cy="26" fill="#54F2DA" r="6" />
      <Circle cx="26" cy="70" fill="#8C55FF" r="5" />
    </Svg>
  );
}

export function ValidatorNodeIcon({ size }: SquareIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
      <Path d="M22 5L34 10.8V20.5C34 29.6 29.3 36.1 22 41C14.7 36.1 10 29.6 10 20.5V10.8L22 5Z" stroke="#1F65FF" strokeLinejoin="round" strokeWidth="3" />
      <Path d="M17 18.2L22 15.3L27 18.2V24L22 27L17 24V18.2Z" stroke="#6C707C" strokeLinejoin="round" strokeWidth="2.8" />
      <Path d="M22 15.5V27" stroke="#6C707C" strokeLinecap="round" strokeWidth="2.8" />
    </Svg>
  );
}

export function WalletLinkIcon({ size }: SquareIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
      <Rect height="20" rx="6" stroke="#6C707C" strokeWidth="3" width="24" x="6" y="12" />
      <Path d="M30 17H36C37.7 17 39 18.3 39 20V28C39 29.7 37.7 31 36 31H30" stroke="#1F65FF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      <Path d="M15 22H25" stroke="#6C707C" strokeLinecap="round" strokeWidth="3" />
      <Circle cx="30.5" cy="24" fill="#12C7B7" r="3.5" />
    </Svg>
  );
}

export function RecentAddressIcon({ size }: SquareIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Circle cx="24" cy="24" fill="#4F86FF" r="21" />
      <Path d="M24 12V29" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="3.2" />
      <Path d="M17 22L24 29L31 22" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />
      <Path d="M15 35H33" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="3.2" />
    </Svg>
  );
}

export function RecentDeployIcon({ size }: SquareIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Defs>
        <SvgLinearGradient gradientUnits="userSpaceOnUse" id="scanResultDeploy" x1="6" x2="42" y1="6" y2="42">
          <Stop stopColor="#8B3DFF" />
          <Stop offset="1" stopColor="#4B6CFF" />
        </SvgLinearGradient>
      </Defs>
      <Circle cx="24" cy="24" fill="url(#scanResultDeploy)" r="21" />
      <Path d="M18 18L12 24L18 30" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />
      <Path d="M30 18L36 24L30 30" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />
      <Path d="M27 15L21 33" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="3.2" />
    </Svg>
  );
}

export function RecentTransferIcon({ size }: SquareIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Circle cx="24" cy="24" fill="#27B66D" r="21" />
      <Path d="M16 19H31" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="3.1" />
      <Path d="M27 15L31 19L27 23" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.1" />
      <Path d="M32 29H17" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="3.1" />
      <Path d="M21 25L17 29L21 33" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.1" />
    </Svg>
  );
}

export function CodeHashIcon({ size }: SquareIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
      <Path d="M17 13L9 22L17 31" stroke="#6C707C" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      <Path d="M27 13L35 22L27 31" stroke="#6C707C" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      <Path d="M25 10L19 34" stroke="#6C707C" strokeLinecap="round" strokeWidth="3" />
    </Svg>
  );
}

export function SourceFileIcon({ size }: SquareIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
      <Path d="M13 7.5H25.5L33 15V35.5C33 37.2 31.7 38.5 30 38.5H13C11.3 38.5 10 37.2 10 35.5V10.5C10 8.8 11.3 7.5 13 7.5Z" stroke="#6C707C" strokeLinejoin="round" strokeWidth="3" />
      <Path d="M25 8V15.5H32.5" stroke="#6C707C" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
    </Svg>
  );
}

export function NetworkNodesIcon({ size }: SquareIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
      <Circle cx="22" cy="10" r="5" stroke="#6C707C" strokeWidth="3" />
      <Circle cx="11.5" cy="31.5" r="5" stroke="#6C707C" strokeWidth="3" />
      <Circle cx="32.5" cy="31.5" r="5" stroke="#6C707C" strokeWidth="3" />
      <Path d="M19.8 14.8L13.7 26.8" stroke="#6C707C" strokeLinecap="round" strokeWidth="3" />
      <Path d="M24.2 14.8L30.3 26.8" stroke="#6C707C" strokeLinecap="round" strokeWidth="3" />
      <Path d="M17 31.5H27" stroke="#6C707C" strokeLinecap="round" strokeWidth="3" />
    </Svg>
  );
}

export function ChevronRightIcon({ size }: SquareIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 44 44" width={size}>
      <Path d="M17 12L27 22L17 32" stroke="#6F7486" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />
    </Svg>
  );
}

export function ScanCornerFrameIcon({ size }: ScanFrameProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 448 448" width={size}>
      <Defs>
        <SvgLinearGradient gradientUnits="userSpaceOnUse" id="scanResultCornerGradient" x1="56" x2="392" y1="56" y2="392">
          <Stop stopColor="#176BFF" />
          <Stop offset="0.52" stopColor="#4E5CFF" />
          <Stop offset="1" stopColor="#9B3DFF" />
        </SvgLinearGradient>
      </Defs>
      <Path d="M56 104V74C56 64.1 64.1 56 74 56H104" stroke="url(#scanResultCornerGradient)" strokeLinecap="round" strokeWidth="7" />
      <Path d="M344 56H374C383.9 56 392 64.1 392 74V104" stroke="url(#scanResultCornerGradient)" strokeLinecap="round" strokeWidth="7" />
      <Path d="M392 344V374C392 383.9 383.9 392 374 392H344" stroke="url(#scanResultCornerGradient)" strokeLinecap="round" strokeWidth="7" />
      <Path d="M104 392H74C64.1 392 56 383.9 56 374V344" stroke="url(#scanResultCornerGradient)" strokeLinecap="round" strokeWidth="7" />
    </Svg>
  );
}
