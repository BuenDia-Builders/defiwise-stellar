"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchEtherfuseStablebonds,
  EtherfuseYieldsResult,
} from "@/lib/etherfuse";

export function useEtherfuseYields() {
  const [data, setData] = useState<EtherfuseYieldsResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const loadData = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchEtherfuseStablebonds({ forceRefresh: force });
      setData(res);
      setLastFetched(new Date());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al consultar yields de Etherfuse";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(() => {
    return loadData(true);
  }, [loadData]);

  return {
    data,
    loading,
    error,
    lastFetched,
    refresh,
  };
}
