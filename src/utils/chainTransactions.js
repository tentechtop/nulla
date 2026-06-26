import bs58 from 'bs58';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import nacl from 'tweetnacl';
import {
  base64FromBytes,
  bytesFromBase64,
  checkedAddUint64,
  concatBytes,
  encodeBytes,
  encodeShortVecLength,
  encodeString,
  encodeUint16LE,
  encodeUint32LE,
  encodeUint64LE,
  validateUint64
} from './byteEncoding.js';
import { RAW_PUBLIC_KEY_BYTES, deriveSigningKeyPairFromSeed, normalizeRawOrSystemAddress } from './addressSpec.js';

const SIGNATURE_BYTES = 64;
const MAX_PROGRAM_DATA_BYTES = 256 * 1024;
const SYSTEM_PROGRAM_ID = '11111111111111111111111111111111';
const STAKE_PROGRAM_ID = 'Stake11111111111111111111111111111111111111';
const BPF_LOADER_PROGRAM_ID = 'BPFLoader2111111111111111111111111111111111';
const SVM_BYTECODE_HEADER = 'SVM1';
const SYSTEM_INSTRUCTION_CREATE_ACCOUNT = 0;
const SYSTEM_INSTRUCTION_TRANSFER = 2;
const STAKE_INSTRUCTION_REGISTER_VALIDATOR = 0;
const STAKE_INSTRUCTION_SELF_STAKE = 1;
const STAKE_INSTRUCTION_UNSTAKE = 2;
const STAKE_INSTRUCTION_WITHDRAW_UNSTAKED = 3;
const STAKE_INSTRUCTION_DELEGATE = 7;
const STAKE_INSTRUCTION_UNDELEGATE = 8;
const STAKE_INSTRUCTION_WITHDRAW_DELEGATION = 9;
const STAKE_INSTRUCTION_UPDATE_COMMISSION = 10;
const BPF_LOADER_INSTRUCTION_DEPLOY = 2;
const RENT_ACCOUNT_STORAGE_OVERHEAD_BYTES = 128n;
const RENT_LAMPORTS_PER_BYTE_YEAR = 3480n;
const RENT_EXEMPTION_THRESHOLD_YEARS = 2n;

export const DEPLOY_CONTRACT_ESTIMATED_FEE_LAMPORTS = 10_000n;

export function buildSignedTransferTransaction(input) {
  const sourceKeyPair = deriveSigningKeyPairFromSeed(input.sourceSeed);
  const instructionData = concatBytes([
    encodeUint32LE(SYSTEM_INSTRUCTION_TRANSFER),
    encodeUint64LE(input.lamports)
  ]);

  return signSingleAuthorityTransaction({
    authorityPublicKey: sourceKeyPair.publicKey,
    authoritySecretKey: sourceKeyPair.secretKey,
    programId: SYSTEM_PROGRAM_ID,
    accountMetas: [
      { publicKey: sourceKeyPair.publicKey, isSigner: true, isWritable: true },
      { publicKey: publicKeyFromAddress(input.destinationAddress, '收款地址'), isSigner: false, isWritable: true },
      { publicKey: publicKeyFromBase58(SYSTEM_PROGRAM_ID, 'system program id'), isSigner: false, isWritable: false }
    ],
    programIdIndex: 2,
    accountIndexes: [0, 1],
    recentBlockhash: hashFromBase58(input.recentBlockhash),
    instructionData
  });
}

export function buildSignedStakeTransaction(input) {
  return buildSignedStakeLikeTransaction(input, STAKE_INSTRUCTION_SELF_STAKE);
}

export function buildSignedUnstakeTransaction(input) {
  return buildSignedStakeLikeTransaction(input, STAKE_INSTRUCTION_UNSTAKE, input.unlockEpoch);
}

export function buildSignedWithdrawUnstakedTransaction(input) {
  return buildSignedStakeLikeTransaction({ ...input, lamports: 0n }, STAKE_INSTRUCTION_WITHDRAW_UNSTAKED, input.currentEpoch);
}

export function buildSignedDelegateTransaction(input) {
  return buildSignedStakeLikeTransaction(input, STAKE_INSTRUCTION_DELEGATE);
}

export function buildSignedUndelegateTransaction(input) {
  return buildSignedStakeLikeTransaction(input, STAKE_INSTRUCTION_UNDELEGATE, input.unlockEpoch);
}

