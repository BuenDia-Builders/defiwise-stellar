import Image from "next/image";
import { BsStars } from "react-icons/bs";

export function ModuleCallToAction() {
  return (
    <section className="border-[1px] border-darkOrange rounded-2xl px-14 py-10">
      <div className="flex flex-col md:flex-row items-center">
        <Image src="/pet_nft.png" alt="Pet NFT" width={150} height={150} />
        <div className="md:pl-8">
          <p className="text-subP text-darkGrey">¡Te falta poco para terminar tu curso!</p>
          <h4 className="text-h4 text-darkOrange leading-6">
            Completa los módulos para desbloquear tu certificado
          </h4>
        </div>
      </div>
      <p className="text-subP text-center text-darkGrey">
        Amplía tu conocimiento sobre DeFi
        <br />
        con nuestras otras rutas de aprendizaje
      </p>
      <button className="m-auto flex items-center py-2 px-10 rounded-2xl bg-gradient-to-b from-darkOrange to-lightOrange text-white font-normal">
        Descubrir más cursos <BsStars fill="white" className="ml-2" />
      </button>
    </section>
  );
}
