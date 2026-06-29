# Security Guidelines

This document outlines security best practices for the DeFiWise backend API that handles admin-signed transactions.

## 🔐 Critical Security Rules

### 1. Admin Secret Key Protection

**NEVER:**
- ❌ Commit `.env` files to Git
- ❌ Include the secret key in client-side code
- ❌ Log the secret key or expose it in error messages
- ❌ Send the secret key in API responses
- ❌ Store the secret key in localStorage or cookies
- ❌ Share the secret key in chat, email, or documentation
- ❌ Include the secret key in frontend bundle

**ALWAYS:**
- ✅ Store the secret key in `.env` (local) or environment variables (production)
- ✅ Verify `.env` is in `.gitignore`
- ✅ Use different keys for development and production
- ✅ Rotate keys periodically (especially if compromised)
- ✅ Keep `.env.example` with placeholder values only
- ✅ Use Vercel's environment variable encryption in production

### 2. Environment Variable Security

**Local Development:**
```bash
# .env (NEVER commit this file)
ADMIN_SECRET_KEY=SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Production (Vercel):**
1. Go to Project Settings → Environment Variables
2. Add `ADMIN_SECRET_KEY` as a secret
3. Ensure it's marked as sensitive (hidden by default)
4. Use different keys per environment (Development, Preview, Production)

### 3. Input Validation

All API endpoints implement comprehensive validation:

✅ **Public Key Validation**
- Validates Stellar public key format
- Checks key starts with 'G' and is 56 characters
- Uses `StellarSdk.StrKey.decodeEd25519PublicKey()` for format verification

✅ **Type Validation**
- Verifies all required fields are present
- Checks types (string, number, etc.)
- Validates ranges (e.g., score 0-100, correct ≤ total)

✅ **Business Logic Validation**
- Checks challenge/module not already completed
- Validates XP amounts are positive
- Ensures sensible quiz scores

### 4. Rate Limiting

Current implementation:
- In-memory rate limiter per user
- Default: 10 requests per minute per endpoint
- Returns 429 status when exceeded

**For production**, use a distributed rate limiter:

```typescript
// Example with Upstash Redis
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
});

const { success } = await ratelimit.limit(userPublicKey);
if (!success) {
  return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
}
```

### 5. Transaction Security

✅ **Simulation Before Signing**
- All transactions are simulated before signing
- Catches errors before spending fees
- Validates contract state

✅ **Duplicate Prevention**
- Queries contract state before signing
- Prevents duplicate challenge completions
- Prevents duplicate badge minting

✅ **Transaction Monitoring**
- Polls for transaction completion (max 30 seconds)
- Returns transaction hash for tracking
- Logs failures for debugging

## 🛡️ API Endpoint Security

### /api/reward-quiz

**Validation Checks:**
1. ✅ User public key format
2. ✅ Challenge ID is not empty
3. ✅ correct ≤ total
4. ✅ maxXp > 0
5. ✅ Challenge not already completed
6. ✅ Rate limit not exceeded

**Security Flow:**
```
Request → Validate Input → Rate Check → Duplicate Check 
   → Build TX → Simulate → Sign → Submit → Poll → Response
```

### /api/mint-badge

**Validation Checks:**
1. ✅ User public key format
2. ✅ Module ID is not empty
3. ✅ Module title is not empty
4. ✅ xpEarned > 0
5. ✅ quizScore between 0-100
6. ✅ Badge not already minted for module
7. ✅ Rate limit not exceeded

**Security Flow:**
```
Request → Validate Input → Rate Check → Duplicate Check 
   → Build TX → Simulate → Sign → Submit → Poll → Response