export function buildSignedWithdrawDelegationTransaction(input) {
  return buildSignedStakeLikeTransaction({ ...input, lamports: 0n }, STAKE_INSTRUCTION_WITHDRAW_DELEGATION, input.currentEpoch);
}

export function buildSignedUpdateCommissionTransaction(input) {
  return buildSignedStakeLikeTransaction(
    { ...input, lamports: 0n },
    STAKE_INSTRUCTION_UPDATE_COMMISSION,
    0n,
    normalizeCommissionBps(input.commissionBps)
  );
}

export function buildSignedRegisterValidatorTransaction(input) {
  const stakerKeyPair = deriveSigningKeyPairFromSeed(input.stakerSeed);
  const instructionData = encodeStakeInstruction({
    type: STAKE_INSTRUCTION_REGISTER_VALIDATOR,
    consensusPublicKey: publicKeyFromAddress(input.consensusPublicKey, 'consensus public key'),
    peerId: input.peerId,
    commissionBps: normalizeCommissionBps(input.commissionBps ?? 0),
    amount: input.lamports,
    unlockEpoch: 0n,
    blsPublicKey: sizedBytesFromBase58(input.blsPublicKey, 'bls public key', 128)
  });

  return signStakeTransaction({
    stakerPublicKey: stakerKeyPair.publicKey,
    stakerSecretKey: stakerKeyPair.secretKey,
    validatorPublicKey: publicKeyFromAddress(input.validatorAddress, '验证者地址'),
    recentBlockhash: hashFromBase58(input.recentBlockhash),
    instructionData
  });
}

export function buildSignedDeployContractTransaction(input) {
  const bytecode = bytesFromBase64(input.bytecodeBase64);
  validateDeployBytecode(bytecode, input.bytecodeHash);
  validateUint64(input.depositLamports, 'deploy deposit lamports');

  const payerKeyPair = deriveSigningKeyPairFromSeed(input.payerSeed);
  const programKeyPair = programKeyPairFromDeployRequest(input);
  const rentLamports = minimumBalanceForRentExemption(bytecode.length);
  const programLamports = checkedAddUint64(rentLamports, input.depositLamports, 'program lamports');
  const createAccountData = encodeCreateAccountInstruction(programLamports, BigInt(bytecode.length));
  const deployData = encodeBpfLoaderDeployInstruction(bytecode);
  const message = encodeMessage({
    accounts: [
      { publicKey: payerKeyPair.publicKey, isSigner: true, isWritable: true },
      { publicKey: programKeyPair.publicKey, isSigner: true, isWritable: true },
      { publicKey: publicKeyFromBase58(SYSTEM_PROGRAM_ID, 'system program id'), isSigner: false, isWritable: false },
      { publicKey: publicKeyFromBase58(BPF_LOADER_PROGRAM_ID, 'bpf loader program id'), isSigner: false, isWritable: false }
    ],
    recentBlockhash: hashFromBase58(input.recentBlockhash),
    instructions: [
      {
        programIdIndex: 2,
        accountIndexes: [0, 1],
        data: createAccountData
      },
      {
        programIdIndex: 3,
        accountIndexes: [1],
        data: deployData
      }
    ]
  });
  const payerSignature = signMessage(message, payerKeyPair.secretKey);
  const programSignature = signMessage(message, programKeyPair.secretKey);

  return {
    encodedTransaction: base64FromBytes(concatBytes([encodeShortVecLength(2), payerSignature, programSignature, message])),
    programAddress: bs58.encode(programKeyPair.publicKey),
    programLamports,
    rentLamports,
    depositLamports: input.depositLamports,
    bytecodeLength: bytecode.length,
    estimatedFeeLamports: DEPLOY_CONTRACT_ESTIMATED_FEE_LAMPORTS
  };
}

export function minimumBalanceForRentExemption(dataLength) {
  if (!Number.isSafeInteger(dataLength) || dataLength < 0 || dataLength > MAX_PROGRAM_DATA_BYTES) {
    throw new Error(`程序字节码长度必须在 0..${MAX_PROGRAM_DATA_BYTES} 字节`);
  }
  return (BigInt(dataLength) + RENT_ACCOUNT_STORAGE_OVERHEAD_BYTES)
    * RENT_LAMPORTS_PER_BYTE_YEAR
    * RENT_EXEMPTION_THRESHOLD_YEARS;
}

