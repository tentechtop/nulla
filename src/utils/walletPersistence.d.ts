import type { WalletAccount } from './walletSetup';

export type WalletSigningSeed = {
  readonly address: string;
  readonly signingSeed: string;
};

export type PersistedWalletState = {
  readonly accounts: readonly WalletAccount[];
  readonly currentAddress: string | null;
  readonly customRpcEndpoint: string;
  readonly rpcMode: 'custom' | 'local' | 'public';
  readonly signingSeeds: readonly WalletSigningSeed[];
};

export declare const EMPTY_PERSISTED_WALLET_STATE: PersistedWalletState;

export declare function normalizePersistedWalletState(value: unknown): PersistedWalletState;
export declare function serializePersistedWalletState(value: unknown): string;
export declare function deserializePersistedWalletState(text: string): PersistedWalletState;
export declare function loadPersistedWalletState(readText?: () => Promise<string | null>): Promise<PersistedWalletState>;
export declare function loadPersistedWalletStateWithSecureStore(
  readText: () => Promise<string | null>,
  readSecureText: () => Promise<string | null>
): Promise<PersistedWalletState>;
export declare function savePersistedWalletState(
  state: PersistedWalletState,
  writeText?: (text: string) => Promise<void>
): Promise<void>;
export declare function savePersistedWalletStateWithSecureStore(
  state: PersistedWalletState,
  writeText: (text: string) => Promise<void>,
  writeSecureText: (text: string) => Promise<void>
): Promise<void>;
