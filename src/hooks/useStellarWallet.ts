"use client";

import { useCallback, useEffect, useState } from "react";
import { Networks } from "@stellar/stellar-sdk";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";
import { useHydrated } from "@/lib/hydration";

export interface WalletOption {
  id: string;
  name: string;
}

export const SUPPORTED_WALLETS: WalletOption[] = [
  { id: "freighter", name: "Freighter" },
  { id: "xbull", name: "xBull" },
];

const SELECTED_WALLET_KEY = "defiwise-selected-wallet";
let walletKitInitialized = false;

function initializeWalletKit() {
  if (walletKitInitialized) return;

  const supportedIds = new Set(SUPPORTED_WALLETS.map((wallet) => wallet.id));
  StellarWalletsKit.init({
    modules: defaultModules({
      filterBy: (module) => supportedIds.has(module.productId),
    }),
    network: Networks.TESTNET,
  });
  walletKitInitialized = true;
}

export function useStellarWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const isHydrated = useHydrated();

  const checkConnection = useCallback(async () => {
    const walletId = localStorage.getItem(SELECTED_WALLET_KEY);
    if (!walletId) return;

    try {
      initializeWalletKit();
      StellarWalletsKit.setWallet(walletId);
      const available = await StellarWalletsKit.selectedModule.isAvailable();
      if (!available) return;

      const { address: walletAddress } =
        await StellarWalletsKit.fetchAddress();
      if (walletAddress) {
        setAddress(walletAddress);
        setSelectedWallet(walletId);
        setConnected(true);
      }
    } catch (err) {
      console.error("Error checking wallet connection:", err);
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
        const wallet = walletId || selectedWallet || "freighter";
        initializeWalletKit();
        StellarWalletsKit.setWallet(wallet);
        const { address: walletAddress } =
          await StellarWalletsKit.fetchAddress();
        if (walletAddress) {
          localStorage.setItem(SELECTED_WALLET_KEY, wallet);
          setAddress(walletAddress);
          setConnected(true);
          setSelectedWallet(wallet);
        }
      } catch (err) {
        console.error("Error connecting to wallet:", err);
      } finally {
        setLoading(false);
      }
    },
    [selectedWallet]
  );

  const disconnect = useCallback(async () => {
    try {
      initializeWalletKit();
      await StellarWalletsKit.disconnect();
      localStorage.removeItem(SELECTED_WALLET_KEY);
      setAddress(null);
      setConnected(false);
      setSelectedWallet(null);
    } catch (err) {
      console.error("Error disconnecting wallet:", err);
    }
  }, []);

  const signTransaction = useCallback(
    (
      xdr: string,
      options?: Parameters<typeof StellarWalletsKit.signTransaction>[1]
    ) => StellarWalletsKit.signTransaction(xdr, options),
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
    selectedWallet,
    connect,
    disconnect,
    signTransaction,
    isHydrated,
  };
}
