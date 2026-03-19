"use client";

import Image from "next/image";
import { Course } from "@/data/courses";
import { useProgress } from "@/hooks/useProgress";
import { BsLock, BsCheckCircleFill, BsAward } from "react-icons/bs";

interface EarnedNftsProps {
  progress: ReturnType<typeof useProgress>;
  course: Course;
}

export default function EarnedNfts({ progress, course }: EarnedNftsProps) {
  return (
    <div className="border border-borderGrey/30 rounded-2xl mb-8 p-6 bg-white">
      <div className="flex items-center gap-3 border-b border-borderGrey/20 pb-4 mb-6">
        <BsAward className="text-darkOrange" size={24} />
        <h3 className="text-lg font-semibold text-grey">NFTs ganados</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {course.modules.map((mod) => {
          const modProgress = progress.getModuleProgress(mod.id);
          const earned = modProgress.completed;

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
                <p className="text-xs text-darkOrange mt-1">
                  +{mod.rewardXP} XP
                </p>
              )}
              {!earned && (
                <p className="text-xs text-darkGrey mt-1">Bloqueado</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
