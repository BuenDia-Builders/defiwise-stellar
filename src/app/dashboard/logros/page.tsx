"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useProgress } from "@/hooks/useProgress";
import { courses } from "@/data/courses";
import EarnedNfts from "./EarnedNfts";
import EarnedCertificates from "./EarnedCertificates";
import XPSummary from "./XPSummary";

export default function Logros() {
  const progress = useProgress();
  const course = courses[0];

  return (
    <DashboardLayout>
      <h2 className="text-2xl font-bold text-darkOrange mb-6">Mis logros</h2>
      <XPSummary progress={progress} course={course} />
      <EarnedNfts progress={progress} course={course} />
      <EarnedCertificates progress={progress} course={course} />
    </DashboardLayout>
  );
}
