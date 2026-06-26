// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import QuizView from "./QuizView";
import React from "react";

afterEach(() => {
  cleanup();
});

// Mock next/image to avoid issues in Node test environment
vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} src={props.src} alt={props.alt || ""} />;
  },
}));

const mockModule = {
  id: "mod-1",
  title: "Test Module",
  description: "Test Description",
  color: "active",
  rewardXP: 50,
  nftImage: "/nft/nft1.svg",
  lessons: [],
  quiz: [
    {
      id: "q-1",
      prompt: "What is DeFi?",
      options: [
        { text: "Decentralized Finance", isCorrect: true },
        { text: "Traditional Finance", isCorrect: false },
      ],
    },
  ],
};

const createMockProgress = (quizScore: number | null, completed: boolean) => ({
  progress: {},
  getModuleProgress: () => ({
    completed,
    lessonsCompleted: [],
    quizScore,
    xpEarned: completed ? 50 : 0,
  }),
  completeLesson: vi.fn(),
  completeQuiz: vi.fn(),
  isModuleUnlocked: vi.fn().mockReturnValue(true),
  totalXP: completed ? 50 : 0,
  completedModules: completed ? 1 : 0,
  isHydrated: true,
});

describe("QuizView", () => {
  it("renders quiz questions and handles answering and completion flow", () => {
    const mockProgress = createMockProgress(null, false);
    const onBack = vi.fn();

    render(
      <QuizView
        module={mockModule}
        onBack={onBack}
        progress={mockProgress as any}
      />
    );

    // Verify it renders the question
    expect(screen.getByText("What is DeFi?")).toBeTruthy();

    // Select the correct option
    const correctOption = screen.getByText("Decentralized Finance");
    fireEvent.click(correctOption);

    // Confirm answer
    const confirmButton = screen.getByText("Confirmar respuesta");
    fireEvent.click(confirmButton);

    // Click on "Ver resultado"
    const nextButton = screen.getByText("Ver resultado");
    fireEvent.click(nextButton);

    // Verify that completeQuiz was called on progress object
    expect(mockProgress.completeQuiz).toHaveBeenCalledWith("mod-1", 200, 50);
  });

  it("does NOT show on-chain confirmation or false Stellar Testnet claims during the current local-only flow", () => {
    const mockProgress = createMockProgress(100, true);
    const onBack = vi.fn();

    render(
      <QuizView
        module={mockModule}
        onBack={onBack}
        progress={mockProgress as any}
      />
    );
    
    // Complete the quiz
    const correctOption = screen.getByText("Decentralized Finance");
    fireEvent.click(correctOption);
    fireEvent.click(screen.getByText("Confirmar respuesta"));
    fireEvent.click(screen.getByText("Ver resultado"));

    // Verify we are on the results screen
    expect(screen.getByText("¡Felicidades!")).toBeTruthy();

    // Verify XP is displayed
    expect(screen.getByText("Ganaste 50 XP")).toBeTruthy();

    // Verify coming soon message is displayed
    expect(
      screen.getByText(
        "El minado de NFT y el registro en la blockchain estarán disponibles próximamente."
      )
    ).toBeTruthy();

    // Verify NO Stellar registration message is shown
    expect(screen.queryByText(/Stellar Testnet/)).toBeNull();
    expect(screen.queryByText(/registrado/)).toBeNull();
  });

  it("shows on-chain confirmation only when a successful transaction hash (txHash) is provided", () => {
    const mockProgress = createMockProgress(100, true);
    const onBack = vi.fn();
    const mockTxHash = "0x1234567890abcdef";

    render(
      <QuizView
        module={mockModule}
        onBack={onBack}
        progress={mockProgress as any}
        txHash={mockTxHash}
      />
    );

    // Complete the quiz
    const correctOption = screen.getByText("Decentralized Finance");
    fireEvent.click(correctOption);
    fireEvent.click(screen.getByText("Confirmar respuesta"));
    fireEvent.click(screen.getByText("Ver resultado"));

    // Verify we are on the results screen
    expect(screen.getByText("¡Felicidades!")).toBeTruthy();

    // Verify Stellar confirmation message is displayed
    expect(screen.getByText("Este NFT ha sido registrado en Stellar Testnet")).toBeTruthy();
    expect(screen.getByText("Ganaste un NFT + 50 XP")).toBeTruthy();

    // Verify txHash is displayed
    expect(screen.getByText(`Tx: ${mockTxHash}`)).toBeTruthy();

    // Verify neutral 'coming soon' message is NOT displayed
    expect(
      screen.queryByText(
        "El minado de NFT y el registro en la blockchain estarán disponibles próximamente."
      )
    ).toBeNull();
  });
});
