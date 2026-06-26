import type nacl from 'tweetnacl';

export type SystemAddressKind = 'transparent' | 'shielded';

export declare const RAW_PUBLIC_KEY_BYTES: 32;
export declare const SHIELDED_ADDRESS_PREFIX: 'Z';
export declare const SYSTEM_ADDRESS_BODY_ALPHABET: string;
export declare const SYSTEM_ADDRESS_BODY_LENGTH: 44;
export declare const SYSTEM_ADDRESS_MAX_LENGTH: 64;
export declare const SYSTEM_ADDRESS_MIN_LENGTH: 33;
export declare const SYSTEM_ADDRESS_TOTAL_LENGTH: 64;
export declare const TRANSPARENT_ADDRESS_PREFIX: 'T';

export declare function isSystemAddress(value: unknown): boolean;
export declare function assertSystemAddress(value: unknown, fieldName?: string): void;
export declare function getSystemAddressKind(address: string): SystemAddressKind;
export declare function stripSystemAddressPrefix(address: string, fieldName?: string): string;
export declare function createDeterministicSystemAddress(sourceText: string, addressKind?: SystemAddressKind): string;
export declare function deriveRawPublicKeyFromSeed(sourceText: string): string;
export declare function deriveSigningKeyPairFromSeed(sourceText: string): nacl.SignKeyPair;
export declare function normalizeRawOrSystemAddress(value: unknown, fieldName?: string): string;
