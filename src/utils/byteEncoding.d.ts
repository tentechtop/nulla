export declare const UINT64_MAX: bigint;

export declare function bytesFromBase64(value: string): Uint8Array;
export declare function base64FromBytes(bytes: Uint8Array): string;
export declare function concatBytes(chunks: readonly Uint8Array[]): Uint8Array;
export declare function encodeBytes(value: Uint8Array): Uint8Array;
export declare function encodeString(value: string): Uint8Array;
export declare function encodeUint16LE(value: number): Uint8Array;
export declare function encodeUint32LE(value: number): Uint8Array;
export declare function encodeUint64LE(value: bigint): Uint8Array;
export declare function validateUint64(value: bigint, fieldName: string): void;
export declare function checkedAddUint64(left: bigint, right: bigint, fieldName: string): bigint;
export declare function encodeShortVecLength(length: number): Uint8Array;
