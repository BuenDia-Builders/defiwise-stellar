import Image from "next/image";
import { BsPatchCheckFill } from "react-icons/bs";

export default function Progress() {
  return (
    <article className="p-6 border-[1px] border-lightGrey rounded-2xl self-start mb-10">
      <h4 className="text-darkGrey mb-4 font-semibold">Tu progreso</h4>
      <div className="flex">
        <BsPatchCheckFill fill="darkOrange" size={35} />
        <div className="pl-2">
          <span className="text-active">Objetivo diario</span>
          <div className="flex items-center">
            <div className="w-[150px] mr-2 bg-progressGrey rounded-full h-2.5">
              <div className="bg-lightOrange h-2.5 rounded-full" style={{ width: "45%" }} />
            </div>
            <span className="text-subP text-light text-lightGrey">8/20 Puntos</span>
          </div>
        </div>
      </div>
      <Image src="/progressChart.svg" alt="Progress Chart" width={300} height={300} />
    </article>
  );
}
