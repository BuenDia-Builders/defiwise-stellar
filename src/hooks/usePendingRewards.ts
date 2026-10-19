"use client";

import { useState, useCallback, useEffect } from "react";
import { courses } from "@/data/courses";
import { useProgress } from "./useProgress";
import { useStellarWallet } from "./useStellarWallet";
import { useStellarProgress } from "./useStellarProgress";
import { rewardQuiz, mintBadge, ApiClientError } from "@/lib/api-client";
import toast from "react-hot-toast";

export interface PendingRewardItem {
  moduleId: string;
  moduleTitle: string;
  challengeId: string;
  quizScore: number;
  xpEarned: number;
  totalQuestions: number;
  needsXP: boolean;
  needsBadge: boolean;
}

export function usePendingRewards() {
  const { progress } = useProgress();
  const { address, connected } = useStellarWallet();
  const { checkChallengeCompleted, checkHasBadge, fetchOnChainProgress } =
    useStellarProgress();

  const [pendingRewards, setPendingRewards] = useState<PendingRewardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);

  // Compute completed modules from localStorage and check on-chain state
  const checkPendingRewards = useCallback(async () => {
    if (!connected || !address) {
      // Find local completed modules awaiting wallet connection
      const offlineItems: PendingRewardItem[] = [];
      for (const course of courses) {
        for (const mod of course.modules) {
          const modProg = progress[mod.id];
          if (modProg && modProg.completed) {
            offlineItems.push({
              moduleId: mod.id,
              moduleTitle: mod.title,
              challengeId: `${mod.id}-quiz`,
              quizScore: modProg.quizScore ?? 100,
              xpEarned: mod.rewardXP,
              totalQuestions: mod.quiz.length,
              needsXP: true,
              needsBadge: (modProg.quizScore ?? 100) >= 75,
            });
          }
        }
      }
      setPendingRewards(offlineItems);
      return;
    }

    setLoading(true);
    try {
      const items: PendingRewardItem[] = [];
      for (const course of courses) {
        for (const mod of course.modules) {
          const modProg = progress[mod.id];
          if (modProg && modProg.completed) {
            const challengeId = `${mod.id}-quiz`;
            const isXpClaimed = await checkChallengeCompleted(challengeId);
            const isBadgeClaimed = await checkHasBadge(mod.id);

            const score = modProg.quizScore ?? 100;
            const eligibleForBadge = score >= 75;

            const needsXP = !isXpClaimed;
            const needsBadge = eligibleForBadge && !isBadgeClaimed;

            if (needsXP || needsBadge) {
              items.push({
                moduleId: mod.id,
                moduleTitle: mod.title,
                challengeId,
                quizScore: score,
                xpEarned: mod.rewardXP,
                totalQuestions: mod.quiz.length,
                needsXP,
                needsBadge,
              });
            }
          }
        }
      }
      setPendingRewards(items);
    } catch (err) {
      console.warn("Failed checking on-chain pending rewards:", err);
    } finally {
      setLoading(false);
    }
  }, [address, connected, progress, checkChallengeCompleted, checkHasBadge]);

  useEffect(() => {
    checkPendingRewards();
  }, [checkPendingRewards]);

  const claimAll = useCallback(async () => {
    if (!connected || !address) {
      toast("Conectá tu wallet para reclamar tus recompensas on-chain", {
        icon: "💡",
      });
      return { success: false, claimedCount: 0 };
    }

    if (pendingRewards.length === 0) {
      toast("No hay recompensas pendientes para reclamar.", { icon: "ℹ️" });
      return { success: true, claimedCount: 0 };
    }

    setClaiming(true);
    let successCount = 0;
    let totalXpRewarded = 0;

    for (const item of pendingRewards) {
      try {
        // 1. Claim XP if needed
        if (item.needsXP) {
          try {
            const xpRes = await rewardQuiz({
              userPublicKey: address,
              challengeId: item.challengeId,
              correct: item.totalQuestions,
              total: item.totalQuestions,
              maxXp: item.xpEarned,
            });
            totalXpRewarded += xpRes.xpRewarded;
          } catch (err) {
            if (err instanceof ApiClientError && err.status === 409) {
              // 409: challenge already completed on-chain, idempotent handling
              console.log(`Challenge ${item.challengeId} already recorded on-chain (409)`);
            } else {
              throw err;
            }
          }
        }

        // 2. Mint badge if needed
        if (item.needsBadge) {
          try {
            await mintBadge({
              userPublicKey: address,
              moduleId: item.moduleId,
              moduleTitle: item.moduleTitle,
              xpEarned: item.xpEarned,
              quizScore: item.quizScore,
            });
          } catch (err) {
            if (err instanceof ApiClientError && err.status === 409) {
              // 409: badge already exists, idempotent handling
              console.log(`Badge ${item.moduleId} already recorded on-chain (409)`);
            } else {
              console.warn(`Badge minting warning for ${item.moduleId}:`, err);
            }
          }
        }

        successCount++;
      } catch (err) {
        console.error(`Error claiming reward for ${item.moduleId}:`, err);
        toast.error(`Error al reclamar ${item.moduleTitle}`);
      }
    }

    await fetchOnChainProgress();
    await checkPendingRewards();
    setClaiming(false);

    if (successCount > 0) {
      toast.success(
        `🏆 ¡${successCount} módulo(s) sincronizado(s) on-chain! +${totalXpRewarded} XP`
      );
    }

    return { success: successCount > 0, claimedCount: successCount };
  }, [
    address,
    connected,
    pendingRewards,
    fetchOnChainProgress,
    checkPendingRewards,
  ]);

  const totalPendingXP = pendingRewards.reduce(
    (sum, r) => sum + (r.needsXP ? r.xpEarned : 0),
    0
  );
  const totalPendingBadges = pendingRewards.filter((r) => r.needsBadge).length;

  return {
    pendingRewards,
    totalPendingXP,
    totalPendingBadges,
    loading,
    claiming,
    checkPendingRewards,
    claimAll,
  };
}
