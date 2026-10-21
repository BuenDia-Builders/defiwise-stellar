"use client";

import { useStellarWallet, SUPPORTED_WALLETS } from "@/hooks/useStellarWallet";
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
    <div className="flex flex-col gap-2">
      {SUPPORTED_WALLETS.map((wallet) => (
        <button
          key={wallet.id}
          onClick={() => connect(wallet.id)}
          disabled={loading}
          className="btn border-0 text-white bg-gradient-to-b from-darkOrange to-lightOrange flex items-center justify-between gap-2 px-4"
        >
          <span>
            <BsWallet2 /> Conectar {wallet.name}
          </span>
          {loading ? "Conectando..." : null}
        </button>
      ))}
    </div>
  );
}
