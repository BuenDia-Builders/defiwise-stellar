"use client";

import { ReactNode } from "react";
import AsideMenu from "@/components/asideMenu/AsideMenu";
import { useProgress } from "@/hooks/useProgress";
import { useStellarProgress } from "@/hooks/useStellarProgress";
import { courses } from "@/data/courses";
import { BsPatchCheckFill, BsTrophy, BsStarFill } from "react-icons/bs";
import { OnChainStatus } from "@/components/stellar/OnChainStatus";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { computeXPPercent } from "@/lib/stellar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { completedModules, isHydrated } = useProgress();
  // Real, tamper-proof XP balance read straight from the Soroban XP Token
  // contract (balanceOf / historicalBalance). The progress widget no longer
  // trusts the localStorage value, which could be edited from dev tools.
  const {
    connected,
    xpBalance,
    historicalXP,
    loading: xpLoading,
  } = useStellarProgress();

  const totalModules = courses.reduce(
    (sum, c) => sum + c.modules.length,
    0
  );

  // Maximum XP achievable across every module of every learning path. Used to
  // derive the progress percentage from on-chain data.
  const maxXP = courses.reduce(
    (sum, c) => sum + c.modules.reduce((s, m) => s + m.rewardXP, 0),
    0
  );

  // On-chain XP balance shown in the header/progress widget. Falls back to 0
  // before hydration or when no wallet is connected.
  const displayXP =
    isHydrated && connected ? xpBalance.toString() : "0";

  // Percentage is based on the connected wallet's permanent historical XP so
  // the bar never shrinks if tokens are spent/burned.
  const xpPercent = computeXPPercent(historicalXP, maxXP);
  const displayPercent = isHydrated && connected ? xpPercent : 0;

  const displayCompleted = isHydrated ? completedModules : 0;

  return (
    <div className="flex flex-wrap lg:justify-center gap-8 max-w-[1536px] m-auto px-4 py-6">
      <AsideMenu />
      
      <div className="flex-1 max-w-[750px] md:p-6">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </div>

      <aside className="lg:max-w-[380px] w-full lg:w-auto">
        <ErrorBoundary>
          <article className="p-6 border border-borderGrey/30 rounded-2xl mb-6 bg-white">
            <h4 className="text-darkGrey mb-4 font-semibold">Tu progreso</h4>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-darkOrange/10 rounded-xl flex items-center justify-center">
                <BsStarFill className="text-darkOrange" size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold text-darkGreen flex items-center gap-2">
                  {displayXP}
                  {/* Subtle spinner while the real on-chain balance is loading */}
                  {xpLoading && (
                    <span
                      aria-label="Actualizando balance on-chain"
                      role="status"
                      className="inline-block w-3.5 h-3.5 border-2 border-darkOrange/30 border-t-darkOrange rounded-full animate-spin"
                    />
                  )}
                </p>
                <p className="text-xs text-darkGrey">XP on-chain</p>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-active/10 rounded-xl flex items-center justify-center">
                <BsPatchCheckFill className="text-active" size={18} />
              </div>
              <div>
                <p className="text-lg font-semibold text-darkGreen">
                  {displayCompleted}/{totalModules}
                </p>
                <p className="text-xs text-darkGrey">Módulos completados</p>
              </div>
            </div>

            {/* Progress bar derived from the connected wallet's on-chain XP */}
            <div className="flex justify-between text-xs text-darkGrey mb-1">
              <span>Progreso XP</span>
              <span>{displayPercent}%</span>
            </div>
            <div className="w-full bg-progressGrey rounded-full h-2">
              <div
                className="bg-active h-2 rounded-full transition-all"
                style={{ width: `${displayPercent}%` }}
              />
            </div>
          </article>

          <article className="p-6 border border-borderGrey/30 rounded-2xl bg-white">
            <h4 className="text-h4 text-orangeGrey font-semibold">
              ¡Compite y demostrá tus habilidades!
            </h4>
            <div className="flex items-center mt-3">
              <BsTrophy className="text-active flex-shrink-0" size={32} />
              <p className="text-sm text-darkGrey ml-4">
                Completá todos los módulos para obtener tu certificado final
              </p>
            </div>
          </article>

          <div className="mt-6">
            <OnChainStatus />
          </div>
        </ErrorBoundary>
      </aside>
    </div>
  );
}