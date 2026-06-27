"use client";

import { courses } from "@/data/courses";
import { useProgress } from "@/hooks/useProgress";
import { useStellarProgress } from "@/hooks/useStellarProgress";
import { BsStarFill, BsPatchCheckFill, BsTrophy } from "react-icons/bs";

interface XPSummaryProps {
  progress: ReturnType<typeof useProgress>;
}

export default function XPSummary({ progress }: XPSummaryProps) {
  const totalModules = courses.reduce((sum, c) => sum + c.modules.length, 0);
  const maxXP = courses.reduce(
    (sum, c) => sum + c.modules.reduce((s, m) => s + m.rewardXP, 0),
    0
  );
  const completedCount = courses.reduce(
    (sum, c) =>
      sum +
      c.modules.filter((m) => progress.getModuleProgress(m.id).completed).length,
    0
  );
  const certificatesEarned = courses.filter((c) =>
    c.modules.every((m) => progress.getModuleProgress(m.id).completed)
  ).length;

  // Real, tamper-proof XP balance from the Soroban XP Token contract.
  const {
    isHydrated,
    connected,
    xpBalance,
    loading: xpLoading,
  } = useStellarProgress();
  const displayXP = isHydrated && connected ? xpBalance.toString() : "0";

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      <div className="bg-darkOrange/5 border border-darkOrange/20 rounded-2xl p-5 text-center">
        <BsStarFill className="text-darkOrange mx-auto mb-2" size={24} />
        <p className="text-2xl font-bold text-darkGreen flex items-center justify-center gap-2">
          {displayXP}
          {xpLoading && (
            <span
              aria-label="Actualizando balance on-chain"
              role="status"
              className="inline-block w-3.5 h-3.5 border-2 border-darkOrange/30 border-t-darkOrange rounded-full animate-spin"
            />
          )}
        </p>
        <p className="text-xs text-darkGrey">
          de {maxXP} XP
        </p>
      </div>
      <div className="bg-active/5 border border-active/20 rounded-2xl p-5 text-center">
        <BsPatchCheckFill className="text-active mx-auto mb-2" size={24} />
        <p className="text-2xl font-bold text-darkGreen">
          {completedCount}
        </p>
        <p className="text-xs text-darkGrey">
          de {totalModules} módulos
        </p>
      </div>
      <div className="bg-pink/5 border border-pink/20 rounded-2xl p-5 text-center">
        <BsTrophy className="text-pink mx-auto mb-2" size={24} />
        <p className="text-2xl font-bold text-darkGreen">
          {certificatesEarned}
        </p>
        <p className="text-xs text-darkGrey">Certificados</p>
      </div>
    </div>
  );
}
