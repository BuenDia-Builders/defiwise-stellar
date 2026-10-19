// @vitest-environment jsdom
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { DEXSwapPractice } from "./DEXSwapPractice";

afterEach(() => {
  cleanup();
});

const mockConnect = vi.fn();
const mockSignTransaction = vi.fn();
let mockAddress: string | null = null;
let mockConnected = false;

vi.mock("@/hooks/useStellarWallet", () => ({
  useStellarWallet: () => ({
    address: mockAddress,
    connected: mockConnected,
    connect: mockConnect,
    signTransaction: mockSignTransaction,
    loading: false,
    truncatedAddress: mockAddress ? `${mockAddress.slice(0, 4)}...${mockAddress.slice(-4)}` : null,
  }),
}));

vi.mock("@/lib/dex-swap", async () => {
  const actual = await vi.importActual<typeof import("@/lib/dex-swap")>("@/lib/dex-swap");
  return {
    ...actual,
    fundWithFriendbot: vi.fn().mockResolvedValue({
      success: true,
      message: "¡Cuenta financiada exitosamente con 10,000 XLM en Stellar Testnet!",
    }),
    fetchAccountBalances: vi.fn().mockResolvedValue({
      XLM: 1000,
      USDC: 50,
      AQUA: 0,
      EURC: 0,
    }),
    buildTestnetSwapTx: vi.fn().mockResolvedValue("AAAA_MOCK_UNSIGNED_XDR"),
    submitSignedSwapTx: vi.fn().mockResolvedValue({
      success: true,
      txHash: "mock_testnet_tx_hash_1234567890abcdef",
    }),
  };
});

let store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = String(value);
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    store = {};
  },
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("DEXSwapPractice Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    mockAddress = null;
    mockConnected = false;
  });

  it("renders with initial assets, didactic AMM details, and sandbox disclaimer", () => {
    render(<DEXSwapPractice />);

    expect(screen.getByText("Práctica Interactiva: Swap en DEX")).toBeTruthy();
    expect(screen.getByText("Stellar Testnet AMM")).toBeTruthy();
    expect(screen.getByText("Tasa de cambio")).toBeTruthy();
    expect(screen.getByText("Impacto de precio (Price Impact)")).toBeTruthy();
    expect(screen.getByText("Comisión de liquidez (LP Fee)")).toBeTruthy();
    expect(screen.getByText(/Entorno Educativo Seguro/)).toBeTruthy();
  });

  it("shows connect wallet prompt when user is not connected", async () => {
    render(<DEXSwapPractice />);

    const connectButtons = screen.getAllByText(/Conectar Wallet/i);
    expect(connectButtons.length).toBeGreaterThan(0);

    fireEvent.click(connectButtons[0]);
    expect(mockConnect).toHaveBeenCalledTimes(1);
  });

  it("renders connected wallet state with friendbot funding button and balance", async () => {
    mockAddress = "GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC";
    mockConnected = true;

    render(<DEXSwapPractice />);

    await waitFor(() => {
      expect(screen.getByText(/GASH...UVHC/)).toBeTruthy();
    });

    const fundButton = screen.getByText(/Recibir 10,000 XLM de prueba/i);
    expect(fundButton).toBeTruthy();

    fireEvent.click(fundButton);

    const { fundWithFriendbot } = await import("@/lib/dex-swap");
    await waitFor(() => {
      expect(fundWithFriendbot).toHaveBeenCalledWith(mockAddress);
    });
  });

  it("inverts swap direction when invert button is clicked", () => {
    render(<DEXSwapPractice initialFromAsset="XLM" initialToAsset="USDC" />);

    const invertButton = screen.getByTitle("Invertir activos");
    fireEvent.click(invertButton);

    // After inverting, fromAsset should be USDC and toAsset should be XLM
    const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
    expect(selects[0].value).toBe("USDC");
    expect(selects[1].value).toBe("XLM");
  });

  it("executes swap with user signature and fires onSwapComplete callback", async () => {
    mockAddress = "GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC";
    mockConnected = true;
    mockSignTransaction.mockResolvedValueOnce({
      signedTxXdr: "AAAA_MOCK_SIGNED_XDR",
    });

    const onSwapComplete = vi.fn();
    render(<DEXSwapPractice onSwapComplete={onSwapComplete} />);

    await waitFor(() => {
      expect(screen.getByText(/1000.00 XLM/)).toBeTruthy();
    });

    const swapButton = screen.getByRole("button", {
      name: /Ejecutar Swap en Testnet/i,
    });
    fireEvent.click(swapButton);

    await waitFor(() => {
      expect(mockSignTransaction).toHaveBeenCalled();
      expect(onSwapComplete).toHaveBeenCalledWith(
        "mock_testnet_tx_hash_1234567890abcdef"
      );
      expect(screen.getByText(/¡Práctica completada on-chain en Stellar Testnet!/i)).toBeTruthy();
    });
  });
});
