const MAX_IMAGE_SCAN_URI_LENGTH = 8192;
const ALLOWED_IMAGE_URI_SCHEMES = new Set(['blob', 'content', 'data', 'file', 'http', 'https']);

export const IMAGE_QR_BARCODE_TYPES = Object.freeze(['qr']);

export function normalizeImageQrScanUri(uri) {
  if (typeof uri !== 'string') {
    throw new TypeError('图片地址必须是字符串');
  }

  const normalizedUri = uri.trim();

  if (normalizedUri.length === 0) {
    throw new RangeError('图片地址不能为空');
  }

  if (normalizedUri.length > MAX_IMAGE_SCAN_URI_LENGTH) {
    throw new RangeError('图片地址过长');
  }

  if (/[\u0000-\u001F\u007F]/.test(normalizedUri)) {
    throw new RangeError('图片地址包含非法控制字符');
  }

  const schemeMatch = /^([a-z][a-z0-9+.-]*):/i.exec(normalizedUri);
  const uriScheme = schemeMatch?.[1]?.toLowerCase() ?? '';

  if (!ALLOWED_IMAGE_URI_SCHEMES.has(uriScheme)) {
    throw new RangeError('图片地址协议不受支持');
  }

  return normalizedUri;
}

export function selectFirstImageQrPayload(scanResults, sanitizePayload) {
  if (!Array.isArray(scanResults)) {
    return '';
  }

  for (const scanResult of scanResults) {
    const rawPayload = typeof scanResult?.data === 'string' ? scanResult.data : '';
    const payload = sanitizePayload(rawPayload);

    if (payload.length > 0) {
      return payload;
    }
  }

  return '';
}

export async function scanImageUriForPayload(imageUri, scanFromUrl, sanitizePayload) {
  const safeImageUri = normalizeImageQrScanUri(imageUri);
  let scanResults = [];

  try {
    scanResults = await scanFromUrl(safeImageUri, [...IMAGE_QR_BARCODE_TYPES]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`图片二维码识别失败：${message}`);
  }

  const payload = selectFirstImageQrPayload(scanResults, sanitizePayload);

  if (payload.length === 0) {
    throw new Error('图片中没有识别到二维码');
  }

  return payload;
}
