# Architecture Diagram

Visual representation of the DeFiWise backend architecture for admin-signed transactions.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER BROWSER                               │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │                    React Frontend                             │     │
│  │                                                               │     │
│  │  ┌─────────────────┐         ┌──────────────────┐           │     │
│  │  │  Quiz Component │         │ Badge Component  │           │     │
│  │  │                 │         │                  │           │     │
│  │  │  [Submit Quiz]  │         │ [Complete Module]│           │     │
│  │  └────────┬────────┘         └────────┬─────────┘           │     │
│  │           │                           │                      │     │
│  │           └───────────┬───────────────┘                      │     │
│  │                       │                                      │     │
│  │                       ▼                                      │     │
│  │            ┌──────────────────────┐                         │     │
│  │            │   api-client.ts      │                         │     │
│  │            │  • rewardQuiz()      │                         │     │
│  │            │  • mintBadge()       │                         │     │
│  │            └──────────┬───────────┘                         │     │
│  └───────────────────────│──────────────────────────────────────┘     │
│                          │                                             │
└──────────────────────────┼─────────────────────────────────────────────┘
                           │ HTTPS POST
                           │ (JSON payload)
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        VERCEL / NEXT.JS SERVER                          │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │                     API Routes                                │     │
│  │                                                               │     │
│  │  ┌────────────────────┐       ┌────────────────────┐        │     │
│  │  │ /api/reward-quiz   │       │ /api/mint-badge    │        │     │
│  │  │                    │       │                    │        │     │
│  │  │ 1. Validate Input  │       │ 1. Validate Input  │        │     │
│  │  │ 2. Rate Limit      │       │ 2. Rate Limit      │        │     │
│  │  │ 3. Check Duplicate │       │ 3. Check Duplicate │        │     │
│  │  │ 4. Build TX        │       │ 4. Build TX        │        │     │
│  │  │ 5. Simulate        │       │ 5. Simulate        │        │     │
│  │  │ 6. Sign with Admin │       │ 6. Sign with Admin │        │     │
│  │  │ 7. Submit          │       │ 7. Submit          │        │     │
│  │  │ 8. Poll Result     │       │ 8. Poll Result     │        │     │
│  │  └──────────┬─────────┘       └──────────┬─────────┘        │     │
│  └─────────────│────────────────────────────│───────────────────┘     │
│                │                            │                         │
│                │     Uses Environment       │                         │
│                │     Variables ──┐          │                         │
│                │                 │          │                         │
│  ┌─────────────▼─────────────────▼──────────▼────────────────┐       │
│  │           Environment Variables (Server-only)             │       │
│  │                                                            │       │
│  │  ADMIN_SECRET_KEY=SXXXXXXXXXXXXXXXXXXXXXXXXXXXXX          │       │
│  │  RATE_LIMIT_WINDOW_MS=60000                               │       │
│  │  RATE_LIMIT_MAX_REQUESTS=10                               │       │
│  └────────────────────────────────────────────────────────────┘       │
│                                                                         │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  │ Signed Transaction
                                  │ (XDR format)
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         STELLAR TESTNET                                 │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │                    Soroban RPC Server                         │     │
│  │            https://soroban-testnet.stellar.org               │     │
│  └───────────────────────────┬──────────────────────────────────┘     │
│                               │                                         │
│                               ▼                                         │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │                  Smart Contracts                              │     │
│  │                                                               │     │
│  │  ┌────────────────────────────────────────────────────┐     │     │
│  │  │  XP Token Contract                                 │     │     │
│  │  │  CATAE4HXRWEIVGI2ZW5NGRXIQDNFWZ4YLAKXU...       │     │     │
│  │  │                                                    │     │     │
│  │  │  • reward_quiz(user, challenge_id, ...)          │     │     │
│  │  │    ├─ Requires: admin.require_auth() ✓           │     │     │
│  │  │    ├─ Checks: challenge not completed            │     │     │
│  │  │    ├─ Updates: user XP balance                   │     │     │
│  │  │    └─ Emits: xp_mint event                       │     │     │
│  │  │                                                    │     │     │
│  │  │  • balance(user) -> i128                          │     │     │
│  │  │  • is_completed(user, challenge_id) -> bool       │     │     │
│  │  └────────────────────────────────────────────────────┘     │     │
│  │                                                               │     │
│  │  ┌────────────────────────────────────────────────────┐     │     │
│  │  │  Badge NFT Contract                               │     │     │
│  │  │  CDWJE7AM3DFWC6FD2RKBASWP7EITQ2ULJH4FX...       │     │     │
│  │  │                                                    │     │     │
│  │  │  • mint_badge(user, module_id, ...) -> u64       │     │     │
│  │  │    ├─ Requires: admin.require_auth() ✓           │     │     │
│  │  │    ├─ Checks: badge not minted for module        │     │     │
│  │  │    ├─ Creates: BadgeInfo with metadata           │     │     │
│  │  │    ├─ Updates: user badges list                  │     │     │
│  │  │    └─ Emits: badge event                         │     │     │
│  │  │                                                    │     │     │
│  │  │  • user_badges(user) -> Vec<u64>                 │     │     │
│  │  │  • has_badge(user, module_id) -> bool            │     │     │
│  │  └────────────────────────────────────────────────────┘     │     │
│  └───────────────────────────────────────────────────────────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Request Flow: Reward Quiz

