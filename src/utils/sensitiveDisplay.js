const HIDDEN_AMOUNT_TEXT = '******';
const SAFE_AMOUNT_PATTERN = /^[\p{L}\p{N}\s.,:%$+_\-/()]+$/u;
const SAFE_UNIT_PATTERN = /^[A-Za-z][A-Za-z0-9-]{0,16}$/;

function assertSafeText(value, fieldName, pattern) {
  if (typeof value !== 'string') {
    throw new TypeError(`${fieldName} 必须是字符串`);
  }

  if (value.length === 0 || value.length > 64) {
    throw new RangeError(`${fieldName} 长度必须在 1 到 64 之间`);
  }

  if (!pattern.test(value)) {
    throw new Error(`${fieldName} 包含非法展示字符`);
  }

  return value;
}

function getSensitiveAmountText(amountText, isVisible) {
  if (typeof isVisible !== 'boolean') {
    throw new TypeError('金额可见状态必须是布尔值');
  }

  const safeAmountText = assertSafeText(amountText, '金额文本', SAFE_AMOUNT_PATTERN);
  return isVisible ? safeAmountText : HIDDEN_AMOUNT_TEXT;
}

function getSensitiveAmountParts(amountText, unitText, isVisible) {
  return {
    amountText: getSensitiveAmountText(amountText, isVisible),
    unitText: assertSafeText(unitText, '金额单位', SAFE_UNIT_PATTERN)
  };
}

exports.HIDDEN_AMOUNT_TEXT = HIDDEN_AMOUNT_TEXT;
exports.getSensitiveAmountParts = getSensitiveAmountParts;
exports.getSensitiveAmountText = getSensitiveAmountText;
