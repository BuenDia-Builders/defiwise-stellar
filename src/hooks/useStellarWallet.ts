"use client";

import { useCallback, useEffect, useState } from "react";
import {
  connect as kitConnect,
  disconnect as kitDisconnect,
  getPublicKey,
  isConnected,
  signTransaction,
} from "@stellar/wallets-kit";
import { useHydrated } from "@/lib/hydration";

export interface WalletOption {
  id: string;
  name: string;
}

export const SUPPORTED_WALLETS: WalletOption[] = [
  { id: "freighter", name: "Freighter" },
  { id: "xbull", name: "xBull" },
];

export function useStellarWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const isHydrated = useHydrated();

  const checkConnection = useCallback(async () => {
    try {
      const result = await isConnected();
      if (result.isConnected) {
        const addr = await getPublicKey();
        if (addr) {
          setAddress(addr);
          setConnected(true);
        }
      }
    } catch {
      // wallet not installed / not connected
    }
  }, []);

  useEffect(() => {
    if (isHydrated) {
      checkConnection();
    }
  }, [isHydrated, checkConnection]);

  const connect = useCallback(
    async (walletId?: string) => {
      setLoading(true);
      try {
        if (walletId) {
          setSelectedWallet(walletId);
        }
        const wallet = selectedWallet || walletId || "freighter";
        await kitConnect({ wallet });
        const addr = await getPublicKey();
        if (addr) {
          setAddress(addr);
          setConnected(true);
        }
      } catch (err) {
        console.error("Error connecting to wallet:", err);
      }
      setLoading(false);
    },
    [selectedWallet]
  );

  const disconnect = useCallback(() => {
    kitDisconnect();
    setAddress(null);
    setConnected(false);
    setSelectedWallet(null);
  }, []);

  const truncatedAddress = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : null;

  return {
    address,
    truncatedAddress,
    connected,
    loading,
    selectedWallet,
    connect,
    disconnect,
    signTransaction,
    isHydrated,
  };
}
