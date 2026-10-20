import * as StellarSdk from "@stellar/stellar-sdk";

// Contract addresses on Stellar Testnet
export const CONTRACTS = {
  XP_TOKEN: "CATAE4HXRWEIVGI2ZW5NGRXIQDNFWZ4YLAKXUU3Q3FKBDT2MPGJECTL4",
  BADGE_NFT: "CDWJE7AM3DFWC6FD2RKBASWP7EITQ2ULJH4FX5JFQRVHXQSXDPJAB3KI",
};

export const ADMIN_PUBLIC_KEY =
  "GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC";

export const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;
export const RPC_URL = "https://soroban-testnet.stellar.org";

// RPC server instance (using the rpc namespace per stellar-ai-guide-mx best practices)
export const server = new StellarSdk.rpc.Server(RPC_URL);

/**
 * Build, simulate, and return a ready-to-sign transaction for a contract call.
 * Follows the simulate → assemble pattern from stellar-ai-guide-mx.
 */
export async function buildContractCall(
  contractId: string,
  method: string,
  args: StellarSdk.xdr.ScVal[],
  sourcePublicKey: string
): Promise<StellarSdk.Transaction> {
  const sourceAccount = await server.getAccount(sourcePublicKey);

  const contract = new StellarSdk.Contract(contractId);
  const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  // Simulate to get the footprint and resource fees
  const simResponse = await server.simulateTransaction(tx);

  if (
    StellarSdk.rpc.Api.isSimulationError(simResponse)
  ) {
    throw new Error(
      `Simulation failed: ${(simResponse as StellarSdk.rpc.Api.SimulateTransactionErrorResponse).error}`
    );
  }

  // Assemble the transaction with the simulation result
  const assembled = StellarSdk.rpc.assembleTransaction(
    tx,
    simResponse as StellarSdk.rpc.Api.SimulateTransactionSuccessResponse
  ).build();

  return assembled;
}

/**
 * Submit a signed transaction and poll until it completes.
 * Follows the send → poll getTransaction pattern from stellar-ai-guide-mx.
 */
export async function submitTransaction(
  signedTxXdr: string
): Promise<StellarSdk.rpc.Api.GetTransactionResponse> {
  const tx = StellarSdk.TransactionBuilder.fromXDR(
    signedTxXdr,
    NETWORK_PASSPHRASE
  );

  const sendResponse = await server.sendTransaction(tx);

  if (sendResponse.status === "ERROR") {
    throw new Error(`Transaction submission failed: ${sendResponse.status}`);
  }

  // Poll for result
  const hash = sendResponse.hash;
  let getResponse: StellarSdk.rpc.Api.GetTransactionResponse;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    getResponse = await server.getTransaction(hash);

    if (getResponse.status !== StellarSdk.rpc.Api.GetTransactionStatus.NOT_FOUND) {
      break;
    }

    // Wait 1 second before polling again
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  if (getResponse.status === StellarSdk.rpc.Api.GetTransactionStatus.FAILED) {
    throw new Error("Transaction failed on-chain");
  }

  return getResponse;
}

/**
 * Read-only contract call (no signing needed).
 */
export async function queryContract(
  contractId: string,
  method: string,
  args: StellarSdk.xdr.ScVal[]
): Promise<StellarSdk.xdr.ScVal | undefined> {
  const account = new StellarSdk.Account(
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    "0"
  );

  const contract = new StellarSdk.Contract(contractId);
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();

  const simResponse = await server.simulateTransaction(tx);

  if (StellarSdk.rpc.Api.isSimulationError(simResponse)) {
    throw new Error(
      `Query failed: ${(simResponse as StellarSdk.rpc.Api.SimulateTransactionErrorResponse).error}`
    );
  }

  const successResponse = simResponse as StellarSdk.rpc.Api.SimulateTransactionSuccessResponse;
  return successResponse.result?.retval;
}

// ─── Pure helpers (no network) ───

/**
 * Compute a 0–100 progress percentage from an on-chain XP value relative to the
 * maximum achievable XP. Always derived from contract data, never localStorage.
 * Clamps to the [0, 100] range and is resilient to bigint inputs.
 */
export function computeXPPercent(
  xp: bigint | number,
  maxXP: number
): number {
  if (!maxXP || maxXP <= 0) return 0;
  const xpNum = typeof xp === "bigint" ? Number(xp) : xp;
  if (!Number.isFinite(xpNum) || xpNum <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((xpNum / maxXP) * 100)));
}

// ─── Helper functions for specific contract calls ───

/**
 * Query XP balance for a user (read-only)
 */
export async function getXPBalance(userPublicKey: string): Promise<bigint> {
  const userAddress = new StellarSdk.Address(userPublicKey).toScVal();
  const result = await queryContract(
    CONTRACTS.XP_TOKEN,
    "balance",
    [userAddress]
  );
  if (!result) return BigInt(0);
  return StellarSdk.scValToNative(result) as bigint;
}

