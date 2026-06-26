export type TransferTransactionInput = {
  readonly sourceSeed: string;
  readonly destinationAddress: string;
  readonly recentBlockhash: string;
  readonly lamports: bigint;
};

export type StakeTransactionInput = {
  readonly stakerSeed: string;
  readonly validatorAddress: string;
  readonly recentBlockhash: string;
  readonly lamports: bigint;
};

export type UnstakeTransactionInput = StakeTransactionInput & {
  readonly unlockEpoch: bigint;
};

export type StakeWithdrawTransactionInput = {
  readonly stakerSeed: string;
  readonly validatorAddress: string;
  readonly recentBlockhash: string;
  readonly currentEpoch: bigint;
};

export type RegisterValidatorTransactionInput = StakeTransactionInput & {
  readonly consensusPublicKey: string;
  readonly blsPublicKey: string;
  readonly commissionBps?: number;
  readonly peerId: string;
};

export type UpdateCommissionTransactionInput = {
  readonly stakerSeed: string;
  readonly validatorAddress: string;
  readonly recentBlockhash: string;
  readonly commissionBps: number;
};

export type DeployContractTransactionInput = {
  readonly payerSeed: string;
  readonly recentBlockhash: string;
  readonly bytecodeBase64: string;
  readonly bytecodeHash: string;
  readonly depositLamports: bigint;
  readonly requestId: string;
  readonly programSeedSalt?: string;
};

export type SignedDeployContractTransaction = {
  readonly encodedTransaction: string;
  readonly programAddress: string;
  readonly programLamports: bigint;
  readonly rentLamports: bigint;
  readonly depositLamports: bigint;
  readonly bytecodeLength: number;
  readonly estimatedFeeLamports: bigint;
};

export declare const DEPLOY_CONTRACT_ESTIMATED_FEE_LAMPORTS: bigint;

export declare function buildSignedTransferTransaction(input: TransferTransactionInput): string;
export declare function buildSignedStakeTransaction(input: StakeTransactionInput): string;
export declare function buildSignedUnstakeTransaction(input: UnstakeTransactionInput): string;
export declare function buildSignedWithdrawUnstakedTransaction(input: StakeWithdrawTransactionInput): string;
export declare function buildSignedDelegateTransaction(input: StakeTransactionInput): string;
export declare function buildSignedUndelegateTransaction(input: UnstakeTransactionInput): string;
export declare function buildSignedWithdrawDelegationTransaction(input: StakeWithdrawTransactionInput): string;
export declare function buildSignedUpdateCommissionTransaction(input: UpdateCommissionTransactionInput): string;
export declare function buildSignedRegisterValidatorTransaction(input: RegisterValidatorTransactionInput): string;
export declare function buildSignedDeployContractTransaction(input: DeployContractTransactionInput): SignedDeployContractTransaction;
export declare function minimumBalanceForRentExemption(dataLength: number): bigint;
export declare function validateDeployBytecode(bytecode: Uint8Array, expectedHash: string): void;
export declare function parseLamports(value: string): bigint;
