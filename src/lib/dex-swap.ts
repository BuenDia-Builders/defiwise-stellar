/* eslint-disable @typescript-eslint/no-explicit-any */
import * as StellarSdk from "@stellar/stellar-sdk";

export const HORIZON_TESTNET_URL = "https://horizon-testnet.stellar.org";
export const FRIENDBOT_URL = "https://friendbot.stellar.org";
export const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

export interface TokenAsset {
  code: string;
  name: string;
  type: "native" | "credit_alphanum4" | "credit_alphanum12";
  issuer?: string;
  decimals: number;
  isNative?: boolean;
  color: string;
}

export const TESTNET_TOKENS: Record<string, TokenAsset> = {
  XLM: {
    code: "XLM",
    name: "Stellar Lumen",
    type: "native",
    decimals: 7,
    isNative: true,
    color: "#08B5E5",
  },
  USDC: {
    code: "USDC",
    name: "USD Coin (Testnet)",
    type: "credit_alphanum4",
    issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
    decimals: 7,
    color: "#2775CA",
  },
  AQUA: {
    code: "AQUA",
    name: "Aquarius Liquidity Token",
    type: "credit_alphanum4",
    issuer: "GBNZILSTVQZ4R7IKQDGHYGY2Q2GLCEW4JHGTH6UDWOZZVWDINQBQBC7J",
    decimals: 7,
    color: "#00E0A4",
  },
  EURC: {
    code: "EURC",
    name: "Euro Coin (Testnet)",
    type: "credit_alphanum4",
    issuer: "GD6WACRODDNGOTV4D2FLHTOOEDAE4QL4KAZNP4JRBXXYZZ25V4W2V626",
    decimals: 7,
    color: "#1E5088",
  },
};

// Base exchange rates relative to XLM for didactic testnet simulation
const TESTNET_RATES_VS_XLM: Record<string, number> = {
  XLM: 1.0,
  USDC: 0.125, // 1 XLM = 0.125 USDC
  AQUA: 215.4, // 1 XLM = 215.4 AQUA
  EURC: 0.115, // 1 XLM = 0.115 EURC
};

export interface DEXQuote {
  fromAsset: string;
  toAsset: string;
  fromAmount: number;
  expectedOutput: number;
  minimumReceived: number;
  rate: number;
  priceImpactPct: number;
  feePct: number;
  feeAmount: number;
  slippagePct: number;
  route: string[];
  provider: "Soroswap" | "Aquarius" | "Stellar AMM";
}

export interface CompletedSwap {
  txHash: string;
  fromAsset: string;
  toAsset: string;
  fromAmount: number;
  toAmount: number;
  timestamp: number;
  network: "Stellar Testnet";
  explorerUrl: string;
}

/**
 * Calculates a simulated or real AMM quote with slippage, pool fees, and price impact.
 */
export function calculateDEXQuote(
  fromCode: string,
  toCode: string,
  fromAmount: number,
  slippagePct = 0.5
): DEXQuote {
  if (fromCode === toCode || fromAmount <= 0) {
    return {
      fromAsset: fromCode,
      toAsset: toCode,
      fromAmount,
      expectedOutput: 0,
      minimumReceived: 0,
      rate: 1,
      priceImpactPct: 0,
      feePct: 0.3,
      feeAmount: 0,
      slippagePct,
      route: [fromCode, toCode],
      provider: "Soroswap",
    };
  }

  const fromRate = TESTNET_RATES_VS_XLM[fromCode] || 1;
  const toRate = TESTNET_RATES_VS_XLM[toCode] || 1;

  // Rate = units of toAsset per 1 unit of fromAsset
  const rawRate = toRate / fromRate;

  // 0.3% constant AMM fee (Uniswap/Soroswap standard)
  const feePct = 0.3;
  const effectiveAmount = fromAmount * (1 - feePct / 100);
  const feeAmount = fromAmount * (feePct / 100);

  // Price impact models pool depth (didactic AMM constant product curve x*y=k)
  const priceImpactPct = Math.min(
    Math.max(0.05, (fromAmount / 15000) * 0.45),
    4.5
  );
  const outputAfterImpact =
    effectiveAmount * rawRate * (1 - priceImpactPct / 100);

  const minimumReceived = outputAfterImpact * (1 - slippagePct / 100);

  const provider =
    fromCode === "AQUA" || toCode === "AQUA"
      ? "Aquarius"
      : fromCode === "XLM" || toCode === "XLM"
      ? "Stellar AMM"
      : "Soroswap";

  const route =
    fromCode !== "XLM" && toCode !== "XLM"
      ? [fromCode, "XLM", toCode]
      : [fromCode, toCode];

  return {
    fromAsset: fromCode,
    toAsset: toCode,
    fromAmount,
    expectedOutput: Number(outputAfterImpact.toFixed(6)),
    minimumReceived: Number(minimumReceived.toFixed(6)),
    rate: Number(rawRate.toFixed(6)),
    priceImpactPct: Number(priceImpactPct.toFixed(2)),
    feePct,
    feeAmount: Number(feeAmount.toFixed(6)),
    slippagePct,
    route,
    provider,
  };
}

/**
 * Funds an account with 10,000 Testnet XLM using Friendbot.
 */
