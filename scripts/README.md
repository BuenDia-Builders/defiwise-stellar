# Scripts

Utility scripts for testing and development.

## test-backend.js

Automated test suite for the backend API endpoints.

### Usage

```bash
node scripts/test-backend.js
```

### Prerequisites

1. `.env` file must be configured with `ADMIN_SECRET_KEY`
2. Development server must be running (`npm run dev`)
3. Admin account must have testnet XLM

### What It Tests

- ✅ Input validation (invalid/missing fields)
- ✅ Reward quiz endpoint (`/api/reward-quiz`)
- ✅ Mint badge endpoint (`/api/mint-badge`)
- ✅ Duplicate prevention
- ✅ Error handling

### Configuration

Update these variables in the script if needed:

```javascript
const TEST_USER_PUBLIC_KEY = "GXXXXX...";  // Test user's public key
const BASE_URL = "http://localhost:3000";  // API base URL
```

### Expected Output

```
🚀 DeFiWise Backend API Test Suite
=====================================
Testing against: http://localhost:3000
Test user: GXXXXX...

🧪 Testing input validation...
✅ Correctly rejected missing userPublicKey
✅ Correctly rejected invalid public key

🧪 Testing /api/reward-quiz...
✅ Success!
   Transaction Hash: abc123...
   XP Rewarded: 80
   Message: Successfully rewarded 80 XP...

🧪 Testing /api/mint-badge...
✅ Success!
   Transaction Hash: def456...
   Token ID: 1
   Message: Successfully minted badge...

🧪 Testing duplicate prevention...
✅ First call succeeded
✅ Correctly prevented duplicate challenge completion

=====================================
✨ Test suite completed!
```

### Troubleshooting

**Error: "fetch failed" or "ECONNREFUSED"**
- Make sure dev server is running: `npm run dev`

**Error: "ADMIN_SECRET_KEY not configured"**
- Create `.env` file with `ADMIN_SECRET_KEY=S...`
- Restart dev server after creating `.env`

**Error: "Simulation failed"**
- Fund admin account at https://friendbot.stellar.org
- Verify contracts are initialized
- Check admin public key matches in `src/lib/stellar.ts`

**All tests fail**
- Check that contracts are deployed and initialized
- Verify admin account has XLM
- Confirm network connectivity

### Adding New Tests

To add a new test:

```javascript
async function testMyNewFeature() {
  console.log("\n🧪 Testing my new feature...");
  
  const response = await fetch(`${BASE_URL}/api/my-endpoint`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ /* test data */ }),
  });
  
  const data = await response.json();
  
  if (response.ok) {
    console.log("✅ Success!");
    console.log("   Result:", data);
  } else {
    console.log("❌ Failed!");
    console.log("   Error:", data.error);
  }
  
  return response.ok;
}

// Then add to runTests():
async function runTests() {
  // ... existing tests
  await testMyNewFeature();
}
```

### Notes

- Each test uses unique IDs (timestamp-based) to avoid duplicate errors
- Some tests may take 3-5 seconds each (waiting for network confirmation)
- Tests are safe to run multiple times
- No destructive operations are performed

---

For more information, see [BACKEND_SETUP.md](../BACKEND_SETUP.md) or [src/app/api/README.md](../src/app/api/README.md).
