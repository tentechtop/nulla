export type HealthResult = {
  readonly ok: boolean;
  readonly head_height: number;
  readonly head_slot: number;
  readonly finalized_height: number;
  readonly head_updated_unix_milli?: number;
  readonly head_age_millis?: number;
  readonly head_stale_threshold_millis?: number;
  readonly chain_progressing?: boolean;
  readonly transaction_submission_enabled?: boolean;
  readonly transaction_submission_reason?: string;
  readonly mempool_size: number;
  readonly liveness_mode?: string;
  readonly liveness_production_enabled?: boolean;
  readonly liveness_reason?: string;
  readonly liveness_state?: string;
};

export type LatestBlockhashResult = {
  readonly blockhash: string;
  readonly slot: number;
  readonly height: number;
  readonly last_valid_slot: number;
  readonly last_valid_block_height?: number;
};

export type AccountTypeResult = {
  readonly address: string;
  readonly exists: boolean;
  readonly owner?: string;
  readonly type: 'transparent' | 'privacy_state' | 'stake' | 'program' | 'unknown';
};

export type TransferResult = {
  readonly signature: string;
};

export type BlockResult = {
  readonly slot: number;
  readonly blockhash?: string;
  readonly parentSlot?: number;
  readonly block_time_unix_milli?: number;
  readonly state_root?: string;
  readonly tx_root?: string;
  readonly leader_address?: string;
  readonly leader_address_source?: 'block' | 'transaction_detail';
  readonly leader_commission_bps?: number;
  readonly leader_stake_lamports?: number | string;
  readonly leader_vote_credits?: number;
  readonly leader_reward_lamports?: number | string;
  readonly total_fee_lamports?: number | string;
  readonly base_fee_lamports?: number | string;
  readonly prioritization_fee_lamports?: number | string;
  readonly burned_fee_lamports?: number | string;
  readonly compute_units_used?: number;
  readonly transactions?: readonly unknown[];
};

export type TransactionDetailResult = {
  readonly signature: string;
  readonly found: boolean;
  readonly location: 'mempool' | 'block' | 'unknown';
  readonly status: 'pending' | 'confirmed' | 'finalized' | 'not_found';
  readonly error?: string;
  readonly sender?: string;
  readonly recent_blockhash?: string;
  readonly fee_lamports: number;
  readonly base_fee_lamports: number;
  readonly prioritization_fee_lamports: number;
  readonly burned_fee_lamports: number;
  readonly leader_fee_lamports: number;
  readonly leader_address?: string;
  readonly submit_time_unix_milli: number;
  readonly account_addresses?: readonly string[];
  readonly writable_addresses?: readonly string[];
  readonly instruction_count: number;
  readonly block_height: number;
  readonly slot: number;
  readonly blockhash?: string;
  readonly finalized: boolean;
};

export type AccountTransactionRecordResult = {
  readonly signature: string;
  readonly direction: 'incoming' | 'outgoing';
  readonly kind: 'transfer' | 'privacy_deposit' | 'privacy_withdraw' | 'validator_register' | 'validator_commission' | 'stake_deposit' | 'stake_withdraw' | 'slash';
  readonly counterparty?: string;
  readonly amount_lamports: string;
  readonly block_height: number;
  readonly slot: number;
  readonly blockhash: string;
  readonly submit_time_unix_milli: number;
  readonly finalized: boolean;
  readonly status: 'confirmed' | 'finalized' | 'pending';
  readonly location: 'block' | 'mempool' | 'unknown';
};

export type AccountTransactionHistoryResult = {
  readonly address: string;
  readonly scope: string;
  readonly records: readonly AccountTransactionRecordResult[];
  readonly next_cursor?: string;
  readonly has_more: boolean;
};

export type ContractProgramResult = {
  readonly address: string;
  readonly owner: string;
  readonly executable: boolean;
  readonly lamports: string;
  readonly data_length: number;
  readonly code_hash: string;
  readonly rent_epoch: number;
};

export type ContractProgramListResult = {
  readonly scope: string;
  readonly programs: readonly ContractProgramResult[];
};

