import Image from "next/image";
import { BsShieldCheck, BsAward, BsLightning } from "react-icons/bs";

export function Advantages() {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-lightYellow/30" id="advantages">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-active font-semibold text-sm uppercase tracking-wider mb-3">
            Beneficios
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-darkGreen mb-4">
            Todo lo que necesitás para aprender DeFi
          </h2>
          <p className="text-grey max-w-2xl mx-auto text-lg">
            Certificaciones validadas en blockchain, insignias coleccionables y una comunidad activa te esperan.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="glass-card rounded-2xl p-8 hover-lift">
            <div className="w-12 h-12 bg-active/10 rounded-xl flex items-center justify-center mb-5">
              <BsShieldCheck className="text-active" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-darkGreen mb-3">Certificados on-chain</h3>
            <p className="text-grey">
              Tus certificados quedan registrados en Stellar. Compartílos en LinkedIn y demostrá tus conocimientos.
            </p>
          </div>
          <div className="glass-card rounded-2xl p-8 hover-lift">
            <div className="w-12 h-12 bg-darkOrange/10 rounded-xl flex items-center justify-center mb-5">
              <BsAward className="text-darkOrange" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-darkGreen mb-3">NFTs e insignias</h3>
            <p className="text-grey">
              Coleccioná badges verificables por cada módulo completado. Tokens únicos que validan tu aprendizaje.
            </p>
          </div>
          <div className="glass-card rounded-2xl p-8 hover-lift">
            <div className="w-12 h-12 bg-pink/10 rounded-xl flex items-center justify-center mb-5">
              <BsLightning className="text-pink" size={24} />
            </div>
            <h3 className="text-xl font-semibold text-darkGreen mb-3">Rápido y económico</h3>
            <p className="text-grey">
              Stellar ofrece transacciones en segundos con costos casi nulos. Ideal para aprender sin barreras.
            </p>
          </div>
        </div>

        {/* Two cards */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-active/5 to-active/15 p-10 hover-lift border border-active/20">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-darkGreen mb-4">
                Certificados validados en Stellar
              </h3>
              <p className="text-grey mb-6">
                Comparte nuestras certificaciones con tus contactos en tu perfil de LinkedIn u otras redes sociales.
              </p>
            </div>
            <Image
              src="/certificate.svg"
              alt="Certificado"
              className="mx-auto relative z-10"
              width={280}
              height={200}
            />
          </div>

          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-darkOrange/5 to-darkOrange/15 p-10 hover-lift border border-darkOrange/20">
            <div className="relative z-10">
              <h3 className="text-2xl font-bold text-darkGreen mb-4">
                Gana NFTs y Tokens aprendiendo
              </h3>
              <p className="text-grey mb-6">
                Coleccioná insignias en la red Stellar y demostrá tus conocimientos con tokens verificables.
              </p>
            </div>
            <Image
              src="/nftsAwards.svg"
              alt="NFT Awards"
              className="mx-auto relative z-10"
              width={280}
              height={200}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
