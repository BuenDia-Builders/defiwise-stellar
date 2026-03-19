"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isConnected,
  getAddress,
  requestAccess,
  signTransaction,
} from "@stellar/freighter-api";

export function useStellarWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkConnection = useCallback(async () => {
    try {
      const result = await isConnected();
      if (result.isConnected) {
        const addr = await getAddress();
        if (addr.address) {
          setAddress(addr.address);
          setConnected(true);
        }
      }
    } catch {
      // Freighter not installed
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const connect = useCallback(async () => {
    setLoading(true);
    try {
      const result = await isConnected();
      if (!result.isConnected) {
        window.open("https://www.freighter.app/", "_blank");
        setLoading(false);
        return;
      }
      await requestAccess();
      const addr = await getAddress();
      if (addr.address) {
        setAddress(addr.address);
        setConnected(true);
      }
    } catch (err) {
      console.error("Error connecting to Freighter:", err);
    }
    setLoading(false);
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setConnected(false);
  }, []);

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
  };
}
