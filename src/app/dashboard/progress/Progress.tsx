import { useProgress } from "@/hooks/useProgress";
import { Course } from "@/data/courses";
import { BsPatchCheckFill, BsBook, BsStarFill } from "react-icons/bs";

interface ProgressProps {
  progress: ReturnType<typeof useProgress>;
  course: Course;
}

export default function Progress({ progress, course }: ProgressProps) {
  const { totalXP, completedModules, getModuleProgress } = progress;
  const totalModules = course.modules.length;

  // Count lessons completed vs total lessons
  const totalLessons = course.modules.reduce(
    (sum, m) => sum + m.lessons.length,
    0
  );
  const completedLessons = course.modules.reduce((sum, m) => {
    const modProgress = getModuleProgress(m.id);
    return sum + modProgress.lessonsCompleted.length;
  }, 0);

  // Max possible XP for this course
  const maxXP = course.modules.reduce((sum, m) => sum + m.rewardXP, 0);

  // Progress percentage based on completed modules vs total
  const modulePercent =
    totalModules > 0
      ? Math.round((completedModules / totalModules) * 100)
      : 0;

  return (
    <article className="p-6 border-[1px] border-lightGrey rounded-2xl self-start mb-10">
      <h4 className="text-darkGrey mb-4 font-semibold">Tu progreso general</h4>

      {/* XP earned */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 bg-darkOrange/10 rounded-xl flex items-center justify-center">
          <BsStarFill className="text-darkOrange" size={18} />
        </div>
        <div>
          <p className="text-sm text-darkGrey">XP acumulado</p>
          <p className="text-lg font-bold text-darkGreen">
            {totalXP} / {maxXP} XP
          </p>
        </div>
      </div>

      {/* Modules completed */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 bg-active/10 rounded-xl flex items-center justify-center">
          <BsPatchCheckFill className="text-active" size={18} />
        </div>
        <div>
          <p className="text-sm text-darkGrey">Módulos completados</p>
          <p className="text-lg font-bold text-darkGreen">
            {completedModules} / {totalModules}
          </p>
        </div>
      </div>

      {/* Lessons completed */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-10 h-10 bg-pink/10 rounded-xl flex items-center justify-center">
          <BsBook className="text-pink" size={18} />
        </div>
        <div>
          <p className="text-sm text-darkGrey">Lecciones completadas</p>
          <p className="text-lg font-bold text-darkGreen">
            {completedLessons} / {totalLessons}
          </p>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="mb-2">
        <div className="flex justify-between text-xs text-darkGrey mb-1">
          <span>Progreso del curso</span>
          <span>{modulePercent}%</span>
        </div>
        <div className="w-full bg-progressGrey rounded-full h-2.5">
          <div
            className="bg-active h-2.5 rounded-full transition-all"
            style={{ width: `${modulePercent}%` }}
          />
        </div>
      </div>
    </article>
  );
}
