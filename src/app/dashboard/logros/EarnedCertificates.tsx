"use client";

import Image from "next/image";
import { Course } from "@/data/courses";
import { useProgress } from "@/hooks/useProgress";
import { BsTrophy, BsLock } from "react-icons/bs";

interface EarnedCertificatesProps {
  progress: ReturnType<typeof useProgress>;
  course: Course;
}

export default function EarnedCertificates({
  progress,
  course,
}: EarnedCertificatesProps) {
  const totalModules = course.modules.length;
  const allCompleted = progress.completedModules >= totalModules;

  return (
    <div className="border border-borderGrey/30 rounded-2xl mb-8 p-6 bg-white">
      <div className="flex items-center gap-3 border-b border-borderGrey/20 pb-4 mb-6">
        <BsTrophy className="text-darkOrange" size={24} />
        <h3 className="text-lg font-semibold text-grey">Certificados</h3>
      </div>

      <div
        className={`relative rounded-2xl p-8 text-center transition-all ${
          allCompleted
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
            className={allCompleted ? "" : "grayscale opacity-40"}
          />
          {!allCompleted && (
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

        {allCompleted ? (
          <>
            <p className="text-sm text-active font-medium mb-3">
              Certificado obtenido
            </p>
            <p className="text-xs text-darkGrey">
              Este certificado será registrado en Stellar Testnet
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-darkGrey mb-2">
              Completá los {totalModules} módulos para obtener este certificado
            </p>
            <div className="w-48 mx-auto bg-progressGrey rounded-full h-2">
              <div
                className="bg-darkOrange h-2 rounded-full transition-all"
                style={{
                  width: `${(progress.completedModules / totalModules) * 100}%`,
                }}
              />
            </div>
            <p className="text-xs text-darkGrey mt-2">
              {progress.completedModules}/{totalModules} módulos
            </p>
          </>
        )}
      </div>
    </div>
  );
}
