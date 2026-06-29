import { BsTrophy, BsCheckCircleFill } from "react-icons/bs";

interface CompiteProps {
  completedModules: number;
  totalModules: number;
}

export function Compite({ completedModules, totalModules }: CompiteProps) {
  const allCompleted = completedModules >= totalModules && totalModules > 0;

  return (
    <article className="p-6 border-[1px] border-lightGrey rounded-2xl self-start">
      <h4 className="text-h4 text-orangeGrey font-semibold mb-4">
        ¡Compite y demuestra tus habilidades!
      </h4>
      <div className="flex items-center">
        {allCompleted ? (
          <BsCheckCircleFill fill="#68CC58" size={40} />
        ) : (
          <BsTrophy fill="#68CC58" size={40} />
        )}
        <p className="text-subP text-darkGrey ml-6">
          {allCompleted
            ? "¡Felicidades! Completaste todos los módulos. Ya podés competir y obtener tu certificado final."
            : `Completá ${totalModules - completedModules} módulo${
                totalModules - completedModules !== 1 ? "s" : ""
              } más para empezar a competir.`}
        </p>
      </div>
    </article>
  );
}
