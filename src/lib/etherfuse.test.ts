/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  parseStellarStablebonds,
  fetchEtherfuseStablebonds,
  FALLBACK_ETHERFUSE_DATA,
  EtherfuseLookupResponse,
  resetEtherfuseCache,
} from "./etherfuse";

describe("Etherfuse Stablebonds Library", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetEtherfuseCache();
  });

  describe("parseStellarStablebonds", () => {
    it("filters and parses only tokens available on the Stellar network", () => {
      const mockRaw: EtherfuseLookupResponse = {
        calculatedAt: "2026-10-19T06:00:00Z",
        stablebonds: [
          {
            name: "Etherfuse CETES",
            symbol: "CETES",
            bondCurrency: "MXN",
            tokenPriceDecimal: "1.186732",
            blockchains: [
              {
                blockchain: "solana",
                tokenIdentifier: "CETES7CKqqKQizuSN6iWQwmTeFRjbJR6Vw2XRKfEDR8f",
                totalSupply: "1000",
                decimals: 6,
              },
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
            name: "Non-Stellar Bond",
            symbol: "OTHER",
            bondCurrency: "USD",
            tokenPriceDecimal: "1.050000",
            blockchains: [
              {
                blockchain: "avalanche",
                tokenIdentifier: "0x123",
                totalSupply: "500",
                decimals: 6,
              },
            ],
          },
        ],
      };

      const result = parseStellarStablebonds(mockRaw, false);

      expect(result.calculatedAt).toBe("2026-10-19T06:00:00Z");
      expect(result.isFallback).toBe(false);
      expect(result.items.length).toBe(1);

      const cetes = result.items[0];
      expect(cetes.symbol).toBe("CETES");
      expect(cetes.country).toBe("México");
      expect(cetes.currency).toBe("MXN");
      expect(cetes.currentPrice).toBe(1.1867);
      expect(cetes.appreciationPercent).toBe(18.67);
      expect(cetes.stellarAssetCode).toBe("CETES");
      expect(cetes.stellarIssuer).toBe(
        "GCRYUGD5NVARGXT56XEZI5CIFCQETYHAPQQTHO2O3IQZTHDH4LATMYWC"
      );
      expect(cetes.stellarDecimals).toBe(7);
    });

    it("sorts LATAM and USD sovereign stablebonds prominently", () => {
      const result = parseStellarStablebonds(FALLBACK_ETHERFUSE_DATA, true);
      const symbols = result.items.map((i) => i.symbol);

      expect(symbols[0]).toBe("CETES");
      expect(symbols[1]).toBe("USTRY");
      expect(symbols[2]).toBe("TESOURO");
      expect(symbols[3]).toBe("EUROB");
      expect(result.isFallback).toBe(true);
    });
  });

  describe("fetchEtherfuseStablebonds", () => {
    it("returns parsed live data when API succeeds", async () => {
      const mockApiResponse: EtherfuseLookupResponse = {
        calculatedAt: "2026-10-19T07:00:00Z",
        stablebonds: [
          {
            name: "Etherfuse USTRY",
            symbol: "USTRY",
            bondCurrency: "USD",
            tokenPriceDecimal: "1.080000",
            blockchains: [
              {
                blockchain: "stellar",
                tokenIdentifier: "USTRY-GCRYUGD5NVARGXT56XEZI5CIFCQETYHAPQQTHO2O3IQZTHDH4LATMYWC",
                totalSupply: "12000000",
                decimals: 7,
              },
            ],
          },
        ],
      };

      vi.spyOn(global, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockApiResponse,
      } as any);

      const res = await fetchEtherfuseStablebonds({ forceRefresh: true });
      expect(res.isFallback).toBe(false);
      expect(res.items.length).toBe(1);
      expect(res.items[0].symbol).toBe("USTRY");
      expect(res.items[0].currentPrice).toBe(1.08);
    });

    it("falls back gracefully to verified snapshot when API fails", async () => {
      vi.spyOn(global, "fetch").mockRejectedValueOnce(
        new Error("Network Error / Timeout")
      );

      const res = await fetchEtherfuseStablebonds({ forceRefresh: true });
      expect(res.isFallback).toBe(true);
      expect(res.items.length).toBeGreaterThan(0);
      expect(res.items.some((i) => i.symbol === "CETES")).toBe(true);
    });
  });
});
