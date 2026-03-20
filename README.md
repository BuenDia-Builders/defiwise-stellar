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

## Contracts

```bash
cd contracts
cargo build --release --target wasm32-unknown-unknown
cargo test
```

Requires Rust + `wasm32-unknown-unknown` target + Stellar CLI.

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
