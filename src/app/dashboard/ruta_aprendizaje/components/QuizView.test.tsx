// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import QuizView from "./QuizView";
import React from "react";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => <img {...props} src={props.src} alt={props.alt || ""} />,
}));

vi.mock("react-hot-toast", () => ({
  __esModule: true,
  default: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}));

// Default hook values — overridden per test where needed
const defaultStellarProgress = {
  connected: false,
  address: null,
  rewarding: false,
  rewardError: null,
  lastRewardResult: null,
  xpBalance: BigInt(0),
  historicalXP: BigInt(0),
  loading: false,
  error: null,
  fetchOnChainProgress: vi.fn(),
  refresh: vi.fn(),
  rewardQuiz: vi.fn().mockResolvedValue(null),
  checkChallengeCompleted: vi.fn().mockResolvedValue(false),
  checkHasBadge: vi.fn().mockResolvedValue(false),
  isHydrated: true,
};

vi.mock("@/hooks/useStellarWallet", () => ({
  useStellarWallet: vi.fn(() => ({ connected: false, address: null })),
}));

vi.mock("@/hooks/useStellarProgress", () => ({
  useStellarProgress: vi.fn(() => ({ ...defaultStellarProgress })),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

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

/** Helper: answer and submit the single-question quiz */
async function completeQuiz() {
  fireEvent.click(screen.getByText("Decentralized Finance"));
  fireEvent.click(screen.getByText("Confirmar respuesta"));
  await act(async () => {
    fireEvent.click(screen.getByText("Ver resultado"));
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("QuizView", () => {
  it("renders the first question", () => {
    render(
      <QuizView
        module={mockModule}
        onBack={vi.fn()}
        progress={createMockProgress(null, false) as any}
      />
    );
    expect(screen.getByText("What is DeFi?")).toBeTruthy();
  });

  it("calls completeQuiz on local progress when quiz is finished", async () => {
    const mockProgress = createMockProgress(null, false);
    render(
      <QuizView
        module={mockModule}
        onBack={vi.fn()}
        progress={mockProgress as any}
      />
    );
    await completeQuiz();
    expect(mockProgress.completeQuiz).toHaveBeenCalledWith("mod-1", 100, 50);
  });

  describe("on-chain integration — rewardQuiz hook", () => {
    beforeEach(() => {
      // Simulate wallet connected
      const { useStellarWallet } = vi.mocked(
        await import("@/hooks/useStellarWallet")
      );
      useStellarWallet.mockReturnValue({
        connected: true,
        address: "GABC123",
      } as any);
    });

    it("calls rewardQuiz with challengeId, correct count, total and moduleTitle when score ≥ 75 %", async () => {
      const mockRewardQuiz = vi.fn().mockResolvedValue({
        hash: "abc123",
        xpRewarded: 50,
      });

      const { useStellarProgress } = vi.mocked(
        await import("@/hooks/useStellarProgress")
      );
      useStellarProgress.mockReturnValue({
        ...defaultStellarProgress,
        connected: true,
        rewardQuiz: mockRewardQuiz,
        lastRewardResult: null,
      } as any);

      render(
        <QuizView
          module={mockModule}
          onBack={vi.fn()}
          progress={createMockProgress(null, false) as any}
        />
      );

      await completeQuiz();

      expect(mockRewardQuiz).toHaveBeenCalledWith(
        "mod-1-quiz",   // challengeId
        1,              // correct
        1,              // total
        50,             // maxXp
        "Test Module"   // moduleTitle
      );
    });

    it("does NOT call rewardQuiz when score < 75 %", async () => {
      const mockRewardQuiz = vi.fn().mockResolvedValue(null);

      const { useStellarProgress } = vi.mocked(
        await import("@/hooks/useStellarProgress")
      );
      useStellarProgress.mockReturnValue({
        ...defaultStellarProgress,
        connected: true,
        rewardQuiz: mockRewardQuiz,
      } as any);

      const failingModule = {
        ...mockModule,
        quiz: [
          {
            id: "q-1",
            prompt: "What is DeFi?",
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
          progress={createMockProgress(null, false) as any}
        />
      );

      // Pick wrong answer
      fireEvent.click(screen.getByText("Decentralized Finance"));
      fireEvent.click(screen.getByText("Confirmar respuesta"));
      await act(async () => {
        fireEvent.click(screen.getByText("Ver resultado"));
      });

      expect(mockRewardQuiz).not.toHaveBeenCalled();
    });

    it("does NOT call rewardQuiz when wallet is disconnected", async () => {
      const { useStellarWallet } = vi.mocked(
        await import("@/hooks/useStellarWallet")
      );
      useStellarWallet.mockReturnValue({ connected: false, address: null } as any);

      const mockRewardQuiz = vi.fn().mockResolvedValue(null);
      const { useStellarProgress } = vi.mocked(
        await import("@/hooks/useStellarProgress")
      );
      useStellarProgress.mockReturnValue({
        ...defaultStellarProgress,
        connected: false,
        rewardQuiz: mockRewardQuiz,
      } as any);

      render(
        <QuizView
          module={mockModule}
          onBack={vi.fn()}
          progress={createMockProgress(null, false) as any}
        />
      );

      await completeQuiz();

      expect(mockRewardQuiz).not.toHaveBeenCalled();
    });
  });

  describe("results screen — on-chain confirmation UI", () => {
    it("shows real tx hash and XP from lastRewardResult", async () => {
      const { useStellarProgress } = vi.mocked(
        await import("@/hooks/useStellarProgress")
      );
      useStellarProgress.mockReturnValue({
        ...defaultStellarProgress,
        connected: true,
        rewardQuiz: vi.fn().mockResolvedValue({
          hash: "stellarhash123",
          xpRewarded: 42,
        }),
        lastRewardResult: {
          hash: "stellarhash123",
          xpRewarded: 42,
        },
      } as any);

      render(
        <QuizView
          module={mockModule}
          onBack={vi.fn()}
          progress={createMockProgress(100, true) as any}
        />
      );

      await completeQuiz();

      expect(screen.getByText("Tx: stellarhash123")).toBeTruthy();
      expect(screen.getByText(/\+42 XP/)).toBeTruthy();
      expect(screen.getByText(/Registrado on-chain en Stellar Testnet/)).toBeTruthy();
    });

    it("shows badge hash label when badge was minted", async () => {
      const { useStellarProgress } = vi.mocked(
        await import("@/hooks/useStellarProgress")
      );
      useStellarProgress.mockReturnValue({
        ...defaultStellarProgress,
        connected: true,
        rewardQuiz: vi.fn().mockResolvedValue({
          hash: "xphash",
          xpRewarded: 50,
          badgeHash: "badgehash",
        }),
        lastRewardResult: {
          hash: "xphash",
          xpRewarded: 50,
          badgeHash: "badgehash",
        },
      } as any);

      render(
        <QuizView
          module={mockModule}
          onBack={vi.fn()}
          progress={createMockProgress(100, true) as any}
        />
      );

      await completeQuiz();

      expect(screen.getByText(/Badge NFT acuñado/)).toBeTruthy();
    });

    it("shows spinner while rewarding is in progress", async () => {
      const { useStellarProgress } = vi.mocked(
        await import("@/hooks/useStellarProgress")
      );
      useStellarProgress.mockReturnValue({
        ...defaultStellarProgress,
        connected: true,
        rewarding: true,
        rewardQuiz: vi.fn().mockReturnValue(new Promise(() => {})), // never resolves
        lastRewardResult: null,
      } as any);

      render(
        <QuizView
          module={mockModule}
          onBack={vi.fn()}
          progress={createMockProgress(100, true) as any}
        />
      );

      await completeQuiz();

      expect(screen.getByText(/Registrando en Stellar Testnet/)).toBeTruthy();
    });

    it("shows wallet prompt when disconnected and score ≥ 75 %", async () => {
      const toast = (await import("react-hot-toast")).default as any;

      const { useStellarWallet } = vi.mocked(
        await import("@/hooks/useStellarWallet")
      );
      useStellarWallet.mockReturnValue({ connected: false, address: null } as any);

      const { useStellarProgress } = vi.mocked(
        await import("@/hooks/useStellarProgress")
      );
      useStellarProgress.mockReturnValue({
        ...defaultStellarProgress,
        connected: false,
        lastRewardResult: null,
      } as any);

      render(
        <QuizView
          module={mockModule}
          onBack={vi.fn()}
          progress={createMockProgress(null, false) as any}
        />
      );

      await completeQuiz();

      expect(toast).toHaveBeenCalledWith(
        expect.stringContaining("Conectá tu wallet"),
        expect.objectContaining({ icon: "💡" })
      );
    });
  });

  describe("local progress is never broken by on-chain errors", () => {
    it("still marks quiz complete locally even when rewardQuiz returns null (409/429)", async () => {
      const { useStellarWallet } = vi.mocked(
        await import("@/hooks/useStellarWallet")
      );
      useStellarWallet.mockReturnValue({ connected: true, address: "GABC" } as any);

      const { useStellarProgress } = vi.mocked(
        await import("@/hooks/useStellarProgress")
      );
      useStellarProgress.mockReturnValue({
        ...defaultStellarProgress,
        connected: true,
        rewardQuiz: vi.fn().mockResolvedValue(null), // simulates 409/429 handled inside hook
        lastRewardResult: null,
      } as any);

      const mockProgress = createMockProgress(null, false);

      render(
        <QuizView
          module={mockModule}
          onBack={vi.fn()}
          progress={mockProgress as any}
        />
      );

      await completeQuiz();

      // Local progress must be saved regardless
      expect(mockProgress.completeQuiz).toHaveBeenCalled();
    });
  });
});
