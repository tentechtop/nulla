export declare const MAX_VALIDATOR_PAIRING_PAYLOAD_LENGTH: number;
export declare const MINIMUM_VALIDATOR_STAKE_LAMPORTS: number;
export declare const VALIDATOR_PAIRING_MODE_BOOTSTRAP = "bootstrap_join";
export declare const VALIDATOR_PAIRING_MODE_REGISTER = "validator_registration";
export declare const VALIDATOR_PAIRING_PAYLOAD_PREFIX: string;

export type ValidatorPairingMode = typeof VALIDATOR_PAIRING_MODE_BOOTSTRAP | typeof VALIDATOR_PAIRING_MODE_REGISTER;

export type ValidatorPairingPayload = {
  readonly version: number;
  readonly mode: ValidatorPairingMode;
  readonly rpcURL: string;
  readonly bootstrapRPCURL: string;
  readonly chainID: string;
  readonly chainIdentityHash: string;
  readonly genesisHash: string;
  readonly nodeName: string;
  readonly nodePeerID: string;
  readonly validatorAddress: string;
  readonly consensusAddress: string;
  readonly blsPublicKey: string;
  readonly advertisedIP: string;
  readonly advertisedPort: number;
  readonly network: string;
  readonly registeredAtUnixMS: number;
  readonly token: string;
  readonly expiresAtUnixMS: number;
  readonly isExpired: boolean;
  readonly rawPayload: string;
};

export type ValidatorPairingCompleteOptions = {
  readonly bootstrapStakerSignature?: string;
  readonly signature?: string;
  readonly stakeLamports?: number;
  readonly stakerAddress: string;
};

export type BootstrapPairingSignOptions = {
  readonly signingSeed: string;
  readonly stakeLamports?: number;
  readonly stakerAddress: string;
};

export declare function sanitizeValidatorPairingPayload(payload: string): string;
export declare function isValidatorPairingPayload(payload: string): boolean;
export declare function parseValidatorPairingPayload(payload: string, nowMs?: number): ValidatorPairingPayload | null;
export declare function compactValidatorPairingValue(value: string, prefixLength?: number, suffixLength?: number): string;
export declare function getValidatorPairingStatus(pairingPayload: ValidatorPairingPayload, fetchImpl?: typeof fetch): Promise<unknown>;
export declare function completeValidatorPairing(
  pairingPayload: ValidatorPairingPayload,
  options: ValidatorPairingCompleteOptions,
  fetchImpl?: typeof fetch
): Promise<unknown>;
export declare function buildValidatorPairingCompleteRequest(
  pairingPayload: ValidatorPairingPayload,
  options: ValidatorPairingCompleteOptions
): Record<string, unknown>;
export declare function signBootstrapPairingAuthorization(
  pairingPayload: ValidatorPairingPayload,
  options: BootstrapPairingSignOptions
): string;
