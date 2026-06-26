import type { HealthResult, NodeStatusResult, PeerNetworkPeer, ValidatorInfo } from './chainRpc';

export type ValidatorReachabilityStatus = 'online' | 'offline' | 'unknown';

export type ValidatorDisplayRow = ValidatorInfo & {
  readonly reachabilityDetail: string;
  readonly reachabilityLabel: string;
  readonly reachabilityStatus: ValidatorReachabilityStatus;
};

export declare const VALIDATOR_REACHABILITY_STATUS: {
  readonly OFFLINE: 'offline';
  readonly ONLINE: 'online';
  readonly UNKNOWN: 'unknown';
};
export declare const VALIDATOR_STALE_SLOT_LAG: number;

export declare function createValidatorDisplayRows(
  validators: readonly ValidatorInfo[],
  peers?: readonly PeerNetworkPeer[],
  nodeStatus?: NodeStatusResult | null,
  health?: HealthResult | null,
  networkAvailable?: boolean
): readonly ValidatorDisplayRow[];
export declare function countOnlineValidatorRows(validators: readonly ValidatorDisplayRow[]): number;
export declare function isValidatorRowOnline(validator: ValidatorDisplayRow): boolean;
