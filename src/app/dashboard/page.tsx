"use client";

import { useState } from "react";
import Image from "next/image";
import { courses, Course } from "@/data/courses";
import { useProgress } from "@/hooks/useProgress";
import DashboardLayout from "@/components/DashboardLayout";
import ModuleCard from "@/app/dashboard/ruta_aprendizaje/components/ModuleCard";
import LessonView from "@/app/dashboard/ruta_aprendizaje/components/LessonView";
import QuizView from "@/app/dashboard/ruta_aprendizaje/components/QuizView";
import {
  BsArrowRight,
  BsArrowLeft,
  BsJournals,
  BsClock,
  BsPatchCheckFill,
} from "react-icons/bs";

type View =
  | { type: "catalog" }
  | { type: "course"; courseId: string }
  | { type: "lesson"; courseId: string; moduleId: string; lessonIndex: number }
  | { type: "quiz"; courseId: string; moduleId: string };

function CourseCard({
  course,
  progress,
  onOpen,
}: {
  course: Course;
  progress: ReturnType<typeof useProgress>;
  onOpen: () => void;
}) {
  const totalModules = course.modules.length;
  const completedCount = course.modules.filter(
    (m) => progress.getModuleProgress(m.id).completed
  ).length;
  const totalLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0
  );
  const totalMinutes = course.modules.reduce(
    (sum, m) => sum + m.lessons.reduce((s, l) => s + l.durationMinutes, 0),
    0
  );
  const isStarted = completedCount > 0 || Object.keys(progress.progress).length > 0;
  const isCompleted = completedCount >= totalModules;

  return (
    <div className="border border-borderGrey/30 rounded-2xl bg-white overflow-hidden hover-lift transition-all">
      {/* Banner */}
      <div className="relative h-40 bg-gradient-to-br from-darkOrange/10 to-lightOrange/20 flex items-center justify-center">
        <Image
          src={course.certificateImage}
          alt={course.title}
          width={120}
          height={90}
          className="opacity-80"
        />
        {isCompleted && (
          <div className="absolute top-3 right-3 bg-active text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
            <BsPatchCheckFill size={12} />
            Completado
          </div>
        )}
        {isStarted && !isCompleted && (
          <div className="absolute top-3 right-3 bg-darkOrange text-white text-xs font-semibold px-3 py-1 rounded-full">
            En progreso
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-darkGreen mb-2">
          {course.title}
        </h3>
        <p className="text-sm text-grey mb-4 leading-relaxed">
          {course.description}
        </p>

        {/* Stats */}
        <div className="flex gap-4 text-sm text-darkGrey mb-5">
          <span className="flex items-center gap-1.5">
            <BsJournals size={14} className="text-darkOrange" />
            {totalModules} módulos
          </span>
          <span className="flex items-center gap-1.5">
            <BsJournals size={14} className="text-active" />
            {totalLessons} lecciones
          </span>
          <span className="flex items-center gap-1.5">
            <BsClock size={14} className="text-pink" />
            ~{totalMinutes} min
          </span>
        </div>

        {/* Progress bar (if started) */}
        {isStarted && (
          <div className="mb-5">
            <div className="flex justify-between text-xs text-darkGrey mb-1">
              <span>
                {completedCount}/{totalModules} módulos
              </span>
              <span>
                {Math.round((completedCount / totalModules) * 100)}%
              </span>
            </div>
            <div className="w-full bg-progressGrey rounded-full h-1.5">
              <div
                className="bg-darkOrange h-1.5 rounded-full transition-all"
                style={{
                  width: `${(completedCount / totalModules) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={onOpen}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-darkOrange to-lightOrange text-white font-medium transition-all hover:opacity-90"
        >
          {isCompleted
            ? "Revisar"
            : isStarted
            ? "Continuar"
            : "Empezar"}
          <BsArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const progressHook = useProgress();
  const [view, setView] = useState<View>({ type: "catalog" });

  const getCourse = (id: string) => courses.find((c) => c.id === id)!;

  const goToCatalog = () => setView({ type: "catalog" });
  const goToCourse = (courseId: string) =>
    setView({ type: "course", courseId });

  // Lesson view
  if (view.type === "lesson") {
    const course = getCourse(view.courseId);
    const mod = course.modules.find((m) => m.id === view.moduleId)!;
    return (
      <DashboardLayout>
        <LessonView
          module={mod}
          lessonIndex={view.lessonIndex}
          onBack={() => goToCourse(view.courseId)}
          onNext={(nextIndex) => {
            if (nextIndex < mod.lessons.length) {
              progressHook.completeLesson(
                mod.id,
                mod.lessons[view.lessonIndex].id
              );
              setView({ ...view, lessonIndex: nextIndex });
            } else {
              progressHook.completeLesson(
                mod.id,
                mod.lessons[view.lessonIndex].id
              );
              setView({
                type: "quiz",
                courseId: view.courseId,
                moduleId: mod.id,
              });
            }
          }}
          progress={progressHook}
        />
      </DashboardLayout>
    );
  }

  // Quiz view
  if (view.type === "quiz") {
    const course = getCourse(view.courseId);
    const mod = course.modules.find((m) => m.id === view.moduleId)!;
    return (
      <DashboardLayout>
        <QuizView
          module={mod}
          onBack={() => goToCourse(view.courseId)}
          progress={progressHook}
        />
      </DashboardLayout>
    );
  }

  // Course detail (modules list)
  if (view.type === "course") {
    const course = getCourse(view.courseId);
    return (
      <DashboardLayout>
        <section>
          <button
            onClick={goToCatalog}
            className="flex items-center gap-2 text-darkGrey hover:text-darkOrange transition-colors mb-6"
          >
            <BsArrowLeft size={16} />
            <span className="text-sm">Todas las rutas</span>
          </button>

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
                unlocked={progressHook.isModuleUnlocked(
                  index,
                  course.modules
                )}
                progress={progressHook.getModuleProgress(mod.id)}
                onStartLesson={(lessonIndex) =>
                  setView({
                    type: "lesson",
                    courseId: course.id,
                    moduleId: mod.id,
                    lessonIndex,
                  })
                }
                onStartQuiz={() =>
                  setView({
                    type: "quiz",
                    courseId: course.id,
                    moduleId: mod.id,
                  })
                }
              />
            ))}
          </div>
        </section>
      </DashboardLayout>
    );
  }

  // Catalog view (default)
  return (
    <DashboardLayout>
      <section>
        <h2 className="text-2xl font-bold text-darkGreen mb-2">
          Rutas de aprendizaje
        </h2>
        <p className="text-grey mb-8">
          Elegí una ruta y empezá a aprender a tu ritmo.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              progress={progressHook}
              onOpen={() => goToCourse(course.id)}
            />
          ))}

          {/* Coming soon placeholder */}
          <div className="border-2 border-dashed border-borderGrey/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center min-h-[300px]">
            <BsJournals className="text-borderGrey mb-3" size={32} />
            <h3 className="text-lg font-semibold text-darkGrey mb-1">
              Más rutas próximamente
            </h3>
            <p className="text-sm text-darkGrey">
              Nuevos contenidos sobre DeFi, NFTs y más.
            </p>
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
