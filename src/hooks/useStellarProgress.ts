"use client";

import { useState, useCallback, useEffect } from "react";
import { useStellarWallet } from "./useStellarWallet";
import { useHydrated } from "@/lib/hydration";
import {
  getXPBalance,
  getHistoricalXP,
  isChallengeCompleted,
  hasBadge,
} from "@/lib/stellar";

export interface OnChainStatus {
  xpBalance: bigint;
  historicalXP: bigint;
  loading: boolean;
  error: string | null;
}

export function useStellarProgress() {
  const isHydrated = useHydrated();
  const { address, connected } = useStellarWallet();
  const [status, setStatus] = useState<OnChainStatus>({
    xpBalance: BigInt(0),
    historicalXP: BigInt(0),
    loading: false,
    error: null,
  });

  const fetchOnChainProgress = useCallback(async () => {
    // Without a connected wallet there is no on-chain identity to query.
    // Reset to zero so stale balances are never shown.
    if (!connected || !address) {
      setStatus({
        xpBalance: BigInt(0),
        historicalXP: BigInt(0),
        loading: false,
        error: null,
      });
      return;
    }

    setStatus((prev) => ({ ...prev, loading: true, error: null }));
    try {
      // Read the authoritative balance directly from the Soroban XP Token
      // contract (balanceOf / historicalBalance). This is the single source
      // of truth and cannot be tampered with from the browser.
      const [balance, historical] = await Promise.all([
        getXPBalance(address),
        getHistoricalXP(address),
      ]);
      setStatus({
        xpBalance: balance,
        historicalXP: historical,
        loading: false,
        error: null,
      });
    } catch (err) {
      setStatus((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Error fetching on-chain data",
      }));
    }
  }, [address, connected]);

  // Automatically (re)fetch the on-chain balance whenever the wallet
  // connection or the connected address changes. This keeps the Header and
  // Dashboard widgets in sync with the contract without each consumer having
  // to wire up its own effect.
  useEffect(() => {
    if (isHydrated && connected && address) {
      fetchOnChainProgress();
    }
  }, [isHydrated, connected, address, fetchOnChainProgress]);

  const checkChallengeCompleted = useCallback(
    async (challengeId: string): Promise<boolean> => {
      if (!connected || !address) return false;
      try {
        return await isChallengeCompleted(address, challengeId);
      } catch {
        return false;
      }
    },
    [address, connected]
  );

  const checkHasBadge = useCallback(
    async (moduleId: string): Promise<boolean> => {
      if (!connected || !address) return false;
      try {
        return await hasBadge(address, moduleId);
      } catch {
        return false;
      }
    },
    [address, connected]
  );

  const [rewarding, setRewarding] = useState(false);
  const [rewardError, setRewardError] = useState<string | null>(null);

  const rewardQuiz = useCallback(
    async (
      challengeId: string,
      correct: number,
      total: number,
      maxXp: number
    ): Promise<boolean> => {
      if (!connected || !address) return false;

      const alreadyDone = await checkChallengeCompleted(challengeId);
      if (alreadyDone) return false;

      setRewarding(true);
      setRewardError(null);

      try {
        // TODO(#18): Replace with actual backend signer call
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await fetchOnChainProgress();
        setRewarding(false);
        return true;
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Error al reclamar XP on-chain";
        setRewardError(msg);
        setRewarding(false);
        return false;
      }
    },
    [address, connected, checkChallengeCompleted, fetchOnChainProgress]
  );

  return {
    ...status,
    connected: isHydrated ? connected : false,
    address,
    rewarding,
    rewardError,
    fetchOnChainProgress,
    refresh: fetchOnChainProgress,
    checkChallengeCompleted,
    checkHasBadge,
    rewardQuiz,
    isHydrated,
  };
}
