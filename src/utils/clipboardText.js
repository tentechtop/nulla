const MAX_CLIPBOARD_TEXT_LENGTH = 4096;
const UNSAFE_CONTROL_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

export function normalizeClipboardText(text) {
  if (typeof text !== 'string') {
    throw new TypeError('复制内容必须是字符串');
  }

  const normalizedText = text.trim();
  if (normalizedText.length === 0) {
    throw new Error('复制内容不能为空');
  }

  if (normalizedText.length > MAX_CLIPBOARD_TEXT_LENGTH) {
    throw new RangeError('复制内容过长');
  }

  if (UNSAFE_CONTROL_PATTERN.test(normalizedText)) {
    throw new Error('复制内容包含非法控制字符');
  }

  return normalizedText;
}
