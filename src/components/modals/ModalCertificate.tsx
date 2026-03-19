"use client";

import Image from "next/image";
import { BsFillTrophyFill, BsJournalCheck } from "react-icons/bs";

interface ModalCertificateProps {
  setCertModal: (open: boolean) => void;
}

export function ModalCertificate({ setCertModal }: ModalCertificateProps) {
  return (
    <section className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="max-w-[90%] md:max-w-[820px] bg-white shadow-lg p-8 rounded-lg flex flex-col justify-center items-center">
        <BsFillTrophyFill fill="darkOrange" size={40} />
        <h3 className="text-darkOrange mt-8 text-h3">¡Felicidades!</h3>
        <div className="flex flex-col md:flex-row items-center bg-lightYellow">
          <Image src="/certificate.svg" alt="Certificado" width={250} height={200} />
          <div className="p-8 text-center">
            <h4 className="text-darkOrange text-h4 mb-4">¡Obtuviste tu primer certificado!</h4>
            <p className="text-subP my-1">
              Tu certificado ha sido registrado en la red Stellar Testnet.
            </p>
            <p className="text-subP my-1">Recuerda que podrás ver la transacción en tu wallet</p>
            <p className="text-subP my-1">
              ¡Continúa aprendiendo para coleccionar más badges y obtener certificados validados en Stellar!
            </p>
          </div>
        </div>
        <button
          className="flex items-center py-2 px-10 rounded-2xl bg-gradient-to-b from-darkOrange to-lightOrange text-white font-normal"
          onClick={() => setCertModal(false)}
        >
          Volver al inicio <BsJournalCheck fill="white" className="ml-2" />
        </button>
      </div>
    </section>
  );
}
