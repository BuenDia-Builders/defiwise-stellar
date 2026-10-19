/**
 * Pending rewards: progress a student earned offline (localStorage) that is
 * not yet recorded on-chain, and an idempotent claim flow for it.
 *
 * A module counts as completed locally when its quiz was passed (>= 75%), see
 * `useProgress.completeQuiz`. On-chain, the XP reward is keyed by the
 * deterministic challenge id `${moduleId}-quiz` (the same id QuizView sends to
 * /api/reward-quiz) and the badge by `moduleId`, so a claim can be retried
 * safely: the contracts reject a second reward / mint and the API answers 409.
 *
 * This module is pure (no React, no network of its own): callers inject the
 * on-chain checks and the API calls, which keeps it unit-testable.
 */
import type { CourseProgress } from "@/hooks/useProgress";

export interface ClaimableModule {
  id: string;
  title: string;
  rewardXP: number;
  quiz: unknown[];
}

export interface PendingReward {
  moduleId: string;
  moduleTitle: string;
  challengeId: string;
  quizScore: number;
  /** XP for this module has not been recorded on-chain yet */
  needsXp: boolean;
  /** The module badge has not been minted yet */
  needsBadge: boolean;
  /** Quiz answers reconstructed from the stored score, for reward_quiz */
  correct: number;
  total: number;
  maxXp: number;
}

export interface OnChainChecks {
  isChallengeCompleted: (challengeId: string) => Promise<boolean>;
  hasBadge: (moduleId: string) => Promise<boolean>;
}

export const PASS_THRESHOLD = 75;

export function challengeIdFor(moduleId: string): string {
  return `${moduleId}-quiz`;
}

/**
 * Number of correct answers implied by a stored percentage score.
 * Scores are stored as Math.round(correct / total * 100), so rounding back
 * recovers the original count for any quiz with up to 100 questions.
 */
export function correctFromScore(score: number, total: number): number {
  if (total <= 0) return 0;
  const c = Math.round((score / 100) * total);
  return Math.max(0, Math.min(total, c));
}

/**
 * Modules passed locally whose XP or badge is missing on-chain.
 * A module whose on-chain state cannot be read is skipped (not offered),
 * so a flaky RPC never leads to a claim for something already rewarded.
 */
export async function findPendingRewards(
  progress: CourseProgress,
  modules: ClaimableModule[],
  checks: OnChainChecks
): Promise<PendingReward[]> {
  const out: PendingReward[] = [];
  for (const mod of modules) {
    const p = progress[mod.id];
    if (!p || !p.completed || p.quizScore === null || p.quizScore < PASS_THRESHOLD) continue;
    const challengeId = challengeIdFor(mod.id);
    let xpDone: boolean;
    let badgeDone: boolean;
    try {
      [xpDone, badgeDone] = await Promise.all([
        checks.isChallengeCompleted(challengeId),
        checks.hasBadge(mod.id),
      ]);
    } catch {
      continue;
    }
    if (xpDone && badgeDone) continue;
    const total = mod.quiz.length;
    out.push({
      moduleId: mod.id,
      moduleTitle: mod.title,
      challengeId,
      quizScore: p.quizScore,
      needsXp: !xpDone,
      needsBadge: !badgeDone,
      correct: correctFromScore(p.quizScore, total),
      total,
      maxXp: mod.rewardXP,
    });
  }
  return out;
}

export interface ClaimApi {
  rewardQuiz: (req: {
    userPublicKey: string;
    challengeId: string;
    correct: number;
    total: number;
    maxXp: number;
  }) => Promise<{ xpRewarded: number }>;
  mintBadge: (req: {
    userPublicKey: string;
    moduleId: string;
    moduleTitle: string;
    xpEarned: number;
    quizScore: number;
  }) => Promise<unknown>;
}

export type ClaimStepResult = "claimed" | "already_claimed" | "skipped" | "failed";

export interface ClaimResult {
  moduleId: string;
  xp: ClaimStepResult;
  badge: ClaimStepResult;
  xpRewarded: number;
  error?: string;
}

/** True when the API reported that the reward already exists (HTTP 409). */
export function isAlreadyClaimed(err: unknown): boolean {
  if (err && typeof err === "object" && "status" in err && (err as { status?: number }).status === 409) {
    return true;
  }
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return /already (completed|minted)/i.test(msg);
}

/**
 * Claim every pending reward for `address`, one module at a time.
 * - Only the missing parts are claimed (no second XP reward for a challenge
 *   already on-chain, no second badge).
 * - A 409 means another tab/device got there first: it is recorded as
 *   "already_claimed", not as a failure, and the flow continues.
 * - Any other error marks that step "failed" and moves on to the next module.
 */
export async function claimPendingRewards(
  address: string,
  pending: PendingReward[],
  api: ClaimApi
): Promise<ClaimResult[]> {
  const results: ClaimResult[] = [];
  for (const r of pending) {
    const res: ClaimResult = { moduleId: r.moduleId, xp: "skipped", badge: "skipped", xpRewarded: 0 };
    if (r.needsXp) {
      try {
        const x = await api.rewardQuiz({
          userPublicKey: address,
          challengeId: r.challengeId,
          correct: r.correct,
          total: r.total,
          maxXp: r.maxXp,
        });
        res.xp = "claimed";
        res.xpRewarded = x.xpRewarded;
      } catch (err) {
        if (isAlreadyClaimed(err)) res.xp = "already_claimed";
        else {
          res.xp = "failed";
          res.error = err instanceof Error ? err.message : String(err);
        }
      }
    }
    if (r.needsBadge) {
      try {
        await api.mintBadge({
          userPublicKey: address,
          moduleId: r.moduleId,
          moduleTitle: r.moduleTitle,
          xpEarned: res.xpRewarded || Math.floor((r.maxXp * r.correct) / Math.max(1, r.total)),
          quizScore: r.quizScore,
        });
        res.badge = "claimed";
      } catch (err) {
        if (isAlreadyClaimed(err)) res.badge = "already_claimed";
        else {
          res.badge = "failed";
          res.error = res.error ?? (err instanceof Error ? err.message : String(err));
        }
      }
    }
    results.push(res);
  }
  return results;
}

/** Pending entries still worth offering after a claim round. */
export function remainingAfterClaim(pending: PendingReward[], results: ClaimResult[]): PendingReward[] {
  const byId = new Map(results.map((r) => [r.moduleId, r]));
  const out: PendingReward[] = [];
  for (const p of pending) {
    const r = byId.get(p.moduleId);
    if (!r) {
      out.push(p);
      continue;
    }
    const needsXp = p.needsXp && r.xp === "failed";
    const needsBadge = p.needsBadge && r.badge === "failed";
    if (needsXp || needsBadge) out.push({ ...p, needsXp, needsBadge });
  }
  return out;
}
