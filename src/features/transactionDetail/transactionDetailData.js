const DEFAULT_SIGNATURE = '5k9P7eQxN2Cw8vS4Zt9R1Yh2m3aP2b7cD8fE6gH1jK9L';
const DEFAULT_SENDER_ADDRESS = 'TGT9QRAu2LZMkSSdpCEMNigQqSLG5FXy6hYuBTcZjT5S';
const DEFAULT_RECEIVER_ADDRESS = 'ZfVME5d1V9auappzpxETWDaCNPqB7IQxT4kLmN8oR2yF';
const PENDING_STATUS_TEXT = '处理中';

export const DEFAULT_TRANSACTION_DETAIL_DATA = {
  amountLamports: '1,000,000',
  baseFeeLamports: '2,000',
  blockHash: '602',
  blockHeight: '602',
  burnedFeeLamports: '500',
  computeUsed: '82,345 CU',
  direction: 'outgoing',
  feeLamports: '5,000',
  instructions: [
    { accountCount: '2', id: '1', name: 'system_transfer', program: 'System Program', writableAccountCount: '1' },
    { accountCount: '4', id: '2', name: 'asset_execute', program: 'Token Program', writableAccountCount: '2' },
    { accountCount: '1', id: '3', name: 'memo/optional', program: 'Memo Program', writableAccountCount: '0' }
  ],
  leaderFeeLamports: '1,000',
  location: 'solana-mainnet',
  priorityFeeLamports: '1,500',
  receiverAddress: DEFAULT_RECEIVER_ADDRESS,
  recentBlockhash: '7U1xYz9...3kLmN1pQ',
  senderAddress: DEFAULT_SENDER_ADDRESS,
  signature: DEFAULT_SIGNATURE,
  slot: '1,180',
  status: 'Finalized',
  submitTime: '2024-05-20 18:11:32 (UTC+8)',
  transactionType: '透明转账'
};

export function createSubmittedTransactionDetail(input) {
  const amountLamports = formatLamports(input.amountLamports);
  const receiverAddress = normalizeDisplayField(input.receiverAddress);
  const senderAddress = normalizeDisplayField(input.senderAddress ?? '');
  const signature = normalizeDisplayField(input.signature ?? DEFAULT_SIGNATURE);
  const recentBlockhash = normalizeDisplayField(input.recentBlockhash ?? '-');

  return {
    amountLamports,
    baseFeeLamports: '5,000',
    blockHash: '-',
    blockHeight: formatOptionalNumber(input.blockHeight, '-'),
    burnedFeeLamports: '-',
    computeUsed: '-',
    direction: 'outgoing',
    feeLamports: '5,000',
    instructions: [
      { accountCount: '2', id: '1', name: 'submitted_transaction', program: 'Runtime', writableAccountCount: '2' }
    ],
    leaderFeeLamports: '-',
    location: 'submitted',
    priorityFeeLamports: '0',
    receiverAddress,
    recentBlockhash,
    rpcEndpoint: input.rpcEndpoint,
    senderAddress,
    signature,
    slot: formatOptionalNumber(input.slot, '-'),
    status: input.status ?? PENDING_STATUS_TEXT,
    submitTime: '-',
    transactionType: getTransactionType(input.mode)
  };
}

export function createTransactionDetailFromRpc(detail, fallback = DEFAULT_TRANSACTION_DETAIL_DATA) {
  const accounts = Array.isArray(detail.account_addresses) ? detail.account_addresses : [];
  const writableAccounts = Array.isArray(detail.writable_addresses) ? detail.writable_addresses : [];
  const instructionCount = normalizePositiveCount(detail.instruction_count);

  return {
    ...fallback,
    baseFeeLamports: formatLamportsFromNumber(detail.base_fee_lamports),
    blockHash: normalizeDisplayField(detail.blockhash ?? fallback.blockHash ?? '-'),
    blockHeight: formatOptionalNumber(detail.block_height, '-'),
    burnedFeeLamports: formatLamportsFromNumber(detail.burned_fee_lamports),
    feeLamports: formatLamportsFromNumber(detail.fee_lamports),
    instructions: createRpcInstructionRows(instructionCount, accounts, writableAccounts),
    leaderFeeLamports: formatLamportsFromNumber(detail.leader_fee_lamports),
    location: normalizeDisplayField(detail.location ?? 'unknown'),
    priorityFeeLamports: formatLamportsFromNumber(detail.prioritization_fee_lamports),
    receiverAddress: normalizeDisplayField(fallback.receiverAddress || accounts[1] || '-'),
    recentBlockhash: normalizeDisplayField(detail.recent_blockhash ?? fallback.recentBlockhash ?? '-'),
    senderAddress: normalizeDisplayField((detail.sender ?? fallback.senderAddress) || accounts[0] || '-'),
    signature: normalizeDisplayField(detail.signature ?? fallback.signature),
    slot: formatOptionalNumber(detail.slot, '-'),
    status: mapRpcStatus(detail.status),
    submitTime: formatTimestamp(detail.submit_time_unix_milli)
  };
}

function formatLamports(value) {
  const digits = String(value ?? '').replace(/[^\d]/g, '');
  if (digits.length === 0) {
    return '0';
  }

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getTransactionType(mode) {
  if (mode === 'private') {
    return '隐私转账';
  }

  if (mode === 'privateToTransparent') {
    return '隐私转透明';
  }

  return '透明转账';
}

function normalizeDisplayField(value) {
  return String(value ?? '').trim().slice(0, 96);
}

function formatOptionalNumber(value, fallbackValue) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return fallbackValue;
  }

  return String(Math.trunc(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatLamportsFromNumber(value) {
  if (typeof value === 'bigint') {
    return formatLamports(value.toString());
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return formatLamports(value);
  }

  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return '-';
  }

  return formatLamports(String(Math.trunc(value)));
}

function normalizePositiveCount(value) {
  return Number.isSafeInteger(value) && value > 0 ? value : 1;
}

function createRpcInstructionRows(instructionCount, accounts, writableAccounts) {
  return Array.from({ length: instructionCount }, (_, index) => ({
    accountCount: String(accounts.length),
    id: String(index + 1),
    name: instructionCount === 1 ? 'rpc_transaction' : `rpc_instruction_${index + 1}`,
    program: 'Runtime',
    writableAccountCount: String(writableAccounts.length)
  }));
}

function mapRpcStatus(status) {
  return status === 'finalized' ? 'Finalized' : PENDING_STATUS_TEXT;
}

function formatTimestamp(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return '-';
  }

  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}
