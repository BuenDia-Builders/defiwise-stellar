// @vitest-environment jsdom
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { ConnectWalletButton } from "./ConnectWalletButton";
import * as WalletHook from "@/hooks/useStellarWallet";

vi.mock("@/hooks/useStellarWallet");

describe("ConnectWalletButton Component", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders connect button supporting multi-wallets when disconnected", () => {
    const connectMock = vi.fn();
    vi.spyOn(WalletHook, "useStellarWallet").mockReturnValue({
      address: null,
      truncatedAddress: null,
      connected: false,
      loading: false,
      connect: connectMock,
      disconnect: vi.fn(),
      signTransaction: vi.fn(),
      isHydrated: true,
    });

    render(<ConnectWalletButton />);

    const btn = screen.getByRole("button", { name: /Conectar Wallet/i });
    expect(btn).toBeTruthy();
    expect(btn.getAttribute("title")).toContain("Stellar Wallets Kit");

    fireEvent.click(btn);
    expect(connectMock).toHaveBeenCalledTimes(1);
  });

  it("renders loading state when connection is in progress", () => {
    vi.spyOn(WalletHook, "useStellarWallet").mockReturnValue({
      address: null,
      truncatedAddress: null,
      connected: false,
      loading: true,
      connect: vi.fn(),
      disconnect: vi.fn(),
      signTransaction: vi.fn(),
      isHydrated: true,
    });

    render(<ConnectWalletButton />);

    expect(screen.getByText("Conectando...")).toBeTruthy();
    const btn = screen.getByRole("button");
    expect(btn.hasAttribute("disabled")).toBe(true);
  });

  it("renders truncated address and disconnect button when connected", () => {
    const disconnectMock = vi.fn();
    vi.spyOn(WalletHook, "useStellarWallet").mockReturnValue({
      address: "GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC",
      truncatedAddress: "GASH...UVHC",
      connected: true,
      loading: false,
      connect: vi.fn(),
      disconnect: disconnectMock,
      signTransaction: vi.fn(),
      isHydrated: true,
    });

    render(<ConnectWalletButton />);

    expect(screen.getByText("GASH...UVHC")).toBeTruthy();
    const disconnectBtn = screen.getByRole("button", { name: /Salir/i });
    expect(disconnectBtn).toBeTruthy();

    fireEvent.click(disconnectBtn);
    expect(disconnectMock).toHaveBeenCalledTimes(1);
  });
});
