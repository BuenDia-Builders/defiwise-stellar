"use client";

import { Module } from "@/data/courses";
import { useProgress } from "@/hooks/useProgress";
import { BsArrowLeft, BsArrowRight, BsCheckCircleFill } from "react-icons/bs";

interface LessonViewProps {
  module: Module;
  lessonIndex: number;
  onBack: () => void;
  onNext: (nextIndex: number) => void;
  progress: ReturnType<typeof useProgress>;
}

export default function LessonView({
  module,
  lessonIndex,
  onBack,
  onNext,
}: LessonViewProps) {
  const lesson = module.lessons[lessonIndex];
  const isLast = lessonIndex === module.lessons.length - 1;

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    return content.split("\n").map((line, i) => {
      if (line.startsWith("## ")) {
        return (
          <h2 key={i} className="text-xl font-bold text-darkGreen mt-6 mb-3">
            {line.replace("## ", "")}
          </h2>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <h3 key={i} className="text-lg font-semibold text-darkGreen mt-5 mb-2">
            {line.replace("### ", "")}
          </h3>
        );
      }
      if (line.startsWith("- **")) {
        const match = line.match(/- \*\*(.+?)\*\*(.*)$/);
        if (match) {
          return (
            <li key={i} className="ml-4 text-grey mb-1 list-disc">
              <strong className="text-darkGreen">{match[1]}</strong>
              {match[2]}
            </li>
          );
        }
      }
      if (line.startsWith("- ")) {
        return (
          <li key={i} className="ml-4 text-grey mb-1 list-disc">
            {line.replace("- ", "")}
          </li>
        );
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <p key={i} className="text-darkGreen font-semibold mt-3 mb-1">
            {line.replace(/\*\*/g, "")}
          </p>
        );
      }
      if (line.trim() === "") {
        return <div key={i} className="h-2" />;
      }
      return (
        <p key={i} className="text-grey leading-relaxed">
          {line}
        </p>
      );
    });
  };

  return (
    <div>
      {/* Breadcrumb */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-darkGrey hover:text-darkOrange transition-colors mb-6"
      >
        <BsArrowLeft size={16} />
        <span className="text-sm">Volver a módulos</span>
      </button>

      {/* Lesson header */}
      <div className="mb-6">
        <p className="text-sm text-darkGrey mb-1">
          Módulo: {module.title} — Lección {lessonIndex + 1} de{" "}
          {module.lessons.length}
        </p>
        <h1 className="text-2xl font-bold text-darkGreen">{lesson.title}</h1>
        <p className="text-grey mt-1">{lesson.description}</p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {module.lessons.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= lessonIndex ? "bg-darkOrange" : "bg-progressGrey"
            }`}
          />
        ))}
        <div
          className={`h-1.5 flex-1 rounded-full bg-progressGrey`}
          title="Quiz"
        />
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-borderGrey/30 p-8 mb-8">
        {renderContent(lesson.content)}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => {
            if (lessonIndex > 0) {
              onNext(lessonIndex); // hack: we go back by re-setting
            } else {
              onBack();
            }
          }}
          disabled={lessonIndex === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-darkGrey hover:text-darkOrange disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <BsArrowLeft size={16} />
          Anterior
        </button>

        <button
          onClick={() => onNext(lessonIndex + 1)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-darkOrange to-lightOrange text-white font-medium shadow-lg shadow-darkOrange/25 hover:shadow-darkOrange/40 transition-all"
        >
          {isLast ? (
            <>
              <BsCheckCircleFill size={16} />
              Ir al Quiz
            </>
          ) : (
            <>
              Siguiente
              <BsArrowRight size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
