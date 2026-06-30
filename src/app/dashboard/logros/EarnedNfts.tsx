"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Course } from "@/data/courses";
import { useProgress } from "@/hooks/useProgress";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { useStellarProgress } from "@/hooks/useStellarProgress";
import { BsLock, BsCheckCircleFill, BsAward } from "react-icons/bs";

interface EarnedNftsProps {
  progress: ReturnType<typeof useProgress>;
  course: Course;
}

export default function EarnedNfts({ progress, course }: EarnedNftsProps) {
  const { connected } = useStellarWallet();
  const { checkHasBadge } = useStellarProgress();
  const [onChainBadges, setOnChainBadges] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  // Fetch on-chain badge status for all modules when wallet is connected
  useEffect(() => {
    async function fetchBadgeStatus() {
      if (!connected) {
        setOnChainBadges({});
        return;
      }

      setLoading(true);
      try {
        const badgeStatuses: Record<string, boolean> = {};
        
        // Check each module's badge status on-chain
        for (const mod of course.modules) {
          const hasBadge = await checkHasBadge(mod.id);
          badgeStatuses[mod.id] = hasBadge;
        }
        
        setOnChainBadges(badgeStatuses);
      } catch (error) {
        console.error("Error fetching badge status:", error);
        setOnChainBadges({});
      } finally {
        setLoading(false);
      }
    }

    fetchBadgeStatus();
  }, [connected, course.modules, checkHasBadge]);

  return (
    <div className="border border-borderGrey/30 rounded-2xl mb-8 p-6 bg-white">
      <div className="flex items-center gap-3 border-b border-borderGrey/20 pb-4 mb-6">
        <BsAward className="text-darkOrange" size={24} />
        <h3 className="text-lg font-semibold text-grey">NFTs ganados</h3>
        {loading && (
          <span className="text-xs text-darkGrey ml-auto">
            Verificando on-chain...
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {course.modules.map((mod) => {
          const modProgress = progress.getModuleProgress(mod.id);
          const earnedLocally = modProgress.completed;
          
          // Use on-chain data as source of truth when wallet is connected
          const earnedOnChain = connected ? onChainBadges[mod.id] || false : false;
          const earned = connected ? earnedOnChain : earnedLocally;

          return (
            <div
              key={mod.id}
              className={`relative rounded-2xl p-4 text-center transition-all ${
                earned
                  ? "bg-lightYellow border border-darkOrange/20"
                  : "bg-progressGrey/30 border border-borderGrey/20 opacity-50"
              }`}
            >
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
                  <p className="text-xs text-darkOrange mt-1">
                    +{mod.rewardXP} XP
                  </p>
                  {connected && earnedOnChain && (
                    <p className="text-xs text-active mt-1 flex items-center justify-center gap-1">
                      <BsCheckCircleFill size={10} />
                      On-chain
                    </p>
                  )}
                  {connected && earnedLocally && !earnedOnChain && (
                    <p className="text-xs text-darkGrey mt-1">
                      Local
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

      {!connected && (
        <p className="text-xs text-darkGrey text-center mt-4 pt-4 border-t border-borderGrey/20">
          Conectá tu wallet para ver tus badges on-chain
        </p>
      )}
    </div>
  );
}
