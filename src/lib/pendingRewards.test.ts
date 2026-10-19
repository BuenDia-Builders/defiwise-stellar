import { describe, it, expect, vi } from "vitest";
import {
  challengeIdFor,
  claimPendingRewards,
  correctFromScore,
  findPendingRewards,
  isAlreadyClaimed,
  remainingAfterClaim,
  type ClaimApi,
  type ClaimableModule,
  type PendingReward,
} from "./pendingRewards";
import { ApiError } from "./api-client";

const q = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `q${i}` }));
const MODULES: ClaimableModule[] = [
  { id: "mod-1", title: "Intro", rewardXP: 50, quiz: q(4) },
  { id: "mod-2", title: "AMMs", rewardXP: 150, quiz: q(5) },
  { id: "mod-3", title: "Lending", rewardXP: 150, quiz: q(4) },
];
const mp = (completed: boolean, quizScore: number | null) => ({
  completed,
  lessonsCompleted: [],
  quizScore,
  xpEarned: 0,
});
const ADDR = "GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC";

function chain(xp: string[] = [], badges: string[] = []) {
  return {
    isChallengeCompleted: vi.fn(async (c: string) => xp.includes(c)),
    hasBadge: vi.fn(async (m: string) => badges.includes(m)),
  };
}

describe("findPendingRewards", () => {
  it("offers locally completed modules that are missing on-chain", async () => {
    const progress = { "mod-1": mp(true, 100), "mod-2": mp(true, 80), "mod-3": mp(false, 50) };
    const out = await findPendingRewards(progress, MODULES, chain());
    expect(out.map((p) => p.moduleId)).toEqual(["mod-1", "mod-2"]);
    expect(out[0]).toMatchObject({ challengeId: "mod-1-quiz", needsXp: true, needsBadge: true, correct: 4, total: 4, maxXp: 50 });
    expect(out[1]).toMatchObject({ correct: 4, total: 5, quizScore: 80 });
  });

  it("does not offer anything already fully on-chain (no re-reward)", async () => {
    const progress = { "mod-1": mp(true, 100) };
    const out = await findPendingRewards(progress, MODULES, chain(["mod-1-quiz"], ["mod-1"]));
    expect(out).toEqual([]);
  });

  it("offers only the missing part when XP is on-chain but the badge is not", async () => {
    const progress = { "mod-1": mp(true, 100) };
    const out = await findPendingRewards(progress, MODULES, chain(["mod-1-quiz"], []));
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ needsXp: false, needsBadge: true });
  });

  it("skips modules whose on-chain state cannot be read", async () => {
    const progress = { "mod-1": mp(true, 100), "mod-2": mp(true, 100) };
    const checks = {
      isChallengeCompleted: vi.fn(async (c: string) => {
        if (c === "mod-1-quiz") throw new Error("rpc down");
        return false;
      }),
      hasBadge: vi.fn(async () => false),
    };
    const out = await findPendingRewards(progress, MODULES, checks);
    expect(out.map((p) => p.moduleId)).toEqual(["mod-2"]);
  });

  it("ignores failed or unattempted quizzes even if marked completed", async () => {
    const progress = { "mod-1": mp(true, 60), "mod-2": mp(true, null) };
    expect(await findPendingRewards(progress, MODULES, chain())).toEqual([]);
  });
});

describe("claimPendingRewards", () => {
  const pending = (over: Partial<PendingReward> = {}): PendingReward => ({
    moduleId: "mod-1",
    moduleTitle: "Intro",
    challengeId: "mod-1-quiz",
    quizScore: 100,
    needsXp: true,
    needsBadge: true,
    correct: 4,
    total: 4,
    maxXp: 50,
    ...over,
  });
  const api = (): ClaimApi & { rewardQuiz: ReturnType<typeof vi.fn>; mintBadge: ReturnType<typeof vi.fn> } => ({
    rewardQuiz: vi.fn(async () => ({ xpRewarded: 50 })),
    mintBadge: vi.fn(async () => ({ success: true })),
  });

  it("claims XP then badge with the deterministic challenge id", async () => {
    const a = api();
    const res = await claimPendingRewards(ADDR, [pending()], a);
    expect(a.rewardQuiz).toHaveBeenCalledWith({ userPublicKey: ADDR, challengeId: "mod-1-quiz", correct: 4, total: 4, maxXp: 50 });
    expect(a.mintBadge).toHaveBeenCalledWith({ userPublicKey: ADDR, moduleId: "mod-1", moduleTitle: "Intro", xpEarned: 50, quizScore: 100 });
    expect(res).toEqual([{ moduleId: "mod-1", xp: "claimed", badge: "claimed", xpRewarded: 50 }]);
  });

  it("treats 409 as already claimed and keeps going", async () => {
    const a = api();
    a.rewardQuiz.mockRejectedValueOnce(new ApiError("Challenge already completed by this user", 409));
    a.mintBadge.mockRejectedValueOnce(new ApiError("Badge already minted for this module", 409));
    const res = await claimPendingRewards(ADDR, [pending(), pending({ moduleId: "mod-2", challengeId: "mod-2-quiz" })], a);
    expect(res[0]).toMatchObject({ xp: "already_claimed", badge: "already_claimed" });
    expect(res[1]).toMatchObject({ xp: "claimed", badge: "claimed" });
    expect(remainingAfterClaim([pending()], [res[0]])).toEqual([]);
  });

  it("never calls reward_quiz for a challenge already on-chain", async () => {
    const a = api();
    await claimPendingRewards(ADDR, [pending({ needsXp: false })], a);
    expect(a.rewardQuiz).not.toHaveBeenCalled();
    expect(a.mintBadge).toHaveBeenCalledTimes(1);
  });

  it("marks real failures as failed and leaves them claimable", async () => {
    const a = api();
    a.rewardQuiz.mockRejectedValueOnce(new ApiError("Transaction simulation failed", 400));
    const res = await claimPendingRewards(ADDR, [pending()], a);
    expect(res[0].xp).toBe("failed");
    expect(res[0].badge).toBe("claimed");
    expect(res[0].error).toContain("simulation");
    expect(remainingAfterClaim([pending()], res)).toEqual([pending({ needsBadge: false })]);
  });
});

describe("helpers", () => {
  it("challengeIdFor matches the id QuizView sends to /api/reward-quiz", () => {
    expect(challengeIdFor("mod-3")).toBe("mod-3-quiz");
  });
  it("correctFromScore inverts the stored rounded percentage", () => {
    for (const total of [1, 3, 4, 5, 7, 10]) {
      for (let c = 0; c <= total; c++) {
        expect(correctFromScore(Math.round((c / total) * 100), total)).toBe(c);
      }
    }
    expect(correctFromScore(100, 0)).toBe(0);
  });
  it("isAlreadyClaimed recognises 409s and the contract panic messages", () => {
    expect(isAlreadyClaimed(new ApiError("x", 409))).toBe(true);
    expect(isAlreadyClaimed(new Error("badge already minted for this module"))).toBe(true);
    expect(isAlreadyClaimed(new ApiError("Rate limit exceeded", 429))).toBe(false);
  });
});
