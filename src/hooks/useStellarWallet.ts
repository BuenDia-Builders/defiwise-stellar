"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { useHydrated } from "@/lib/hydration";
import { getStellarWalletsKit } from "@/lib/stellar-wallets-kit";

export interface SignTransactionOpts {
  networkPassphrase?: string;
  address?: string;
  path?: string;
}

export function useStellarWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const isHydrated = useHydrated();

  const checkConnection = useCallback(async () => {
    if (!isHydrated || typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem("defiwise:wallet_address");
      if (stored) {
        setAddress(stored);
        setConnected(true);
        return;
      }

      const kit = await getStellarWalletsKit();
      if (kit) {
        const res = await kit.getAddress().catch(() => null);
        if (res?.address) {
          setAddress(res.address);
          setConnected(true);
          localStorage.setItem("defiwise:wallet_address", res.address);
        }
      }
    } catch {
      // Disconnected or no active session
    }
  }, [isHydrated]);

  useEffect(() => {
    if (isHydrated) {
      checkConnection();
    }
  }, [isHydrated, checkConnection]);

  const connect = useCallback(async () => {
    setLoading(true);
    try {
      const kit = await getStellarWalletsKit();
      if (!kit) {
        console.warn("StellarWalletsKit not available in current environment");
        setLoading(false);
        return;
      }

      // authModal opens the multi-wallet picker (Freighter, xBull, Albedo, Lobstr, Hana)
      const res = await kit.authModal();
      if (res?.address) {
        setAddress(res.address);
        setConnected(true);
        if (typeof window !== "undefined") {
          localStorage.setItem("defiwise:wallet_address", res.address);
        }
      }
    } catch (err: any) {
      // Code -1 is user cancellation / closed modal
      if (err?.code !== -1) {
        console.error("Error connecting via StellarWalletsKit:", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      const kit = await getStellarWalletsKit();
      if (kit) {
        await kit.disconnect().catch(() => {});
      }
    } catch {
      // Ignore cleanup error
    }
    setAddress(null);
    setConnected(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("defiwise:wallet_address");
    }
  }, []);

  const signTransaction = useCallback(
    async (xdr: string, opts?: SignTransactionOpts) => {
      const kit = await getStellarWalletsKit();
      if (!kit) {
        throw new Error("StellarWalletsKit not initialized");
      }
      return kit.signTransaction(xdr, opts);
    },
    []
  );

  const truncatedAddress = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : null;

  return {
    address,
    truncatedAddress,
    connected,
    loading,
    connect,
    disconnect,
    signTransaction,
    isHydrated,
  };
}
