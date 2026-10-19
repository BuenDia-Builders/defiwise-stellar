// @vitest-environment jsdom
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePendingRewards } from "./usePendingRewards";
import * as ProgressHook from "./useProgress";
import * as StellarWalletHook from "./useStellarWallet";
import * as StellarProgressHook from "./useStellarProgress";
import * as ApiClient from "@/lib/api-client";

vi.mock("./useProgress");
vi.mock("./useStellarWallet");
vi.mock("./useStellarProgress");
vi.mock("@/lib/api-client", async (importOriginal) => {
  const actual = await importOriginal<typeof ApiClient>();
  return {
    ...actual,
    rewardQuiz: vi.fn(),
    mintBadge: vi.fn(),
  };
});
vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

describe("usePendingRewards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("identifies completed modules as pending offline rewards when disconnected", async () => {
    vi.spyOn(StellarWalletHook, "useStellarWallet").mockReturnValue({
      address: null,
      connected: false,
    } as any);

    vi.spyOn(ProgressHook, "useProgress").mockReturnValue({
      progress: {
        "mod-1": {
          completed: true,
          quizScore: 100,
          lessonsCompleted: ["l1", "l2"],
          xpEarned: 50,
        },
      },
    } as any);

    vi.spyOn(StellarProgressHook, "useStellarProgress").mockReturnValue({
      checkChallengeCompleted: vi.fn(),
      checkHasBadge: vi.fn(),
      fetchOnChainProgress: vi.fn(),
    } as any);

    const { result } = renderHook(() => usePendingRewards());

    await act(async () => {
      await result.current.checkPendingRewards();
    });

    expect(result.current.pendingRewards.length).toBe(1);
    expect(result.current.pendingRewards[0].moduleId).toBe("mod-1");
    expect(result.current.pendingRewards[0].needsXP).toBe(true);
    expect(result.current.pendingRewards[0].needsBadge).toBe(true);
    expect(result.current.totalPendingXP).toBe(50);
    expect(result.current.totalPendingBadges).toBe(1);
  });

  it("checks on-chain status and filters out already claimed items when connected", async () => {
    vi.spyOn(StellarWalletHook, "useStellarWallet").mockReturnValue({
      address: "GBTESTADDRESS123",
      connected: true,
    } as any);

    vi.spyOn(ProgressHook, "useProgress").mockReturnValue({
      progress: {
        "mod-1": {
          completed: true,
          quizScore: 100,
          lessonsCompleted: ["l1"],
          xpEarned: 50,
        },
        "mod-2": {
          completed: true,
          quizScore: 80,
          lessonsCompleted: ["l1"],
          xpEarned: 75,
        },
      },
    } as any);

    const checkChallengeCompleted = vi.fn().mockImplementation(async (id: string) => {
      // mod-1 already completed on-chain, mod-2 not yet
      return id === "mod-1-quiz";
    });

    const checkHasBadge = vi.fn().mockImplementation(async (modId: string) => {
      // mod-1 badge already minted
      return modId === "mod-1";
    });

    vi.spyOn(StellarProgressHook, "useStellarProgress").mockReturnValue({
      checkChallengeCompleted,
      checkHasBadge,
      fetchOnChainProgress: vi.fn(),
    } as any);

    const { result } = renderHook(() => usePendingRewards());

    await act(async () => {
      await result.current.checkPendingRewards();
    });

    // mod-1 is fully claimed on-chain, so only mod-2 should be pending
    expect(result.current.pendingRewards.length).toBe(1);
    expect(result.current.pendingRewards[0].moduleId).toBe("mod-2");
    expect(result.current.pendingRewards[0].needsXP).toBe(true);
    expect(result.current.pendingRewards[0].needsBadge).toBe(true);
  });

  it("claims all pending rewards and handles 409 idempotently", async () => {
    vi.spyOn(StellarWalletHook, "useStellarWallet").mockReturnValue({
      address: "GBTESTADDRESS123",
      connected: true,
    } as any);

    vi.spyOn(ProgressHook, "useProgress").mockReturnValue({
      progress: {
        "mod-1": {
          completed: true,
          quizScore: 100,
          lessonsCompleted: ["l1"],
          xpEarned: 50,
        },
      },
    } as any);

    vi.spyOn(StellarProgressHook, "useStellarProgress").mockReturnValue({
      checkChallengeCompleted: vi.fn().mockResolvedValue(false),
      checkHasBadge: vi.fn().mockResolvedValue(false),
      fetchOnChainProgress: vi.fn().mockResolvedValue(undefined),
    } as any);

    // Mock rewardQuiz returning 409 ApiClientError (already recorded on-chain)
    vi.spyOn(ApiClient, "rewardQuiz").mockRejectedValue(
      new ApiClient.ApiClientError(409, "Challenge already recorded")
    );

    // Mock mintBadge succeeding
    vi.spyOn(ApiClient, "mintBadge").mockResolvedValue({
      status: "success",
      badgeMinted: true,
      txHash: "0xmockhash123",
    });

    const { result } = renderHook(() => usePendingRewards());

    await act(async () => {
      await result.current.checkPendingRewards();
    });

    let claimResult: any;
    await act(async () => {
      claimResult = await result.current.claimAll();
    });

    expect(claimResult.success).toBe(true);
    expect(claimResult.claimedCount).toBe(1);
    expect(ApiClient.mintBadge).toHaveBeenCalledTimes(1);
  });
});
