import QRCode from 'qrcode';

const QR_QUIET_ZONE_MODULES = 4;
const MAX_QR_VALUE_LENGTH = 512;
const UNSAFE_CONTROL_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

export function normalizeQrValue(value) {
  if (typeof value !== 'string') {
    throw new TypeError('二维码内容必须是字符串');
  }

  const normalizedValue = value.trim();
  if (normalizedValue.length === 0) {
    throw new Error('二维码内容不能为空');
  }

  if (normalizedValue.length > MAX_QR_VALUE_LENGTH) {
    throw new RangeError('二维码内容过长');
  }

  if (UNSAFE_CONTROL_PATTERN.test(normalizedValue)) {
    throw new Error('二维码内容包含非法控制字符');
  }

  return normalizedValue;
}

export function generateQrMatrix(value) {
  const qrValue = normalizeQrValue(value);

  try {
    const qrCode = QRCode.create(qrValue, { errorCorrectionLevel: 'H' });
    const sourceSize = qrCode.modules.size;
    const targetSize = sourceSize + QR_QUIET_ZONE_MODULES * 2;
    const matrix = [];

    for (let rowIndex = 0; rowIndex < targetSize; rowIndex += 1) {
      matrix.push(buildQrMatrixRow(qrCode.modules, rowIndex, targetSize));
    }

    return matrix;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`生成二维码失败: ${message}`);
  }
}

function buildQrMatrixRow(modules, targetRowIndex, targetSize) {
  const matrixRow = [];
  const sourceRowIndex = targetRowIndex - QR_QUIET_ZONE_MODULES;

  for (let columnIndex = 0; columnIndex < targetSize; columnIndex += 1) {
    const sourceColumnIndex = columnIndex - QR_QUIET_ZONE_MODULES;
    const inSourceBounds = isQrSourceCoordinate(sourceRowIndex, sourceColumnIndex, modules.size);
    const moduleValue = inSourceBounds ? modules.get(sourceRowIndex, sourceColumnIndex) : false;
    matrixRow.push(moduleValue === true || moduleValue === 1);
  }

  return matrixRow;
}

function isQrSourceCoordinate(rowIndex, columnIndex, sourceSize) {
  if (rowIndex < 0 || columnIndex < 0) {
    return false;
  }

  return rowIndex < sourceSize && columnIndex < sourceSize;
}
