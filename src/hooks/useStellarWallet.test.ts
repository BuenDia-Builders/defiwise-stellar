// @vitest-environment jsdom
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStellarWallet } from "./useStellarWallet";

const mockAuthModal = vi.fn();
const mockGetAddress = vi.fn();
const mockDisconnect = vi.fn();
const mockSignTransaction = vi.fn();

const mockKit = {
  authModal: (...args: any[]) => mockAuthModal(...args),
  getAddress: (...args: any[]) => mockGetAddress(...args),
  disconnect: (...args: any[]) => mockDisconnect(...args),
  signTransaction: (...args: any[]) => mockSignTransaction(...args),
};

vi.mock("@/lib/hydration", () => ({
  useHydrated: () => true,
}));

vi.mock("@/lib/stellar-wallets-kit", () => ({
  getStellarWalletsKit: vi.fn().mockImplementation(async () => mockKit),
}));

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
  get length() {
    return Object.keys(store).length;
  },
  key: (index: number) => Object.keys(store)[index] ?? null,
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

describe("useStellarWallet hook (Stellar Wallets Kit)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("returns initial disconnected state", () => {
    const { result } = renderHook(() => useStellarWallet());

    expect(result.current.address).toBeNull();
    expect(result.current.truncatedAddress).toBeNull();
    expect(result.current.connected).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it("authenticates and connects via authModal", async () => {
    const mockAddress = "GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC";
    mockAuthModal.mockResolvedValueOnce({ address: mockAddress });

    const { result } = renderHook(() => useStellarWallet());

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.address).toBe(mockAddress);
    expect(result.current.truncatedAddress).toBe("GASH...UVHC");
    expect(result.current.connected).toBe(true);
    expect(window.localStorage.getItem("defiwise:wallet_address")).toBe(mockAddress);
  });

  it("gracefully handles user closing the auth modal without connecting", async () => {
    mockAuthModal.mockRejectedValueOnce({
      code: -1,
      message: "The user closed the modal.",
    });

    const { result } = renderHook(() => useStellarWallet());

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.address).toBeNull();
    expect(result.current.connected).toBe(false);
    expect(result.current.loading).toBe(false);
  });

  it("disconnects active wallet and clears storage", async () => {
    const mockAddress = "GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC";
    window.localStorage.setItem("defiwise:wallet_address", mockAddress);

    const { result } = renderHook(() => useStellarWallet());

    expect(result.current.address).toBe(mockAddress);
    expect(result.current.connected).toBe(true);

    await act(async () => {
      await result.current.disconnect();
    });

    expect(result.current.address).toBeNull();
    expect(result.current.connected).toBe(false);
    expect(window.localStorage.getItem("defiwise:wallet_address")).toBeNull();
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it("signs transaction via StellarWalletsKit.signTransaction", async () => {
    const mockSigned = { signedTxXdr: "AAAA_MOCK_SIGNED_XDR" };
    mockSignTransaction.mockResolvedValueOnce(mockSigned);

    const { result } = renderHook(() => useStellarWallet());

    let res: any;
    await act(async () => {
      res = await result.current.signTransaction("AAAA_RAW_TX");
    });

    expect(res).toEqual(mockSigned);
    expect(mockSignTransaction).toHaveBeenCalledWith("AAAA_RAW_TX", undefined);
  });
});
