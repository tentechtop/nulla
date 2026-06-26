import type { AccountTransactionHistoryResult, AccountTransactionRecordResult } from './chainRpc';

export type LocalTransactionRecordInput = {
  readonly amountLamports: bigint | number | string;
  readonly blockHeight?: number;
  readonly blockhash?: string;
  readonly counterparty?: string;
  readonly direction?: AccountTransactionRecordResult['direction'];
  readonly finalized?: boolean;
  readonly kind: AccountTransactionRecordResult['kind'];
  readonly location?: AccountTransactionRecordResult['location'];
  readonly ownerAddress: string;
  readonly signature: string;
  readonly slot?: number;
  readonly status?: AccountTransactionRecordResult['status'];
  readonly submitTimeUnixMilli?: number;
};

export type LocalTransactionHistoryItem = {
  readonly owner_address: string;
  readonly record: AccountTransactionRecordResult;
};

export declare function normalizeLocalTransactionHistory(value: unknown): readonly LocalTransactionHistoryItem[];
export declare function loadLocalTransactionRecords(
  ownerAddress: string,
  readText?: () => Promise<string | null>
): Promise<readonly AccountTransactionRecordResult[]>;
export declare function saveLocalTransactionRecord(
  input: LocalTransactionRecordInput,
  readText?: () => Promise<string | null>,
  writeText?: (text: string) => Promise<void>
): Promise<AccountTransactionRecordResult>;
export declare function mergeLocalTransactionRecords(
  history: AccountTransactionHistoryResult,
  localRecords: readonly AccountTransactionRecordResult[]
): AccountTransactionHistoryResult;
