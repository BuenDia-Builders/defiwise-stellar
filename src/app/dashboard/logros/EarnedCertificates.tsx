"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Course } from "@/data/courses";
import { useProgress } from "@/hooks/useProgress";
import { useStellarProgress } from "@/hooks/useStellarProgress";
import { CONTRACTS } from "@/lib/stellar";
import {
  BsTrophy,
  BsLock,
  BsShieldCheck,
  BsExclamationCircle,
  BsBoxArrowUpRight,
  BsArrowRepeat,
} from "react-icons/bs";

interface EarnedCertificatesProps {
  progress: ReturnType<typeof useProgress>;
  course: Course;
}

const EXPLORER_BASE = "https://stellar.expert/explorer/testnet";

export default function EarnedCertificates({
  progress,
  course,
}: EarnedCertificatesProps) {
  const totalModules = course.modules.length;

  // ── Local progress (optimistic) ────────────────────────────────────────────
  const completedLocally = course.modules.filter((m) =>
    progress.getModuleProgress(m.id).completed
  ).length;
  const allCompletedLocally = completedLocally >= totalModules;

  // ── On-chain verification ──────────────────────────────────────────────────
  const { connected, checkHasBadge, address } = useStellarProgress();
  const [onChainBadges, setOnChainBadges] = useState<Record<string, boolean>>({});
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  async function verifyAllBadges() {
    if (!connected) {
      setOnChainBadges({});
      return;
    }
    setVerifying(true);
    setVerifyError(null);
    try {
      const results: Record<string, boolean> = {};
      for (const mod of course.modules) {
        results[mod.id] = await checkHasBadge(mod.id);
      }
      setOnChainBadges(results);
    } catch (err) {
      setVerifyError(
        err instanceof Error ? err.message : "Error al verificar badges on-chain"
      );
      setOnChainBadges({});
    } finally {
      setVerifying(false);
    }
  }

  useEffect(() => {
    verifyAllBadges();
    // Re-verify whenever the wallet connection or address changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, address]);

  // Certificate is "earned on-chain" only when every module has a badge in the contract.
  const allVerifiedOnChain =
    connected &&
    course.modules.length > 0 &&
    course.modules.every((m) => onChainBadges[m.id] === true);

  // Display state: prefer on-chain truth when connected, fall back to local.
  const displayCompleted = connected
    ? course.modules.filter((m) => onChainBadges[m.id] === true).length
    : completedLocally;
  const isEarned = connected ? allVerifiedOnChain : allCompletedLocally;

  // Stellar Expert links
  const badgeContractUrl = `${EXPLORER_BASE}/contract/${CONTRACTS.BADGE_NFT}`;
  const accountUrl = address
    ? `${EXPLORER_BASE}/account/${address}`
    : null;

  return (
    <div className="border border-borderGrey/30 rounded-2xl mb-8 p-6 bg-white">
      {/* ── Section header ── */}
      <div className="flex items-center gap-3 border-b border-borderGrey/20 pb-4 mb-6">
        <BsTrophy className="text-darkOrange" size={24} />
        <h3 className="text-lg font-semibold text-grey">Certificados</h3>

        {/* Re-verify button — only shown when wallet is connected */}
        {connected && (
          <button
            onClick={verifyAllBadges}
            disabled={verifying}
            title="Reverificar on-chain"
            className="ml-auto text-darkGrey hover:text-active transition-colors"
          >
            <BsArrowRepeat size={14} className={verifying ? "animate-spin" : ""} />
          </button>
        )}
      </div>

      {verifyError && (
        <p className="text-xs text-pink mb-4">{verifyError}</p>
      )}

      {/* ── Certificate card ── */}
      <div
        className={`relative rounded-2xl p-8 text-center transition-all ${
          isEarned
            ? "bg-gradient-to-br from-lightYellow to-lightBeige border border-darkOrange/20"
            : "bg-progressGrey/20 border border-borderGrey/20"
        }`}
      >
        <div className="relative w-48 h-36 mx-auto mb-4">
          <Image
            src={course.certificateImage}
            alt={course.title}
            width={192}
            height={144}
            className={isEarned ? "" : "grayscale opacity-40"}
          />
          {!isEarned && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/80 rounded-full p-3">
                <BsLock className="text-darkGrey" size={24} />
              </div>
            </div>
          )}
        </div>

        <h4 className="text-lg font-semibold text-darkGreen mb-1">
          {course.title}
        </h4>

        {isEarned ? (
          <div className="space-y-2">
            <p className="text-sm text-active font-medium">Certificado obtenido</p>

            {/* Verification status pill */}
            {connected ? (
              allVerifiedOnChain ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-active/10 text-active">
                  <BsShieldCheck size={11} />
                  Verificado on-chain
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-darkGrey/10 text-darkGrey">
                  <BsExclamationCircle size={11} />
                  Local · badges pendientes de confirmar
                </span>
              )
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-darkGrey/10 text-darkGrey">
                <BsExclamationCircle size={11} />
                Local · no verificado
              </span>
            )}

            {/* Stellar Explorer links */}
            <div className="flex flex-wrap justify-center gap-3 mt-3">
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
          </div>
        ) : (
          <>
            <p className="text-sm text-darkGrey mb-2">
              Completá los {totalModules} módulos para obtener este certificado
            </p>
            <div className="w-48 mx-auto bg-progressGrey rounded-full h-2">
              <div
                className="bg-darkOrange h-2 rounded-full transition-all"
                style={{
                  width: `${(displayCompleted / totalModules) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-darkGrey mt-2">
              {displayCompleted}/{totalModules} módulos
              {connected && (
                <span className="ml-1 text-active font-medium">(on-chain)</span>
              )}
            </p>
          </>
        )}
      </div>

      {/* Prompt to connect wallet when disconnected */}
      {!connected && (
        <p className="text-xs text-darkGrey text-center mt-4 pt-4 border-t border-borderGrey/20">
          Conectá tu wallet para verificar tu certificado on-chain
        </p>
      )}
    </div>
  );
}
