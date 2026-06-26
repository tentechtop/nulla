export type DeployRequestQRCode = {
  readonly bytecodeHash: string;
  readonly expiresAtUnixMillis: number;
  readonly requestUrl: string;
  readonly type: 'svm_deploy_request';
  readonly version: 1;
};

export type ContractManifestSummary = {
  readonly computeUnitLimit: string;
  readonly name: string;
  readonly requiredSyscalls: readonly string[];
  readonly upgradeAuthority: string;
  readonly version: string;
};

export type LoadedDeployRequest = {
  readonly bytecodeBase64: string;
  readonly bytecodeHash: string;
  readonly bytecodeLength: number;
  readonly chainId: string;
  readonly contractName: string;
  readonly depositLamports: bigint;
  readonly expiresAtUnixMillis: number;
  readonly id: string;
  readonly manifest: ContractManifestSummary;
  readonly requestUrl: string;
  readonly resultUrl: string;
  readonly rpcUrl: string;
};

export type DeployRequestResult =
  | {
      readonly programAddress: string;
      readonly signature: string;
      readonly status: 'submitted';
      readonly submittedAtUnixMillis: number;
      readonly walletAddress: string;
    }
  | {
      readonly reason: string;
      readonly status: 'rejected';
      readonly submittedAtUnixMillis: number;
      readonly walletAddress: string;
    }
  | {
      readonly error: string;
      readonly status: 'failed';
      readonly submittedAtUnixMillis: number;
      readonly walletAddress: string;
    };

export declare function parseDeployRequestQRCode(value: string): DeployRequestQRCode | null;
export declare function isDeployRequestQRCode(value: string): boolean;
export declare function loadDeployRequestFromQRCode(value: string, fetchImpl?: typeof fetch): Promise<LoadedDeployRequest>;
export declare function postDeployRequestResult(request: LoadedDeployRequest, result: DeployRequestResult, fetchImpl?: typeof fetch): Promise<void>;
