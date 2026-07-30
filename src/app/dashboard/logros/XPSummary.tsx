"use client";

import { courses } from "@/data/courses";
import { useProgress } from "@/hooks/useProgress";
import { useStellarProgress } from "@/hooks/useStellarProgress";
import { BsStarFill, BsPatchCheckFill, BsTrophy, BsShieldCheck, BsExclamationCircle } from "react-icons/bs";

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

  // On-chain XP from Soroban XP Token contract — authoritative when wallet connected.
  // Falls back to localStorage-derived XP (optimistic, unverified) when disconnected.
  const {
    isHydrated,
    connected,
    xpBalance,
    loading: xpLoading,
  } = useStellarProgress();

  const isOnChain = isHydrated && connected;
  // When connected: use on-chain balance (bigint → number for display).
  // When not connected: fall back to locally accumulated XP from useProgress.
  const displayXP = isOnChain ? Number(xpBalance) : progress.totalXP;

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {/* ── XP Card ── */}
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

        <p className="text-xs text-darkGrey">de {maxXP} XP</p>

        {/* Verification badge — tells the user whether the number is authoritative */}
        {isHydrated && (
          <span
            className={`inline-flex items-center gap-1 mt-2 text-[10px] font-medium px-2 py-0.5 rounded-full ${
              isOnChain
                ? "bg-active/10 text-active"
                : "bg-darkGrey/10 text-darkGrey"
            }`}
          >
            {isOnChain ? (
              <>
                <BsShieldCheck size={10} />
                Verificado on-chain
              </>
            ) : (
              <>
                <BsExclamationCircle size={10} />
                Local · no verificado
              </>
            )}
          </span>
        )}
      </div>

      {/* ── Modules Card ── */}
      <div className="bg-active/5 border border-active/20 rounded-2xl p-5 text-center">
        <BsPatchCheckFill className="text-active mx-auto mb-2" size={24} />
        <p className="text-2xl font-bold text-darkGreen">{completedCount}</p>
        <p className="text-xs text-darkGrey">de {totalModules} módulos</p>
      </div>

      {/* ── Certificates Card ── */}
      <div className="bg-pink/5 border border-pink/20 rounded-2xl p-5 text-center">
        <BsTrophy className="text-pink mx-auto mb-2" size={24} />
        <p className="text-2xl font-bold text-darkGreen">{certificatesEarned}</p>
        <p className="text-xs text-darkGrey">Certificados</p>
      </div>
    </div>
  );
}
