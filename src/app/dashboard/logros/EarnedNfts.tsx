"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Course } from "@/data/courses";
import { useProgress } from "@/hooks/useProgress";
import { useStellarProgress } from "@/hooks/useStellarProgress";
import { CONTRACTS } from "@/lib/stellar";
import {
  BsLock,
  BsCheckCircleFill,
  BsAward,
  BsBoxArrowUpRight,
} from "react-icons/bs";

interface EarnedNftsProps {
  progress: ReturnType<typeof useProgress>;
  course: Course;
}

const EXPLORER_BASE = "https://stellar.expert/explorer/testnet";

export default function EarnedNfts({ progress, course }: EarnedNftsProps) {
  const { connected, checkHasBadge, address } = useStellarProgress();
  const [onChainBadges, setOnChainBadges] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchBadgeStatus() {
      if (!connected) {
        setOnChainBadges({});
        return;
      }

      setLoading(true);
      try {
        const statuses: Record<string, boolean> = {};
        for (const mod of course.modules) {
          statuses[mod.id] = await checkHasBadge(mod.id);
        }
        setOnChainBadges(statuses);
      } catch (error) {
        console.error("Error fetching badge status:", error);
        setOnChainBadges({});
      } finally {
        setLoading(false);
      }
    }

    fetchBadgeStatus();
    // Re-fetch whenever wallet connection or address changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, address]);

  // Stellar Expert URLs
  const badgeContractUrl = `${EXPLORER_BASE}/contract/${CONTRACTS.BADGE_NFT}`;
  const accountUrl = address ? `${EXPLORER_BASE}/account/${address}` : null;

  return (
    <div className="border border-borderGrey/30 rounded-2xl mb-8 p-6 bg-white">
      {/* ── Section header ── */}
      <div className="flex items-center gap-3 border-b border-borderGrey/20 pb-4 mb-6">
        <BsAward className="text-darkOrange" size={24} />
        <h3 className="text-lg font-semibold text-grey">NFTs ganados</h3>
        {loading && (
          <span className="text-xs text-darkGrey ml-auto">
            Verificando on-chain…
          </span>
        )}
      </div>

      {/* ── Badge grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {course.modules.map((mod) => {
          const modProgress = progress.getModuleProgress(mod.id);
          const earnedLocally = modProgress.completed;

          // On-chain is the source of truth when wallet is connected.
          const earnedOnChain = connected ? (onChainBadges[mod.id] ?? false) : false;
          const earned = connected ? earnedOnChain : earnedLocally;

          // Build per-badge explorer link: filter contract events by module ID
          // so the user can land directly on relevant activity.
          const badgeExplorerUrl = accountUrl
            ? accountUrl
            : badgeContractUrl;

          return (
            <div
              key={mod.id}
              className={`relative rounded-2xl p-4 text-center transition-all ${
                earned
                  ? "bg-lightYellow border border-darkOrange/20"
                  : "bg-progressGrey/30 border border-borderGrey/20 opacity-50"
              }`}
            >
              {/* Badge image */}
              <div className="relative w-24 h-24 mx-auto mb-3">
                <Image
                  src={mod.nftImage}
                  alt={mod.title}
                  width={96}
                  height={96}
                  className={earned ? "" : "grayscale"}
                />
                {earned ? (
                  <BsCheckCircleFill
                    className="absolute -top-1 -right-1 text-active bg-white rounded-full"
                    size={20}
                  />
                ) : (
                  <BsLock
                    className="absolute -top-1 -right-1 text-darkGrey bg-white rounded-full p-0.5"
                    size={20}
                  />
                )}
              </div>

              <p className="text-sm font-medium text-darkGreen">{mod.title}</p>

              {earned && (
                <>
                  <p className="text-xs text-darkOrange mt-1">+{mod.rewardXP} XP</p>

                  {/* Verification status + explorer link */}
                  {connected && earnedOnChain ? (
                    <a
                      href={badgeExplorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1 text-[11px] text-active mt-1.5 hover:underline"
                      title="Ver en Stellar Expert"
                    >
                      <BsCheckCircleFill size={10} />
                      On-chain
                      <BsBoxArrowUpRight size={9} />
                    </a>
                  ) : connected && earnedLocally && !earnedOnChain ? (
                    <p className="text-[11px] text-darkGrey mt-1.5">
                      Local · pendiente
                    </p>
                  ) : (
                    /* disconnected — earned locally */
                    <p className="text-[11px] text-darkGrey mt-1.5">
                      Local · no verificado
                    </p>
                  )}
                </>
              )}

              {!earned && (
                <p className="text-xs text-darkGrey mt-1">Bloqueado</p>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      {connected ? (
        /* Show contract + account explorer links for full traceability */
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t border-borderGrey/20">
          <a
            href={badgeContractUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-active hover:underline"
          >
            <BsBoxArrowUpRight size={11} />
            Contrato Badge NFT
          </a>
          {accountUrl && (
            <a
              href={accountUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-active hover:underline"
            >
              <BsBoxArrowUpRight size={11} />
              Mi cuenta Stellar
            </a>
          )}
        </div>
      ) : (
        <p className="text-xs text-darkGrey text-center mt-4 pt-4 border-t border-borderGrey/20">
          Conectá tu wallet para ver tus badges on-chain
        </p>
      )}
    </div>
  );
}
