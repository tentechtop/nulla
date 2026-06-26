import type { JsonRpcClient, LatestBlockhashResult, TransactionDetailResult } from './chainRpc';
import type { SignedDeployContractTransaction } from './chainTransactions';

export type ChainSubmitInputBase = {
  readonly client?: JsonRpcClient;
  readonly signingSeed?: string | null;
};

export type SubmitTransferInput = ChainSubmitInputBase & {
  readonly destinationAddress: string;
  readonly lamports: string;
};

export type SubmitStakeInput = ChainSubmitInputBase & {
  readonly validatorAddress: string;
  readonly lamports: string;
};

export type SubmitRegisterValidatorIdentityInput = ChainSubmitInputBase & {
  readonly blsPublicKey: string;
  readonly commissionBps?: number;
  readonly consensusPublicKey: string;
  readonly peerId: string;
  readonly stakeLamports: string;
  readonly validatorAddress: string;
};

export type SubmitUpdateValidatorCommissionInput = ChainSubmitInputBase & {
  readonly commissionBps: string | number;
  readonly validatorAddress: string;
};

export type SubmitDeployContractInput = ChainSubmitInputBase & {
  readonly bytecodeBase64: string;
  readonly bytecodeHash: string;
  readonly depositLamports: string;
  readonly requestId: string;
};

export type SubmittedTransactionResult = {
  readonly signature: string;
  readonly lamports: bigint;
  readonly latestBlockhash: LatestBlockhashResult;
  readonly rpcEndpoint?: string;
};

export type SubmittedDeployContractResult = SignedDeployContractTransaction & {
  readonly signature: string;
  readonly latestBlockhash: LatestBlockhashResult;
  readonly rpcEndpoint?: string;
};

export type WaitForTransactionFinalityInput = {
  readonly client?: JsonRpcClient;
  readonly delayMillis?: number;
  readonly maxAttempts?: number;
  readonly signature: string;
};

export declare function createDefaultChainClient(): JsonRpcClient;
export declare function submitTransferTransaction(input: SubmitTransferInput): Promise<SubmittedTransactionResult>;
export declare function submitStakeTransaction(input: SubmitStakeInput): Promise<SubmittedTransactionResult>;
export declare function submitDelegateStakeTransaction(input: SubmitStakeInput): Promise<SubmittedTransactionResult>;
export declare function submitUnstakeTransaction(input: SubmitStakeInput): Promise<SubmittedTransactionResult>;
export declare function submitUndelegateStakeTransaction(input: SubmitStakeInput): Promise<SubmittedTransactionResult>;
export declare function submitWithdrawUnstakedTransaction(input: SubmitStakeInput): Promise<SubmittedTransactionResult>;
export declare function submitWithdrawDelegationTransaction(input: SubmitStakeInput): Promise<SubmittedTransactionResult>;
export declare function submitRegisterValidatorIdentityTransaction(input: SubmitRegisterValidatorIdentityInput): Promise<SubmittedTransactionResult>;
export declare function submitUpdateValidatorCommissionTransaction(input: SubmitUpdateValidatorCommissionInput): Promise<SubmittedTransactionResult>;
export declare function submitDeployContractTransaction(input: SubmitDeployContractInput): Promise<SubmittedDeployContractResult>;
export declare function waitForTransactionFinality(input: WaitForTransactionFinalityInput): Promise<TransactionDetailResult | null>;
