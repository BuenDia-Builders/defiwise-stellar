import Image from "next/image";
import { BsArrowRight, BsCheckCircle } from "react-icons/bs";

export function Methodology() {
  return (
    <section className="py-24" id="methodology">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-darkOrange font-semibold text-sm uppercase tracking-wider mb-3">
            Cómo funciona
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-darkGreen mb-4">
            Aprendé, resolvé, demostralo
          </h2>
          <p className="text-grey max-w-2xl mx-auto text-lg">
            Rutas de aprendizaje con teoría, desafíos prácticos y certificación al completar cada etapa.
          </p>
        </div>

        {/* Main card */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-lightBeige to-beige">
          <div className="grid lg:grid-cols-2 gap-8 p-8 lg:p-16 items-center">
            <Image
              src="/call_to_action.svg"
              alt="Metodología interactiva"
              width={450}
              height={350}
              className="mx-auto"
            />
            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-darkGreen mb-6 leading-tight">
                Contenido práctico con validación real
              </h3>
              <p className="text-grey mb-8 text-lg">
                Cada ruta combina teoría con desafíos que ponen a prueba lo que aprendiste.
                Tu progreso queda registrado de forma transparente y verificable.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <BsCheckCircle className="text-active mt-1 flex-shrink-0" size={20} />
                  <p className="text-grey m-0">Módulos progresivos con teoría y práctica</p>
                </div>
                <div className="flex items-start gap-3">
                  <BsCheckCircle className="text-active mt-1 flex-shrink-0" size={20} />
                  <p className="text-grey m-0">Quizzes al final de cada módulo con feedback inmediato</p>
                </div>
                <div className="flex items-start gap-3">
                  <BsCheckCircle className="text-active mt-1 flex-shrink-0" size={20} />
                  <p className="text-grey m-0">NFTs y certificados verificables al completar</p>
                </div>
              </div>

              <a
                href="/dashboard"
                className="mt-8 inline-flex items-center gap-2 btn border-0 text-white bg-gradient-to-r from-darkOrange to-lightOrange text-base px-8 py-3 rounded-xl shadow-lg shadow-darkOrange/25"
              >
                Ver rutas disponibles
                <BsArrowRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
