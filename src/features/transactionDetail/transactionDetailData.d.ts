import type { TransactionDetailResult } from '../../utils/chainRpc';

export type TransactionDirection = 'incoming' | 'outgoing';
export type TransactionStatus = 'Finalized' | '处理中';

export type TransactionInstructionDetail = {
  readonly accountCount: string;
  readonly id: string;
  readonly name: string;
  readonly program: string;
  readonly writableAccountCount: string;
};

export type TransactionDetailData = {
  readonly amountLamports: string;
  readonly baseFeeLamports?: string;
  readonly blockHash: string;
  readonly blockHeight: string;
  readonly burnedFeeLamports?: string;
  readonly computeUsed: string;
  readonly direction: TransactionDirection;
  readonly feeLamports: string;
  readonly instructions: readonly TransactionInstructionDetail[];
  readonly leaderFeeLamports?: string;
  readonly location: string;
  readonly priorityFeeLamports?: string;
  readonly receiverAddress: string;
  readonly recentBlockhash: string;
  readonly rpcEndpoint?: string;
  readonly senderAddress: string;
  readonly signature: string;
  readonly slot: string;
  readonly status: TransactionStatus;
  readonly submitTime: string;
  readonly transactionType: string;
};

export type SubmittedTransactionInput = {
  readonly amountLamports: string;
  readonly blockHeight?: number;
  readonly mode: string;
  readonly receiverAddress: string;
  readonly recentBlockhash?: string;
  readonly rpcEndpoint?: string;
  readonly senderAddress?: string | null;
  readonly signature?: string;
  readonly slot?: number;
  readonly status?: TransactionStatus;
};

export const DEFAULT_TRANSACTION_DETAIL_DATA: TransactionDetailData;

export function createSubmittedTransactionDetail(input: SubmittedTransactionInput): TransactionDetailData;
export function createTransactionDetailFromRpc(detail: TransactionDetailResult, fallback?: TransactionDetailData): TransactionDetailData;
