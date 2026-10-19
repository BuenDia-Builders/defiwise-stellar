"use client";

import React from "react";
import { usePendingRewards } from "@/hooks/usePendingRewards";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { BsAwardFill, BsLightningChargeFill, BsArrowRightCircleFill } from "react-icons/bs";

export default function PendingRewardsBanner() {
  const { connected } = useStellarWallet();
  const {
    pendingRewards,
    totalPendingXP,
    totalPendingBadges,
    claiming,
    claimAll,
  } = usePendingRewards();

  if (pendingRewards.length === 0) {
    return null;
  }

  if (!connected) {
    return (
      <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200/60 shadow-sm transition-all">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-darkOrange/10 text-darkOrange flex items-center justify-center flex-shrink-0">
              <BsLightningChargeFill size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-darkGreen text-base">
                Progreso local completado sin wallet
              </h4>
              <p className="text-sm text-darkGrey mt-0.5">
                Completaste {pendingRewards.length} módulo(s) ({totalPendingXP} XP).
                Conectá tu wallet para reclamar tus XP y minar tus Badges NFT en Stellar Testnet.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200 shadow-sm transition-all">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-700 flex items-center justify-center font-bold text-sm">
              <BsAwardFill size={16} />
            </span>
            <h4 className="font-bold text-darkGreen text-lg">
              Recompensas pendientes on-chain
            </h4>
          </div>
          <p className="text-sm text-darkGrey mt-1">
            Tienes {pendingRewards.length} módulo(s) terminado(s) localmente listos para registrarse en la blockchain:{" "}
            <strong className="text-emerald-700">+{totalPendingXP} XP</strong>
            {totalPendingBadges > 0 && (
              <span> y <strong className="text-darkOrange">{totalPendingBadges} Badge(s) NFT</strong></span>
            )}
            .
          </p>

          <div className="flex flex-wrap gap-2 mt-3">
            {pendingRewards.map((item) => (
              <div
                key={item.moduleId}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/80 border border-emerald-200/80 text-xs text-darkGreen font-medium shadow-xs"
              >
                <span>{item.moduleTitle}</span>
                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                  +{item.xpEarned} XP
                </span>
                {item.needsBadge && (
                  <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                    NFT
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={claimAll}
          disabled={claiming}
          className="flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-darkOrange to-lightOrange text-white font-semibold text-sm shadow-md hover:opacity-95 active:scale-95 disabled:opacity-60 transition-all cursor-pointer"
        >
          {claiming ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              Sincronizando on-chain...
            </>
          ) : (
            <>
              <span>Reclamar recompensas</span>
              <BsArrowRightCircleFill size={16} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
