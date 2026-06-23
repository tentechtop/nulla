import assert from 'node:assert/strict';
import test from 'node:test';
import {
  HIDDEN_AMOUNT_TEXT,
  getSensitiveAmountParts,
  getSensitiveAmountText
} from '../src/utils/sensitiveDisplay.js';

test('getSensitiveAmountText masks amount without changing visible values', () => {
  assert.equal(HIDDEN_AMOUNT_TEXT, '******');
  assert.equal(getSensitiveAmountText('10,000,000', true), '10,000,000');
  assert.equal(getSensitiveAmountText('10,000,000', false), HIDDEN_AMOUNT_TEXT);
});

test('getSensitiveAmountParts keeps DPoS and privacy units while hidden', () => {
  assert.deepEqual(getSensitiveAmountParts('0.000000', 'SOL', false), {
    amountText: HIDDEN_AMOUNT_TEXT,
    unitText: 'SOL'
  });
  assert.deepEqual(getSensitiveAmountParts('10,000,000', 'lamports', false), {
    amountText: HIDDEN_AMOUNT_TEXT,
    unitText: 'lamports'
  });
});

test('getSensitiveAmountText never uses dot bullets for hidden amounts', () => {
  assert.notEqual(getSensitiveAmountText('10,000,000', false), '••••••');
});

test('getSensitiveAmountParts rejects unsafe display values', () => {
  assert.throws(() => getSensitiveAmountText('', true), /金额文本 长度必须在 1 到 64 之间/);
  assert.throws(() => getSensitiveAmountText('<script>', true), /金额文本 包含非法展示字符/);
  assert.throws(() => getSensitiveAmountParts('1', 'SOL<script>', true), /金额单位 包含非法展示字符/);
});
