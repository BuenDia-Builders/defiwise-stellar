import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ModuleCard from "./ModuleCard";
import { Module } from "@/data/courses";

afterEach(() => {
  cleanup();
});

const sampleModule: Module = {
  id: "mod-3",
  title: "El Valor del Dinero en el Tiempo",
  description: "Entendé por qué el dinero pierde valor y cómo DeFi te protege.",
  color: "darkOrange",
  rewardXP: 150,
  minXp: 100,
  nftImage: "/nft/nft3.svg",
  lessons: [
    {
      id: "les-3-1",
      title: "¿Qué es la inflación?",
      description: "Conceptos clave",
      content: "Contenido",
      durationMinutes: 10,
    },
  ],
  quiz: [
    {
      id: "q-3-1",
      prompt: "¿Qué es la inflación?",
      options: [
        { text: "Pérdida de poder adquisitivo", isCorrect: true },
        { text: "Ganancia de poder adquisitivo", isCorrect: false },
      ],
    },
  ],
};

describe("ModuleCard on-chain gating (Issue #38)", () => {
  it("renders clear wallet required message when user is not connected", () => {
    render(
      <ModuleCard
        module={sampleModule}
        index={2}
        unlocked={false}
        walletConnected={false}
        historicalXP={0}
        lockedReason="wallet_required"
        progress={{ completed: false, lessonsCompleted: [], quizScore: null, xpEarned: 0 }}
        onStartLesson={vi.fn()}
        onStartQuiz={vi.fn()}
      />
    );

    expect(screen.getByText("Módulo 3")).toBeTruthy();
    expect(screen.getByText("100 XP req.")).toBeTruthy();
    expect(
      screen.getByText("Conectá tu wallet para verificar tu XP on-chain (requiere 100 XP)")
    ).toBeTruthy();
  });

  it("renders insufficient on-chain XP message when historical XP is below minXp", () => {
    render(
      <ModuleCard
        module={sampleModule}
        index={2}
        unlocked={false}
        walletConnected={true}
        historicalXP={50}
        lockedReason="insufficient_xp"
        progress={{ completed: false, lessonsCompleted: [], quizScore: null, xpEarned: 0 }}
        onStartLesson={vi.fn()}
        onStartQuiz={vi.fn()}
      />
    );

    expect(
      screen.getByText("Requiere 100 XP históricos on-chain (actual: 50 XP)")
    ).toBeTruthy();
  });

  it("renders default previous module message when prerequisite module is not completed", () => {
    render(
      <ModuleCard
        module={sampleModule}
        index={2}
        unlocked={false}
        walletConnected={true}
        historicalXP={150}
        lockedReason="previous_module"
        progress={{ completed: false, lessonsCompleted: [], quizScore: null, xpEarned: 0 }}
        onStartLesson={vi.fn()}
        onStartQuiz={vi.fn()}
      />
    );

    expect(
      screen.getByText("Completá el módulo anterior para desbloquear")
    ).toBeTruthy();
  });

  it("renders unlocked module content when on-chain requirements are satisfied", () => {
    render(
      <ModuleCard
        module={sampleModule}
        index={2}
        unlocked={true}
        walletConnected={true}
        historicalXP={150}
        progress={{ completed: false, lessonsCompleted: [], quizScore: null, xpEarned: 0 }}
        onStartLesson={vi.fn()}
        onStartQuiz={vi.fn()}
      />
    );

    expect(screen.getByText("El Valor del Dinero en el Tiempo")).toBeTruthy();
    expect(
      screen.getByText("Entendé por qué el dinero pierde valor y cómo DeFi te protege.")
    ).toBeTruthy();
  });
});
