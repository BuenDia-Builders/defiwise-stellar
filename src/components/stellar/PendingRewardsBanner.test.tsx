// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import React from "react";

const wallet = { address: "GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC", connected: true };
const onChain = { xp: new Set<string>(), badges: new Set<string>() };
const rewardQuiz = vi.fn();
const mintBadge = vi.fn();

vi.mock("@/hooks/useStellarWallet", () => ({ useStellarWallet: () => wallet }));
vi.mock("@/hooks/useStellarProgress", () => ({ useStellarProgress: () => ({ fetchOnChainProgress: vi.fn() }) }));
vi.mock("@/lib/stellar", () => ({
  isChallengeCompleted: async (_a: string, c: string) => onChain.xp.has(c),
  hasBadge: async (_a: string, m: string) => onChain.badges.has(m),
}));
vi.mock("@/lib/api-client", async () => {
  const real = await vi.importActual<typeof import("@/lib/api-client")>("@/lib/api-client");
  return { ...real, rewardQuiz: (r: unknown) => rewardQuiz(r), mintBadge: (r: unknown) => mintBadge(r) };
});
vi.mock("react-hot-toast", () => {
  const t = Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() });
  return { __esModule: true, default: t };
});

import { PendingRewardsBanner } from "./PendingRewardsBanner";
import { ApiError } from "@/lib/api-client";

const STORAGE_KEY = "defiwise-progress";

beforeEach(() => {
  wallet.connected = true;
  onChain.xp = new Set();
  onChain.badges = new Set();
  rewardQuiz.mockReset().mockResolvedValue({ xpRewarded: 50 });
  mintBadge.mockReset().mockResolvedValue({ success: true });
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ "mod-1": { completed: true, lessonsCompleted: [], quizScore: 100, xpEarned: 50 } })
  );
});
afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("PendingRewardsBanner", () => {
  it("lists offline progress missing on-chain and claims it", async () => {
    render(<PendingRewardsBanner />);
    const btn = await screen.findByRole("button", { name: /Reclamar recompensas pendientes/i });
    expect(screen.getByText(/Badge/)).toBeTruthy();
    fireEvent.click(btn);
    await waitFor(() => expect(mintBadge).toHaveBeenCalledTimes(1));
    expect(rewardQuiz).toHaveBeenCalledWith(expect.objectContaining({ challengeId: "mod-1-quiz", correct: expect.any(Number) }));
    // the whole banner goes away once nothing is left to claim
    await waitFor(() => expect(screen.queryByLabelText("Recompensas pendientes")).toBeNull());
  });

  it("renders nothing without a wallet", async () => {
    wallet.connected = false;
    const { container } = render(<PendingRewardsBanner />);
    await new Promise((r) => setTimeout(r, 20));
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when everything is already on-chain", async () => {
    onChain.xp.add("mod-1-quiz");
    onChain.badges.add("mod-1");
    const { container } = render(<PendingRewardsBanner />);
    await new Promise((r) => setTimeout(r, 20));
    expect(container.innerHTML).toBe("");
  });

  it("a 409 does not break the flow and the item disappears", async () => {
    rewardQuiz.mockRejectedValue(new ApiError("Challenge already completed by this user", 409));
    render(<PendingRewardsBanner />);
    fireEvent.click(await screen.findByRole("button", { name: /Reclamar/i }));
    await waitFor(() => expect(screen.queryByLabelText("Recompensas pendientes")).toBeNull());
    expect(mintBadge).toHaveBeenCalledTimes(1);
  });

  it("a real failure keeps the item claimable", async () => {
    rewardQuiz.mockRejectedValue(new ApiError("Transaction simulation failed", 400));
    render(<PendingRewardsBanner />);
    fireEvent.click(await screen.findByRole("button", { name: /Reclamar/i }));
    await waitFor(() => expect(mintBadge).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole("button", { name: /Reclamar recompensas pendientes/i })).toBeTruthy();
  });
});
