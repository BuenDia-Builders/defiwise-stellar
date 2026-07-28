"use client";

import { useStellarProgress } from "@/hooks/useStellarProgress";
import { useHydrated } from "@/lib/hydration";
import { CONTRACTS } from "@/lib/stellar";
import { BsLink45Deg, BsArrowRepeat, BsBoxArrowUpRight } from "react-icons/bs";

const EXPLORER_BASE = "https://stellar.expert/explorer/testnet";

export function OnChainStatus() {
  const isHydrated = useHydrated();
  const {
    connected,
    address,
    xpBalance,
    historicalXP,
    loading,
    error,
    fetchOnChainProgress,
  } = useStellarProgress();

  // Explorer URLs
  const xpContractUrl  = `${EXPLORER_BASE}/contract/${CONTRACTS.XP_TOKEN}`;
  const nftContractUrl = `${EXPLORER_BASE}/contract/${CONTRACTS.BADGE_NFT}`;
  const accountUrl     = address ? `${EXPLORER_BASE}/account/${address}` : null;

  // ── Disconnected / pre-hydration state ────────────────────────────────────
  if (!isHydrated || !connected) {
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

  // ── Connected state ────────────────────────────────────────────────────────
  return (
    <article className="p-5 border border-active/20 rounded-2xl bg-active/5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-active rounded-full animate-pulse" />
          <h4 className="text-sm font-semibold text-darkGreen">Stellar Testnet</h4>
        </div>
        <button
          onClick={fetchOnChainProgress}
          disabled={loading}
          title="Actualizar balance on-chain"
          className="text-darkGrey hover:text-active transition-colors"
        >
          <BsArrowRepeat size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Balances or error */}
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

      {/* Explorer links */}
      <div className="mt-4 pt-3 border-t border-active/20 flex flex-col gap-1.5">
        {accountUrl && (
          <a
            href={accountUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-active hover:underline"
          >
            <BsBoxArrowUpRight size={11} />
            Mi cuenta Stellar
          </a>
        )}
        <a
          href={xpContractUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-active hover:underline"
        >
          <BsBoxArrowUpRight size={11} />
          Contrato XP Token
        </a>
        <a
          href={nftContractUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-active hover:underline"
        >
          <BsBoxArrowUpRight size={11} />
          Contrato Badge NFT
        </a>
      </div>
    </article>
  );
}
