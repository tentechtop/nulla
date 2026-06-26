import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SYSTEM_ADDRESS_MAX_LENGTH,
  SYSTEM_ADDRESS_MIN_LENGTH,
  SYSTEM_ADDRESS_TOTAL_LENGTH,
  assertSystemAddress,
  createDeterministicSystemAddress,
  getSystemAddressKind,
  isSystemAddress
} from '../src/utils/addressSpec.js';

test('system address spec uses uppercase T and Z prefixes', () => {
  const transparentAddress = createDeterministicSystemAddress('wallet seed', 'transparent');
  const shieldedAddress = createDeterministicSystemAddress('wallet seed', 'shielded');

  assert.equal(SYSTEM_ADDRESS_TOTAL_LENGTH, SYSTEM_ADDRESS_MAX_LENGTH);
  assert.equal(transparentAddress.length >= SYSTEM_ADDRESS_MIN_LENGTH, true);
  assert.equal(transparentAddress.length <= SYSTEM_ADDRESS_MAX_LENGTH, true);
  assert.equal(shieldedAddress.length >= SYSTEM_ADDRESS_MIN_LENGTH, true);
  assert.equal(shieldedAddress.length <= SYSTEM_ADDRESS_MAX_LENGTH, true);
  assert.equal(transparentAddress.startsWith('T'), true);
  assert.equal(shieldedAddress.startsWith('Z'), true);
  assert.equal(isSystemAddress(transparentAddress), true);
  assert.equal(isSystemAddress(shieldedAddress), true);
  assert.equal(getSystemAddressKind(transparentAddress), 'transparent');
  assert.equal(getSystemAddressKind(shieldedAddress), 'shielded');
});

test('system address spec rejects legacy and lowercase prefixes', () => {
  const transparentAddress = createDeterministicSystemAddress('wallet seed', 'transparent');
  const shieldedAddress = createDeterministicSystemAddress('wallet seed', 'shielded');

  assert.equal(isSystemAddress(transparentAddress.replace(/^T/, '3')), false);
  assert.equal(isSystemAddress(transparentAddress.replace(/^T/, 't')), false);
  assert.equal(isSystemAddress(shieldedAddress.replace(/^Z/, 'z')), false);
  assert.throws(() => assertSystemAddress('bad-address'), /钱包地址格式无效/);
  assert.throws(() => createDeterministicSystemAddress('', 'transparent'), /地址种子必须是非空字符串/);
  assert.throws(() => createDeterministicSystemAddress('wallet seed', 'legacy'), /地址类型只支持/);
});
