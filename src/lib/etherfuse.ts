/**
 * Etherfuse Stablebonds Client & Data Models
 * Integration for DeFiWise Inflation Module (mod-3)
 *
 * Public API Reference: https://api.etherfuse.com/lookup/stablebonds
 * Etherfuse tokenizes sovereign bonds (CETES, USTRY, TESOURO, EUROB, etc.) on Stellar.
 */

export interface EtherfuseBlockchainInfo {
  blockchain: string;
  tokenIdentifier: string;
  totalSupply: string;
  decimals: number;
}

export interface EtherfuseRawStablebond {
  name: string;
  symbol: string;
  netAmountDecimal?: string;
  netValueDecimal?: string;
  bondCurrency: string;
  tokenPriceDecimal: string;
  purchaseOrderAmount?: string;
  redeemOrderAmount?: string;
  blockchains: EtherfuseBlockchainInfo[];
  solanaMintAddress?: string;
}

export interface EtherfuseLookupResponse {
  calculatedAt: string;
  stablebonds: EtherfuseRawStablebond[];
}

export interface StablebondYieldItem {
  name: string;
  symbol: string;
  currency: string;
  country: string;
  countryFlag: string;
  currentPrice: number;
  appreciationPercent: number;
  benchmarkRateDescription: string;
  stellarTokenIdentifier: string;
  stellarIssuer: string;
  stellarAssetCode: string;
  stellarDecimals: number;
  stellarTotalSupply: string;
}

export interface EtherfuseYieldsResult {
  calculatedAt: string;
  items: StablebondYieldItem[];
  isFallback: boolean;
  stale: boolean;
}

// Benchmark metadata mapping for educational context
const BENCHMARK_METADATA: Record<
  string,
  { country: string; flag: string; rateDescription: string }
> = {
  CETES: {
    country: "México",
    flag: "🇲🇽",
    rateDescription: "Cetes 28d Banco de México (~10.5% - 11.0% TNA)",
  },
  USTRY: {
    country: "Estados Unidos",
    flag: "🇺🇸",
    rateDescription: "US Treasury Bills (~4.5% - 5.0% TNA)",
  },
  TESOURO: {
    country: "Brasil",
    flag: "🇧🇷",
    rateDescription: "Tesouro Selic Banco Central do Brasil (~10.75% - 12.0% TNA)",
  },
  EUROB: {
    country: "Unión Europea",
    flag: "🇪🇺",
    rateDescription: "Bonos Soberanos UE / BCE (~3.0% - 3.5% TNA)",
  },
  GILTS: {
    country: "Reino Unido",
    flag: "🇬🇧",
    rateDescription: "UK Gilts Bank of England (~4.2% - 4.8% TNA)",
  },
  KTB: {
    country: "Corea del Sur",
    flag: "🇰🇷",
    rateDescription: "Korea Treasury Bonds (~3.0% - 3.4% TNA)",
  },
  MEX: {
    country: "México",
    flag: "🇲🇽",
    rateDescription: "Tasa de fondeo interbancario MXN (~10.5% TNA)",
  },
};

/**
 * Verified production snapshot used as fallback if the network or CORS fails
 */
export const FALLBACK_ETHERFUSE_DATA: EtherfuseLookupResponse = {
  calculatedAt: "2026-10-19T06:03:32.765637075+00:00",
  stablebonds: [
    {
      name: "Etherfuse CETES",
      symbol: "CETES",
      bondCurrency: "MXN",
      tokenPriceDecimal: "1.186732",
      blockchains: [
        {
          blockchain: "stellar",
          tokenIdentifier:
            "CETES-GCRYUGD5NVARGXT56XEZI5CIFCQETYHAPQQTHO2O3IQZTHDH4LATMYWC",
          totalSupply: "54594002.4150018",
          decimals: 7,
        },
      ],
    },
    {
      name: "Etherfuse USTRY",
      symbol: "USTRY",
      bondCurrency: "USD",
      tokenPriceDecimal: "1.077505",
      blockchains: [
        {
          blockchain: "stellar",
          tokenIdentifier:
            "USTRY-GCRYUGD5NVARGXT56XEZI5CIFCQETYHAPQQTHO2O3IQZTHDH4LATMYWC",
          totalSupply: "11513230.8784747",
          decimals: 7,
        },
      ],
    },
    {
      name: "Etherfuse TESOURO",
      symbol: "TESOURO",
      bondCurrency: "BRL",
      tokenPriceDecimal: "1.268294",
      blockchains: [
        {
          blockchain: "stellar",
          tokenIdentifier:
            "TESOURO-GCRYUGD5NVARGXT56XEZI5CIFCQETYHAPQQTHO2O3IQZTHDH4LATMYWC",
          totalSupply: "1210811.2723843",
          decimals: 7,
        },
      ],
    },
    {
      name: "Etherfuse EUROB",
      symbol: "EUROB",
      bondCurrency: "EUR",
      tokenPriceDecimal: "1.031298",
      blockchains: [
        {
          blockchain: "stellar",
          tokenIdentifier:
            "EUROB-GCRYUGD5NVARGXT56XEZI5CIFCQETYHAPQQTHO2O3IQZTHDH4LATMYWC",
          totalSupply: "1.5",
          decimals: 7,
        },
      ],
    },
  ],
};

