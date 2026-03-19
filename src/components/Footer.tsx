import { BsGithub, BsHeartFill, BsInstagram, BsLinkedin } from "react-icons/bs";

export function Footer() {
  return (
    <footer className="bg-darkGreen text-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Logo" className="h-8 brightness-200" />
            <span className="font-semibold text-xl text-white" style={{ fontFamily: "Rubik, sans-serif" }}>
              DeFiWise
            </span>
          </div>

          {/* Social */}
          <ul className="flex gap-4">
            <li>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-darkOrange/80 flex items-center justify-center transition-colors"
              >
                <BsLinkedin size={18} />
              </a>
            </li>
            <li>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-darkOrange/80 flex items-center justify-center transition-colors"
              >
                <BsInstagram size={18} />
              </a>
            </li>
            <li>
              <a
                href="https://github.com/BuenDia-Builders"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-darkOrange/80 flex items-center justify-center transition-colors"
              >
                <BsGithub size={18} />
              </a>
            </li>
          </ul>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/50">
          <p className="m-0">Copyright 2026 &copy; DeFiWise. All rights reserved.</p>
          <p className="m-0 flex items-center">
            Hecho con
            <BsHeartFill fill="#EF798A" className="mx-1.5" size={12} />
            por Buen Dia Builders
          </p>
        </div>
      </div>
    </footer>
  );
}