export type ValidatorInfo = {
  readonly validator_id: string;
  readonly account_address: string;
  readonly staker_address?: string;
  readonly consensus_public_key: string;
  readonly p2p_peer_id: string;
  readonly stake_lamports: number;
  readonly self_stake_lamports?: number;
  readonly self_pending_stake_lamports?: number;
  readonly self_unlocking_stake_lamports?: number;
  readonly self_reward_lamports?: number;
  readonly commission_reward_lamports?: number;
  readonly delegated_lamports?: number;
  readonly delegator_count?: number;
  readonly status: string;
  readonly commission_bps: number;
  readonly vote_credits?: number;
  readonly reward_lamports?: number;
  readonly last_rewarded_slot?: number;
  readonly last_reward_epoch?: number;
  readonly jail_until_epoch?: number;
  readonly activation_epoch?: number;
  readonly deactivation_epoch?: number;
  readonly last_effective_stake_lamports?: number;
  readonly last_slashed_slot?: number;
  readonly delegations?: readonly DelegationInfo[];
};

export type DelegationInfo = {
  readonly delegator_address: string;
  readonly active_stake_lamports: number;
  readonly pending_stake_lamports: number;
  readonly unlocking_stake_lamports: number;
  readonly reward_lamports: number;
  readonly activation_epoch: number;
  readonly deactivation_epoch: number;
  readonly unlock_epoch: number;
};

export type ValidatorSetResult = {
  readonly validators: readonly ValidatorInfo[];
};

export type NodeStatusResult = {
  readonly node_name: string;
  readonly peer_id: string;
  readonly node_mode?: string;
  readonly node_role?: string;
  readonly node_roles?: readonly string[];
  readonly node_capabilities?: number;
  readonly node_capability_names?: readonly string[];
  readonly epoch_id?: number;
  readonly validator_enabled?: boolean;
  readonly consensus_enabled?: boolean;
  readonly rpc_forwarding?: boolean;
  readonly head_height: number;
  readonly head_slot: number;
  readonly finalized_height: number;
  readonly mempool_size: number;
  readonly validator_count: number;
  readonly known_peer_count: number;
  readonly p2p_secure_session: boolean;
  readonly transaction_fast_path: {
    readonly fast_path_available: boolean;
    readonly validator_peer_ids?: readonly string[];
    readonly preferred_peer_ids?: readonly string[];
  };
  readonly consensus: {
    readonly available: boolean;
    readonly epoch_id?: number;
    readonly validator_count: number;
    readonly validators?: readonly unknown[];
  };
};

export type PeerNetworkPeer = {
  readonly peer_id: string;
  readonly status: string;
  readonly role: string;
  readonly roles?: readonly string[];
  readonly capabilities?: number;
  readonly capability_names?: readonly string[];
  readonly validator: boolean;
  readonly connected: boolean;
  readonly best_address?: string;
  readonly latest_slot: number;
  readonly block_height: number;
  readonly failure_count: number;
  readonly last_error?: string;
};

export type PeerNetworkResult = {
  readonly local_peer_id: string;
  readonly peers: readonly PeerNetworkPeer[];
};

export declare const DEFAULT_PUBLIC_RPC_URL: string;
export declare const DEFAULT_LOCAL_RPC_URL: string;
export declare const PUBLIC_VALIDATOR_RPC_URLS: readonly string[];
export declare const LEGACY_PUBLIC_RPC_URLS: readonly string[];
export declare function normalizeRpcEndpoint(endpoint: unknown, fieldName?: string): string;
export declare function isLegacyPublicRpcEndpoint(endpoint: unknown): boolean;

export declare class JsonRpcClient {
  readonly endpoint: string;
  readonly timeoutMillis: number;
  readonly sendTransactionTimeoutMillis: number;
  constructor(endpoint?: string, timeoutMillis?: number);
  getHealth(): Promise<HealthResult>;
  getBalance(address: string): Promise<bigint>;
  getAccountType(address: string): Promise<AccountTypeResult>;
  getLatestBlockhash(): Promise<LatestBlockhashResult>;
  sendTransaction(encodedTransaction: string): Promise<TransferResult>;
  getBlock(slot: number): Promise<BlockResult>;
  getTransaction(signature: string): Promise<TransactionDetailResult>;
  getAddressTransactions(address: string, limit?: number, cursor?: string): Promise<AccountTransactionHistoryResult>;
  getContractPrograms(limit?: number): Promise<ContractProgramListResult>;
  getValidatorSet(): Promise<ValidatorSetResult>;
  getNodeStatus(): Promise<NodeStatusResult>;
  getPeerNetwork(): Promise<PeerNetworkResult>;
}

export declare function stringifyJsonRpcRequest(id: number, method: string, params: readonly unknown[]): string;
export declare function isMethodUnavailableError(error: unknown): boolean;