```

## 🔍 Monitoring & Logging

### What to Log

**DO log:**
- ✅ Transaction hashes
- ✅ User public keys (these are public)
- ✅ Challenge/module IDs
- ✅ XP amounts and scores
- ✅ Error types and messages
- ✅ Rate limit violations
- ✅ Failed simulations

**DO NOT log:**
- ❌ Admin secret key
- ❌ Transaction signatures
- ❌ Any private keys
- ❌ User IP addresses (check GDPR compliance)

### Recommended Monitoring

```typescript
// Example: Track failed transactions
if (getResponse.status === "FAILED") {
  console.error("Transaction failed:", {
    hash: txHash,
    userPublicKey,
    challengeId,
    error: getResponse.resultXdr?.toString(),
  });
  
  // Send to monitoring service (Sentry, Datadog, etc.)
  Sentry.captureException(new Error("Transaction failed"), {
    tags: { txHash, userPublicKey },
  });
}
```

## 🚨 Incident Response

### If Secret Key is Compromised

1. **Immediate Actions:**
   - Generate a new admin keypair
   - Update environment variables everywhere
   - Redeploy all services

2. **Update Contracts:**
   - If contracts support admin transfer, call the admin transfer function
   - Otherwise, may need to redeploy contracts with new admin

3. **Notify Team:**
   - Document the incident
   - Review how the compromise occurred
   - Update security procedures

### If Rate Limiting Fails

1. Check logs for suspicious patterns
2. Temporarily reduce rate limits
3. Block suspicious user public keys if needed
4. Implement additional validation

### If Invalid Transactions Are Signed

1. Investigate how validation was bypassed
2. Review validation logic
3. Add additional checks
4. Consider reverting affected transactions (if contract supports it)

## ✅ Pre-Deployment Checklist

Before deploying to production:

- [ ] `.env` is in `.gitignore` and not committed
- [ ] `ADMIN_SECRET_KEY` is set in Vercel environment variables
- [ ] Secret key is different from development key
- [ ] Rate limiting is configured appropriately
- [ ] Error messages don't leak sensitive information
- [ ] Transaction simulation is working
- [ ] Duplicate prevention is working
- [ ] Input validation tests pass
- [ ] Admin account has sufficient XLM balance
- [ ] Monitoring/logging is set up
- [ ] Error tracking is configured (Sentry, etc.)
- [ ] API endpoints are tested with invalid inputs
- [ ] CORS is configured correctly (if needed)

## 🔐 Additional Security Recommendations

### 1. Multi-Signature (Advanced)

For high-value operations, consider multi-signature:

```rust
// Contract example
pub fn reward_quiz(
    env: Env,
    user: Address,
    // ... other params
    admin_signatures: Vec<Signature>
) {
    // Require N of M admin signatures
    require_multi_sig(&env, &admin_signatures, 2, 3);
    // ... rest of logic
}
```

### 2. Challenge Validation (Advanced)

Validate quiz answers server-side:

```typescript
// Store correct answers server-side
const QUIZ_ANSWERS = {
  "defi-basics-01": ["B", "A", "C", "D", ...],
};

// Validate before signing
export async function POST(request: NextRequest) {
  const { challengeId, userAnswers } = await request.json();
  
  const correctAnswers = QUIZ_ANSWERS[challengeId];
  if (!correctAnswers) {
    return NextResponse.json({ error: "Invalid challenge" }, { status: 400 });
  }
  
  const correct = userAnswers.filter((ans, i) => ans === correctAnswers[i]).length;
  const total = correctAnswers.length;
  
  // Now sign transaction with verified score
  // ...
}
```

### 3. IP-Based Rate Limiting

Add IP-based rate limiting in addition to user-based:

```typescript
import { NextRequest } from "next/server";

function getRealIP(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0] || 
         request.headers.get("x-real-ip") || 
         "unknown";
}

// Rate limit by IP
const ip = getRealIP(request);
if (!checkRateLimit(`ip:${ip}`)) {
  return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
}
```

### 4. Request Signing (Advanced)

Have the frontend sign requests with the user's wallet:

```typescript
// Frontend
const message = JSON.stringify({ challengeId, timestamp: Date.now() });
const signature = await walletSign(message);

await fetch("/api/reward-quiz", {
  body: JSON.stringify({
    userPublicKey,
    challengeId,
    signature,
    // ... other params
  }),
});

// Backend
// Verify the signature matches the user's public key
```

### 5. Admin Account Monitoring

Monitor admin account balance:

```typescript
// Regular check (cron job or monitoring)
const adminBalance = await server.getAccount(adminPublicKey);
const xlmBalance = Number(adminBalance.balances[0].balance);

if (xlmBalance < 1000) {
  // Alert: Low balance
  console.warn("Admin account low on XLM:", xlmBalance);
  // Send alert to team
}
```

## 📚 Resources

- [Stellar Security Best Practices](https://developers.stellar.org/docs/security)
- [Soroban Security](https://soroban.stellar.org/docs/security)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)

## 🤝 Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email the team privately: security@defiwise.example (update with real email)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and coordinate disclosure.

---

**Remember:** Security is an ongoing process, not a one-time setup. Regularly review and update security measures as the project evolves.
