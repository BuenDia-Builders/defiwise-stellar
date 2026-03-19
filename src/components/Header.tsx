"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { ConnectWalletButton } from "@/components/stellar/ConnectWalletButton";

const menuLinks = [
  { label: "Beneficios", href: "/#advantages" },
  { label: "Metodología", href: "/#methodology" },
];

function HeaderMenuLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {menuLinks.map(({ label, href }) => (
        <li key={href}>
          <Link
            href={href}
            onClick={onClick}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === href
                ? "text-darkOrange bg-lightYellow"
                : "text-grey hover:text-darkOrange hover:bg-lightYellow/50"
            }`}
          >
            {label}
          </Link>
        </li>
      ))}
    </>
  );
}

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-borderGrey/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img alt="DeFiWise" src="/logo.svg" className="h-8 w-8" />
            <span className="logo text-darkGreen">DeFiWise</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            <ul className="flex items-center gap-1">
              <HeaderMenuLinks />
            </ul>
            <div className="ml-6">
              <ConnectWalletButton />
            </div>
          </nav>

          {/* Mobile toggle */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <XMarkIcon className="h-6 w-6 text-grey" />
            ) : (
              <Bars3Icon className="h-6 w-6 text-grey" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div ref={menuRef} className="lg:hidden pb-4 border-t border-borderGrey/30 mt-2 pt-4">
            <ul className="flex flex-col gap-1">
              <HeaderMenuLinks onClick={() => setIsOpen(false)} />
            </ul>
            <div className="mt-4">
              <ConnectWalletButton />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
