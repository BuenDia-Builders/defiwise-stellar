import { courses } from "@/data/courses";

export type QuizRewardValidation =
  | { valid: true; correct: number; total: number; maxXp: number }
  | {
      valid: false;
      reason: "challenge_not_found" | "invalid_answers" | "score_mismatch";
    };

export function validateQuizReward(
  challengeId: string,
  answers: unknown,
  claimedCorrect?: unknown,
  claimedTotal?: unknown
): QuizRewardValidation {
  const quizModule = courses
    .flatMap((course) => course.modules)
    .find((candidate) => `${candidate.id}-quiz` === challengeId);

  if (!quizModule) {
    return { valid: false, reason: "challenge_not_found" };
  }

  if (
    !Array.isArray(answers) ||
    answers.length !== quizModule.quiz.length ||
    answers.some(
      (answer, index) =>
        !Number.isInteger(answer) ||
        answer < 0 ||
        answer >= quizModule.quiz[index].options.length
    )
  ) {
    return { valid: false, reason: "invalid_answers" };
  }

  const correct = answers.reduce(
    (count: number, answer: number, index: number) =>
      count + Number(quizModule.quiz[index].options[answer].isCorrect),
    0
  );

  if (
    (claimedCorrect !== undefined && claimedCorrect !== correct) ||
    (claimedTotal !== undefined && claimedTotal !== quizModule.quiz.length)
  ) {
    return { valid: false, reason: "score_mismatch" };
  }

  return {
    valid: true,
    correct,
    total: quizModule.quiz.length,
    maxXp: quizModule.rewardXP,
  };
}
