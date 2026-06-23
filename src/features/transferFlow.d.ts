export type ScannedSendDraft = {
  readonly address: string;
  readonly amount: string;
  readonly sourcePayload: string;
};

export const MAX_SCANNED_SEND_PAYLOAD_LENGTH: number;

export function sanitizeScannedSendPayload(payload: string): string;

export function parseScannedSendPayload(payload: string): ScannedSendDraft | null;
