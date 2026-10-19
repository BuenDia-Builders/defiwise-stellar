// @vitest-environment jsdom
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useStellarProgress } from "./useStellarProgress";
import * as apiClient from "@/lib/api-client";
import * as stellarLib from "@/lib/stellar";
import toast from "react-hot-toast";

// Mock toast
vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

// Mock wallet hook
const mockWallet = {
  address: "GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC",
  connected: true,
};

vi.mock("./useStellarWallet", () => ({
  useStellarWallet: () => mockWallet,
}));

// Mock hydration
vi.mock("@/lib/hydration", () => ({
  useHydrated: () => true,
}));

// Mock stellar queries
vi.mock("@/lib/stellar", () => ({
  getXPBalance: vi.fn().mockResolvedValue(BigInt(100)),
  getHistoricalXP: vi.fn().mockResolvedValue(BigInt(100)),
  isChallengeCompleted: vi.fn().mockResolvedValue(false),
  hasBadge: vi.fn().mockResolvedValue(false),
}));

// Mock api-client
vi.mock("@/lib/api-client", () => {
  class MockApiClientError extends Error {
    status: number;
    details?: string;
    constructor(status: number, message: string, details?: string) {
      super(message);
      this.name = "ApiClientError";
      this.status = status;
      this.details = details;
    }
  }

  return {
    ApiClientError: MockApiClientError,
    rewardQuiz: vi.fn(),
    mintBadge: vi.fn(),
  };
});

describe("useStellarProgress hook (Issue #35)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWallet.connected = true;
    mockWallet.address = "GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC";
  });

  afterEach(() => {
    cleanup();
  });

  it("calls real backend apiRewardQuiz without fake setTimeout stub and updates status", async () => {
    const mockHash = "0xabc123456789";
    vi.mocked(apiClient.rewardQuiz).mockResolvedValueOnce({
      success: true,
      hash: mockHash,
      xpRewarded: 50,
      message: "Successfully rewarded 50 XP",
    });

    vi.mocked(apiClient.mintBadge).mockResolvedValueOnce({
      success: true,
      hash: "0xbadgehash",
      tokenId: 1,
      message: "Badge minted",
    });

    const { result } = renderHook(() => useStellarProgress());

    let rewardResult: any;
    await act(async () => {
      rewardResult = await result.current.rewardQuiz(
        "mod-1-quiz",
        4,
        4,
        50,
        { moduleId: "mod-1", moduleTitle: "Intro to DeFi" }
      );
    });

    // Verifies real API call was made with exact parameters
    expect(apiClient.rewardQuiz).toHaveBeenCalledWith({
      userPublicKey: mockWallet.address,
      challengeId: "mod-1-quiz",
      correct: 4,
      total: 4,
      maxXp: 50,
      answers: [],
    });

    // Verifies real tx hash and reward returned
    expect(rewardResult.success).toBe(true);
    expect(rewardResult.hash).toBe(mockHash);
    expect(rewardResult.xpRewarded).toBe(50);
    expect(result.current.lastTxHash).toBe(mockHash);
    expect(result.current.lastXpRewarded).toBe(50);

    // Verifies on-chain progress was refreshed
    expect(stellarLib.getXPBalance).toHaveBeenCalled();
  });

  it("mints badge NFT when quiz passed with score >= 75%", async () => {
    vi.mocked(apiClient.rewardQuiz).mockResolvedValueOnce({
      success: true,
      hash: "0xquizhash",
      xpRewarded: 50,
      message: "Successfully rewarded 50 XP",
    });

    vi.mocked(apiClient.mintBadge).mockResolvedValueOnce({
      success: true,
      hash: "0xbadgehash99",
      tokenId: 42,
      message: "Badge minted",
    });

    vi.mocked(stellarLib.hasBadge).mockResolvedValueOnce(false);

    const { result } = renderHook(() => useStellarProgress());

    let rewardResult: any;
    await act(async () => {
      rewardResult = await result.current.rewardQuiz(
        "mod-1-quiz",
        4,
        4,
        50,
        { moduleId: "mod-1", moduleTitle: "Intro to DeFi" }
      );
    });

    expect(apiClient.mintBadge).toHaveBeenCalledWith({
      userPublicKey: mockWallet.address,
      moduleId: "mod-1",
      moduleTitle: "Intro to DeFi",
      xpEarned: 50,
      quizScore: 100,
    });

    expect(rewardResult.badgeTokenId).toBe(42);
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining("¡Badge NFT registrado on-chain!")
    );
  });

  it("handles 409 Conflict gracefully with toast without breaking local state", async () => {
    vi.mocked(apiClient.rewardQuiz).mockRejectedValueOnce(
      new apiClient.ApiClientError(409, "Challenge already completed by this user")
    );

    const { result } = renderHook(() => useStellarProgress());

    let rewardResult: any;
    await act(async () => {
      rewardResult = await result.current.rewardQuiz("mod-1-quiz", 4, 4, 50);
    });

    expect(rewardResult.success).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("previamente en la blockchain")
    );
    expect(result.current.rewarding).toBe(false);
  });

  it("handles 429 Rate Limit gracefully with toast without breaking local state", async () => {
    vi.mocked(apiClient.rewardQuiz).mockRejectedValueOnce(
      new apiClient.ApiClientError(429, "Rate limit exceeded. Please try again later.")
    );

    const { result } = renderHook(() => useStellarProgress());

    let rewardResult: any;
    await act(async () => {
      rewardResult = await result.current.rewardQuiz("mod-1-quiz", 4, 4, 50);
    });

    expect(rewardResult.success).toBe(false);
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringContaining("Límite de peticiones alcanzado")
    );
    expect(result.current.rewarding).toBe(false);
  });

  it("returns early with guidance toast when wallet is disconnected", async () => {
    mockWallet.connected = false;
    mockWallet.address = "";

    const { result } = renderHook(() => useStellarProgress());

    let rewardResult: any;
    await act(async () => {
      rewardResult = await result.current.rewardQuiz("mod-1-quiz", 4, 4, 50);
    });

    expect(rewardResult.success).toBe(false);
    expect(apiClient.rewardQuiz).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(
      expect.stringContaining("Conectá tu wallet"),
      expect.anything()
    );
  });

  it("avoids redundant API call if challenge is already completed on-chain", async () => {
    vi.mocked(stellarLib.isChallengeCompleted).mockResolvedValueOnce(true);

    const { result } = renderHook(() => useStellarProgress());

    let rewardResult: any;
    await act(async () => {
      rewardResult = await result.current.rewardQuiz("mod-1-quiz", 4, 4, 50);
    });

    expect(rewardResult.success).toBe(false);
    expect(rewardResult.alreadyCompleted).toBe(true);
    expect(apiClient.rewardQuiz).not.toHaveBeenCalled();
    expect(toast).toHaveBeenCalledWith(
      expect.stringContaining("ya fue registrado on-chain"),
      expect.anything()
    );
  });
});
