import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FAST_DIALOG_ENTER_MS,
  FAST_DIALOG_EXIT_MS,
  normalizeDialogAnimationDuration
} from '../src/utils/dialogMotion.js';

test('dialog motion defaults stay below slow native fade timing', () => {
  assert.equal(FAST_DIALOG_ENTER_MS, 96);
  assert.equal(FAST_DIALOG_EXIT_MS, 72);
  assert.ok(FAST_DIALOG_ENTER_MS < 180);
  assert.ok(FAST_DIALOG_EXIT_MS < FAST_DIALOG_ENTER_MS);
});

test('dialog motion duration rejects invalid values and clamps unsafe ranges', () => {
  assert.equal(normalizeDialogAnimationDuration(Number.NaN, FAST_DIALOG_ENTER_MS), FAST_DIALOG_ENTER_MS);
  assert.equal(normalizeDialogAnimationDuration(-12, FAST_DIALOG_ENTER_MS), 0);
  assert.equal(normalizeDialogAnimationDuration(260, FAST_DIALOG_ENTER_MS), 180);
  assert.equal(normalizeDialogAnimationDuration(95.6, FAST_DIALOG_ENTER_MS), 96);
});
