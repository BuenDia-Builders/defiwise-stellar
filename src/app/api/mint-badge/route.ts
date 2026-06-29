import { NextRequest, NextResponse } from "next/server";
import * as StellarSdk from "@stellar/stellar-sdk";
import {
  CONTRACTS,
  NETWORK_PASSPHRASE,
  server,
  buildMintBadgeArgs,
  hasBadge,
} from "@/lib/stellar";

// Rate limiting store (in production, use Redis or a proper rate limiter)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userPublicKey: string): boolean {
  const now = Date.now();
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10);
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "10", 10);

  const key = `mint-badge:${userPublicKey}`;
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { userPublicKey, moduleId, moduleTitle, xpEarned, quizScore } = body;

    // Validate required fields
    if (!userPublicKey || typeof userPublicKey !== "string") {
      return NextResponse.json(
        { error: "userPublicKey is required and must be a string" },
        { status: 400 }
      );
    }

    if (!moduleId || typeof moduleId !== "string") {
      return NextResponse.json(
        { error: "moduleId is required and must be a string" },
        { status: 400 }
      );
    }

    if (!moduleTitle || typeof moduleTitle !== "string") {
      return NextResponse.json(
        { error: "moduleTitle is required and must be a string" },
        { status: 400 }
      );
    }

    if (typeof xpEarned !== "number" || xpEarned <= 0) {
      return NextResponse.json(
        { error: "xpEarned must be a positive number" },
        { status: 400 }
      );
    }

    if (
      typeof quizScore !== "number" ||
      quizScore < 0 ||
      quizScore > 100
    ) {
      return NextResponse.json(
        { error: "quizScore must be a number between 0 and 100" },
        { status: 400 }
      );
    }

    // Validate Stellar public key format
    try {
      StellarSdk.StrKey.decodeEd25519PublicKey(userPublicKey);
    } catch {
      return NextResponse.json(
        { error: "Invalid Stellar public key format" },
        { status: 400 }
      );
    }

    // Rate limiting
    if (!checkRateLimit(userPublicKey)) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please try again later.",
        },
        { status: 429 }
      );
    }

    // Check if badge already exists for this module (early validation)
    const alreadyMinted = await hasBadge(userPublicKey, moduleId);
    if (alreadyMinted) {
      return NextResponse.json(
        { error: "Badge already minted for this module" },
        { status: 409 }
      );
    }

    // Get admin secret key from environment
    const adminSecretKey = process.env.ADMIN_SECRET_KEY;
    if (!adminSecretKey) {
      console.error("ADMIN_SECRET_KEY not configured");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Build admin keypair
    const adminKeypair = StellarSdk.Keypair.fromSecret(adminSecretKey);
    const adminPublicKey = adminKeypair.publicKey();

    // Build the contract call arguments
    const args = buildMintBadgeArgs(
      userPublicKey,
      moduleId,
      moduleTitle,
      xpEarned,
      quizScore
    );

    // Get admin account
    const adminAccount = await server.getAccount(adminPublicKey);

    // Build transaction
    const contract = new StellarSdk.Contract(CONTRACTS.BADGE_NFT);
    const tx = new StellarSdk.TransactionBuilder(adminAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call("mint_badge", ...args))
      .setTimeout(30)
      .build();

    // Simulate transaction
    const simResponse = await server.simulateTransaction(tx);

    if (StellarSdk.rpc.Api.isSimulationError(simResponse)) {
      const errorResponse =
        simResponse as StellarSdk.rpc.Api.SimulateTransactionErrorResponse;
      console.error("Simulation error:", errorResponse.error);
      return NextResponse.json(
        {
          error: "Transaction simulation failed",
          details: errorResponse.error,
        },
        { status: 400 }
      );
    }

    // Assemble transaction with simulation results
    const assembled = StellarSdk.rpc.assembleTransaction(
      tx,
      simResponse as StellarSdk.rpc.Api.SimulateTransactionSuccessResponse
    ).build();

    // Sign with admin key
    assembled.sign(adminKeypair);

    // Submit transaction
    const sendResponse = await server.sendTransaction(assembled);

    if (sendResponse.status === "ERROR") {
      console.error("Transaction send error:", sendResponse);
      return NextResponse.json(
        {
          error: "Failed to submit transaction",
          details: sendResponse.errorResult?.toString(),
        },
        { status: 500 }
      );
    }

    const txHash = sendResponse.hash;

    // Poll for transaction result
    let getResponse: StellarSdk.rpc.Api.GetTransactionResponse;
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout

    // eslint-disable-next-line no-constant-condition
    while (true) {
      getResponse = await server.getTransaction(txHash);

      if (
        getResponse.status !==
        StellarSdk.rpc.Api.GetTransactionStatus.NOT_FOUND
      ) {
        break;
      }

      attempts++;
      if (attempts >= maxAttempts) {
        return NextResponse.json(
          {
            error: "Transaction timeout",
            hash: txHash,
            message: "Transaction submitted but result not confirmed in time",
          },
          { status: 202 }
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (getResponse.status === StellarSdk.rpc.Api.GetTransactionStatus.FAILED) {
      console.error("Transaction failed:", getResponse);
      return NextResponse.json(
        {
          error: "Transaction failed on-chain",
          hash: txHash,
          details: getResponse.resultXdr?.toString(),
        },
        { status: 400 }
      );
    }

    // Extract token ID from result if available
    let tokenId: number | undefined;
    try {
      const successResponse =
        getResponse as StellarSdk.rpc.Api.GetSuccessfulTransactionResponse;
      if (successResponse.returnValue) {
        tokenId = Number(StellarSdk.scValToNative(successResponse.returnValue));
      }
    } catch {
      // If we can't extract the token ID, that's okay
    }

    // Success!
    return NextResponse.json({
      success: true,
      hash: txHash,
      tokenId,
      message: `Successfully minted badge for module ${moduleId}`,
    });
  } catch (error) {
    console.error("Mint badge error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
