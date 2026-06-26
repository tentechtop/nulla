export type QrMatrix = readonly (readonly boolean[])[];

export declare function normalizeQrValue(value: string): string;
export declare function generateQrMatrix(value: string): QrMatrix;
