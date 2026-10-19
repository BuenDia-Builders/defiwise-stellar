// @vitest-environment jsdom
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import EtherfuseStablebondYields from "./EtherfuseStablebondYields";
import * as EtherfuseHook from "@/hooks/useEtherfuseYields";

vi.mock("@/hooks/useEtherfuseYields");

const mockItems = [
  {
    name: "Etherfuse CETES",
    symbol: "CETES",
    currency: "MXN",
    country: "México",
    countryFlag: "🇲🇽",
    currentPrice: 1.1867,
    appreciationPercent: 18.67,
    benchmarkRateDescription: "Cetes 28d Banco de México (~10.5% - 11.0% TNA)",
    stellarTokenIdentifier:
      "CETES-GCRYUGD5NVARGXT56XEZI5CIFCQETYHAPQQTHO2O3IQZTHDH4LATMYWC",
    stellarIssuer: "GCRYUGD5NVARGXT56XEZI5CIFCQETYHAPQQTHO2O3IQZTHDH4LATMYWC",
    stellarAssetCode: "CETES",
    stellarDecimals: 7,
    stellarTotalSupply: "54594002.4150018",
  },
  {
    name: "Etherfuse USTRY",
    symbol: "USTRY",
    currency: "USD",
    country: "Estados Unidos",
    countryFlag: "🇺🇸",
    currentPrice: 1.0775,
    appreciationPercent: 7.75,
    benchmarkRateDescription: "US Treasury Bills (~4.5% - 5.0% TNA)",
    stellarTokenIdentifier:
      "USTRY-GCRYUGD5NVARGXT56XEZI5CIFCQETYHAPQQTHO2O3IQZTHDH4LATMYWC",
    stellarIssuer: "GCRYUGD5NVARGXT56XEZI5CIFCQETYHAPQQTHO2O3IQZTHDH4LATMYWC",
    stellarAssetCode: "USTRY",
    stellarDecimals: 7,
    stellarTotalSupply: "11513230.8784747",
  },
];

describe("EtherfuseStablebondYields Component", () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders live sovereign yields and tokens when data is loaded", () => {
    const refreshMock = vi.fn();
    vi.spyOn(EtherfuseHook, "useEtherfuseYields").mockReturnValue({
      data: {
        calculatedAt: "2026-10-19T06:00:00Z",
        items: mockItems,
        isFallback: false,
        stale: false,
      },
      loading: false,
      error: null,
      lastFetched: new Date(),
      refresh: refreshMock,
    });

    render(<EtherfuseStablebondYields />);

    // Header & live status badge
    expect(
      screen.getByText(/Rendimientos Soberanos en Stellar/i)
    ).toBeTruthy();
    expect(
      screen.getByText(/Datos en vivo \(Etherfuse API\)/i)
    ).toBeTruthy();

    // Bond cards
    expect(screen.getByText("Etherfuse CETES")).toBeTruthy();
    expect(screen.getByText("$1.1867")).toBeTruthy();
    expect(screen.getByText(/\+18\.67% interés acumulado/i)).toBeTruthy();

    expect(screen.getByText("Etherfuse USTRY")).toBeTruthy();
    expect(screen.getByText("$1.0775")).toBeTruthy();
    expect(screen.getByText(/\+7\.75% interés acumulado/i)).toBeTruthy();

    // Educational disclaimer (Acceptance Criteria #5)
    expect(
      screen.getByText(/Nota educativa \(Stellar Testnet \/ Demo\)/i)
    ).toBeTruthy();
    expect(
      screen.getByText(/No constituye en ningún caso asesoramiento financiero/i)
    ).toBeTruthy();

    // Refresh trigger
    const refreshBtn = screen.getByRole("button", { name: /Actualizar/i });
    fireEvent.click(refreshBtn);
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("renders fallback warning pill when operating in fallback mode", () => {
    vi.spyOn(EtherfuseHook, "useEtherfuseYields").mockReturnValue({
      data: {
        calculatedAt: "2026-10-19T06:00:00Z",
        items: mockItems,
        isFallback: true,
        stale: false,
      },
      loading: false,
      error: "Network unavailable",
      lastFetched: new Date(),
      refresh: vi.fn(),
    });

    render(<EtherfuseStablebondYields />);

    expect(
      screen.getByText(/Caché verificada \(Offline\)/i)
    ).toBeTruthy();
    expect(
      screen.getByText(/Mostrando datos de respaldo validados de Etherfuse/i)
    ).toBeTruthy();
  });
});
