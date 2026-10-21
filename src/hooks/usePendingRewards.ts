"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useProgress } from "./useProgress";
import { useStellarWallet } from "./useStellarWallet";
import { courses } from "@/data/courses";
import { hasBadge, isChallengeCompleted } from "@/lib/stellar";
import { mintBadge, rewardQuiz } from "@/lib/api-client";
import {
  ClaimResult,
  PendingReward,
  claimPendingRewards,
  findPendingRewards,
  remainingAfterClaim,
} from "@/lib/pendingRewards";

const ALL_MODULES = courses.flatMap((c) => c.modules);

/**
 * Detects rewards earned offline (localStorage) that are missing on-chain once
 * a wallet is connected, and claims them through the admin-signed API routes.
 */
export function usePendingRewards(onClaimed?: () => void) {
  const { progress, isHydrated } = useProgress();
  const { address, connected } = useStellarWallet();
  const [pending, setPending] = useState<PendingReward[]>([]);
  const [checking, setChecking] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [results, setResults] = useState<ClaimResult[]>([]);
  const runId = useRef(0);

  const detect = useCallback(async () => {
    if (!isHydrated || !connected || !address) {
      setPending([]);
      return;
    }
    const id = ++runId.current;
    setChecking(true);
    try {
      const found = await findPendingRewards(progress, ALL_MODULES, {
        isChallengeCompleted: (challengeId) => isChallengeCompleted(address, challengeId),
        hasBadge: (moduleId) => hasBadge(address, moduleId),
      });
      if (id === runId.current) setPending(found);
    } finally {
      if (id === runId.current) setChecking(false);
    }
  }, [isHydrated, connected, address, progress]);

  // Re-check whenever the wallet connects / changes or local progress changes.
  useEffect(() => {
    detect();
  }, [detect]);

  const claim = useCallback(async () => {
    if (!address || pending.length === 0 || claiming) return [];
    setClaiming(true);
    try {
      const res = await claimPendingRewards(address, pending, { rewardQuiz, mintBadge });
      setResults(res);
      setPending(remainingAfterClaim(pending, res));
      onClaimed?.();
      return res;
    } finally {
      setClaiming(false);
    }
  }, [address, pending, claiming, onClaimed]);

  return { pending, checking, claiming, results, claim, detect, connected };
}
