import { describe, expect, it } from "vitest";
import { validateQuizReward } from "./validation";

describe("validateQuizReward", () => {
  it("scores answers using the canonical quiz and reward", () => {
    expect(validateQuizReward("mod-1-quiz", [1, 2, 2, 1], 4, 4)).toEqual({
      valid: true,
      correct: 4,
      total: 4,
      maxXp: 50,
    });
  });

  it("rejects a manipulated score", () => {
    const result = validateQuizReward("mod-1-quiz", [0, 0, 0, 0], 4, 4);

    expect(result).toEqual({
      valid: false,
      reason: "score_mismatch",
    });
  });

  it("rejects an unknown challenge", () => {
    expect(validateQuizReward("unknown-quiz", [])).toEqual({
      valid: false,
      reason: "challenge_not_found",
    });
  });
});
