# Backend Setup Guide

This guide will help you set up the backend API routes that handle admin-signed transactions for DeFiWise.

## Why Do We Need a Backend?

The DeFiWise smart contracts require admin authorization for:
- **`reward_quiz`** - Awarding XP tokens to users
- **`mint_badge`** - Minting NFT badges for module completion

These functions check for `admin.require_auth()` in the contract code, meaning only the admin can sign these transactions. Since a regular user's wallet cannot provide the admin's signature, we need a backend service to sign these transactions.

## Architecture Overview

```
User Wallet → Frontend → Backend API → Smart Contract
                            ↓
                    Admin Private Key
                    (Signs Transaction)
```

## Step 1: Get Your Admin Secret Key

1. The admin public key is already defined in `src/lib/stellar.ts`:
   ```typescript
   export const ADMIN_PUBLIC_KEY = "GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC";
   ```

2. You need the **secret key** (private key) for this account. If you don't have it:
   - If this is a test account, you can generate a new keypair:
     ```javascript
     import * as StellarSdk from "@stellar/stellar-sdk";
     const pair = StellarSdk.Keypair.random();
     console.log("Public:", pair.publicKey());
     console.log("Secret:", pair.secret());
     ```
   - Update the `ADMIN_PUBLIC_KEY` in `src/lib/stellar.ts` with your new public key
   - Use the secret key in the next step

3. **Important**: The secret key starts with `S` (e.g., `SXXXXX...`)

## Step 2: Create Environment File

1. Copy the example environment file:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env` and add your admin secret key:
   ```bash
   NODE_ENV=development

   # CRITICAL: Keep this secret! Never commit to git!
   ADMIN_SECRET_KEY=SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

   # Optional: Rate limiting (defaults shown)
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=10
   ```

3. Verify `.env` is in `.gitignore` (it already is by default)

## Step 3: Fund the Admin Account (Testnet)

The admin account needs XLM for transaction fees:

1. Visit the Stellar testnet friendbot:
   ```
   https://friendbot.stellar.org?addr=YOUR_ADMIN_PUBLIC_KEY
   ```

2. Replace `YOUR_ADMIN_PUBLIC_KEY` with your admin public key

3. You should receive 10,000 test XLM

## Step 4: Verify Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Test the endpoints using curl or Postman:

   **Test reward-quiz:**
   ```bash
   curl -X POST http://localhost:3000/api/reward-quiz ^
     -H "Content-Type: application/json" ^
     -d "{\"userPublicKey\":\"GXXXXXX...\",\"challengeId\":\"test-01\",\"correct\":8,\"total\":10,\"maxXp\":100}"
   ```

   **Test mint-badge:**
   ```bash
   curl -X POST http://localhost:3000/api/mint-badge ^
     -H "Content-Type: application/json" ^
     -d "{\"userPublicKey\":\"GXXXXXX...\",\"moduleId\":\"test-module\",\"moduleTitle\":\"Test\",\"xpEarned\":100,\"quizScore\":80}"
   ```

3. Replace `GXXXXXX...` with a valid testnet user public key

## Step 5: Integrate into Frontend

Use the provided client utilities in your components:

```typescript
import { rewardQuiz, mintBadge } from "@/lib/api-client";

// Award XP for quiz completion
const result = await rewardQuiz({
  userPublicKey: user.publicKey,
  challengeId: "quiz-01",
  correct: 8,
  total: 10,
  maxXp: 100,
});

// Mint badge for module completion
const badge = await mintBadge({
  userPublicKey: user.publicKey,
  moduleId: "module-01",
  moduleTitle: "DeFi Basics",
  xpEarned: 250,
  quizScore: 85,
});
```

See `src/components/examples/QuizCompletionExample.tsx` for a complete example.

## Step 6: Deploy to Production (Vercel)

### 6.1 Push to GitHub

```bash
git add .
git commit -m "Add backend API routes"
git push
```

### 6.2 Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Add environment variables:
   - Click "Environment Variables"
   - Add `ADMIN_SECRET_KEY` with your secret key
   - Add `RATE_LIMIT_WINDOW_MS` (optional, default: 60000)
   - Add `RATE_LIMIT_MAX_REQUESTS` (optional, default: 10)
5. Click "Deploy"

### 6.3 Verify Production Deployment

Test the production endpoints:

```bash
curl -X POST https://your-app.vercel.app/api/reward-quiz ^
  -H "Content-Type: application/json" ^
  -d "{\"userPublicKey\":\"GXXXXXX...\",\"challengeId\":\"test-01\",\"correct\":8,\"total\":10,\"maxXp\":100}"
