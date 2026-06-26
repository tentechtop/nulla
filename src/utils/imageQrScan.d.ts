export type ImageQrBarcodeType = 'qr';

export type ImageQrScanResult = {
  readonly data?: string | null;
  readonly type?: string;
};

export type ImageQrScanFunction = (
  imageUri: string,
  barcodeTypes: ImageQrBarcodeType[]
) => Promise<readonly ImageQrScanResult[]>;

export const IMAGE_QR_BARCODE_TYPES: readonly ImageQrBarcodeType[];

export function normalizeImageQrScanUri(uri: string): string;

export function selectFirstImageQrPayload(
  scanResults: unknown,
  sanitizePayload: (payload: string) => string
): string;

export function scanImageUriForPayload(
  imageUri: string,
  scanFromUrl: ImageQrScanFunction,
  sanitizePayload: (payload: string) => string
): Promise<string>;
