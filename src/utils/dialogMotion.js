export const FAST_DIALOG_ENTER_MS = 96;
export const FAST_DIALOG_EXIT_MS = 72;

const MIN_DIALOG_ANIMATION_MS = 0;
const MAX_DIALOG_ANIMATION_MS = 180;

export function normalizeDialogAnimationDuration(value, fallback) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  const duration = Math.round(value);

  if (duration < MIN_DIALOG_ANIMATION_MS) {
    return MIN_DIALOG_ANIMATION_MS;
  }

  if (duration > MAX_DIALOG_ANIMATION_MS) {
    return MAX_DIALOG_ANIMATION_MS;
  }

  return duration;
}
