"use client";

import { ReactNode } from "react";
import AsideMenu from "@/components/asideMenu/AsideMenu";
import { useProgress } from "@/hooks/useProgress";
import { courses } from "@/data/courses";
import { BsPatchCheckFill, BsTrophy, BsStarFill } from "react-icons/bs";
import { OnChainStatus } from "@/components/stellar/OnChainStatus";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { totalXP, completedModules } = useProgress();
  const course = courses[0];
  const totalModules = course.modules.length;

  return (
    <div className="flex flex-wrap lg:justify-center gap-8 max-w-[1536px] m-auto px-4 py-6">
      <AsideMenu />
      <div className="flex-1 max-w-[750px] md:p-6">{children}</div>
      <aside className="lg:max-w-[380px] w-full lg:w-auto">
        {/* Progress card */}
        <article className="p-6 border border-borderGrey/30 rounded-2xl mb-6 bg-white">
          <h4 className="text-darkGrey mb-4 font-semibold">Tu progreso</h4>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-darkOrange/10 rounded-xl flex items-center justify-center">
              <BsStarFill className="text-darkOrange" size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-darkGreen">{totalXP}</p>
              <p className="text-xs text-darkGrey">XP totales</p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-active/10 rounded-xl flex items-center justify-center">
              <BsPatchCheckFill className="text-active" size={18} />
            </div>
            <div>
              <p className="text-lg font-semibold text-darkGreen">
                {completedModules}/{totalModules}
              </p>
              <p className="text-xs text-darkGrey">Módulos completados</p>
            </div>
          </div>

          <div className="w-full bg-progressGrey rounded-full h-2">
            <div
              className="bg-active h-2 rounded-full transition-all"
              style={{
                width: `${totalModules > 0 ? (completedModules / totalModules) * 100 : 0}%`,
              }}
            />
          </div>
        </article>

        {/* Compete card */}
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

        {/* On-chain status */}
        <div className="mt-6">
          <OnChainStatus />
        </div>
      </aside>
    </div>
  );
}
