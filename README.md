# DeFiWise

Plataforma educativa de finanzas descentralizadas con certificaciones verificables on-chain en Stellar.

## Qué es

DeFiWise permite aprender DeFi de forma práctica a través de rutas de aprendizaje con módulos, lecciones y quizzes. Al completar cada módulo, el usuario recibe un NFT (badge) y XP registrados en Stellar Testnet.

## Stack

- **Frontend:** Next.js 14, Tailwind CSS, DaisyUI
- **Wallet:** Freighter (Stellar)
- **Contratos:** Soroban (Rust) — XP Token + Badge NFT
- **Red:** Stellar Testnet

## Contratos deployados (Testnet)

| Contrato | Address |
|----------|---------|
| XP Token | `CATAE4HXRWEIVGI2ZW5NGRXIQDNFWZ4YLAKXUU3Q3FKBDT2MPGJECTL4` |
| Badge NFT | `CDWJE7AM3DFWC6FD2RKBASWP7EITQ2ULJH4FX5JFQRVHXQSXDPJAB3KI` |

## Cómo correr

```bash
npm install
npm run dev
```

Abrir http://localhost:3000

## Contratos

```bash
cd contracts
cargo build --release --target wasm32-unknown-unknown
cargo test
```

Requiere Rust + `wasm32-unknown-unknown` target + Stellar CLI.

## Estructura

```
src/
  app/
    home/           # Landing (Hero, Advantages, Methodology)
    dashboard/      # Catálogo de rutas, módulos, lecciones, quizzes
      logros/       # NFTs y certificados ganados
  components/
    stellar/        # ConnectWalletButton, OnChainStatus
  hooks/            # useStellarWallet, useProgress, useStellarProgress
  lib/              # stellar.ts (interacción con contratos)
  data/             # Cursos, módulos, lecciones, preguntas
contracts/
  xp-token/         # Token fungible de XP con balance histórico
  badge-nft/        # NFT por módulo completado
```

## Licencia

MIT

---

Hecho por [Buen Dia Builders](https://github.com/BuenDia-Builders)
