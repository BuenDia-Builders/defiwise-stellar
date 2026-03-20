# DeFiWise

Educational platform for decentralized finance with verifiable on-chain certifications on Stellar.

## What is it

DeFiWise lets users learn DeFi hands-on through learning paths with modules, lessons, and quizzes. Upon completing each module, the user receives an NFT badge and XP tokens recorded on Stellar Testnet.

## Stack

- **Frontend:** Next.js 14, Tailwind CSS, DaisyUI
- **Wallet:** Freighter (Stellar)
- **Smart Contracts:** Soroban (Rust) — XP Token + Badge NFT
- **Network:** Stellar Testnet

## Deployed Contracts (Testnet)

| Contract | Address |
|----------|---------|
| XP Token | `CATAE4HXRWEIVGI2ZW5NGRXIQDNFWZ4YLAKXUU3Q3FKBDT2MPGJECTL4` |
| Badge NFT | `CDWJE7AM3DFWC6FD2RKBASWP7EITQ2ULJH4FX5JFQRVHXQSXDPJAB3KI` |

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Smart Contracts

Two Soroban contracts power the on-chain mechanics:

**XP Token** — Fungible token minted as a reward when users complete quizzes. Tracks a historical balance that never decreases (even if tokens are burned), acting as a permanent reputation score. Supports progressive gating: advanced modules can require a minimum XP to unlock.

**Badge NFT** — Non-fungible token minted per completed module. Stores on-chain metadata: owner, module ID, XP earned, quiz score, and timestamp. One badge per user per module.

### Build & Test

```bash
cd contracts
cargo build --release --target wasm32-unknown-unknown
cargo test
```

Requires Rust, `wasm32-unknown-unknown` target, and [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/install-cli).

## Project Structure

```
src/
  app/
    home/           # Landing page (Hero, Advantages, Methodology)
    dashboard/      # Course catalog, modules, lessons, quizzes
      logros/       # Earned NFTs and certificates
  components/
    stellar/        # ConnectWalletButton, OnChainStatus
  hooks/            # useStellarWallet, useProgress, useStellarProgress
  lib/              # stellar.ts (contract interaction layer)
  data/             # Courses, modules, lessons, quiz questions
contracts/
  xp-token/         # Fungible XP token with historical balance tracking
  badge-nft/        # NFT minted per completed module
```

## License

MIT

---

Built by [Buen Dia Builders](https://github.com/BuenDia-Builders)
