"use client";

import toast from "react-hot-toast";
import { BsGift, BsCheckCircleFill } from "react-icons/bs";
import { usePendingRewards } from "@/hooks/usePendingRewards";
import { useStellarProgress } from "@/hooks/useStellarProgress";

/**
 * Shown after a wallet connects when the student has quizzes passed offline
 * (stored in localStorage) whose XP or badge is not on-chain yet.
 */
export function PendingRewardsBanner() {
  const { fetchOnChainProgress } = useStellarProgress();
  const { pending, claiming, claim, connected } = usePendingRewards(fetchOnChainProgress);

  if (!connected || pending.length === 0) return null;

  const onClaim = async () => {
    const res = await claim();
    const claimed = res.filter((r) => r.xp === "claimed" || r.badge === "claimed").length;
    const already = res.filter(
      (r) => r.xp !== "failed" && r.badge !== "failed" && r.xp !== "claimed" && r.badge !== "claimed"
    ).length;
    const failed = res.filter((r) => r.xp === "failed" || r.badge === "failed").length;
    if (claimed) toast.success(`Recompensas registradas on-chain para ${claimed} módulo(s)`);
    if (already) toast(`${already} módulo(s) ya estaban registrados on-chain`, { icon: "✅" });
    if (failed) toast.error(`No se pudieron registrar ${failed} módulo(s). Podés reintentar.`);
  };

  return (
    <article
      aria-label="Recompensas pendientes"
      className="p-5 mb-6 border border-darkOrange/30 rounded-2xl bg-lightYellow"
    >
      <div className="flex items-center gap-2 mb-3">
        <BsGift className="text-darkOrange" size={18} />
        <h4 className="text-sm font-semibold text-darkGreen m-0">Recompensas pendientes</h4>
      </div>
      <p className="text-xs text-darkGrey mb-3">
        Completaste estos módulos sin wallet conectada. Podés registrar tu XP y tus badges en Stellar Testnet.
      </p>
      <ul className="space-y-2 mb-4">
        {pending.map((p) => (
          <li key={p.moduleId} className="flex items-center justify-between text-sm">
            <span className="text-darkGreen">{p.moduleTitle}</span>
            <span className="flex gap-2 text-xs">
              {p.needsXp ? (
                <span className="px-2 py-0.5 rounded-full bg-darkOrange/10 text-darkOrange">
                  +{Math.floor((p.maxXp * p.correct) / Math.max(1, p.total))} XP
                </span>
              ) : (
                <span className="flex items-center gap-1 text-active">
                  <BsCheckCircleFill size={10} /> XP
                </span>
              )}
              {p.needsBadge ? (
                <span className="px-2 py-0.5 rounded-full bg-darkOrange/10 text-darkOrange">Badge</span>
              ) : (
                <span className="flex items-center gap-1 text-active">
                  <BsCheckCircleFill size={10} /> Badge
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <button
        onClick={onClaim}
        disabled={claiming}
        className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-darkOrange to-lightOrange text-white text-sm font-medium disabled:opacity-50"
      >
        {claiming ? "Registrando on-chain..." : "Reclamar recompensas pendientes"}
      </button>
    </article>
  );
}
