"use client";

import { useState, useCallback } from "react";
import { useStellarWallet } from "./useStellarWallet";
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
  const { address, connected } = useStellarWallet();
  const [status, setStatus] = useState<OnChainStatus>({
    xpBalance: BigInt(0),
    historicalXP: BigInt(0),
    loading: false,
    error: null,
  });

  const fetchOnChainProgress = useCallback(async () => {
    if (!connected || !address) return;

    setStatus((prev) => ({ ...prev, loading: true, error: null }));
    try {
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

  return {
    ...status,
    connected,
    address,
    fetchOnChainProgress,
    checkChallengeCompleted,
    checkHasBadge,
  };
}
