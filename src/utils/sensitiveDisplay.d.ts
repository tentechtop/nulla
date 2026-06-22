export const HIDDEN_AMOUNT_TEXT: string;
export function getSensitiveAmountText(amountText: string, isVisible: boolean): string;
export function getSensitiveAmountParts(
  amountText: string,
  unitText: string,
  isVisible: boolean
): {
  amountText: string;
  unitText: string;
};
