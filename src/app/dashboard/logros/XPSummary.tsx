"use client";

import { Course } from "@/data/courses";
import { useProgress } from "@/hooks/useProgress";
import { BsStarFill, BsPatchCheckFill, BsTrophy } from "react-icons/bs";

interface XPSummaryProps {
  progress: ReturnType<typeof useProgress>;
  course: Course;
}

export default function XPSummary({ progress, course }: XPSummaryProps) {
  const totalModules = course.modules.length;
  const maxXP = course.modules.reduce((sum, m) => sum + m.rewardXP, 0);

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      <div className="bg-darkOrange/5 border border-darkOrange/20 rounded-2xl p-5 text-center">
        <BsStarFill className="text-darkOrange mx-auto mb-2" size={24} />
        <p className="text-2xl font-bold text-darkGreen">{progress.totalXP}</p>
        <p className="text-xs text-darkGrey">
          de {maxXP} XP
        </p>
      </div>
      <div className="bg-active/5 border border-active/20 rounded-2xl p-5 text-center">
        <BsPatchCheckFill className="text-active mx-auto mb-2" size={24} />
        <p className="text-2xl font-bold text-darkGreen">
          {progress.completedModules}
        </p>
        <p className="text-xs text-darkGrey">
          de {totalModules} módulos
        </p>
      </div>
      <div className="bg-pink/5 border border-pink/20 rounded-2xl p-5 text-center">
        <BsTrophy className="text-pink mx-auto mb-2" size={24} />
        <p className="text-2xl font-bold text-darkGreen">
          {progress.completedModules >= totalModules ? 1 : 0}
        </p>
        <p className="text-xs text-darkGrey">Certificados</p>
      </div>
    </div>
  );
}
