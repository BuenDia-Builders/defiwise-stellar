# Quick Start Guide

Get DeFiWise backend up and running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- A Stellar Testnet account with XLM (for admin)

## 1. Clone & Install (1 min)

```bash
cd defiwise-stellar
npm install
```

## 2. Set Up Environment (2 min)

```bash
# Copy example env file
copy .env.example .env
```

Edit `.env` and add your admin secret key:

```bash
ADMIN_SECRET_KEY=SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Don't have an admin key?** Generate one:

```javascript
// Run this in browser console or Node
import * as StellarSdk from "@stellar/stellar-sdk";
const pair = StellarSdk.Keypair.random();
console.log("Public:", pair.publicKey());
console.log("Secret:", pair.secret());
```

Then:
1. Fund the public key at: https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY
2. Update `ADMIN_PUBLIC_KEY` in `src/lib/stellar.ts` with your public key
3. Use the secret key in `.env`

## 3. Start Development Server (30 sec)

```bash
npm run dev
```

Server runs at http://localhost:3000

## 4. Test Backend APIs (1 min)

```bash
node scripts/test-backend.js
```

You should see:
```
✅ Success! Transaction Hash: abc123...
✅ Success! Token ID: 1
```

## 5. Integrate in Frontend (30 sec)

```typescript
import { rewardQuiz, mintBadge } from "@/lib/api-client";

// Award XP
const result = await rewardQuiz({
  userPublicKey: user.publicKey,
  challengeId: "quiz-01",
  correct: 8,
  total: 10,
  maxXp: 100,
});

// Mint badge
const badge = await mintBadge({
  userPublicKey: user.publicKey,
  moduleId: "module-01",
  moduleTitle: "DeFi Basics",
  xpEarned: 250,
  quizScore: 85,
});
```

## 🎉 You're Ready!

The backend is now handling admin-signed transactions for:
- ✅ Rewarding XP for quiz completion
- ✅ Minting NFT badges for module completion

## Next Steps

- 📖 Read [BACKEND_SETUP.md](./BACKEND_SETUP.md) for detailed setup
- 📖 Check [src/app/api/README.md](./src/app/api/README.md) for API docs
- 🔐 Review [SECURITY.md](./SECURITY.md) for security best practices
- 🎨 See [src/components/examples/QuizCompletionExample.tsx](./src/components/examples/QuizCompletionExample.tsx) for UI integration

## Common Issues

### "ADMIN_SECRET_KEY not configured"
- Make sure `.env` file exists in project root
- Restart dev server after creating `.env`

### "Simulation failed"
- Admin account needs XLM for fees
- Visit friendbot: https://friendbot.stellar.org?addr=YOUR_ADMIN_PUBLIC_KEY

### "Invalid Stellar public key format"
- Public key must start with 'G' and be 56 characters
- Secret key starts with 'S' (don't confuse them!)

### "Challenge already completed"
- Use a unique challengeId for each test
- This is expected behavior (prevents duplicates)

## Deployment to Vercel

```bash
# Push to GitHub
git add .
git commit -m "Add backend"
git push

# Deploy on Vercel
# 1. Import repo on vercel.com
# 2. Add ADMIN_SECRET_KEY in Environment Variables
# 3. Deploy!
```

## Help

- Questions? Check the [full documentation](./BACKEND_SETUP.md)
- Issues? Review [SECURITY.md](./SECURITY.md)
- Example code? See [src/components/examples/](./src/components/examples/)

---

**Pro Tip:** Keep your `.env` file secure and NEVER commit it to Git! ✨
