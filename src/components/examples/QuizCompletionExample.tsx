"use client";

import { useState } from "react";
import { rewardQuiz, mintBadge } from "@/lib/api-client";
import toast from "react-hot-toast";

/**
 * Example component showing how to integrate the backend API
 * for rewarding quiz completion and minting badges.
 *
 * This is a reference implementation - adapt it to your actual UI.
 */
export default function QuizCompletionExample() {
  const [loading, setLoading] = useState(false);

  // In a real implementation, get these from your auth/wallet context
  const userPublicKey = "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";

  /**
   * Handle quiz completion - award XP via backend API
   */
  const handleQuizComplete = async () => {
    setLoading(true);

    try {
      // Call the backend API to reward the user
      const result = await rewardQuiz({
        userPublicKey,
        challengeId: "defi-basics-quiz-01", // Unique ID for this quiz
        correct: 8,
        total: 10,
        maxXp: 100, // Maximum XP for perfect score
      });

      // Show success message
      toast.success(
        `🎉 Congratulations! You earned ${result.xpRewarded} XP!`
      );

      // Log transaction details
      console.log("Transaction hash:", result.hash);
      console.log("XP rewarded:", result.xpRewarded);

      // Update UI state, refresh user progress, etc.
      // refreshUserProgress();
    } catch (error) {
      // Handle different error cases
      const errorMessage =
        error instanceof Error ? error.message : "Failed to reward quiz";

      if (errorMessage.includes("already completed")) {
        toast.error("You've already completed this quiz!");
      } else if (errorMessage.includes("Rate limit")) {
        toast.error("Too many requests. Please try again later.");
      } else {
        toast.error(`Error: ${errorMessage}`);
      }

      console.error("Quiz reward error:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle module completion - mint badge via backend API
   */
  const handleModuleComplete = async () => {
    setLoading(true);

    try {
      // Call the backend API to mint the badge
      const result = await mintBadge({
        userPublicKey,
        moduleId: "fundamentals-module", // Unique ID for this module
        moduleTitle: "DeFi Fundamentals",
        xpEarned: 250,
        quizScore: 85,
      });

      // Show success message
      toast.success(
        `🏆 Badge earned! Token ID: ${result.tokenId || "pending"}`
      );

      // Log transaction details
      console.log("Transaction hash:", result.hash);
      console.log("Token ID:", result.tokenId);

      // Update UI state, show badge animation, etc.
      // refreshUserBadges();
    } catch (error) {
      // Handle different error cases
      const errorMessage =
        error instanceof Error ? error.message : "Failed to mint badge";

      if (errorMessage.includes("already minted")) {
        toast.error("You already have this badge!");
      } else if (errorMessage.includes("Rate limit")) {
        toast.error("Too many requests. Please try again later.");
      } else {
        toast.error(`Error: ${errorMessage}`);
      }

      console.error("Badge mint error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-4">
      <h2 className="text-2xl font-bold">Quiz & Badge Example</h2>

      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title">Complete Quiz</h3>
          <p>Award XP tokens for quiz completion</p>
          <div className="card-actions justify-end">
            <button
              className="btn btn-primary"
              onClick={handleQuizComplete}
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                "Complete Quiz"
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title">Complete Module</h3>
          <p>Mint NFT badge for module completion</p>
          <div className="card-actions justify-end">
            <button
              className="btn btn-secondary"
              onClick={handleModuleComplete}
              disabled={loading}
            >
              {loading ? (
                <span className="loading loading-spinner"></span>
              ) : (
                "Complete Module"
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="alert alert-info">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="stroke-current shrink-0 w-6 h-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <span>
          This is an example component. Replace with your actual user wallet
          integration.
        </span>
      </div>
    </div>
  );
}
