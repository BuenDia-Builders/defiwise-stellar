"use client";

import { useStellarWallet } from "@/hooks/useStellarWallet";
import { BsWallet2 } from "react-icons/bs";

export function ConnectWalletButton() {
  const { connected, truncatedAddress, loading, connect, disconnect } =
    useStellarWallet();

  if (connected && truncatedAddress) {
    return (
      <div className="flex items-center gap-2">
        <span className="bg-lightGreen text-darkGreen text-sm px-3 py-1 rounded-full font-normal">
          {truncatedAddress}
        </span>
        <button
          onClick={disconnect}
          className="btn btn-sm btn-ghost text-darkGrey"
        >
          Salir
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      disabled={loading}
      className="btn border-0 text-white bg-gradient-to-b from-darkOrange to-lightOrange flex items-center gap-2"
    >
      <BsWallet2 />
      {loading ? "Conectando..." : "Conectar Wallet"}
    </button>
  );
}
