"use client";

import { useState } from "react";
import Image from "next/image";
import { Module } from "@/data/courses";
import { useProgress } from "@/hooks/useProgress";
import {
  BsArrowLeft,
  BsArrowRight,
  BsCheckCircleFill,
  BsXCircleFill,
  BsTrophy,
  BsArrowRepeat,
} from "react-icons/bs";

interface QuizViewProps {
  module: Module;
  onBack: () => void;
  progress: ReturnType<typeof useProgress>;
}

export default function QuizView({ module, onBack, progress }: QuizViewProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const quiz = module.quiz;
  const question = quiz[currentQ];
  const totalQuestions = quiz.length;

  const handleAnswer = () => {
    if (selectedOption === null) return;
    setAnswered(true);
    if (question.options[selectedOption].isCorrect) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQ + 1 < totalQuestions) {
      setCurrentQ((prev) => prev + 1);
      setSelectedOption(null);
      setAnswered(false);
    } else {
      const finalCorrect =
        correctCount +
        (question.options[selectedOption!]?.isCorrect ? 1 : 0);
      const finalScore = Math.round((finalCorrect / totalQuestions) * 100);
      progress.completeQuiz(module.id, finalScore, module.rewardXP);
      setFinished(true);
    }
  };

  const handleRetry = () => {
    setCurrentQ(0);
    setSelectedOption(null);
    setAnswered(false);
    setCorrectCount(0);
    setFinished(false);
  };

  // Results screen
  if (finished) {
    const modProgress = progress.getModuleProgress(module.id);
    const passed = modProgress.completed;

    return (
      <div className="text-center py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-darkGrey hover:text-darkOrange transition-colors mb-8"
        >
          <BsArrowLeft size={16} />
          <span className="text-sm">Volver a módulos</span>
        </button>

        <div className="max-w-md mx-auto">
          {passed ? (
            <>
              <div className="w-20 h-20 bg-active/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <BsTrophy className="text-active" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-darkGreen mb-2">
                ¡Felicidades!
              </h2>
              <p className="text-grey mb-6">
                Completaste el módulo &quot;{module.title}&quot; con un{" "}
                <strong className="text-active">
                  {modProgress.quizScore}%
                </strong>{" "}
                de aciertos.
              </p>
              <div className="bg-lightYellow rounded-2xl p-6 mb-6">
                <Image
                  src={module.nftImage}
                  alt="NFT Reward"
                  width={120}
                  height={120}
                  className="mx-auto mb-4"
                />
                <p className="text-sm text-darkOrange font-semibold">
                  Ganaste un NFT + {module.rewardXP} XP
                </p>
                <p className="text-xs text-darkGrey mt-1">
                  Este NFT será registrado en Stellar Testnet
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-pink/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <BsXCircleFill className="text-pink" size={40} />
              </div>
              <h2 className="text-2xl font-bold text-darkGreen mb-2">
                ¡Casi!
              </h2>
              <p className="text-grey mb-6">
                Obtuviste{" "}
                <strong className="text-pink">
                  {modProgress.quizScore}%
                </strong>
                . Necesitás al menos 75% para aprobar.
              </p>
            </>
          )}

          <div className="flex gap-4 justify-center">
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-xl border border-borderGrey text-darkGrey hover:border-darkOrange hover:text-darkOrange transition-colors"
            >
              Volver
            </button>
            {!passed && (
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-darkOrange to-lightOrange text-white font-medium"
              >
                <BsArrowRepeat size={16} />
                Reintentar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Quiz question screen
  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-darkGrey hover:text-darkOrange transition-colors mb-6"
      >
        <BsArrowLeft size={16} />
        <span className="text-sm">Volver a módulos</span>
      </button>

      {/* Header */}
      <div className="mb-6">
        <p className="text-sm text-darkGrey mb-1">
          Quiz: {module.title}
        </p>
        <h1 className="text-xl font-bold text-darkGreen">
          Pregunta {currentQ + 1} de {totalQuestions}
        </h1>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mb-8">
        {quiz.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < currentQ
                ? "bg-active"
                : i === currentQ
                ? "bg-darkOrange"
                : "bg-progressGrey"
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl border border-borderGrey/30 p-8 mb-6">
        <h2 className="text-lg font-semibold text-darkGreen mb-6">
          {question.prompt}
        </h2>

        <div className="space-y-3">
          {question.options.map((option, i) => {
            let optionClass =
              "border border-borderGrey/50 hover:border-darkOrange/50 bg-white";

            if (selectedOption === i && !answered) {
              optionClass = "border-2 border-darkOrange bg-darkOrange/5";
            }
            if (answered) {
              if (option.isCorrect) {
                optionClass = "border-2 border-active bg-active/5";
              } else if (selectedOption === i) {
                optionClass = "border-2 border-pink bg-pink/5";
              }
            }

            return (
              <button
                key={i}
                onClick={() => !answered && setSelectedOption(i)}
                disabled={answered}
                className={`w-full text-left p-4 rounded-xl transition-all flex items-center gap-3 ${optionClass}`}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                    selectedOption === i
                      ? "bg-darkOrange text-white"
                      : "bg-progressGrey text-darkGrey"
                  } ${answered && option.isCorrect ? "bg-active text-white" : ""}
                  ${answered && selectedOption === i && !option.isCorrect ? "bg-pink text-white" : ""}`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-darkGreen">{option.text}</span>
                {answered && option.isCorrect && (
                  <BsCheckCircleFill
                    className="text-active ml-auto flex-shrink-0"
                    size={18}
                  />
                )}
                {answered && selectedOption === i && !option.isCorrect && (
                  <BsXCircleFill
                    className="text-pink ml-auto flex-shrink-0"
                    size={18}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        {!answered ? (
          <button
            onClick={handleAnswer}
            disabled={selectedOption === null}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-darkOrange to-lightOrange text-white font-medium shadow-lg shadow-darkOrange/25 disabled:opacity-40 disabled:shadow-none transition-all"
          >
            Confirmar respuesta
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-darkOrange to-lightOrange text-white font-medium shadow-lg shadow-darkOrange/25 transition-all"
          >
            {currentQ + 1 < totalQuestions ? (
              <>
                Siguiente
                <BsArrowRight size={16} />
              </>
            ) : (
              "Ver resultado"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
