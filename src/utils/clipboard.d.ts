export type ClipboardResult = {
  readonly message: string;
  readonly ok: boolean;
};

export declare function normalizeClipboardText(text: string): string;
export declare function copyTextToClipboard(text: string, successMessage?: string): Promise<ClipboardResult>;
