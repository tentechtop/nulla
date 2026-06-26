import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

type BlockDetailIconProps = {
  readonly size?: number;
};

export type BlockDetailIconName =
  | 'buttonCopy'
  | 'buttonTransactions'
  | 'computeUsed'
  | 'copySmall'
  | 'feeBase'
  | 'feeBurned'
  | 'feePriority'
  | 'statusConfirmations'
  | 'statusFinalized'
  | 'statusMempool'
  | 'statusRpc'
  | 'txContract'
  | 'txPrivacy'
  | 'txStake'
  | 'txTransfer';

export function BlockDetailIcon({ name, size = 40 }: BlockDetailIconProps & { readonly name: BlockDetailIconName }) {
  if (name === 'copySmall') {
    return <BlockCopySmallIcon size={size} />;
  }

  if (name === 'buttonCopy') {
    return <BlockButtonCopyIcon size={size} />;
  }

  if (name === 'buttonTransactions') {
    return <BlockButtonTransactionsIcon size={size} />;
  }

  if (name === 'feePriority') {
    return <BlockFeePriorityIcon size={size} />;
  }

  if (name === 'feeBurned') {
    return <BlockFeeBurnedIcon size={size} />;
  }

  if (name === 'computeUsed') {
    return <BlockComputeUsedIcon size={size} />;
  }

  if (name === 'statusConfirmations') {
    return <BlockStatusConfirmationsIcon size={size} />;
  }

  if (name === 'statusFinalized') {
    return <BlockStatusFinalizedIcon size={size} />;
  }

  if (name === 'statusMempool') {
    return <BlockStatusMempoolIcon size={size} />;
  }

  if (name === 'statusRpc') {
    return <BlockStatusRpcIcon size={size} />;
  }

  if (name === 'txStake') {
    return <BlockTxStakeIcon size={size} />;
  }

  if (name === 'txContract') {
    return <BlockTxContractIcon size={size} />;
  }

  if (name === 'txPrivacy') {
    return <BlockTxPrivacyIcon size={size} />;
  }

  return name === 'txTransfer' ? <BlockTxTransferIcon size={size} /> : <BlockFeeBaseIcon size={size} />;
}

function BlockFeeBaseIcon({ size }: BlockDetailIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 40 40" width={size}>
      <Path d="M20 8L32 14L20 20L8 14L20 8Z" stroke="#5F6675" strokeLinejoin="round" strokeWidth={2.6} />
      <Path d="M8 21L20 27L32 21" stroke="#5F6675" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.6} />
      <Path d="M8 28L20 34L32 28" stroke="#5F6675" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.6} />
    </Svg>
  );
}

function BlockFeePriorityIcon({ size }: BlockDetailIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 40 40" width={size}>
      <Path d="M22 5L11 22H19L16 35L29 17H21L22 5Z" stroke="#5F6675" strokeLinejoin="round" strokeWidth={2.8} />
    </Svg>
  );
}

function BlockFeeBurnedIcon({ size }: BlockDetailIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 40 40" width={size}>
      <Path d="M21 5C22 12 31 15 31 25C31 31 26.5 35 20 35C13.5 35 9 31 9 25C9 18.5 14.2 15.5 16.5 10C17.3 14.3 20 16.5 22 19C23 15 22.4 10.2 21 5Z" stroke="#8B3DFF" strokeLinejoin="round" strokeWidth={2.8} />
      <Path d="M20 33C17 31.4 16 29.4 16 26.8C16 23.9 18.4 22.2 19.3 19.8C20.5 22.2 24 23.7 24 27.2C24 30 22.6 31.9 20 33Z" fill="#2F7BFF" />
    </Svg>
  );
}

function BlockComputeUsedIcon({ size }: BlockDetailIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 40 40" width={size}>
      <Rect height={16} rx={3} stroke="#5F6675" strokeWidth={2.6} width={16} x={12} y={12} />
      <Path d="M7 16H12" stroke="#5F6675" strokeLinecap="round" strokeWidth={2.4} />
      <Path d="M7 24H12" stroke="#5F6675" strokeLinecap="round" strokeWidth={2.4} />
      <Path d="M28 16H33" stroke="#5F6675" strokeLinecap="round" strokeWidth={2.4} />
      <Path d="M28 24H33" stroke="#5F6675" strokeLinecap="round" strokeWidth={2.4} />
      <Path d="M16 7V12" stroke="#5F6675" strokeLinecap="round" strokeWidth={2.4} />
      <Path d="M24 7V12" stroke="#5F6675" strokeLinecap="round" strokeWidth={2.4} />
      <Path d="M16 28V33" stroke="#5F6675" strokeLinecap="round" strokeWidth={2.4} />
      <Path d="M24 28V33" stroke="#5F6675" strokeLinecap="round" strokeWidth={2.4} />
      <Circle cx={20} cy={20} fill="#5F6675" r={3} />
    </Svg>
  );
}

function BlockStatusConfirmationsIcon({ size }: BlockDetailIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 40 40" width={size}>
      <Circle cx={20} cy={20} r={12} stroke="#5F6675" strokeWidth={2.6} />
      <Path d="M14.5 20.2L18 23.7L25.8 16" stroke="#5F6675" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.6} />
    </Svg>
  );
}