export async function fundWithFriendbot(publicKey: string): Promise<{
  success: boolean;
  message: string;
}> {
  if (!publicKey || !publicKey.startsWith("G") || publicKey.length !== 56) {
    return {
      success: false,
      message: "Clave pública de Stellar inválida.",
    };
  }

  try {
    const res = await fetch(
      `${FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`
    );
    if (res.ok) {
      return {
        success: true,
        message:
          "¡Cuenta financiada exitosamente con 10,000 XLM en Stellar Testnet!",
      };
    }

    const text = await res.text();
    if (text.includes("createAccountAlreadyExist") || res.status === 400) {
      return {
        success: true,
        message: "La cuenta ya existe y está activa en Stellar Testnet.",
      };
    }

    return {
      success: false,
      message: `Friendbot devolvió un error (${res.status}): ${text.slice(0, 100)}`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Error al conectar con Friendbot: ${err?.message || "Sin conexión"}`,
    };
  }
}

/**
 * Fetches token balances for an account from Horizon Testnet.
 */
export async function fetchAccountBalances(
  publicKey: string
): Promise<Record<string, number>> {
  const result: Record<string, number> = {
    XLM: 0,
    USDC: 0,
    AQUA: 0,
    EURC: 0,
  };

  if (!publicKey || !publicKey.startsWith("G")) return result;

  try {
    const res = await fetch(
      `${HORIZON_TESTNET_URL}/accounts/${encodeURIComponent(publicKey)}`
    );
    if (!res.ok) {
      // Unfunded or not found on testnet
      return result;
    }

    const data = await res.json();
    if (Array.isArray(data.balances)) {
      for (const b of data.balances) {
        if (b.asset_type === "native") {
          result.XLM = parseFloat(b.balance) || 0;
        } else if (b.asset_code && result[b.asset_code] !== undefined) {
          result[b.asset_code] = parseFloat(b.balance) || 0;
        }
      }
    }
  } catch {
    // Return default empty balances
  }

  return result;
}

/**
 * Builds an unsigned Stellar Testnet swap transaction for the user wallet to sign.
 */
export async function buildTestnetSwapTx(params: {
  userPublicKey: string;
  fromAsset: string;
  toAsset: string;
  fromAmount: string;
  minimumReceived: string;
}): Promise<string> {
  const { userPublicKey, fromAsset, toAsset, fromAmount, minimumReceived } =
    params;

  let sequence = "1";
  try {
    const res = await fetch(
      `${HORIZON_TESTNET_URL}/accounts/${encodeURIComponent(userPublicKey)}`
    );
    if (res.ok) {
      const data = await res.json();
      sequence = data.sequence;
    }
  } catch {
    sequence = "1";
  }

  const account = new StellarSdk.Account(userPublicKey, sequence);

  const sendAssetObj =
    fromAsset === "XLM"
      ? StellarSdk.Asset.native()
      : new StellarSdk.Asset(
          fromAsset,
          TESTNET_TOKENS[fromAsset]?.issuer ||
            "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
        );

  const destAssetObj =
    toAsset === "XLM"
      ? StellarSdk.Asset.native()
      : new StellarSdk.Asset(
          toAsset,
          TESTNET_TOKENS[toAsset]?.issuer ||
            "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5"
        );

  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: "100000", // 0.01 XLM
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      StellarSdk.Operation.pathPaymentStrictSend({
        sendAsset: sendAssetObj,
        sendAmount: Number(fromAmount).toFixed(7),
        destination: userPublicKey,
        destAsset: destAssetObj,
        destMin: Math.max(0.0000001, Number(minimumReceived)).toFixed(7),
        path: [],
      })
    )
    .addMemo(
      StellarSdk.Memo.text(
        `DeFiWise:${fromAsset}->${toAsset}`.slice(0, 28)
      )
    )
    .setTimeout(180)
    .build();

  return tx.toXDR();
}

/**
 * Submits user-signed transaction to Horizon Testnet, returning the txHash.
 */
export async function submitSignedSwapTx(
  signedTxXdr: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    const body = new URLSearchParams();
    body.append("tx", signedTxXdr);

    const res = await fetch(`${HORIZON_TESTNET_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = await res.json();
    if (res.ok && data.hash) {
      return { success: true, txHash: data.hash };
    }

    // If Horizon returned an error or rate limit, generate simulated explorer hash
    const errDetail =
      data?.extras?.result_codes?.transaction ||
      data?.detail ||
      data?.title ||
      "Error al enviar transacción a Horizon Testnet";

    return {
      success: false,
      error: `Horizon Testnet: ${errDetail}`,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Error de conexión: ${err?.message || "Desconocido"}`,
    };
  }
}

/**
 * Persistence helpers for tracking completed swaps in local storage.
 */
const STORAGE_KEY = "defiwise:completed_swaps";

export function recordCompletedSwap(swap: CompletedSwap): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getCompletedSwaps();
    const updated = [swap, ...existing.filter((s) => s.txHash !== swap.txHash)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, 20)));
  } catch {
    // Ignore storage errors
  }
}

export function getCompletedSwaps(): CompletedSwap[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function hasCompletedDEXPractice(): boolean {
  return getCompletedSwaps().length > 0;
}
