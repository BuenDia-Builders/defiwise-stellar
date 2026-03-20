import Image from "next/image";
import { BsArrowRight } from "react-icons/bs";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-lightYellow via-white to-lightGreen opacity-60" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-lightOrange/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-active/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: text content */}
          <div className="text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-darkGreen leading-tight mb-6">
              Dominá las{" "}
              <span className="gradient-text">finanzas descentralizadas</span>
            </h1>

            <p className="text-lg text-grey max-w-lg mb-8 leading-relaxed">
              Aprendé DeFi de forma práctica: completá desafíos, demostrá lo que
              sabés y obtené certificaciones verificables en blockchain.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/dashboard"
                className="btn border-0 text-white bg-gradient-to-r from-darkOrange to-lightOrange text-base px-8 py-3 rounded-xl shadow-lg shadow-darkOrange/25 hover:shadow-darkOrange/40 transition-all"
              >
                Explorar rutas
                <BsArrowRight className="ml-2" />
              </a>
            </div>
          </div>

          {/* Right: image collage */}
          <div className="hidden lg:block relative">
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Decorative ring */}
              <div className="absolute inset-4 border-2 border-dashed border-darkOrange/20 rounded-full" />
              <div className="absolute inset-12 border-2 border-dashed border-active/20 rounded-full" />

              {/* Floating images */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 hover-lift">
                <Image src="/hero_mask1.svg" alt="Estudiante" width={140} height={140} className="rounded-2xl" />
              </div>
              <div className="absolute top-1/4 right-0 hover-lift">
                <Image src="/hero_mask2.svg" alt="Estudiante" width={110} height={110} className="rounded-2xl" />
              </div>
              <div className="absolute bottom-1/4 right-4 hover-lift">
                <Image src="/hero_mask3.svg" alt="Estudiante" width={90} height={90} className="rounded-2xl" />
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 hover-lift">
                <Image src="/hero_mask4.svg" alt="Estudiante" width={130} height={130} className="rounded-2xl" />
              </div>
              <div className="absolute top-1/4 left-0 hover-lift">
                <Image src="/hero_mask5.svg" alt="Estudiante" width={100} height={100} className="rounded-2xl" />
              </div>
              <div className="absolute bottom-1/4 left-4 hover-lift">
                <Image src="/hero_mask6.svg" alt="Estudiante" width={80} height={80} className="rounded-2xl" />
              </div>

              {/* Center badge */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 glass-card rounded-2xl p-6 shadow-xl">
                <Image src="/logo.svg" alt="DeFiWise" width={60} height={60} className="mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