```
User Completes Quiz
        │
        ▼
┌───────────────────────────────────────────────────────┐
│ 1. Frontend: Calculate score (correct/total)         │
└───────────────┬───────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────┐
│ 2. Frontend: Call rewardQuiz() from api-client.ts    │
│    • userPublicKey: "GXXXXX..."                       │
│    • challengeId: "defi-basics-01"                    │
│    • correct: 8                                       │
│    • total: 10                                        │
│    • maxXp: 100                                       │
└───────────────┬───────────────────────────────────────┘
                │ POST /api/reward-quiz
                ▼
┌───────────────────────────────────────────────────────┐
│ 3. Backend: Validate Input                           │
│    ✓ Public key format                               │
│    ✓ Challenge ID not empty                          │
│    ✓ correct ≤ total                                 │
│    ✓ maxXp > 0                                       │
└───────────────┬───────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────┐
│ 4. Backend: Check Rate Limit                         │
│    • Key: "reward-quiz:GXXXXX..."                    │
│    • Limit: 10 requests/minute                       │
│    • Action: Increment counter                       │
└───────────────┬───────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────┐
│ 5. Backend: Check Duplicate (Query Contract)         │
│    • Call: is_completed(user, challenge_id)          │
│    • Result: false (not completed yet) ✓             │
└───────────────┬───────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────┐
│ 6. Backend: Build Transaction                        │
│    • Get admin account from network                  │
│    • Build contract call operation                   │
│    • Set fee and timeout                             │
└───────────────┬───────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────┐
│ 7. Backend: Simulate Transaction                     │
│    • Send to Stellar RPC for simulation              │
│    • Validate contract will accept                   │
│    • Get resource requirements                       │
└───────────────┬───────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────┐
│ 8. Backend: Assemble with Simulation Results         │
│    • Add footprint and auth                          │
│    • Prepare for signing                             │
└───────────────┬───────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────┐
│ 9. Backend: Sign with Admin Key                      │
│    • Load ADMIN_SECRET_KEY from env                  │
│    • Sign transaction                                │
│    • Admin signature authorizes contract call        │
└───────────────┬───────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────┐
│ 10. Backend: Submit to Network                       │
│     • Send signed TX to Stellar                      │
│     • Receive transaction hash                       │
└───────────────┬───────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────┐
│ 11. Backend: Poll for Result                         │
│     • Query transaction status                       │
│     • Wait up to 30 seconds                          │
│     • Confirm SUCCESS status                         │
└───────────────┬───────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────┐
│ 12. Backend: Return Response                         │
│     {                                                 │
│       success: true,                                  │
│       hash: "abc123...",                              │
│       xpRewarded: 80,                                 │
│       message: "Successfully rewarded 80 XP..."       │
│     }                                                 │
└───────────────┬───────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────┐
│ 13. Frontend: Update UI                              │
│     • Show success toast: "Earned 80 XP! 🎉"         │
│     • Update XP balance display                      │
│     • Refresh progress indicators                    │
│     • Log transaction hash                           │
└───────────────────────────────────────────────────────┘
```

## Request Flow: Mint Badge

