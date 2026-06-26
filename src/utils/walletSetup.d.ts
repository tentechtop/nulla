export type WalletAccountTone = 'main' | 'trade' | 'watch';

export type WalletAccount = {
  readonly address: string;
  readonly label: string;
  readonly status: string;
  readonly tone: WalletAccountTone;
};

export declare const INITIAL_MNEMONIC_WORDS: readonly string[];
export declare const INITIAL_WALLET_ACCOUNTS: readonly WalletAccount[];

export declare function getDefaultWalletAccountLabel(accountIndex: number): string;
export declare function createMnemonicWords(wordCount?: 12 | 18 | 24, randomBytes?: Uint8Array): string[];
export declare function validateMnemonicWords(words: readonly string[]): string;
export declare function parseMnemonicText(text: string): string[];
export declare function verifyMnemonicWord(words: readonly string[], wordNumber: number, answer: string): boolean;
export declare function formatShortAddress(address: string, prefixLength?: number, suffixLength?: number): string;
export declare function sanitizeWalletAccountLabelInput(label: unknown): string;
export declare function normalizeWalletAccountLabel(label: unknown): string;
export declare function createWalletAccountFromMnemonic(words: readonly string[], accountIndex: number, label?: string): WalletAccount;
export declare function upsertWalletAccount(accounts: readonly WalletAccount[], nextAccount: WalletAccount): WalletAccount[];
export declare function selectWalletAccount(accounts: readonly WalletAccount[], selectedAddress: string): string;
export declare function removeWalletAccount(
  accounts: readonly WalletAccount[],
  removedAddress: string,
  currentAddress: string
): {
  readonly accounts: WalletAccount[];
  readonly currentAddress: string;
};
