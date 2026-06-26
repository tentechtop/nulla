import { setStringAsync } from 'expo-clipboard';
import { normalizeClipboardText } from './clipboardText.js';

export { normalizeClipboardText } from './clipboardText.js';

export async function copyTextToClipboard(text, successMessage = '已复制') {
  const normalizedText = normalizeClipboardText(text);

  try {
    if (typeof setStringAsync !== 'function') {
      throw new Error('当前平台未接入系统剪贴板');
    }

    await setStringAsync(normalizedText);
    return {
      message: successMessage,
      ok: true
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`复制内容失败: ${message}`);
  }
}
