"use client";

import { useState, useCallback, useEffect } from "react";
import { useHydrated } from "@/lib/hydration";

export interface ModuleProgress {
  completed: boolean;
  lessonsCompleted: string[];
  quizScore: number | null; // null = not attempted, 0-100 = score
  quizAnswers?: number[];
  xpEarned: number;
}

export interface CourseProgress {
  [moduleId: string]: ModuleProgress;
}

const STORAGE_KEY = "defiwise-progress";

function loadProgress(): CourseProgress {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: CourseProgress) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function useProgress() {
  const isHydrated = useHydrated();
  const [progress, setProgress] = useState<CourseProgress>({});

  useEffect(() => {
    if (isHydrated) {
      const loaded = loadProgress();
      setProgress(loaded);
    }
  }, [isHydrated]);

  const getModuleProgress = useCallback(
    (moduleId: string): ModuleProgress => {
      return (
        progress[moduleId] ?? {
          completed: false,
          lessonsCompleted: [],
          quizScore: null,
          xpEarned: 0,
        }
      );
    },
    [progress]
  );

  const completeLesson = useCallback(
    (moduleId: string, lessonId: string) => {
      setProgress((prev) => {
        const mod = prev[moduleId] ?? {
          completed: false,
          lessonsCompleted: [],
          quizScore: null,
          xpEarned: 0,
        };
        if (mod.lessonsCompleted.includes(lessonId)) return prev;
        const updated = {
          ...prev,
          [moduleId]: {
            ...mod,
            lessonsCompleted: [...mod.lessonsCompleted, lessonId],
          },
        };
        saveProgress(updated);
        return updated;
      });
    },
    []
  );

  const completeQuiz = useCallback(
    (moduleId: string, score: number, xp: number, answers: number[]) => {
      setProgress((prev) => {
        const mod = prev[moduleId] ?? {
          completed: false,
          lessonsCompleted: [],
          quizScore: null,
          xpEarned: 0,
        };
        const passed = score >= 75;
        const updated = {
          ...prev,
          [moduleId]: {
            ...mod,
            quizScore: score,
            quizAnswers: answers,
            completed: passed,
            xpEarned: passed ? xp : 0,
          },
        };
        saveProgress(updated);
        return updated;
      });
    },
    []
  );

  const isModuleUnlocked = useCallback(
    (
      moduleIndex: number,
      modules: { id: string; minXp?: number }[],
      /**
       * On-chain historical XP from the XP Token contract. Required when any
       * module in the list declares a `minXp` gate.
       *
       * INVARIANT: always pass `historicalXP` from `useStellarProgress`, never
       * the local `totalXP`. The historical balance is append-only and cannot
       * be gamed by spending or transferring tokens.
       */
      historicalXP?: bigint
    ): boolean => {
      if (moduleIndex === 0) return true;
      const mod = modules[moduleIndex];

      // On-chain XP gate: if the module declares a minXp threshold, the wallet
      // must be connected (historicalXP provided) AND the historical balance
      // must meet the threshold. Without a wallet we cannot verify on-chain
      // state, so the module stays locked rather than falsely unlocked.
      if (mod.minXp !== undefined && mod.minXp > 0) {
        if (historicalXP === undefined || historicalXP === null) return false;
        if (historicalXP < BigInt(mod.minXp)) return false;
      }

      // Sequential gate: previous module must be locally completed.
      const prevModuleId = modules[moduleIndex - 1].id;
      const prevProgress = progress[prevModuleId];
      return prevProgress?.completed ?? false;
    },
    [progress]
  );

  const totalXP = Object.values(progress).reduce(
    (sum, mod) => sum + mod.xpEarned,
    0
  );

  const completedModules = Object.values(progress).filter(
    (mod) => mod.completed
  ).length;

  return {
    progress,
    getModuleProgress,
    completeLesson,
    completeQuiz,
    isModuleUnlocked,
    totalXP,
    completedModules,
    isHydrated,
  };
}
