"use client";

import Image from "next/image";
import { Module } from "@/data/courses";
import { ModuleProgress } from "@/hooks/useProgress";
import {
  BsLock,
  BsCheckCircleFill,
  BsPlayCircle,
  BsJournalText,
  BsPatchQuestion,
} from "react-icons/bs";

interface ModuleCardProps {
  module: Module;
  index: number;
  unlocked: boolean;
  progress: ModuleProgress;
  onStartLesson: (lessonIndex: number) => void;
  onStartQuiz: () => void;
}

const colorMap: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  active: {
    bg: "bg-active/5",
    border: "border-active/30",
    text: "text-active",
    badge: "bg-active",
  },
  pink: {
    bg: "bg-pink/5",
    border: "border-pink/30",
    text: "text-pink",
    badge: "bg-pink",
  },
  darkOrange: {
    bg: "bg-darkOrange/5",
    border: "border-darkOrange/30",
    text: "text-darkOrange",
    badge: "bg-darkOrange",
  },
};

export default function ModuleCard({
  module,
  index,
  unlocked,
  progress,
  onStartLesson,
  onStartQuiz,
}: ModuleCardProps) {
  const colors = colorMap[module.color] ?? colorMap.active;
  const lessonsTotal = module.lessons.length;
  const lessonsDone = progress.lessonsCompleted.length;
  const allLessonsDone = lessonsDone >= lessonsTotal;
  const quizPassed = progress.completed;

  if (!unlocked) {
    return (
      <div className="rounded-2xl border border-borderGrey/50 p-6 opacity-60">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-progressGrey flex items-center justify-center">
            <BsLock size={20} className="text-darkGrey" />
          </div>
          <div>
            <p className="text-sm text-darkGrey font-medium">
              Módulo {index + 1}
            </p>
            <h3 className="text-lg font-semibold text-grey">{module.title}</h3>
            <p className="text-sm text-darkGrey mt-1">
              Completá el módulo anterior para desbloquear
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border ${colors.border} ${colors.bg} p-6 transition-all`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl ${colors.badge} flex items-center justify-center text-white font-bold text-lg`}
          >
            {index + 1}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-darkGreen">
              {module.title}
            </h3>
            <p className="text-sm text-darkGrey">{module.description}</p>
          </div>
        </div>
        {quizPassed && (
          <div className="flex items-center gap-2">
            <Image
              src={module.nftImage}
              alt="NFT"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <BsCheckCircleFill className="text-active" size={20} />
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-darkGrey">
            {lessonsDone}/{lessonsTotal} lecciones
          </span>
          {progress.quizScore !== null && (
            <span className={colors.text}>
              Quiz: {progress.quizScore}%
            </span>
          )}
        </div>
        <div className="w-full bg-progressGrey rounded-full h-2">
          <div
            className={`${colors.badge} h-2 rounded-full transition-all`}
            style={{
              width: `${quizPassed ? 100 : (lessonsDone / (lessonsTotal + 1)) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Lessons list */}
      <div className="space-y-2 mb-4">
        {module.lessons.map((lesson, i) => {
          const done = progress.lessonsCompleted.includes(lesson.id);
          return (
            <button
              key={lesson.id}
              onClick={() => onStartLesson(i)}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/60 transition-colors text-left"
            >
              {done ? (
                <BsCheckCircleFill className="text-active flex-shrink-0" size={18} />
              ) : (
                <BsJournalText className="text-darkGrey flex-shrink-0" size={18} />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium truncate ${
                    done ? "text-active" : "text-darkGreen"
                  }`}
                >
                  {lesson.title}
                </p>
                <p className="text-xs text-darkGrey">
                  {lesson.durationMinutes} min
                </p>
              </div>
              {!done && (
                <BsPlayCircle className={`${colors.text} flex-shrink-0`} size={18} />
              )}
            </button>
          );
        })}
      </div>

      {/* Quiz button */}
      {allLessonsDone && !quizPassed && (
        <button
          onClick={onStartQuiz}
          className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl ${colors.badge} text-white font-medium transition-all hover:opacity-90`}
        >
          <BsPatchQuestion size={18} />
          {progress.quizScore !== null
            ? "Reintentar Quiz"
            : "Tomar Quiz"}
          <span className="text-xs opacity-80 ml-1">
            (+{module.rewardXP} XP)
          </span>
        </button>
      )}

      {quizPassed && (
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-active/10 text-active font-medium">
          <BsCheckCircleFill size={18} />
          Módulo completado — +{module.rewardXP} XP
        </div>
      )}
    </div>
  );
}