export function validateDeployBytecode(bytecode, expectedHash) {
  if (bytecode.length === 0) {
    throw new Error('合约字节码不能为空');
  }
  if (bytecode.length > MAX_PROGRAM_DATA_BYTES) {
    throw new Error(`合约字节码不能超过 ${MAX_PROGRAM_DATA_BYTES} 字节`);
  }

  const header = String.fromCharCode(...bytecode.slice(0, SVM_BYTECODE_HEADER.length));
  if (header !== SVM_BYTECODE_HEADER) {
    throw new Error('合约字节码不是 SVM1 格式');
  }

  const actualHash = bytesToHex(sha256(bytecode));
  if (actualHash !== String(expectedHash).trim().toLowerCase()) {
    throw new Error('合约字节码哈希与部署请求不一致');
  }
}

export function parseLamports(value) {
  const trimmedValue = String(value).trim();
  if (!/^[1-9][0-9]*$/.test(trimmedValue)) {
    throw new Error('lamports 必须是正整数');
  }

  const lamports = BigInt(trimmedValue);
  validateUint64(lamports, 'lamports');
  return lamports;
}

function buildSignedStakeLikeTransaction(input, instructionType, unlockEpoch = 0n, commissionBps = 0) {
  const stakerKeyPair = deriveSigningKeyPairFromSeed(input.stakerSeed);
  const resolvedLamports = input.lamports ?? 0n;
  const resolvedUnlockEpoch = normalizeUint64BigInt(unlockEpoch, 'unlock epoch');
  const instructionData = encodeStakeInstruction({
    type: instructionType,
    consensusPublicKey: new Uint8Array(RAW_PUBLIC_KEY_BYTES),
    peerId: '',
    commissionBps,
    amount: resolvedLamports,
    unlockEpoch: resolvedUnlockEpoch,
    blsPublicKey: new Uint8Array()
  });

  return signStakeTransaction({
    stakerPublicKey: stakerKeyPair.publicKey,
    stakerSecretKey: stakerKeyPair.secretKey,
    validatorPublicKey: publicKeyFromAddress(input.validatorAddress, '验证者地址'),
    recentBlockhash: hashFromBase58(input.recentBlockhash),
    instructionData
  });
}

function signStakeTransaction(input) {
  return signSingleAuthorityTransaction({
    authorityPublicKey: input.stakerPublicKey,
    authoritySecretKey: input.stakerSecretKey,
    programId: STAKE_PROGRAM_ID,
    accountMetas: [
      { publicKey: input.stakerPublicKey, isSigner: true, isWritable: true },
      { publicKey: input.validatorPublicKey, isSigner: false, isWritable: true },
      { publicKey: publicKeyFromBase58(STAKE_PROGRAM_ID, 'stake program id'), isSigner: false, isWritable: false }
    ],
    programIdIndex: 2,
    accountIndexes: [0, 1],
    recentBlockhash: input.recentBlockhash,
    instructionData: input.instructionData
  });
}

function signSingleAuthorityTransaction(input) {
  const message = encodeMessage({
    accounts: input.accountMetas,
    recentBlockhash: input.recentBlockhash,
    instructions: [
      {
        programIdIndex: input.programIdIndex,
        accountIndexes: input.accountIndexes,
        data: input.instructionData
      }
    ]
  });
  const signature = signMessage(message, input.authoritySecretKey);
  return base64FromBytes(concatBytes([encodeShortVecLength(1), signature, message]));
}

function signMessage(message, secretKey) {
  const signature = nacl.sign.detached(message, secretKey);
  if (signature.length !== SIGNATURE_BYTES) {
    throw new Error('签名长度异常');
  }
  return signature;
}

function encodeMessage(input) {
  const requiredSignatures = input.accounts.filter((account) => account.isSigner).length;
  const readonlySignedAccounts = input.accounts.filter((account) => account.isSigner && !account.isWritable).length;
  const readonlyUnsignedAccounts = input.accounts.filter((account) => !account.isSigner && !account.isWritable).length;

  return concatBytes([
    Uint8Array.from([requiredSignatures, readonlySignedAccounts, readonlyUnsignedAccounts]),
    encodeShortVecLength(input.accounts.length),
    ...input.accounts.map((account) => account.publicKey),
    input.recentBlockhash,
    encodeShortVecLength(input.instructions.length),
    ...input.instructions.map(encodeCompiledInstruction)
  ]);
}

