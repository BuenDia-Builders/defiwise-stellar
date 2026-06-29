/**
 * Simple test script for backend API endpoints
 * 
 * Usage:
 *   node scripts/test-backend.js
 * 
 * Make sure:
 * 1. Your .env file is set up with ADMIN_SECRET_KEY
 * 2. The dev server is running (npm run dev)
 * 3. Update TEST_USER_PUBLIC_KEY below with a valid testnet address
 */

const TEST_USER_PUBLIC_KEY = "GASHSELFFKPP5BTMD73FBODXO65MLGP4JCRIXQNEM3RYCWMRKSGOUVHC";
const BASE_URL = "http://localhost:3000";

async function testRewardQuiz() {
  console.log("\n🧪 Testing /api/reward-quiz...");
  
  const challengeId = `test-challenge-${Date.now()}`; // Unique ID to avoid duplicates
  
  const response = await fetch(`${BASE_URL}/api/reward-quiz`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userPublicKey: TEST_USER_PUBLIC_KEY,
      challengeId: challengeId,
      correct: 8,
      total: 10,
      maxXp: 100,
    }),
  });

  const data = await response.json();
  
  if (response.ok) {
    console.log("✅ Success!");
    console.log("   Transaction Hash:", data.hash);
    console.log("   XP Rewarded:", data.xpRewarded);
    console.log("   Message:", data.message);
  } else {
    console.log("❌ Failed!");
    console.log("   Status:", response.status);
    console.log("   Error:", data.error);
    console.log("   Message:", data.message);
  }
  
  return response.ok;
}

async function testMintBadge() {
  console.log("\n🧪 Testing /api/mint-badge...");
  
  const moduleId = `test-module-${Date.now()}`; // Unique ID to avoid duplicates
  
  const response = await fetch(`${BASE_URL}/api/mint-badge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userPublicKey: TEST_USER_PUBLIC_KEY,
      moduleId: moduleId,
      moduleTitle: "Test Module",
      xpEarned: 100,
      quizScore: 80,
    }),
  });

  const data = await response.json();
  
  if (response.ok) {
    console.log("✅ Success!");
    console.log("   Transaction Hash:", data.hash);
    console.log("   Token ID:", data.tokenId || "N/A");
    console.log("   Message:", data.message);
  } else {
    console.log("❌ Failed!");
    console.log("   Status:", response.status);
    console.log("   Error:", data.error);
    console.log("   Message:", data.message);
  }
  
  return response.ok;
}

async function testInvalidInputs() {
  console.log("\n🧪 Testing input validation...");
  
  // Test missing userPublicKey
  const response1 = await fetch(`${BASE_URL}/api/reward-quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      challengeId: "test",
      correct: 5,
      total: 10,
      maxXp: 100,
    }),
  });
  
  console.log(response1.ok ? "❌ Should have failed" : "✅ Correctly rejected missing userPublicKey");
  
  // Test invalid public key format
  const response2 = await fetch(`${BASE_URL}/api/reward-quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userPublicKey: "invalid-key",
      challengeId: "test",
      correct: 5,
      total: 10,
      maxXp: 100,
    }),
  });
  
  console.log(response2.ok ? "❌ Should have failed" : "✅ Correctly rejected invalid public key");
}

async function testDuplicatePrevention() {
  console.log("\n🧪 Testing duplicate prevention...");
  
  const challengeId = `duplicate-test-${Date.now()}`;
  
  // First call should succeed
  const response1 = await fetch(`${BASE_URL}/api/reward-quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userPublicKey: TEST_USER_PUBLIC_KEY,
      challengeId: challengeId,
      correct: 5,
      total: 10,
      maxXp: 100,
    }),
  });
  
  const success1 = response1.ok;
  console.log(success1 ? "✅ First call succeeded" : "❌ First call failed");
  
  if (!success1) {
    console.log("   Skipping duplicate test since first call failed");
    return;
  }
  
  // Wait a bit for transaction to settle
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Second call with same challengeId should fail
  const response2 = await fetch(`${BASE_URL}/api/reward-quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userPublicKey: TEST_USER_PUBLIC_KEY,
      challengeId: challengeId,
      correct: 5,
      total: 10,
      maxXp: 100,
    }),
  });
  
  const data2 = await response2.json();
  
  if (response2.status === 409 || data2.error?.includes("already completed")) {
    console.log("✅ Correctly prevented duplicate challenge completion");
  } else {
    console.log("⚠️  Duplicate was not prevented (might be a timing issue)");
  }
}

async function runTests() {
  console.log("🚀 DeFiWise Backend API Test Suite");
  console.log("=====================================");
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Test user: ${TEST_USER_PUBLIC_KEY}`);
  console.log("\nMake sure:");
  console.log("  1. .env file has ADMIN_SECRET_KEY set");
  console.log("  2. Dev server is running (npm run dev)");
  console.log("  3. Admin account has testnet XLM");
  console.log("\nStarting tests in 2 seconds...");
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // Test input validation
    await testInvalidInputs();
    
    // Test reward quiz endpoint
    const rewardSuccess = await testRewardQuiz();
    
    // Test mint badge endpoint
    const badgeSuccess = await testMintBadge();
    
    // Test duplicate prevention (only if we had at least one success)
    if (rewardSuccess || badgeSuccess) {
      await testDuplicatePrevention();
    }
    
    console.log("\n=====================================");
    console.log("✨ Test suite completed!");
    console.log("\nNote: Some tests may fail if contracts aren't initialized");
    console.log("or if the admin account doesn't have enough XLM.");
    
  } catch (error) {
    console.error("\n❌ Test suite error:", error.message);
    console.error("\nPossible issues:");
    console.error("  • Dev server not running (npm run dev)");
    console.error("  • ADMIN_SECRET_KEY not set in .env");
    console.error("  • Network connectivity issues");
  }
}

// Run the tests
runTests();