// In-memory short cache to avoid hammering Etherfuse API (Acceptance Criteria #4)
let cachedResult: EtherfuseYieldsResult | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

export function parseStellarStablebonds(
  rawResponse: EtherfuseLookupResponse,
  isFallback = false
): EtherfuseYieldsResult {
  const items: StablebondYieldItem[] = [];

  for (const b of rawResponse.stablebonds) {
    const stellarBc = b.blockchains.find(
      (bc) => bc.blockchain.toLowerCase() === "stellar"
    );
    if (!stellarBc) continue;

    const price = parseFloat(b.tokenPriceDecimal) || 1.0;
    // Price increases over initial par 1.000000 through compound interest accrual
    const appreciation = Math.max(0, (price - 1.0) * 100);

    // Format is CODE-ISSUER on Stellar
    const parts = stellarBc.tokenIdentifier.split("-");
    const assetCode = parts[0] || b.symbol;
    const issuer = parts[1] || "";

    const meta = BENCHMARK_METADATA[b.symbol] || {
      country: "Global",
      flag: "🌐",
      rateDescription: "Bono Soberano Tokenizado en Stellar",
    };

    items.push({
      name: b.name,
      symbol: b.symbol,
      currency: b.bondCurrency,
      country: meta.country,
      countryFlag: meta.flag,
      currentPrice: Math.round(price * 10000) / 10000,
      appreciationPercent: Math.round(appreciation * 100) / 100,
      benchmarkRateDescription: meta.rateDescription,
      stellarTokenIdentifier: stellarBc.tokenIdentifier,
      stellarIssuer: issuer,
      stellarAssetCode: assetCode,
      stellarDecimals: stellarBc.decimals,
      stellarTotalSupply: stellarBc.totalSupply,
    });
  }

  // Sort so LATAM and USD bonds are prominent (CETES, USTRY, TESOURO, EUROB)
  const priorityOrder = ["CETES", "USTRY", "TESOURO", "EUROB", "GILTS", "KTB"];
  items.sort((a, b) => {
    const idxA = priorityOrder.indexOf(a.symbol);
    const idxB = priorityOrder.indexOf(b.symbol);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.symbol.localeCompare(b.symbol);
  });

  return {
    calculatedAt: rawResponse.calculatedAt,
    items,
    isFallback,
    stale: false,
  };
}

/**
 * Fetch live Etherfuse Stablebonds data from public API with caching and fallback.
 */
export async function fetchEtherfuseStablebonds(options?: {
  forceRefresh?: boolean;
  timeoutMs?: number;
}): Promise<EtherfuseYieldsResult> {
  const now = Date.now();
  if (
    !options?.forceRefresh &&
    cachedResult &&
    now - cacheTimestamp < CACHE_TTL_MS
  ) {
    return cachedResult;
  }

  const timeout = options?.timeoutMs || 5000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch("https://api.etherfuse.com/lookup/stablebonds", {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`Etherfuse API responded with status ${res.status}`);
    }

    const json = (await res.json()) as EtherfuseLookupResponse;
    const result = parseStellarStablebonds(json, false);

    cachedResult = result;
    cacheTimestamp = now;
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn("Using fallback Etherfuse Stablebonds data:", err);

    // If we have previous cached data, return it marked as stale
    if (cachedResult) {
      return {
        ...cachedResult,
        stale: true,
      };
    }

    // Otherwise use verified fallback snapshot
    const fallbackResult = parseStellarStablebonds(FALLBACK_ETHERFUSE_DATA, true);
    cachedResult = fallbackResult;
    cacheTimestamp = now;
    return fallbackResult;
  }
}

export function resetEtherfuseCache(): void {
  cachedResult = null;
  cacheTimestamp = 0;
}