function BlockStatusFinalizedIcon({ size }: BlockDetailIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 40 40" width={size}>
      <Path d="M12 34V7" stroke="#5F6675" strokeLinecap="round" strokeWidth={2.8} />
      <Path d="M13 8H28L25 14L28 20H13V8Z" stroke="#5F6675" strokeLinejoin="round" strokeWidth={2.8} />
    </Svg>
  );
}

function BlockStatusMempoolIcon({ size }: BlockDetailIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 40 40" width={size}>
      <Ellipse cx={20} cy={11} rx={11} ry={5} stroke="#5F6675" strokeWidth={2.6} />
      <Path d="M9 11V29C9 31.8 13.9 34 20 34C26.1 34 31 31.8 31 29V11" stroke="#5F6675" strokeWidth={2.6} />
      <Path d="M9 20C9 22.8 13.9 25 20 25C26.1 25 31 22.8 31 20" stroke="#5F6675" strokeWidth={2.6} />
    </Svg>
  );
}

function BlockStatusRpcIcon({ size }: BlockDetailIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 40 40" width={size}>
      <Circle cx={20} cy={20} r={13} stroke="#6A52FF" strokeWidth={2.6} />
      <Path d="M7 20H33" stroke="#6A52FF" strokeLinecap="round" strokeWidth={2.6} />
      <Path d="M20 7C24 10.7 26 15 26 20C26 25 24 29.3 20 33" stroke="#6A52FF" strokeLinecap="round" strokeWidth={2.6} />
      <Path d="M20 7C16 10.7 14 15 14 20C14 25 16 29.3 20 33" stroke="#6A52FF" strokeLinecap="round" strokeWidth={2.6} />
    </Svg>
  );
}

function BlockTxTransferIcon({ size }: BlockDetailIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 40 40" width={size}>
      <Circle cx={20} cy={20} fill="#2F7BFF" r={16} />
      <Path d="M20 10V27" stroke="#FFFFFF" strokeLinecap="round" strokeWidth={2.8} />
      <Path d="M14 21L20 27L26 21" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} />
    </Svg>
  );
}

function BlockTxStakeIcon({ size }: BlockDetailIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 40 40" width={size}>
      <Circle cx={20} cy={20} fill="#EDE8FF" r={16} />
      <Circle cx={20} cy={20} r={10} stroke="#7A3DFF" strokeWidth={3} />
      <Path d="M11 20H29" stroke="#7A3DFF" strokeLinecap="round" strokeWidth={3} />
    </Svg>
  );
}

function BlockTxContractIcon({ size }: BlockDetailIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 40 40" width={size}>
      <Circle cx={20} cy={20} fill="#E4FAFF" r={16} />
      <Path d="M15 15L10 20L15 25" stroke="#00A6C8" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} />
      <Path d="M25 15L30 20L25 25" stroke="#00A6C8" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.8} />
      <Path d="M22.5 13L17.5 27" stroke="#00A6C8" strokeLinecap="round" strokeWidth={2.8} />
    </Svg>
  );
}

function BlockTxPrivacyIcon({ size }: BlockDetailIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 40 40" width={size}>
      <Circle cx={20} cy={20} fill="#EFE7FF" r={16} />
      <Path d="M10.5 17.2C10.5 15.4 12 14.1 13.8 14.4L18.6 15.2C19.5 15.4 20.5 15.4 21.4 15.2L26.2 14.4C28 14.1 29.5 15.4 29.5 17.2V20.2C29.5 25.4 25 28.7 20.9 25.5L20 24.8L19.1 25.5C15 28.7 10.5 25.4 10.5 20.2V17.2Z" fill="#7A3DFF" />
      <Path d="M14.5 19.2C16.8 18.3 18.3 18.7 19.3 20.4" stroke="#FFFFFF" strokeLinecap="round" strokeWidth={2} />
      <Path d="M25.5 19.2C23.2 18.3 21.7 18.7 20.7 20.4" stroke="#FFFFFF" strokeLinecap="round" strokeWidth={2} />
    </Svg>
  );
}

function BlockCopySmallIcon({ size }: BlockDetailIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 32 32" width={size}>
      <Rect height={12} rx={2} stroke="#7B8494" strokeWidth={2.2} width={10} x={13} y={8} />
      <Path d="M9 13V23C9 24.1 9.9 25 11 25H18" stroke="#7B8494" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} />
    </Svg>
  );
}

function BlockButtonCopyIcon({ size }: BlockDetailIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Rect height={17} rx={2.5} stroke="#FFFFFF" strokeWidth={3} width={14} x={20} y={12} />
      <Path d="M14 19V34C14 35.1 14.9 36 16 36H28" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} />
      <Path d="M14 19C14 17.9 14.9 17 16 17H20" stroke="#FFFFFF" strokeLinecap="round" strokeWidth={3} />
    </Svg>
  );
}

function BlockButtonTransactionsIcon({ size }: BlockDetailIconProps) {
  return (
    <Svg fill="none" height={size} viewBox="0 0 48 48" width={size}>
      <Path d="M14 9H29L37 17V37C37 38.1 36.1 39 35 39H14C12.9 39 12 38.1 12 37V11C12 9.9 12.9 9 14 9Z" stroke="#050505" strokeLinejoin="round" strokeWidth={3} />
      <Path d="M29 9V17H37" stroke="#050505" strokeLinejoin="round" strokeWidth={3} />
      <Path d="M18 25H29" stroke="#050505" strokeLinecap="round" strokeWidth={3} />
      <Path d="M26 21L30 25L26 29" stroke="#050505" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} />
    </Svg>
  );
}
