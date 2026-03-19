"use client";

import { useState, useCallback } from "react";

export interface ModuleProgress {
  completed: boolean;
  lessonsCompleted: string[];
  quizScore: number | null; // null = not attempted, 0-100 = score
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
  const [progress, setProgress] = useState<CourseProgress>(loadProgress);

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
    (moduleId: string, score: number, xp: number) => {
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
    (moduleIndex: number, modules: { id: string }[]): boolean => {
      if (moduleIndex === 0) return true;
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
  };
}
