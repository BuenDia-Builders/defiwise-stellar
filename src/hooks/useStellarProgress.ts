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
} from "@/lib/api-client";
import toast from "react-hot-toast";

export interface OnChainStatus {
  xpBalance: bigint;
  historicalXP: bigint;
  loading: boolean;
  error: string | null;
}

export interface RewardResult {
  hash: string;
  xpRewarded: number;
  badgeHash?: string;
  tokenId?: number;
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
  const [lastRewardResult, setLastRewardResult] = useState<RewardResult | null>(null);

  /**
   * Call the backend to award XP for a completed quiz, and mint a badge
   * when the score meets the passing threshold (≥ 75 %).
   *
   * Returns a RewardResult on success, or null when the user has no wallet,
   * the challenge was already claimed (409), or a rate-limit (429) was hit.
   * In the 409 / 429 cases a toast is shown but local progress is preserved.
   */
  const rewardQuiz = useCallback(
    async (
      challengeId: string,
      answers: number[],
      correct: number,
      total: number,
      moduleTitle?: string
    ): Promise<RewardResult | null> => {
      if (!connected || !address) return null;

      const alreadyDone = await checkChallengeCompleted(challengeId);
      if (alreadyDone) {
        toast("Este quiz ya fue registrado on-chain.", { icon: "ℹ️" });
        return null;
      }

      setRewarding(true);
      setRewardError(null);

      try {
        // Step 1 — Reward XP via the backend signer
        const xpResult = await apiRewardQuiz({
          userPublicKey: address,
          challengeId,
          answers,
        });

        const result: RewardResult = {
          hash: xpResult.hash,
          xpRewarded: xpResult.xpRewarded,
        };

        // Step 2 — Mint badge when score ≥ 75 % and moduleTitle is provided
        const score = Math.round((correct / total) * 100);
        if (score >= 75 && moduleTitle) {
          // moduleId is the part of challengeId before "-quiz"
          const moduleId = challengeId.endsWith("-quiz")
            ? challengeId.slice(0, -5)
            : challengeId;

          try {
            const badgeResult = await apiMintBadge({
              userPublicKey: address,
              moduleId,
              moduleTitle,
              xpEarned: xpResult.xpRewarded,
              quizScore: score,
            });
            result.badgeHash = badgeResult.hash;
            result.tokenId = badgeResult.tokenId;
          } catch (badgeErr) {
            const msg =
              badgeErr instanceof Error ? badgeErr.message : "";
            // Badge already minted is not a fatal error — XP was still awarded
            if (msg.includes("already") || msg.includes("409")) {
              toast("Badge ya registrado para este módulo.", { icon: "ℹ️" });
            } else {
              // Surface non-duplicate badge errors as warnings; XP was still
              // recorded so we don't fail the whole flow.
              toast.error(
                "XP registrado, pero no se pudo acuñar el badge. Intenta más tarde."
              );
            }
          }
        }

        setLastRewardResult(result);

        // Refresh on-chain balances to reflect the new XP
        await fetchOnChainProgress();

        return result;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Error al reclamar XP on-chain";

        // 409 — already completed on-chain
        if (msg.includes("already completed") || msg.includes("409")) {
          toast("Este quiz ya fue registrado on-chain.", { icon: "ℹ️" });
          setRewarding(false);
          return null;
        }

        // 429 — rate limited
        if (msg.includes("Rate limit") || msg.includes("429")) {
          toast.error(
            "Demasiadas solicitudes. Esperá unos segundos e intentá de nuevo."
          );
          setRewarding(false);
          return null;
        }

        // Generic error — surface to UI but don't break local progress
        setRewardError(msg);
        toast.error(
          "No se pudo registrar on-chain. Tu progreso se guardó localmente."
        );
        setRewarding(false);
        return null;
      } finally {
        setRewarding(false);
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
    lastRewardResult,
    fetchOnChainProgress,
    refresh: fetchOnChainProgress,
    checkChallengeCompleted,
    checkHasBadge,
    rewardQuiz,
    isHydrated,
  };
}
