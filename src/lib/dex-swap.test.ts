// @vitest-environment jsdom
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  calculateDEXQuote,
  fundWithFriendbot,
  recordCompletedSwap,
  getCompletedSwaps,
  hasCompletedDEXPractice,
  TESTNET_TOKENS,
} from "./dex-swap";

let store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = String(value);
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    store = {};
  },
  get length() {
    return Object.keys(store).length;
  },
  key: (index: number) => Object.keys(store)[index] ?? null,
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("dex-swap library", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  describe("calculateDEXQuote", () => {
    it("calculates a valid quote for XLM to USDC with fees and price impact", () => {
      const quote = calculateDEXQuote("XLM", "USDC", 100, 0.5);

      expect(quote.fromAsset).toBe("XLM");
      expect(quote.toAsset).toBe("USDC");
      expect(quote.fromAmount).toBe(100);
      expect(quote.rate).toBe(0.125);
      expect(quote.feePct).toBe(0.3);
      expect(quote.feeAmount).toBe(0.3);
      expect(quote.expectedOutput).toBeGreaterThan(12);
      expect(quote.expectedOutput).toBeLessThan(12.5);
      expect(quote.minimumReceived).toBeLessThan(quote.expectedOutput);
      expect(quote.provider).toBe("Stellar AMM");
      expect(quote.route).toEqual(["XLM", "USDC"]);
    });

    it("assigns Aquarius provider when trading AQUA", () => {
      const quote = calculateDEXQuote("XLM", "AQUA", 50, 1.0);
      expect(quote.provider).toBe("Aquarius");
      expect(quote.slippagePct).toBe(1.0);
    });

    it("handles zero or same token swap gracefully", () => {
      const zeroQuote = calculateDEXQuote("XLM", "XLM", 10);
      expect(zeroQuote.expectedOutput).toBe(0);
      expect(zeroQuote.rate).toBe(1);

      const invalidAmount = calculateDEXQuote("XLM", "USDC", 0);
      expect(invalidAmount.expectedOutput).toBe(0);
    });

    it("adjusts minimum received according to slippage tolerance", () => {
      const quoteHalfPct = calculateDEXQuote("XLM", "USDC", 1000, 0.5);
      const quoteTwoPct = calculateDEXQuote("XLM", "USDC", 1000, 2.0);

      expect(quoteHalfPct.expectedOutput).toBe(quoteTwoPct.expectedOutput);
      expect(quoteTwoPct.minimumReceived).toBeLessThan(quoteHalfPct.minimumReceived);
    });
  });

  describe("fundWithFriendbot", () => {
    it("rejects invalid public key", async () => {
      const res = await fundWithFriendbot("invalid_key");
      expect(res.success).toBe(false);
      expect(res.message).toContain("inválida");
    });

    it("handles successful friendbot response", async () => {
      const validKey = "GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC";
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as any);

      const res = await fundWithFriendbot(validKey);
      expect(res.success).toBe(true);
      expect(res.message).toContain("10,000 XLM");
    });

    it("handles account already existing on testnet", async () => {
      const validKey = "GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC";
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => "createAccountAlreadyExist",
      } as any);

      const res = await fundWithFriendbot(validKey);
      expect(res.success).toBe(true);
      expect(res.message).toContain("activa");
    });
  });

  describe("completed swaps storage", () => {
    it("records and retrieves completed swaps in localStorage", () => {
      expect(hasCompletedDEXPractice()).toBe(false);
      expect(getCompletedSwaps()).toEqual([]);

      const mockSwap = {
        txHash: "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
        fromAsset: "XLM",
        toAsset: "USDC",
        fromAmount: 50,
        toAmount: 6.22,
        timestamp: Date.now(),
        network: "Stellar Testnet" as const,
        explorerUrl: "https://stellar.expert/explorer/testnet/tx/a1b2c3d4",
      };

      recordCompletedSwap(mockSwap);

      expect(hasCompletedDEXPractice()).toBe(true);
      const retrieved = getCompletedSwaps();
      expect(retrieved.length).toBe(1);
      expect(retrieved[0].txHash).toBe(mockSwap.txHash);
      expect(retrieved[0].fromAsset).toBe("XLM");
      expect(retrieved[0].toAsset).toBe("USDC");
    });
  });

  describe("token assets definition", () => {
    it("defines XLM as native and USDC/AQUA/EURC with testnet issuers", () => {
      expect(TESTNET_TOKENS.XLM.isNative).toBe(true);
      expect(TESTNET_TOKENS.USDC.issuer).toBeTruthy();
      expect(TESTNET_TOKENS.AQUA.issuer).toBeTruthy();
      expect(TESTNET_TOKENS.EURC.issuer).toBeTruthy();
    });
  });
});
