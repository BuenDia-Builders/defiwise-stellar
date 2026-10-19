import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { courses } from "@/data/courses";

// Valid testnet ed25519 public key
const VALID_STELLAR_KEY =
  "GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC";

describe("POST /api/reward-quiz route tests (Issue #36)", () => {
  const mod1 = courses[0].modules[0];
  const perfectAnswers = mod1.quiz.map((q) =>
    q.options.findIndex((opt) => opt.isCorrect)
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when userPublicKey is missing or invalid", async () => {
    const req = new NextRequest("http://localhost:3000/api/reward-quiz", {
      method: "POST",
      body: JSON.stringify({
        userPublicKey: "invalid-key-format",
        challengeId: "mod-1-quiz",
        answers: perfectAnswers,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid Stellar public key");
  });

  it("returns 400 when challengeId is non-existent", async () => {
    const req = new NextRequest("http://localhost:3000/api/reward-quiz", {
      method: "POST",
      body: JSON.stringify({
        userPublicKey: VALID_STELLAR_KEY,
        challengeId: "fake-non-existent-module-999",
        answers: [0, 1, 2],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Challenge not found");
  });

  it("returns 400 when answers are missing (rejects raw unverified claims)", async () => {
    const req = new NextRequest("http://localhost:3000/api/reward-quiz", {
      method: "POST",
      body: JSON.stringify({
        userPublicKey: VALID_STELLAR_KEY,
        challengeId: "mod-1-quiz",
        correct: 4,
        total: 4,
        maxXp: 50,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("answers payload is required");
  });

  it("returns 400 when client claims a manipulated score that answers do not support", async () => {
    // Submit all wrong answers (e.g. index 3 for each)
    const wrongAnswers = mod1.quiz.map((q) =>
      q.options.findIndex((opt) => !opt.isCorrect)
    );

    const req = new NextRequest("http://localhost:3000/api/reward-quiz", {
      method: "POST",
      body: JSON.stringify({
        userPublicKey: VALID_STELLAR_KEY,
        challengeId: "mod-1-quiz",
        answers: wrongAnswers,
        correct: 4, // Attacker claiming 4/4!
        total: 4,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Quiz integrity violation");
  });

  it("returns 400 when client attempts to spoof maxXp above canonical value", async () => {
    const req = new NextRequest("http://localhost:3000/api/reward-quiz", {
      method: "POST",
      body: JSON.stringify({
        userPublicKey: VALID_STELLAR_KEY,
        challengeId: "mod-1-quiz",
        answers: perfectAnswers,
        maxXp: 9999, // Canonical is 50
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("maxXp mismatch");
  });

  it("enforces rate limiting (returns 429 when max requests exceeded)", async () => {
    const userKey = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

    // Trigger requests up to limit
    for (let i = 0; i < 10; i++) {
      const req = new NextRequest("http://localhost:3000/api/reward-quiz", {
        method: "POST",
        body: JSON.stringify({
          userPublicKey: userKey,
          challengeId: "mod-1-quiz",
          answers: [99, 99], // Will fail integrity, but rate limit tracks before integrity
        }),
      });
      await POST(req);
    }

    // 11th request must be rejected by rate limiter
    const req11 = new NextRequest("http://localhost:3000/api/reward-quiz", {
      method: "POST",
      body: JSON.stringify({
        userPublicKey: userKey,
        challengeId: "mod-1-quiz",
        answers: perfectAnswers,
      }),
    });

    const res11 = await POST(req11);
    expect(res11.status).toBe(429);
    const data = await res11.json();
    expect(data.error).toContain("Rate limit exceeded");
  });
});
