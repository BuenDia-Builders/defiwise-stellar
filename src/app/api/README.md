# DeFiWise Backend API Routes

This directory contains Next.js API routes that handle admin-signed transactions for the DeFiWise Stellar smart contracts.

## Overview

The smart contracts (`XP Token` and `Badge NFT`) require admin authorization for certain operations:
- `reward_quiz` - Awards XP to users for completing quizzes
- `mint_badge` - Mints NFT badges for completing modules

Since these functions require the admin's signature, they cannot be called directly from a user's wallet. These API routes act as a secure backend that signs transactions with the admin private key.

## Security Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────────┐
│   Frontend  │────────>│  API Routes  │────────>│ Stellar Testnet │
│ (User Auth) │ Request │ (Admin Sig)  │  Signed │   (Contracts)   │
└─────────────┘         └──────────────┘    TX   └─────────────────┘
                              │
                              │ Uses
                              ▼
                        ┌─────────────┐
                        │ Admin Secret│
                        │ (Env Var)   │
                        └─────────────┘
```

### Security Features

1. **Secret Key Protection**: Admin private key is stored server-side only in environment variables
2. **Input Validation**: All requests are validated before signing
3. **Duplicate Prevention**: Checks if challenge/badge already exists before signing
4. **Rate Limiting**: Per-user rate limiting to prevent abuse
5. **Stellar Key Validation**: Validates public key format before processing

## API Endpoints

### POST /api/reward-quiz

Awards XP tokens to a user for completing a quiz challenge.

**Request Body:**
```typescript
{
  userPublicKey: string;    // User's Stellar public key
  challengeId: string;      // Unique challenge identifier
  correct: number;          // Number of correct answers
  total: number;            // Total number of questions
  maxXp: number;            // Maximum XP available for perfect score
}
```

**Response (Success):**
```typescript
{
  success: true,
  hash: string;            // Transaction hash
  xpRewarded: number;      // Actual XP awarded (proportional to score)
  message: string;         // Success message
}
```

**Response (Error):**
```typescript
{
  error: string;           // Error type
  message?: string;        // Error message
  details?: string;        // Additional details
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request or transaction failed
- `409` - Challenge already completed
- `429` - Rate limit exceeded
- `500` - Server error

---

### POST /api/mint-badge

Mints an NFT badge for completing a module.

**Request Body:**
```typescript
{
  userPublicKey: string;    // User's Stellar public key
  moduleId: string;         // Unique module identifier
  moduleTitle: string;      // Module display name
  xpEarned: number;         // XP earned in this module
  quizScore: number;        // Quiz score (0-100)
}
```

**Response (Success):**
```typescript
{
  success: true,
  hash: string;            // Transaction hash
  tokenId?: number;        // NFT token ID (if extracted)
  message: string;         // Success message
}
```

**Response (Error):**
```typescript
{
  error: string;           // Error type
  message?: string;        // Error message
  details?: string;        // Additional details
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request or transaction failed
- `409` - Badge already minted for this module
- `429` - Rate limit exceeded
- `500` - Server error

## Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Required: Admin secret key for signing transactions
ADMIN_SECRET_KEY=S...YOUR_SECRET_KEY_HERE...

# Optional: Rate limiting configuration
RATE_LIMIT_WINDOW_MS=60000        # Time window in milliseconds (default: 60000 = 1 minute)
RATE_LIMIT_MAX_REQUESTS=10        # Max requests per window (default: 10)
```

### Getting the Admin Secret Key

1. The admin public key is defined in `src/lib/stellar.ts` as `ADMIN_PUBLIC_KEY`
2. You need the corresponding private/secret key for that account
3. **NEVER commit the `.env` file to version control**
4. Store the secret key securely (use environment variables in Vercel/production)

## Client Usage

Use the type-safe client utilities in `src/lib/api-client.ts`:

```typescript
import { rewardQuiz, mintBadge } from "@/lib/api-client";
import toast from "react-hot-toast";

// Example: Reward quiz completion
async function handleQuizComplete() {
  try {
    const result = await rewardQuiz({
      userPublicKey: userWallet.publicKey,
      challengeId: "defi-basics-01",
      correct: 8,
      total: 10,
      maxXp: 100,
    });
    
    toast.success(`Earned ${result.xpRewarded} XP!`);
    console.log("Transaction hash:", result.hash);
  } catch (error) {
    toast.error(error.message);
  }
}

// Example: Mint badge for module completion
async function handleModuleComplete() {
  try {
    const result = await mintBadge({
      userPublicKey: userWallet.publicKey,
      moduleId: "module-fundamentals",
      moduleTitle: "DeFi Fundamentals",
      xpEarned: 250,
      quizScore: 85,
    });
    
    toast.success(`Badge minted! Token ID: ${result.tokenId}`);
    console.log("Transaction hash:", result.hash);
  } catch (error) {
    toast.error(error.message);
  }
}
```

## Rate Limiting

The API implements in-memory rate limiting per user:
- Default: 10 requests per minute per endpoint per user
- Configurable via environment variables
- **Production recommendation**: Use Redis or a distributed rate limiter

## Error Handling

The API routes include comprehensive error handling:

1. **Input Validation**: Invalid request parameters return 400
2. **Duplicate Detection**: Already completed challenges/badges return 409
3. **Rate Limiting**: Too many requests return 429
4. **Simulation Errors**: Contract simulation failures return 400 with details
5. **Transaction Failures**: On-chain failures return 400 with transaction hash
6. **Server Errors**: Unexpected errors return 500

## Testing

### Local Testing

1. Set up your `.env` file with a testnet admin secret key
2. Start the dev server: `npm run dev`
3. Test the endpoints using curl or a REST client:

```bash
# Test reward-quiz endpoint
curl -X POST http://localhost:3000/api/reward-quiz \
  -H "Content-Type: application/json" \
  -d '{
    "userPublicKey": "GXXXXXX...",
    "challengeId": "test-quiz-01",
    "correct": 8,
    "total": 10,
    "maxXp": 100
  }'

# Test mint-badge endpoint
curl -X POST http://localhost:3000/api/mint-badge \
  -H "Content-Type: application/json" \
  -d '{
    "userPublicKey": "GXXXXXX...",
    "moduleId": "test-module",
    "moduleTitle": "Test Module",
    "xpEarned": 100,
    "quizScore": 80
  }'
```

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect to Vercel
3. Add environment variables in Vercel dashboard:
   - `ADMIN_SECRET_KEY` - Your admin secret key
   - `RATE_LIMIT_WINDOW_MS` - (optional) Rate limit window
   - `RATE_LIMIT_MAX_REQUESTS` - (optional) Max requests per window
4. Deploy

### Environment Variables in Production

**Critical**: Never expose `ADMIN_SECRET_KEY` in:
- Client-side code
- Git repositories
- Logs or error messages
- Frontend bundles

Vercel automatically keeps server-side environment variables secure and excludes them from the client bundle.

## Monitoring

Consider adding:
- Transaction logging for auditing
- Error tracking (Sentry, etc.)
- Performance monitoring
- Rate limit metrics
- Failed transaction alerts

## Future Improvements

1. **Persistent Rate Limiting**: Replace in-memory store with Redis
2. **Database Logging**: Track all transactions in a database
3. **Webhook Notifications**: Notify users of completed transactions
4. **Admin Dashboard**: UI for monitoring transactions
5. **Multi-signature**: Require multiple admin signatures for high-value operations
6. **Challenge Validation**: Verify quiz answers server-side before signing
7. **Gas Fee Optimization**: Batch multiple operations
8. **Retry Logic**: Automatic retry for failed transactions

## Support

For issues or questions, refer to:
- Stellar SDK documentation: https://developers.stellar.org/
- Soroban smart contracts: https://soroban.stellar.org/
- Next.js API routes: https://nextjs.org/docs/api-routes/introduction
