"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useProgress } from "@/hooks/useProgress";
import { courses } from "@/data/courses";
import Progress from "./Progress";
import { Compite } from "./Compite";

export default function ProgressPage() {
  const progress = useProgress();
  const course = courses[0];

  return (
    <DashboardLayout>
      <h2 className="text-2xl font-bold text-darkOrange mb-6">Tu progreso</h2>
      <Progress progress={progress} course={course} />
      <Compite
        completedModules={progress.completedModules}
        totalModules={course.modules.length}
      />
    </DashboardLayout>
  );
}
