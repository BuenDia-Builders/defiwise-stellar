# DeFiWise

Educational platform for decentralized finance with verifiable on-chain certifications on Stellar.

## What is it

DeFiWise lets users learn DeFi hands-on through learning paths with modules, lessons, and quizzes. Upon completing each module, the user receives an NFT badge and XP tokens recorded on Stellar Testnet.

## Stack

- **Frontend:** Next.js 14, Tailwind CSS, DaisyUI
- **Backend:** Next.js API Routes (admin-signed transactions)
- **Wallet:** Freighter (Stellar)
- **Smart Contracts:** Soroban (Rust) — XP Token + Badge NFT
- **Network:** Stellar Testnet

## Deployed Contracts (Testnet)

| Contract | Address |
|----------|---------|
| XP Token | `CATAE4HXRWEIVGI2ZW5NGRXIQDNFWZ4YLAKXUU3Q3FKBDT2MPGJECTL4` |
| Badge NFT | `CDWJE7AM3DFWC6FD2RKBASWP7EITQ2ULJH4FX5JFQRVHXQSXDPJAB3KI` |

## Getting Started

### Frontend Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000

### Backend Setup (Required for XP & Badges)

The smart contracts require admin signatures for rewarding XP and minting badges. You need to set up the backend API:

1. **Copy environment file:**
   ```bash
   copy .env.example .env
   ```

2. **Add your admin secret key to `.env`:**
   ```bash
   ADMIN_SECRET_KEY=SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

3. **Verify setup:**
   ```bash
   node scripts/test-backend.js
   ```

📖 **Full setup guide:** See [BACKEND_SETUP.md](./BACKEND_SETUP.md) for detailed instructions.

📖 **API documentation:** See [src/app/api/README.md](./src/app/api/README.md) for endpoint reference.

## Smart Contracts

Two Soroban contracts power the on-chain mechanics:

**XP Token** — Fungible token minted as a reward when users complete quizzes. Tracks a historical balance that never decreases (even if tokens are burned), acting as a permanent reputation score. Supports progressive gating: advanced modules can require a minimum XP to unlock.

**Badge NFT** — Non-fungible token minted per completed module. Stores on-chain metadata: owner, module ID, XP earned, quiz score, and timestamp. One badge per user per module.

### Build & Test

```bash
cd contracts
cargo build --release --target wasm32v1-none
cargo test
```

Requires Rust, `wasm32v1-none` target, and [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools/cli/install-cli).

## Project Structure

```
src/
  app/
    api/            # Backend API routes (admin-signed transactions)
      reward-quiz/  # Award XP tokens
      mint-badge/   # Mint NFT badges
    home/           # Landing page (Hero, Advantages, Methodology)
    dashboard/      # Course catalog, modules, lessons, quizzes
      logros/       # Earned NFTs and certificates
  components/
    stellar/        # ConnectWalletButton, OnChainStatus
    examples/       # Example integration components
  hooks/            # useStellarWallet, useProgress, useStellarProgress
  lib/
    stellar.ts      # Contract interaction layer
    api-client.ts   # Backend API client utilities
  data/             # Courses, modules, lessons, quiz questions
contracts/
  xp-token/         # Fungible XP token with historical balance tracking
  badge-nft/        # NFT minted per completed module
scripts/
  test-backend.js   # Backend API test suite
```

## License

MIT

---

Built by [Buen Dia Builders](https://github.com/BuenDia-Builders)
