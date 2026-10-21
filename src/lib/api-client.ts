/**
 * Client-side utilities for calling the backend API routes
 * that sign admin transactions.
 */

export interface RewardQuizRequest {
  userPublicKey: string;
  challengeId: string;
  answers: number[];
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

/**
 * Error thrown by the API helpers. `status` is the HTTP status, so callers can
 * tell "already rewarded / already minted" (409) apart from real failures.
 */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Call the backend API to reward a user for completing a quiz.
 * The backend signs the transaction with the admin key.
 *
 * @throws ApiError (with the HTTP status) if the request fails or returns an error
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
    throw new ApiError(error.message || error.error || "Failed to reward quiz", response.status);
  }

  return data as RewardQuizResponse;
}

/**
 * Call the backend API to mint a badge NFT for completing a module.
 * The backend signs the transaction with the admin key.
 *
 * @throws ApiError (with the HTTP status) if the request fails or returns an error
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
    throw new ApiError(error.message || error.error || "Failed to mint badge", response.status);
  }

  return data as MintBadgeResponse;
}
