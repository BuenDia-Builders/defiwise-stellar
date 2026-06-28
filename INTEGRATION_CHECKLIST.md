# Integration Checklist

Use this checklist to integrate the backend API into your existing frontend components.

## Phase 1: Setup & Configuration ⚙️

### Environment Setup
- [ ] Copy `.env.example` to `.env`
- [ ] Generate or obtain admin Stellar keypair
- [ ] Add `ADMIN_SECRET_KEY` to `.env`
- [ ] Update `ADMIN_PUBLIC_KEY` in `src/lib/stellar.ts` if using new keypair
- [ ] Verify `.env` is in `.gitignore`
- [ ] Fund admin account on testnet (https://friendbot.stellar.org)

### Verify Setup
- [ ] Start dev server (`npm run dev`)
- [ ] Run test suite (`node scripts/test-backend.js`)
- [ ] All tests pass successfully
- [ ] No errors in console

## Phase 2: Frontend Integration 🔌

### Update Quiz Components

Find where quizzes are completed and results are shown:

- [ ] Import API client:
  ```typescript
  import { rewardQuiz } from "@/lib/api-client";
  ```

- [ ] Replace any direct contract calls with API call:
  ```typescript
  // OLD: Direct contract call (doesn't work - needs admin signature)
  // await contract.reward_quiz(...)
  
  // NEW: Backend API call
  const result = await rewardQuiz({
    userPublicKey: wallet.publicKey,
    challengeId: quizId,
    correct: correctAnswers,
    total: totalQuestions,
    maxXp: maxPossibleXp,
  });
  ```

- [ ] Add loading state during API call
- [ ] Show success message with XP earned
- [ ] Handle errors gracefully
- [ ] Update local state/context with new XP
- [ ] Refresh user progress display

### Update Module Completion Components

Find where modules are marked as complete:

- [ ] Import API client:
  ```typescript
  import { mintBadge } from "@/lib/api-client";
  ```

- [ ] Replace any direct contract calls with API call:
  ```typescript
  // OLD: Direct contract call (doesn't work - needs admin signature)
  // await contract.mint_badge(...)
  
  // NEW: Backend API call
  const result = await mintBadge({
    userPublicKey: wallet.publicKey,
    moduleId: module.id,
    moduleTitle: module.title,
    xpEarned: totalXpForModule,
    quizScore: finalScore,
  });
  ```

- [ ] Add loading state during API call
- [ ] Show success animation/modal for badge
- [ ] Display token ID if available
- [ ] Handle errors gracefully
- [ ] Update local state/context with new badge
- [ ] Refresh badges collection display

### Update Progress Tracking

- [ ] Ensure progress updates after successful rewards
- [ ] Refresh XP balance display
- [ ] Update progress bars/indicators
- [ ] Refresh badges/achievements list
- [ ] Update user profile/dashboard

## Phase 3: User Experience 🎨

### Loading States
- [ ] Show loading spinner during API calls
- [ ] Disable buttons while processing
- [ ] Show progress message ("Signing transaction...", "Confirming...")

### Success Feedback
- [ ] Toast notification for successful XP reward
- [ ] Toast notification for successful badge mint
- [ ] Celebration animation for achievements
- [ ] Update UI immediately with new values

### Error Handling
- [ ] Show user-friendly error messages
- [ ] Handle "already completed" gracefully
- [ ] Handle rate limiting with retry message
- [ ] Handle network errors with retry option
- [ ] Log errors for debugging

### Example Error Handling:
```typescript
try {
  const result = await rewardQuiz({ /* ... */ });
  toast.success(`🎉 Earned ${result.xpRewarded} XP!`);
} catch (error) {
  const message = error.message;
  
  if (message.includes("already completed")) {
    toast.info("You've already completed this quiz!");
  } else if (message.includes("Rate limit")) {
    toast.error("Please wait a moment before trying again.");
  } else {
    toast.error("Failed to reward XP. Please try again.");
    console.error(error);
  }
}
```

## Phase 4: Testing 🧪

### Local Testing
- [ ] Test quiz completion flow end-to-end
- [ ] Test module completion flow end-to-end
- [ ] Test with different user wallets
- [ ] Test duplicate prevention (complete same quiz twice)
- [ ] Test error scenarios (invalid inputs)
- [ ] Test rate limiting (rapid requests)
- [ ] Verify XP updates correctly
- [ ] Verify badges display correctly

### Cross-Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

### Wallet Testing
- [ ] Freighter wallet
- [ ] Multiple accounts
- [ ] New users (no prior XP/badges)
- [ ] Users with existing XP/badges

## Phase 5: Production Deployment 🚀

### Vercel Setup
- [ ] Push code to GitHub
- [ ] Connect repository to Vercel
- [ ] Add `ADMIN_SECRET_KEY` environment variable
- [ ] Add optional rate limit env vars
- [ ] Deploy to production
- [ ] Verify environment variables are set

### Post-Deployment
- [ ] Test production endpoints
- [ ] Verify admin secret is secure
- [ ] Monitor first few transactions
- [ ] Check logs for errors
- [ ] Verify XP rewards on explorer
- [ ] Verify badge mints on explorer

### Monitoring Setup
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Set up uptime monitoring
- [ ] Configure alerts for failures
- [ ] Monitor admin account balance
- [ ] Track API usage/metrics

## Phase 6: Documentation 📚

### For Your Team
- [ ] Document how quiz rewards work
- [ ] Document how badge minting works
- [ ] Share API endpoint details
- [ ] Document error codes and meanings
- [ ] Share admin account management process

### For Users
- [ ] Update help/FAQ with XP info
- [ ] Explain badge system
- [ ] Document achievement criteria
- [ ] Provide transaction tracking info

## Phase 7: Security Review 🔐

### Pre-Launch Security Check
- [ ] `.env` is in `.gitignore` ✅
- [ ] No secrets in client code ✅
- [ ] Rate limiting is active ✅
- [ ] Input validation is working ✅
- [ ] Duplicate prevention is working ✅
- [ ] Admin key is secured in Vercel ✅
- [ ] Error messages don't leak sensitive info ✅
- [ ] Transaction simulation is working ✅

### Review
- [ ] Read [SECURITY.md](./SECURITY.md)
- [ ] Verify all security recommendations
- [ ] Set up incident response plan
- [ ] Document admin key rotation process

## Common Integration Points

### Where to Integrate `rewardQuiz()`

Look for files/components related to:
- Quiz completion handlers
- Quiz result displays
- Submit quiz buttons
- Score calculation
- Quiz progress tracking

Example locations:
- `src/app/dashboard/*/quiz/page.tsx`
- `src/components/quiz/*`
- `src/hooks/useQuiz.ts`

### Where to Integrate `mintBadge()`

Look for files/components related to:
- Module completion
- Final quiz results
- Achievement unlocks
- Certificate generation
- Module progress tracking

Example locations:
- `src/app/dashboard/*/complete/page.tsx`
- `src/components/badges/*`
- `src/hooks/useModuleProgress.ts`

## Troubleshooting Common Issues

### Issue: "ADMIN_SECRET_KEY not configured"
**Solution**: 
1. Ensure `.env` file exists
2. Check `ADMIN_SECRET_KEY=S...` is present
3. Restart dev server

### Issue: "Challenge already completed"
**Solution**: 
- This is expected behavior (prevents duplicates)
- Use unique challengeId for each test
- Clear contract state or use different user for testing

### Issue: "Simulation failed"
**Solution**:
1. Check admin account has XLM
2. Verify contract addresses are correct
3. Ensure contracts are initialized
4. Check admin public key matches

### Issue: API returns 429 (Rate Limited)
**Solution**:
- Wait 1 minute
- Increase `RATE_LIMIT_MAX_REQUESTS` in `.env` for testing
- Implement proper rate limiter for production

### Issue: Transaction timeout
**Solution**:
- Stellar testnet can be slow
- Transaction may still succeed - check hash on explorer
- Increase timeout in route files if needed

## Useful Commands

```bash
# Start dev server
npm run dev

# Test backend
node scripts/test-backend.js

# Test specific endpoint with curl
curl -X POST http://localhost:3000/api/reward-quiz \
  -H "Content-Type: application/json" \
  -d '{"userPublicKey":"G...","challengeId":"test","correct":8,"total":10,"maxXp":100}'

# View logs (in dev)
# Check terminal where npm run dev is running

# Deploy to Vercel
git push  # Auto-deploys if connected
```

## Resources

- **Setup Guide**: [BACKEND_SETUP.md](./BACKEND_SETUP.md)
- **API Docs**: [src/app/api/README.md](./src/app/api/README.md)
- **Security**: [SECURITY.md](./SECURITY.md)
- **Quick Start**: [QUICK_START.md](./QUICK_START.md)
- **Example**: [src/components/examples/QuizCompletionExample.tsx](./src/components/examples/QuizCompletionExample.tsx)
- **Summary**: [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

## Final Checklist

Before marking complete:

- [ ] All Phase 1 items complete (Setup)
- [ ] All Phase 2 items complete (Integration)
- [ ] All Phase 3 items complete (UX)
- [ ] All Phase 4 items complete (Testing)
- [ ] All Phase 5 items complete (Deployment)
- [ ] All Phase 6 items complete (Documentation)
- [ ] All Phase 7 items complete (Security)

## 🎉 Integration Complete!

Once all items are checked, your backend integration is complete and users can:
- ✅ Earn XP for completing quizzes
- ✅ Receive NFT badges for completing modules
- ✅ Track their progress on-chain
- ✅ View their achievements

---

**Need Help?** Review the documentation files or check the example component for reference implementations.
