// @vitest-environment jsdom
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import PendingRewardsBanner from "./PendingRewardsBanner";
import * as PendingRewardsHook from "@/hooks/usePendingRewards";
import * as StellarWalletHook from "@/hooks/useStellarWallet";

vi.mock("@/hooks/usePendingRewards");
vi.mock("@/hooks/useStellarWallet");

describe("PendingRewardsBanner", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders null when there are no pending rewards", () => {
    vi.spyOn(StellarWalletHook, "useStellarWallet").mockReturnValue({
      address: null,
      connected: false,
      connecting: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      network: "testnet",
    } as any);

    vi.spyOn(PendingRewardsHook, "usePendingRewards").mockReturnValue({
      pendingRewards: [],
      totalPendingXP: 0,
      totalPendingBadges: 0,
      loading: false,
      claiming: false,
      checkPendingRewards: vi.fn(),
      claimAll: vi.fn(),
    });

    const { container } = render(<PendingRewardsBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders offline reminder when progress is completed locally without wallet connection", () => {
    vi.spyOn(StellarWalletHook, "useStellarWallet").mockReturnValue({
      address: null,
      connected: false,
      connecting: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      network: "testnet",
    } as any);

    vi.spyOn(PendingRewardsHook, "usePendingRewards").mockReturnValue({
      pendingRewards: [
        {
          moduleId: "mod-1",
          moduleTitle: "Introducción a DeFi",
          challengeId: "mod-1-quiz",
          quizScore: 100,
          xpEarned: 50,
          totalQuestions: 2,
          needsXP: true,
          needsBadge: true,
        },
      ],
      totalPendingXP: 50,
      totalPendingBadges: 1,
      loading: false,
      claiming: false,
      checkPendingRewards: vi.fn(),
      claimAll: vi.fn(),
    });

    render(<PendingRewardsBanner />);

    expect(screen.getByText("Progreso local completado sin wallet")).toBeTruthy();
    expect(
      screen.getByText(/Completaste 1 módulo\(s\) \(50 XP\)\./i)
    ).toBeTruthy();
    expect(
      screen.getByText(/Conectá tu wallet para reclamar tus XP/i)
    ).toBeTruthy();
  });

  it("renders on-chain claim banner with module details when wallet is connected", () => {
    const claimAllMock = vi.fn();

    vi.spyOn(StellarWalletHook, "useStellarWallet").mockReturnValue({
      address: "GBDEVTESTWALLET1234567890",
      connected: true,
      connecting: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      network: "testnet",
    } as any);

    vi.spyOn(PendingRewardsHook, "usePendingRewards").mockReturnValue({
      pendingRewards: [
        {
          moduleId: "mod-1",
          moduleTitle: "Introducción a DeFi",
          challengeId: "mod-1-quiz",
          quizScore: 100,
          xpEarned: 50,
          totalQuestions: 2,
          needsXP: true,
          needsBadge: true,
        },
        {
          moduleId: "mod-2",
          moduleTitle: "Conceptos Básicos",
          challengeId: "mod-2-quiz",
          quizScore: 80,
          xpEarned: 75,
          totalQuestions: 3,
          needsXP: true,
          needsBadge: false,
        },
      ],
      totalPendingXP: 125,
      totalPendingBadges: 1,
      loading: false,
      claiming: false,
      checkPendingRewards: vi.fn(),
      claimAll: claimAllMock,
    });

    render(<PendingRewardsBanner />);

    expect(screen.getByText("Recompensas pendientes on-chain")).toBeTruthy();
    expect(screen.getByText("+125 XP")).toBeTruthy();
    expect(screen.getByText(/1 Badge\(s\) NFT/i)).toBeTruthy();

    expect(screen.getByText("Introducción a DeFi")).toBeTruthy();
    expect(screen.getByText("+50 XP")).toBeTruthy();
    expect(screen.getByText("NFT")).toBeTruthy();

    expect(screen.getByText("Conceptos Básicos")).toBeTruthy();
    expect(screen.getByText("+75 XP")).toBeTruthy();

    const claimBtn = screen.getByRole("button", { name: /Reclamar recompensas/i });
    expect(claimBtn).toBeTruthy();

    fireEvent.click(claimBtn);
    expect(claimAllMock).toHaveBeenCalledTimes(1);
  });

  it("displays syncing loading state while claiming rewards", () => {
    vi.spyOn(StellarWalletHook, "useStellarWallet").mockReturnValue({
      address: "GBDEVTESTWALLET1234567890",
      connected: true,
      connecting: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      network: "testnet",
    } as any);

    vi.spyOn(PendingRewardsHook, "usePendingRewards").mockReturnValue({
      pendingRewards: [
        {
          moduleId: "mod-1",
          moduleTitle: "Introducción a DeFi",
          challengeId: "mod-1-quiz",
          quizScore: 100,
          xpEarned: 50,
          totalQuestions: 2,
          needsXP: true,
          needsBadge: true,
        },
      ],
      totalPendingXP: 50,
      totalPendingBadges: 1,
      loading: false,
      claiming: true,
      checkPendingRewards: vi.fn(),
      claimAll: vi.fn(),
    });

    render(<PendingRewardsBanner />);

    expect(screen.getByText("Sincronizando on-chain...")).toBeTruthy();
    const claimBtn = screen.getByRole("button");
    expect(claimBtn.hasAttribute("disabled")).toBe(true);
  });
});
