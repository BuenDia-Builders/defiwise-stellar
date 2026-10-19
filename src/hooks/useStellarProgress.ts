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
import {
  rewardQuiz as apiRewardQuiz,
  mintBadge as apiMintBadge,
  ApiClientError,
  RewardQuizResponse,
  MintBadgeResponse,
} from "@/lib/api-client";
import toast from "react-hot-toast";

export interface OnChainStatus {
  xpBalance: bigint;
  historicalXP: bigint;
  loading: boolean;
  error: string | null;
  lastTxHash?: string | null;
  lastXpRewarded?: number | null;
}

export interface RewardQuizOptions {
  moduleId?: string;
  moduleTitle?: string;
  answers?: number[] | string[] | Record<string, number | string>;
}

export interface RewardQuizResult {
  success: boolean;
  hash?: string;
  xpRewarded?: number;
  badgeHash?: string;
  badgeTokenId?: number;
  alreadyCompleted?: boolean;
  error?: string;
}

export function useStellarProgress() {
  const isHydrated = useHydrated();
  const { address, connected } = useStellarWallet();
  const [status, setStatus] = useState<OnChainStatus>({
    xpBalance: BigInt(0),
    historicalXP: BigInt(0),
    loading: false,
    error: null,
    lastTxHash: null,
    lastXpRewarded: null,
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
        lastTxHash: null,
        lastXpRewarded: null,
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
      setStatus((prev) => ({
        ...prev,
        xpBalance: balance,
        historicalXP: historical,
        loading: false,
        error: null,
      }));
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

  /**
   * Replaces mock stub (Issue #35) by calling actual backend API routes
   * (/api/reward-quiz and /api/mint-badge), obtaining real tx hashes,
   * refreshing on-chain balances, and handling 409/429 gracefully with toasts.
   */
  const rewardQuiz = useCallback(
    async (
      challengeId: string,
      correct: number,
      total: number,
      maxXp: number,
      options?: RewardQuizOptions
    ): Promise<RewardQuizResult> => {
      if (!connected || !address) {
        toast("Conectá tu wallet para registrar XP en Stellar Testnet", {
          icon: "💡",
        });
        return { success: false, error: "Wallet not connected" };
      }

      // Check on-chain early deduplication
      const alreadyDone = await checkChallengeCompleted(challengeId);
      if (alreadyDone) {
        toast("Este desafío ya fue registrado on-chain anteriormente.", {
          icon: "ℹ️",
        });
        return { success: false, alreadyCompleted: true };
      }

      setRewarding(true);
      setRewardError(null);

      try {
        // 1. Submit quiz reward to backend admin signer
        const xpResult: RewardQuizResponse = await apiRewardQuiz({
          userPublicKey: address,
          challengeId,
          correct,
          total,
          maxXp,
          answers: options?.answers || [],
        });

        setStatus((prev) => ({
          ...prev,
          lastTxHash: xpResult.hash,
          lastXpRewarded: xpResult.xpRewarded,
        }));

        // 2. If passing score (>= 75%), mint module badge NFT
        let badgeResult: MintBadgeResponse | undefined;
        const score = total > 0 ? Math.round((correct / total) * 100) : 0;
        const targetModuleId =
          options?.moduleId || challengeId.replace(/-quiz$/, "");

        if (score >= 75 && targetModuleId) {
          const hasBadgeAlready = await checkHasBadge(targetModuleId);
          if (!hasBadgeAlready) {
            try {
              badgeResult = await apiMintBadge({
                userPublicKey: address,
                moduleId: targetModuleId,
                moduleTitle: options?.moduleTitle || targetModuleId,
                xpEarned: xpResult.xpRewarded,
                quizScore: score,
              });
              toast.success(
                `🏆 ¡Badge NFT registrado on-chain! +${xpResult.xpRewarded} XP`
              );
            } catch (badgeErr) {
              console.warn("Badge mint failed after quiz reward:", badgeErr);
              toast.success(`+${xpResult.xpRewarded} XP registrados on-chain`);
            }
          } else {
            toast.success(`+${xpResult.xpRewarded} XP registrados on-chain`);
          }
        } else {
          toast.success(`+${xpResult.xpRewarded} XP registrados on-chain`);
        }

        // 3. Refresh on-chain balance and badges
        await fetchOnChainProgress();

        return {
          success: true,
          hash: xpResult.hash,
          xpRewarded: xpResult.xpRewarded,
          badgeHash: badgeResult?.hash,
          badgeTokenId: badgeResult?.tokenId,
        };
      } catch (err) {
        let errorMsg = "Error al reclamar XP on-chain";

        if (err instanceof ApiClientError) {
          if (err.status === 409) {
            errorMsg =
              "El desafío o badge ya fue registrado previamente en la blockchain.";
            toast.error(errorMsg);
          } else if (err.status === 429) {
            errorMsg =
              "Límite de peticiones alcanzado. Esperá un minuto antes de reintentar.";
            toast.error(errorMsg);
          } else {
            errorMsg = err.message;
            toast.error(errorMsg);
          }
        } else if (err instanceof Error) {
          errorMsg = err.message;
          toast.error(errorMsg);
        } else {
          toast.error(errorMsg);
        }

        setRewardError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setRewarding(false);
      }
    },
    [
      address,
      connected,
      checkChallengeCompleted,
      checkHasBadge,
      fetchOnChainProgress,
    ]
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
