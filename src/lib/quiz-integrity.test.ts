import { describe, it, expect } from "vitest";
import {
  findModuleByChallengeId,
  evaluateQuizAnswers,
  verifyQuizIntegrity,
} from "./quiz-integrity";
import { courses } from "@/data/courses";

describe("quiz-integrity library (Issue #36)", () => {
  const mod1 = courses[0].modules[0]; // 'mod-1', rewardXP: 50, 4 questions

  describe("findModuleByChallengeId", () => {
    it("finds module by exact ID", () => {
      const found = findModuleByChallengeId("mod-1");
      expect(found).not.toBeNull();
      expect(found?.id).toBe("mod-1");
      expect(found?.rewardXP).toBe(50);
    });

    it("finds module with '-quiz' suffix", () => {
      const found = findModuleByChallengeId("mod-1-quiz");
      expect(found).not.toBeNull();
      expect(found?.id).toBe("mod-1");
    });

    it("is case-insensitive and trims whitespace", () => {
      const found = findModuleByChallengeId("   MOD-1-QUIZ   ");
      expect(found).not.toBeNull();
      expect(found?.id).toBe("mod-1");
    });

    it("returns null for non-existent challengeId", () => {
      expect(findModuleByChallengeId("non-existent-module")).toBeNull();
      expect(findModuleByChallengeId("")).toBeNull();
      expect(findModuleByChallengeId("fake-quiz-999")).toBeNull();
    });
  });

  describe("evaluateQuizAnswers", () => {
    it("evaluates a perfect score from array of option indices", () => {
      // Find the correct option index for each question in mod1
      const correctIndices = mod1.quiz.map((q) =>
        q.options.findIndex((opt) => opt.isCorrect)
      );

      const result = evaluateQuizAnswers(mod1, correctIndices);
      expect(result.total).toBe(mod1.quiz.length);
      expect(result.correct).toBe(mod1.quiz.length);
      expect(result.scorePercent).toBe(100);
    });

    it("evaluates a partial score with incorrect answers", () => {
      const correctIndices = mod1.quiz.map((q) =>
        q.options.findIndex((opt) => opt.isCorrect)
      );
      // Invert the first answer
      const tamperedAnswers = [...correctIndices];
      tamperedAnswers[0] = (tamperedAnswers[0] + 1) % mod1.quiz[0].options.length;

      const result = evaluateQuizAnswers(mod1, tamperedAnswers);
      expect(result.total).toBe(mod1.quiz.length);
      expect(result.correct).toBe(mod1.quiz.length - 1);
      expect(result.scorePercent).toBe(
        Math.round(((mod1.quiz.length - 1) / mod1.quiz.length) * 100)
      );
    });

    it("evaluates answers passed as a Record mapping questionId to option index", () => {
      const answersMap: Record<string, number> = {};
      mod1.quiz.forEach((q) => {
        answersMap[q.id] = q.options.findIndex((opt) => opt.isCorrect);
      });

      const result = evaluateQuizAnswers(mod1, answersMap);
      expect(result.correct).toBe(mod1.quiz.length);
      expect(result.scorePercent).toBe(100);
    });

    it("throws error when answers array length does not match questions count", () => {
      expect(() => evaluateQuizAnswers(mod1, [1, 2])).toThrow(/does not match/);
    });

    it("throws error when answers is null or invalid", () => {
      expect(() => evaluateQuizAnswers(mod1, null)).toThrow(/must be an array/);
      expect(() => evaluateQuizAnswers(mod1, "string")).toThrow(/must be an array/);
    });
  });

  describe("verifyQuizIntegrity (End-to-End Integrity Verification)", () => {
    const perfectAnswers = mod1.quiz.map((q) =>
      q.options.findIndex((opt) => opt.isCorrect)
    );

    it("accepts a valid score and derives canonical maxXp strictly server-side", () => {
      const verification = verifyQuizIntegrity({
        challengeId: "mod-1-quiz",
        answers: perfectAnswers,
        correct: mod1.quiz.length,
        total: mod1.quiz.length,
      });

      expect(verification.valid).toBe(true);
      expect(verification.statusCode).toBe(200);
      expect(verification.correct).toBe(mod1.quiz.length);
      expect(verification.total).toBe(mod1.quiz.length);
      expect(verification.maxXp).toBe(50); // From canonical courses.ts, not client
      expect(verification.xpRewarded).toBe(50);
      expect(verification.scorePercent).toBe(100);
    });

    it("accepts valid submission even if client omitted optional correct/total/maxXp fields", () => {
      const verification = verifyQuizIntegrity({
        challengeId: "mod-1",
        answers: perfectAnswers,
      });

      expect(verification.valid).toBe(true);
      expect(verification.correct).toBe(mod1.quiz.length);
      expect(verification.maxXp).toBe(50);
    });

    it("rejects manipulated score when client claims more correct than submitted answers yield", () => {
      // Invert one answer so only 3 are correct
      const partialAnswers = [...perfectAnswers];
      partialAnswers[0] = (partialAnswers[0] + 1) % mod1.quiz[0].options.length;

      // Attacker claims 4/4 correct, but answers only yield 3/4
      const verification = verifyQuizIntegrity({
        challengeId: "mod-1-quiz",
        answers: partialAnswers,
        correct: 4, // Manipulated!
        total: 4,
      });

      expect(verification.valid).toBe(false);
      expect(verification.statusCode).toBe(400);
      expect(verification.error).toContain("Quiz integrity violation");
      expect(verification.details).toContain("Client claimed 4");
    });

    it("rejects when challengeId does not exist (challenge inexistente)", () => {
      const verification = verifyQuizIntegrity({
        challengeId: "non-existent-module-id",
        answers: [1, 2, 3],
      });

      expect(verification.valid).toBe(false);
      expect(verification.statusCode).toBe(400);
      expect(verification.error).toContain("Challenge not found");
    });

    it("rejects when answers payload is missing (preventing blind trust on raw numbers)", () => {
      const verification = verifyQuizIntegrity({
        challengeId: "mod-1-quiz",
        correct: 4,
        total: 4,
        maxXp: 50,
      });

      expect(verification.valid).toBe(false);
      expect(verification.statusCode).toBe(400);
      expect(verification.error).toContain("answers payload is required");
    });

    it("rejects manipulated maxXp when client attempts to inflate reward (server-side enforcement)", () => {
      const verification = verifyQuizIntegrity({
        challengeId: "mod-1-quiz",
        answers: perfectAnswers,
        correct: 4,
        total: 4,
        maxXp: 9999, // Attempted spoof of 9999 XP instead of canonical 50 XP
      });

      expect(verification.valid).toBe(false);
      expect(verification.statusCode).toBe(400);
      expect(verification.error).toContain("maxXp mismatch");
    });

    it("rejects mismatched total questions count", () => {
      const verification = verifyQuizIntegrity({
        challengeId: "mod-1-quiz",
        answers: perfectAnswers,
        total: 100, // Fabricated total
      });

      expect(verification.valid).toBe(false);
      expect(verification.statusCode).toBe(400);
      expect(verification.error).toContain("total questions count does not match");
    });
  });
});
