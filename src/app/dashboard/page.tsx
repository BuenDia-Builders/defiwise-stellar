"use client";

import { useState } from "react";
import { courses } from "@/data/courses";
import { useProgress } from "@/hooks/useProgress";
import DashboardLayout from "@/components/DashboardLayout";
import ModuleCard from "@/app/dashboard/ruta_aprendizaje/components/ModuleCard";
import LessonView from "@/app/dashboard/ruta_aprendizaje/components/LessonView";
import QuizView from "@/app/dashboard/ruta_aprendizaje/components/QuizView";

type View =
  | { type: "modules" }
  | { type: "lesson"; moduleId: string; lessonIndex: number }
  | { type: "quiz"; moduleId: string };

export default function Dashboard() {
  const course = courses[0];
  const progressHook = useProgress();
  const [view, setView] = useState<View>({ type: "modules" });

  const goToModules = () => setView({ type: "modules" });

  if (view.type === "lesson") {
    const mod = course.modules.find((m) => m.id === view.moduleId)!;
    return (
      <DashboardLayout>
        <LessonView
          module={mod}
          lessonIndex={view.lessonIndex}
          onBack={goToModules}
          onNext={(nextIndex) => {
            if (nextIndex < mod.lessons.length) {
              progressHook.completeLesson(mod.id, mod.lessons[view.lessonIndex].id);
              setView({ type: "lesson", moduleId: mod.id, lessonIndex: nextIndex });
            } else {
              progressHook.completeLesson(mod.id, mod.lessons[view.lessonIndex].id);
              setView({ type: "quiz", moduleId: mod.id });
            }
          }}
          progress={progressHook}
        />
      </DashboardLayout>
    );
  }

  if (view.type === "quiz") {
    const mod = course.modules.find((m) => m.id === view.moduleId)!;
    return (
      <DashboardLayout>
        <QuizView module={mod} onBack={goToModules} progress={progressHook} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <section>
        <h2 className="text-2xl font-bold text-darkGreen mb-2">
          {course.title}
        </h2>
        <p className="text-grey mb-8">{course.description}</p>

        <div className="space-y-4">
          {course.modules.map((mod, index) => (
            <ModuleCard
              key={mod.id}
              module={mod}
              index={index}
              unlocked={progressHook.isModuleUnlocked(index, course.modules)}
              progress={progressHook.getModuleProgress(mod.id)}
              onStartLesson={(lessonIndex) =>
                setView({ type: "lesson", moduleId: mod.id, lessonIndex })
              }
              onStartQuiz={() =>
                setView({ type: "quiz", moduleId: mod.id })
              }
            />
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}
