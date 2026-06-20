const SAFE_TEXT_PATTERN = /^[\p{L}\p{N}\s.,:%$+_\-/()]+$/u;

function assertSafeDisplayText(value, fieldName) {
  if (typeof value !== 'string') {
    throw new TypeError(`${fieldName} 必须是字符串`);
  }

  if (value.length === 0 || value.length > 64) {
    throw new RangeError(`${fieldName} 长度必须在 1 到 64 之间`);
  }

  if (!SAFE_TEXT_PATTERN.test(value)) {
    throw new Error(`${fieldName} 包含非法展示字符`);
  }

  return value;
}

function formatAmount(value, maximumFractionDigits = 6) {
  if (!Number.isFinite(value)) {
    throw new TypeError('金额必须是有限数字');
  }

  if (maximumFractionDigits < 0 || maximumFractionDigits > 12) {
    throw new RangeError('小数位必须在 0 到 12 之间');
  }

  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
    minimumFractionDigits: 0
  }).format(value);
}

function getSignedPercentText(value) {
  if (!Number.isFinite(value)) {
    throw new TypeError('涨跌幅必须是有限数字');
  }

  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

exports.assertSafeDisplayText = assertSafeDisplayText;
exports.formatAmount = formatAmount;
exports.getSignedPercentText = getSignedPercentText;
