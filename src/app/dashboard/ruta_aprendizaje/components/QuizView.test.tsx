// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import QuizView from "./QuizView";
import type { Module } from "@/data/courses";
import { useProgress } from "@/hooks/useProgress";
import { useStellarProgress } from "@/hooks/useStellarProgress";
import { useStellarWallet } from "@/hooks/useStellarWallet";

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: React.ComponentProps<"img">) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} src={props.src} alt={props.alt || ""} />;
  },
}));

vi.mock("react-hot-toast", () => ({
  __esModule: true,
  default: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock("@/hooks/useStellarWallet", () => ({
  useStellarWallet: vi.fn(),
}));

vi.mock("@/hooks/useStellarProgress", () => ({
  useStellarProgress: vi.fn(),
}));

const mockModule: Module = {
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

const createMockProgress = (
  quizScore: number | null,
  completed: boolean
): ReturnType<typeof useProgress> => ({
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

const createMockStellarProgress = (): ReturnType<typeof useStellarProgress> => ({
  connected: false,
  address: null,
  rewarding: false,
  rewardError: null,
  lastRewardResult: null,
  xpBalance: BigInt(0),
  historicalXP: BigInt(0),
  loading: false,
  error: null,
  fetchOnChainProgress: vi.fn(async () => {}),
  refresh: vi.fn(async () => {}),
  checkChallengeCompleted: vi.fn(async () => false),
  checkHasBadge: vi.fn(async () => false),
  rewardQuiz: vi.fn(async () => null),
  isHydrated: true,
});

async function completeQuiz() {
  fireEvent.click(screen.getByText("Decentralized Finance"));
  fireEvent.click(screen.getByText("Confirmar respuesta"));
  await act(async () => {
    fireEvent.click(screen.getByText("Ver resultado"));
  });
}

beforeEach(() => {
  vi.mocked(useStellarWallet).mockReturnValue({
    connected: false,
    address: null,
  } as ReturnType<typeof useStellarWallet>);
  vi.mocked(useStellarProgress).mockReturnValue(createMockStellarProgress());
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("QuizView", () => {
  it("renders questions and records the quiz result locally", async () => {
    const progress = createMockProgress(null, false);
    render(<QuizView module={mockModule} onBack={vi.fn()} progress={progress} />);

    expect(screen.getByText("What is DeFi?")).toBeTruthy();
    await completeQuiz();

    expect(progress.completeQuiz).toHaveBeenCalledWith("mod-1", 100, 50, [0]);
  });

  it("submits the selected answer indices for server-side validation", async () => {
    const rewardQuiz = vi.fn().mockResolvedValue({
      hash: "stellarhash123",
      xpRewarded: 50,
    });
    vi.mocked(useStellarWallet).mockReturnValue({
      connected: true,
      address: "GABC123",
    } as ReturnType<typeof useStellarWallet>);
    vi.mocked(useStellarProgress).mockReturnValue({
      ...createMockStellarProgress(),
      connected: true,
      rewardQuiz,
    } as ReturnType<typeof useStellarProgress>);

    render(
      <QuizView
        module={mockModule}
        onBack={vi.fn()}
        progress={createMockProgress(null, false)}
      />
    );
    await completeQuiz();

    expect(rewardQuiz).toHaveBeenCalledWith(
      "mod-1-quiz",
      [0],
      1,
      1,
      "Test Module"
    );
  });

  it("does not submit a quiz below the passing threshold", async () => {
    const rewardQuiz = vi.fn().mockResolvedValue(null);
    vi.mocked(useStellarWallet).mockReturnValue({
      connected: true,
      address: "GABC123",
    } as ReturnType<typeof useStellarWallet>);
    vi.mocked(useStellarProgress).mockReturnValue({
      ...createMockStellarProgress(),
      connected: true,
      rewardQuiz,
    } as ReturnType<typeof useStellarProgress>);

    const failingModule: Module = {
      ...mockModule,
      quiz: [
        {
          ...mockModule.quiz[0],
          options: [
            { text: "Decentralized Finance", isCorrect: false },
            { text: "Traditional Finance", isCorrect: true },
          ],
        },
      ],
    };

    render(
      <QuizView
        module={failingModule}
        onBack={vi.fn()}
        progress={createMockProgress(null, false)}
      />
    );
    fireEvent.click(screen.getByText("Decentralized Finance"));
    fireEvent.click(screen.getByText("Confirmar respuesta"));
    await act(async () => {
      fireEvent.click(screen.getByText("Ver resultado"));
    });

    expect(rewardQuiz).not.toHaveBeenCalled();
  });

  it("shows the transaction hash from a successful on-chain reward", async () => {
    vi.mocked(useStellarWallet).mockReturnValue({
      connected: true,
      address: "GABC123",
    } as ReturnType<typeof useStellarWallet>);
    vi.mocked(useStellarProgress).mockReturnValue({
      ...createMockStellarProgress(),
      connected: true,
      lastRewardResult: {
        hash: "stellarhash123",
        xpRewarded: 42,
      },
      rewardQuiz: vi.fn().mockResolvedValue({
        hash: "stellarhash123",
        xpRewarded: 42,
      }),
    } as ReturnType<typeof useStellarProgress>);

    render(
      <QuizView
        module={mockModule}
        onBack={vi.fn()}
        progress={createMockProgress(100, true)}
      />
    );
    await completeQuiz();

    expect(screen.getByText("Tx: stellarhash123")).toBeTruthy();
    expect(screen.getByText(/\+42 XP/)).toBeTruthy();
    expect(screen.getByText(/Registrado on-chain en Stellar Testnet/)).toBeTruthy();
  });
});
