"use client";

import { useEffect } from "react";
import { useStellarProgress } from "@/hooks/useStellarProgress";
import { BsLink45Deg, BsArrowRepeat } from "react-icons/bs";

export function OnChainStatus() {
  const {
    connected,
    xpBalance,
    historicalXP,
    loading,
    error,
    fetchOnChainProgress,
  } = useStellarProgress();

  useEffect(() => {
    if (connected) {
      fetchOnChainProgress();
    }
  }, [connected, fetchOnChainProgress]);

  if (!connected) {
    return (
      <article className="p-5 border border-borderGrey/30 rounded-2xl bg-white">
        <div className="flex items-center gap-2 mb-3">
          <BsLink45Deg className="text-darkGrey" size={18} />
          <h4 className="text-sm font-semibold text-darkGrey">Stellar Testnet</h4>
        </div>
        <p className="text-xs text-darkGrey m-0">
          Conectá tu wallet para ver tu progreso on-chain
        </p>
      </article>
    );
  }

  return (
    <article className="p-5 border border-active/20 rounded-2xl bg-active/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-active rounded-full animate-pulse" />
          <h4 className="text-sm font-semibold text-darkGreen">
            Stellar Testnet
          </h4>
        </div>
        <button
          onClick={fetchOnChainProgress}
          disabled={loading}
          className="text-darkGrey hover:text-active transition-colors"
        >
          <BsArrowRepeat
            size={14}
            className={loading ? "animate-spin" : ""}
          />
        </button>
      </div>

      {error ? (
        <p className="text-xs text-pink m-0">{error}</p>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-darkGrey">XP on-chain</span>
            <span className="font-semibold text-darkGreen">
              {xpBalance.toString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-darkGrey">XP histórico</span>
            <span className="font-semibold text-darkGreen">
              {historicalXP.toString()}
            </span>
          </div>
        </div>
      )}
    </article>
  );
}
