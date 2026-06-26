import type { HealthResult, JsonRpcClient, NodeStatusResult, PeerNetworkPeer, ValidatorInfo } from './chainRpc';
import type { ValidatorReachabilityStatus } from './validatorStatus';

export type WalletValidatorSummary = {
  readonly accountAddress: string;
  readonly commissionBps: number;
  readonly delegatedLamports: bigint;
  readonly delegatorCount: number;
  readonly displayName: string;
  readonly selfStakeLamports: bigint;
  readonly status: string;
  readonly totalStakeLamports: bigint;
  readonly p2pPeerID: string;
  readonly reachabilityDetail: string;
  readonly reachabilityLabel: string;
  readonly reachabilityStatus: ValidatorReachabilityStatus;
  readonly validatorID: string;
};

export type WalletDposSummary = {
  readonly commissionRewardLamports: bigint;
  readonly delegatedLamports: bigint;
  readonly delegatedPendingLamports: bigint;
  readonly delegatedRewardLamports: bigint;
  readonly delegatedUnlockingLamports: bigint;
  readonly selfPendingLamports: bigint;
  readonly selfRewardLamports: bigint;
  readonly selfStakeLamports: bigint;
  readonly selfUnlockingLamports: bigint;
  readonly totalPowerLamports: bigint;
  readonly totalRewardLamports: bigint;
  readonly validatorCount: number;
  readonly validators: readonly WalletValidatorSummary[];
};

export type WalletPortfolio = {
  readonly address: string | null;
  readonly availableSolText: string;
  readonly chain: {
    readonly currentEpoch: number;
    readonly error: string;
    readonly headHeight: number;
    readonly headSlot: number;
    readonly isHealthy: boolean;
    readonly knownPeerCount: number;
    readonly rpcURL: string;
    readonly validatorCount: number;
  };
  readonly dpos: WalletDposSummary;
  readonly privateLamports: bigint;
  readonly privateSolText: string;
  readonly tokenLamportsText: string;
  readonly totalLamports: bigint;
  readonly totalSolText: string;
  readonly transparentLamports: bigint;
};

export declare function createEmptyWalletPortfolio(address?: string | null): WalletPortfolio;
export declare function loadWalletPortfolio(address?: string | null, client?: JsonRpcClient): Promise<WalletPortfolio>;
export declare function createWalletDposSummary(
  validators: readonly ValidatorInfo[],
  walletAddress?: string | null,
  peers?: readonly PeerNetworkPeer[],
  nodeStatus?: NodeStatusResult | null,
  health?: HealthResult | null,
  networkAvailable?: boolean
): WalletDposSummary;
export declare function normalizeValidatorSummary(validator: ValidatorInfo): WalletValidatorSummary;
export declare function formatLamportsAsSol(value: bigint | number | string): string;
export declare function formatLamports(value: bigint | number | string): string;
export declare function toBigIntLamports(value: unknown): bigint;
export declare function splitSolAmount(value: string): { readonly decimalPart: string; readonly integerPart: string };