```

## Security Checklist

- [ ] `.env` file is in `.gitignore` and never committed
- [ ] `ADMIN_SECRET_KEY` is only in environment variables
- [ ] Secret key is not in any client-side code
- [ ] Secret key is not logged or displayed
- [ ] Production environment variables are set in Vercel dashboard
- [ ] Rate limiting is enabled
- [ ] Input validation is working (test with invalid data)

## Troubleshooting

### Error: "ADMIN_SECRET_KEY not configured"
- Make sure `.env` file exists and contains `ADMIN_SECRET_KEY=S...`
- Restart the dev server after creating `.env`
- In production, check Vercel environment variables

### Error: "Invalid Stellar public key format"
- Ensure the user public key starts with `G`
- Verify it's a valid Stellar public key (56 characters)

### Error: "Simulation failed"
- Verify the admin account has enough XLM for fees
- Check that the contract addresses in `src/lib/stellar.ts` are correct
- Ensure the contracts are initialized with the correct admin

### Error: "Challenge already completed"
- This is expected if testing with the same challengeId twice
- Use a unique challengeId for each test
- The contract prevents duplicate rewards (this is correct behavior)

### Error: "Rate limit exceeded"
- Wait 1 minute and try again
- Increase `RATE_LIMIT_MAX_REQUESTS` in `.env` for testing
- Consider implementing a proper rate limiter for production

### Transaction timeout
- Stellar testnet can be slow sometimes
- The API waits up to 30 seconds
- If timeout occurs, check the transaction on Stellar Expert

## API Endpoints Reference

### POST /api/reward-quiz
Awards XP tokens for quiz completion.

**Request:**
```json
{
  "userPublicKey": "GXXXXXX...",
  "challengeId": "unique-challenge-id",
  "correct": 8,
  "total": 10,
  "maxXp": 100
}
```

**Response:**
```json
{
  "success": true,
  "hash": "transaction-hash",
  "xpRewarded": 80,
  "message": "Successfully rewarded 80 XP..."
}
```

### POST /api/mint-badge
Mints an NFT badge for module completion.

**Request:**
```json
{
  "userPublicKey": "GXXXXXX...",
  "moduleId": "unique-module-id",
  "moduleTitle": "DeFi Fundamentals",
  "xpEarned": 250,
  "quizScore": 85
}
```

**Response:**
```json
{
  "success": true,
  "hash": "transaction-hash",
  "tokenId": 1,
  "message": "Successfully minted badge..."
}
```

## Advanced Topics

### Custom Rate Limiting
For production, consider using Redis:

```typescript
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function checkRateLimit(key: string): Promise<boolean> {
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, 60); // 60 seconds
  }
  return count <= 10; // max 10 requests per minute
}
```

### Transaction Logging
Add database logging for auditing:

```typescript
// After successful transaction
await db.transaction.create({
  hash: txHash,
  userPublicKey,
  type: "REWARD_QUIZ",
  challengeId,
  xpRewarded,
  timestamp: new Date(),
});
```

### Monitoring
Set up alerts for:
- Failed transactions
- Rate limit violations
- High transaction fees
- Low admin account balance

## Support & Resources

- **API Documentation**: See `src/app/api/README.md`
- **Example Component**: See `src/components/examples/QuizCompletionExample.tsx`
- **Stellar Docs**: https://developers.stellar.org/
- **Soroban Docs**: https://soroban.stellar.org/
- **Next.js API Routes**: https://nextjs.org/docs/api-routes/introduction

## Next Steps

1. ✅ Set up environment variables
2. ✅ Test endpoints locally
3. ✅ Integrate into frontend components
4. ✅ Deploy to Vercel
5. ✅ Test production endpoints
6. 🎯 Add monitoring and logging
7. 🎯 Implement persistent rate limiting
8. 🎯 Add admin dashboard for monitoring
