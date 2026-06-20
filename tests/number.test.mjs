import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertSafeDisplayText,
  formatAmount,
  getSignedPercentText
} from '../src/utils/number.js';

test('formatAmount formats finite asset amounts with grouping', () => {
  assert.equal(formatAmount(99999999.958218, 6), '99,999,999.958218');
  assert.equal(formatAmount(71.28, 2), '71.28');
});

test('formatAmount rejects unsafe numeric boundaries', () => {
  assert.throws(() => formatAmount(Number.NaN), /金额必须是有限数字/);
  assert.throws(() => formatAmount(1, 13), /小数位必须在 0 到 12 之间/);
});

test('getSignedPercentText keeps explicit positive signs', () => {
  assert.equal(getSignedPercentText(2.56), '+2.56%');
  assert.equal(getSignedPercentText(-1.23), '-1.23%');
});

test('assertSafeDisplayText blocks suspicious display payloads', () => {
  assert.equal(assertSafeDisplayText('Solana 原生代币', '名称'), 'Solana 原生代币');
  assert.throws(() => assertSafeDisplayText('<script>', '名称'), /非法展示字符/);
});
