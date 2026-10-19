/**
 * Client-side utilities for calling the backend API routes
 * that sign admin transactions.
 */

export interface RewardQuizRequest {
  userPublicKey: string;
  challengeId: string;
  correct: number;
  total: number;
  maxXp: number;
  answers?: number[] | string[] | Record<string, number | string>;
}

export interface RewardQuizResponse {
  success: boolean;
  hash: string;
  xpRewarded: number;
  message: string;
}

export interface MintBadgeRequest {
  userPublicKey: string;
  moduleId: string;
  moduleTitle: string;
  xpEarned: number;
  quizScore: number;
}

export interface MintBadgeResponse {
  success: boolean;
  hash: string;
  tokenId?: number;
  message: string;
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
  details?: string;
}

export class ApiClientError extends Error {
  status: number;
  details?: string;

  constructor(status: number, message: string, details?: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.details = details;
  }
}

/**
 * Call the backend API to reward a user for completing a quiz.
 * The backend signs the transaction with the admin key.
 *
 * @throws ApiClientError if the request fails or returns an error
 */
export async function rewardQuiz(
  request: RewardQuizRequest
): Promise<RewardQuizResponse> {
  const response = await fetch("/api/reward-quiz", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = data as ApiErrorResponse;
    const msg = error.message || error.error || "Failed to reward quiz";
    throw new ApiClientError(response.status, msg, error.details);
  }

  return data as RewardQuizResponse;
}

/**
 * Call the backend API to mint a badge NFT for completing a module.
 * The backend signs the transaction with the admin key.
 *
 * @throws ApiClientError if the request fails or returns an error
 */
export async function mintBadge(
  request: MintBadgeRequest
): Promise<MintBadgeResponse> {
  const response = await fetch("/api/mint-badge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = data as ApiErrorResponse;
    const msg = error.message || error.error || "Failed to mint badge";
    throw new ApiClientError(response.status, msg, error.details);
  }

  return data as MintBadgeResponse;
}
