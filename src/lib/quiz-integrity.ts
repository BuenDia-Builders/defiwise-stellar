import { courses, Module, Question } from "@/data/courses";

export type QuizAnswerItem =
  | number
  | string
  | { questionId: string; selectedOption: number };

export type QuizAnswersPayload =
  | number[]
  | string[]
  | Record<string, number | string>
  | { questionId: string; selectedOption: number }[];

export interface QuizIntegrityResult {
  valid: boolean;
  error?: string;
  details?: string;
  statusCode: number;
  module?: Module;
  correct?: number;
  total?: number;
  scorePercent?: number;
  maxXp?: number;
  xpRewarded?: number;
}

export interface VerifyQuizParams {
  challengeId: string;
  answers?: unknown;
  correct?: number;
  total?: number;
  maxXp?: number;
}

/**
 * Searches the canonical courses hierarchy for a module matching challengeId.
 * Supports direct module ID, case-insensitive match, and "-quiz" suffix patterns.
 */
export function findModuleByChallengeId(challengeId: string): Module | null {
  if (!challengeId || typeof challengeId !== "string") {
    return null;
  }

  const clean = challengeId.trim().toLowerCase();
  const stripped = clean.replace(/-quiz$/, "");

  for (const course of courses) {
    for (const mod of course.modules) {
      const modId = mod.id.toLowerCase();
      if (
        modId === clean ||
        `${modId}-quiz` === clean ||
        modId === stripped
      ) {
        return mod;
      }
    }
  }

  return null;
}

/**
 * Evaluates submitted user answers against the canonical quiz questions in the module.
 * Returns the exact count of correct answers, total questions, and percentage score.
 */
export function evaluateQuizAnswers(
  module: Module,
  answers: unknown
): { correct: number; total: number; scorePercent: number } {
  if (!answers || (typeof answers !== "object" && !Array.isArray(answers))) {
    throw new Error(
      "Answers payload must be an array of option indices or a key-value record mapping question IDs to selections"
    );
  }

  const quiz = module.quiz;
  const total = quiz.length;
  let correct = 0;

  if (Array.isArray(answers)) {
    if (answers.length !== total) {
      throw new Error(
        `Answers array length (${answers.length}) does not match total quiz questions (${total})`
      );
    }

    quiz.forEach((q: Question, idx: number) => {
      const ans = answers[idx];

      if (typeof ans === "number") {
        if (ans >= 0 && ans < q.options.length && q.options[ans]?.isCorrect) {
          correct++;
        }
      } else if (typeof ans === "string") {
        const matchingOption = q.options.find(
          (opt) => opt.text.trim().toLowerCase() === ans.trim().toLowerCase()
        );
        if (matchingOption?.isCorrect) {
          correct++;
        }
      } else if (
        ans &&
        typeof ans === "object" &&
        "questionId" in ans &&
        "selectedOption" in ans
      ) {
        const item = ans as { questionId: string; selectedOption: number };
        const targetQ = quiz.find((qu) => qu.id === item.questionId) || q;
        if (
          item.selectedOption >= 0 &&
          item.selectedOption < targetQ.options.length &&
          targetQ.options[item.selectedOption]?.isCorrect
        ) {
          correct++;
        }
      }
    });
  } else {
    // Record / Map format: { [questionId]: selectedOptionIndex | optionText }
    const record = answers as Record<string, unknown>;

    quiz.forEach((q: Question, idx: number) => {
      const ans = record[q.id] ?? record[String(idx)];

      if (typeof ans === "number") {
        if (ans >= 0 && ans < q.options.length && q.options[ans]?.isCorrect) {
          correct++;
        }
      } else if (typeof ans === "string") {
        const matchingOption = q.options.find(
          (opt) => opt.text.trim().toLowerCase() === ans.trim().toLowerCase()
        );
        if (matchingOption?.isCorrect) {
          correct++;
        }
      }
    });
  }

  const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0;
  return { correct, total, scorePercent };
}

/**
 * Complete server-side verification of a quiz submission.
 * Enforces:
 * 1. Challenge exists in canonical courses.ts.
 * 2. User answers are provided and valid.
 * 3. Recalculates score and validates against any claimed values.
 * 4. Derives maxXp strictly from server-side module rewardXP, rejecting client spoofing.
 */
export function verifyQuizIntegrity(params: VerifyQuizParams): QuizIntegrityResult {
  const { challengeId, answers, correct, total, maxXp } = params;

  if (!challengeId || typeof challengeId !== "string" || challengeId.trim() === "") {
    return {
      valid: false,
      error: "challengeId is required and must be a non-empty string",
      statusCode: 400,
    };
  }

  const canonicalModule = findModuleByChallengeId(challengeId);
  if (!canonicalModule) {
    return {
      valid: false,
      error: "Challenge not found in canonical courses data",
      details: `No module matches challengeId '${challengeId}'`,
      statusCode: 400,
    };
  }

  const canonicalMaxXp = canonicalModule.rewardXP;
  const canonicalTotal = canonicalModule.quiz.length;

  // Strict check on client-provided maxXp if present
  if (typeof maxXp === "number" && maxXp !== canonicalMaxXp) {
    return {
      valid: false,
      error: "maxXp mismatch with canonical course reward",
      details: `Expected canonical maxXp of ${canonicalMaxXp}, but received ${maxXp}`,
      statusCode: 400,
    };
  }

  // Enforce server-side evaluation via answers
  if (answers === undefined || answers === null) {
    return {
      valid: false,
      error: "answers payload is required to verify quiz integrity server-side",
      details:
        "Raw score submissions without answers are disallowed to prevent tampering with admin-signed rewards.",
      statusCode: 400,
    };
  }

  let evaluation: { correct: number; total: number; scorePercent: number };
  try {
    evaluation = evaluateQuizAnswers(canonicalModule, answers);
  } catch (err) {
    return {
      valid: false,
      error: "Invalid answers format or length",
      details: err instanceof Error ? err.message : "Error evaluating answers",
      statusCode: 400,
    };
  }

  // Integrity checks against client-claimed numbers
  if (typeof correct === "number" && correct !== evaluation.correct) {
    return {
      valid: false,
      error: "Quiz integrity violation: submitted score does not match server evaluation",
      details: `Client claimed ${correct} correct answers, but server evaluated ${evaluation.correct}`,
      statusCode: 400,
    };
  }

  if (typeof total === "number" && total !== canonicalTotal) {
    return {
      valid: false,
      error: "Quiz integrity violation: submitted total questions count does not match canonical quiz",
      details: `Canonical quiz has ${canonicalTotal} questions, but client claimed ${total}`,
      statusCode: 400,
    };
  }

  const xpRewarded = Math.floor((canonicalMaxXp * evaluation.correct) / canonicalTotal);

  return {
    valid: true,
    statusCode: 200,
    module: canonicalModule,
    correct: evaluation.correct,
    total: canonicalTotal,
    scorePercent: evaluation.scorePercent,
    maxXp: canonicalMaxXp,
    xpRewarded,
  };
}