/**
 * Query historical XP balance (never decreases)
 */
export async function getHistoricalXP(userPublicKey: string): Promise<bigint> {
  const userAddress = new StellarSdk.Address(userPublicKey).toScVal();
  const result = await queryContract(
    CONTRACTS.XP_TOKEN,
    "historical_balance",
    [userAddress]
  );
  if (!result) return BigInt(0);
  return StellarSdk.scValToNative(result) as bigint;
}

/**
 * Check if a challenge is already completed
 */
export async function isChallengeCompleted(
  userPublicKey: string,
  challengeId: string
): Promise<boolean> {
  const userAddress = new StellarSdk.Address(userPublicKey).toScVal();
  const challengeStr = StellarSdk.nativeToScVal(challengeId, { type: "string" });
  const result = await queryContract(
    CONTRACTS.XP_TOKEN,
    "is_completed",
    [userAddress, challengeStr]
  );
  if (!result) return false;
  return StellarSdk.scValToNative(result) as boolean;
}

/**
 * Check whether a user's on-chain historical XP meets a minimum threshold.
 *
 * INVARIANT: gating is always based on `historical_balance`, never on the
 * current spendable `balance`. The historical balance is append-only and can
 * never decrease, so token burns or transfers cannot be used to replay modules
 * or game the unlock system.
 *
 * This is a read-only simulation — no signing or XLM fee required.
 */
export async function checkXPRequirement(
  userPublicKey: string,
  minXp: number
): Promise<boolean> {
  if (!userPublicKey || userPublicKey.trim() === "") return false;
  if (minXp <= 0) return true; // no threshold → always pass
  const userAddress = new StellarSdk.Address(userPublicKey).toScVal();
  const minXpScVal = StellarSdk.nativeToScVal(BigInt(minXp), { type: "i128" });
  const result = await queryContract(
    CONTRACTS.XP_TOKEN,
    "meets_requirement",
    [userAddress, minXpScVal]
  );
  if (!result) return false;
  return StellarSdk.scValToNative(result) as boolean;
}

/**
 * Check if user has a badge for a module
 */
export async function hasBadge(
  userPublicKey: string,
  moduleId: string
): Promise<boolean> {
  const userAddress = new StellarSdk.Address(userPublicKey).toScVal();
  const moduleStr = StellarSdk.nativeToScVal(moduleId, { type: "string" });
  const result = await queryContract(
    CONTRACTS.BADGE_NFT,
    "has_badge",
    [userAddress, moduleStr]
  );
  if (!result) return false;
  return StellarSdk.scValToNative(result) as boolean;
}

/**
 * Build a reward_quiz transaction (needs admin signing via backend in production,
 * for testnet demo the user signs and admin is the signer)
 */
export function buildRewardQuizArgs(
  userPublicKey: string,
  challengeId: string,
  correct: number,
  total: number,
  maxXp: number
): StellarSdk.xdr.ScVal[] {
  if (!userPublicKey || userPublicKey.trim() === "") {
    throw new Error("userPublicKey cannot be empty");
  }
  if (!challengeId || challengeId.trim() === "") {
    throw new Error("challengeId cannot be empty");
  }
  if (!Number.isInteger(maxXp) || maxXp <= 0) {
    throw new Error("xpAmount must be a positive integer");
  }

  return [
    new StellarSdk.Address(userPublicKey).toScVal(),
    StellarSdk.nativeToScVal(challengeId, { type: "string" }),
    StellarSdk.nativeToScVal(correct, { type: "u32" }),
    StellarSdk.nativeToScVal(total, { type: "u32" }),
    StellarSdk.nativeToScVal(maxXp, { type: "i128" }),
  ];
}

/**
 * Build a mint_badge transaction args
 */
export function buildMintBadgeArgs(
  userPublicKey: string,
  moduleId: string,
  moduleTitle: string,
  xpEarned: number,
  quizScore: number
): StellarSdk.xdr.ScVal[] {
  if (!userPublicKey || userPublicKey.trim() === "") {
    throw new Error("userPublicKey cannot be empty");
  }
  if (!moduleId || moduleId.trim() === "") {
    throw new Error("moduleId cannot be empty");
  }
  if (!moduleTitle || moduleTitle.trim() === "") {
    throw new Error("moduleTitle cannot be empty");
  }
  if (!Number.isInteger(xpEarned) || xpEarned <= 0) {
    throw new Error("xpAmount must be a positive integer");
  }
  if (quizScore < 0 || quizScore > 100) {
    throw new Error("score must be between 0 and 100");
  }

  return [
    new StellarSdk.Address(userPublicKey).toScVal(),
    StellarSdk.nativeToScVal(moduleId, { type: "string" }),
    StellarSdk.nativeToScVal(moduleTitle, { type: "string" }),
    StellarSdk.nativeToScVal(xpEarned, { type: "i128" }),
    StellarSdk.nativeToScVal(quizScore, { type: "u32" }),
  ];
}