```
User Completes Module
        │
        ▼
┌───────────────────────────────────────────────────────┐
│ 1. Frontend: Calculate final stats                   │
│    • Total XP earned in module                        │
│    • Final quiz score                                 │
└───────────────┬───────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────┐
│ 2. Frontend: Call mintBadge() from api-client.ts     │
│    • userPublicKey: "GXXXXX..."                       │
│    • moduleId: "fundamentals"                         │
│    • moduleTitle: "DeFi Fundamentals"                 │
│    • xpEarned: 250                                    │
│    • quizScore: 85                                    │
└───────────────┬───────────────────────────────────────┘
                │ POST /api/mint-badge
                ▼
┌───────────────────────────────────────────────────────┐
│ 3-11. Backend: Same flow as reward-quiz              │
│       (validate, rate limit, check duplicate,         │
│        build, simulate, sign, submit, poll)           │
└───────────────┬───────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────┐
│ 12. Backend: Return Response                         │
│     {                                                 │
│       success: true,                                  │
│       hash: "def456...",                              │
│       tokenId: 42,                                    │
│       message: "Successfully minted badge..."         │
│     }                                                 │
└───────────────┬───────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────┐
│ 13. Frontend: Update UI                              │
│     • Show badge earned animation 🏆                  │
│     • Display badge with token ID                    │
│     • Update badges collection                       │
│     • Show certificate/achievement                   │
└───────────────────────────────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                          │
│                                                             │
│  Layer 1: Input Validation                                 │
│  ┌───────────────────────────────────────────────────┐    │
│  │ • Type checking (strings, numbers)                │    │
│  │ • Format validation (Stellar keys)                │    │
│  │ • Range validation (0 ≤ score ≤ 100)             │    │
│  │ • Business rules (correct ≤ total)                │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
│  Layer 2: Rate Limiting                                    │
│  ┌───────────────────────────────────────────────────┐    │
│  │ • Per-user throttling                             │    │
│  │ • Per-endpoint limits                             │    │
│  │ • Configurable thresholds                         │    │
│  │ • 429 status on exceed                            │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
│  Layer 3: Duplicate Prevention                             │
│  ┌───────────────────────────────────────────────────┐    │
│  │ • Query contract state                            │    │
│  │ • Check before signing                            │    │
│  │ • Contract also validates                         │    │
│  │ • 409 status on duplicate                         │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
│  Layer 4: Transaction Simulation                           │
│  ┌───────────────────────────────────────────────────┐    │
│  │ • Validate before signing                         │    │
│  │ • Check contract acceptance                       │    │
│  │ • Verify account balances                         │    │
│  │ • Catch errors pre-submission                     │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
│  Layer 5: Secret Key Protection                            │
│  ┌───────────────────────────────────────────────────┐    │
│  │ • Server-side only storage                        │    │
│  │ • Never in client bundle                          │    │
│  │ • Environment variable isolation                  │    │
│  │ • .env in .gitignore                              │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Component Interaction Map

```
┌─────────────────────────────────────────────────────────────┐
│                 Frontend Components                         │
│                                                             │
│  QuizComponent.tsx                                          │
│       │                                                     │
│       ├─ Uses: api-client.ts                               │
│       ├─ Calls: rewardQuiz()                               │
│       └─ Updates: Progress context                         │
│                                                             │
│  BadgeComponent.tsx                                         │
│       │                                                     │
│       ├─ Uses: api-client.ts                               │
│       ├─ Calls: mintBadge()                                │
│       └─ Updates: Badges context                           │
│                                                             │
│  DashboardComponent.tsx                                     │
│       │                                                     │
│       ├─ Displays: XP balance (from stellar.ts)            │
│       ├─ Displays: Badge collection (from stellar.ts)      │
│       └─ Updates: On successful API calls                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                           │
                           │ Uses
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                 Utility Libraries                           │
│                                                             │
│  api-client.ts (NEW)                                        │
│       │                                                     │
│       ├─ Function: rewardQuiz()                            │
│       ├─ Function: mintBadge()                             │
│       └─ Returns: TypeScript typed responses               │
│                                                             │
│  stellar.ts (EXISTING)                                      │
│       │                                                     │
│       ├─ Function: getXPBalance()                          │
│       ├─ Function: hasBadge()                              │
│       ├─ Function: buildRewardQuizArgs()                   │
│       ├─ Function: buildMintBadgeArgs()                    │
│       └─ Used by: Backend API routes                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## File Dependencies

```
Frontend Components
        │
        ├─ Import: api-client.ts
        │          └─ Exports: rewardQuiz(), mintBadge()
        │
        └─ Import: stellar.ts
                   └─ Exports: getXPBalance(), hasBadge(), etc.

Backend API Routes
        │
        ├─ /api/reward-quiz/route.ts
        │          │
        │          ├─ Import: @stellar/stellar-sdk
        │          ├─ Import: stellar.ts (buildRewardQuizArgs, etc.)
        │          └─ Uses: process.env.ADMIN_SECRET_KEY
        │
        └─ /api/mint-badge/route.ts
                   │
                   ├─ Import: @stellar/stellar-sdk
                   ├─ Import: stellar.ts (buildMintBadgeArgs, etc.)
                   └─ Uses: process.env.ADMIN_SECRET_KEY

Environment Variables (.env)
        │
        ├─ ADMIN_SECRET_KEY (required)
        ├─ RATE_LIMIT_WINDOW_MS (optional)
        └─ RATE_LIMIT_MAX_REQUESTS (optional)
```

---

This architecture ensures:
- ✅ Secure admin key handling (server-side only)
- ✅ Proper separation of concerns (frontend/backend)
- ✅ Multiple security layers (validation, rate limiting, simulation)
- ✅ Type safety throughout (TypeScript)
- ✅ Clear error handling and user feedback