function encodeCompiledInstruction(instruction) {
  return concatBytes([
    Uint8Array.from([instruction.programIdIndex]),
    encodeShortVecLength(instruction.accountIndexes.length),
    Uint8Array.from(instruction.accountIndexes),
    encodeShortVecLength(instruction.data.length),
    instruction.data
  ]);
}

function encodeStakeInstruction(input) {
  validateUint64(input.amount, 'stake lamports');
  validateUint64(input.unlockEpoch, 'unlock epoch');
  if (input.peerId.length > 128) {
    throw new Error('P2P PeerID 不能超过 128 个字符');
  }
  if (input.commissionBps < 0 || input.commissionBps > 10000) {
    throw new Error('commission bps 必须在 0..10000');
  }

  return concatBytes([
    encodeUint32LE(input.type),
    requireSizedBytes(input.consensusPublicKey, RAW_PUBLIC_KEY_BYTES, 'consensus public key'),
    encodeString(input.peerId),
    encodeUint16LE(input.commissionBps),
    encodeUint64LE(input.amount),
    encodeUint64LE(input.unlockEpoch),
    encodeBytes(input.blsPublicKey)
  ]);
}

function encodeCreateAccountInstruction(lamports, space) {
  return concatBytes([
    encodeUint32LE(SYSTEM_INSTRUCTION_CREATE_ACCOUNT),
    encodeUint64LE(lamports),
    encodeUint64LE(space),
    publicKeyFromBase58(BPF_LOADER_PROGRAM_ID, 'bpf loader program id')
  ]);
}

function encodeBpfLoaderDeployInstruction(bytecode) {
  return concatBytes([
    encodeUint32LE(BPF_LOADER_INSTRUCTION_DEPLOY),
    encodeUint32LE(0),
    encodeBytes(bytecode)
  ]);
}

function programKeyPairFromDeployRequest(input) {
  const saltText = input.programSeedSalt ?? `${Date.now()}-${Math.random()}`;
  const seedText = [
    String(input.payerSeed).trim(),
    'svm-program',
    String(input.requestId).trim(),
    String(input.bytecodeHash).trim().toLowerCase(),
    saltText
  ].join('|');
  return nacl.sign.keyPair.fromSeed(sha256(utf8ToBytes(seedText)));
}

function publicKeyFromAddress(value, fieldName) {
  const rawAddress = normalizeRawOrSystemAddress(value, fieldName);
  return publicKeyFromBase58(rawAddress, fieldName);
}

function publicKeyFromBase58(value, fieldName) {
  return requireSizedBytes(bs58.decode(String(value).trim()), RAW_PUBLIC_KEY_BYTES, fieldName);
}

function hashFromBase58(value) {
  return requireSizedBytes(bs58.decode(String(value).trim()), RAW_PUBLIC_KEY_BYTES, 'recent blockhash');
}

function sizedBytesFromBase58(value, fieldName, maxBytes) {
  const decoded = bs58.decode(String(value).trim());
  if (decoded.length === 0 || decoded.length > maxBytes) {
    throw new Error(`${fieldName} 长度必须是 1..${maxBytes} 字节`);
  }
  return decoded;
}

function normalizeUint64BigInt(value, fieldName) {
  if (typeof value === 'bigint') {
    validateUint64(value, fieldName);
    return value;
  }

  if (Number.isSafeInteger(value) && value >= 0) {
    return BigInt(value);
  }

  if (typeof value === 'string' && /^[0-9]+$/.test(value.trim())) {
    const normalizedValue = BigInt(value.trim());
    validateUint64(normalizedValue, fieldName);
    return normalizedValue;
  }

  throw new Error(`${fieldName} 必须是 uint64`);
}

function normalizeCommissionBps(value) {
  const normalizedValue = Number(value);
  if (!Number.isSafeInteger(normalizedValue) || normalizedValue < 0 || normalizedValue > 10000) {
    throw new Error('commission bps 必须在 0..10000');
  }
  return normalizedValue;
}

function requireSizedBytes(value, size, fieldName) {
  if (value.length !== size) {
    throw new Error(`${fieldName} 必须是 ${size} 字节`);
  }
  return value;
}
