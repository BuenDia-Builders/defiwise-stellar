# Badge NFT Integration - Implementation Instructions

## Overview
Wire the module completion flow to mint Badge NFTs on Stellar Testnet when users pass quizzes.

## Files Created

I've created the updated versions of the files with the suffix `_NEW.tsx`:

1. **QuizView_NEW.tsx** - Updated quiz component with blockchain integration
2. **EarnedNfts_NEW.tsx** - Updated achievements page with on-chain verification

## Manual Steps Required

### Step 1: Replace QuizView.tsx

```bash
# Backup the original
copy "src\app\dashboard\ruta_aprendizaje\components\QuizView.tsx" "src\app\dashboard\ruta_aprendizaje\components\QuizView.tsx.backup"

# Replace with new version
copy "QuizView_NEW.tsx" "src\app\dashboard\ruta_aprendizaje\components\QuizView.tsx"

# Delete the temp file
del "QuizView_NEW.tsx"
```

### Step 2: Replace EarnedNfts.tsx

```bash
# Backup the original
copy "src\app\dashboard\logros\EarnedNfts.tsx" "src\app\dashboard\logros\EarnedNfts.tsx.backup"

# Replace with new version
copy "EarnedNfts_NEW.tsx" "src\app\dashboard\logros\EarnedNfts.tsx"

# Delete the temp file
del "EarnedNfts_NEW.tsx"
```

## What Was Changed

### QuizView.tsx Changes:

1. **Added Imports:**
   - `useStellarWallet` - Get connected wallet address
   - `useStellarProgress` - Check badge status and refresh on-chain data
   - `rewardQuiz`, `mintBadge` - API client functions
   - `toast` - User notifications

2. **Added State:**
   - `submitting` - Track blockchain submission progress
   - `badgeMinted` - Track if badge was successfully minted

3. **New Function: `submitToBlockchain()`**
   - Checks if badge already exists with `checkHasBadge(module.id)`
   - Calls `rewardQuiz` API with challengeId = `${module.id}-quiz`
   - If passed (score >= 75), calls `mintBadge` with:
     - `moduleId`: Exact module.id from courses.ts
     - `moduleTitle`: module.title
     - `xpEarned`: Actual XP from reward_quiz result
     - `quizScore`: Final quiz score (0-100)
   - Refreshes on-chain progress
   - Shows success/error toasts

4. **Updated `handleNext()`:**
   - Calls `submitToBlockchain()` after local progress update when wallet is connected

5. **Updated Results Screen:**
   - Shows on-chain confirmation status:
     - ✓ "Badge registrado on-chain" if minted successfully
     - "Registrando on-chain..." while submitting
     - "Conectá tu wallet para registrarlo on-chain" if not connected
     - Error messages for duplicates/failures

### EarnedNfts.tsx Changes:

1. **Added Imports:**
   - `useEffect`, `useState` - React hooks
   - `useStellarWallet` - Check wallet connection
   - `useStellarProgress` - Query on-chain badge status

2. **Added State:**
   - `onChainBadges` - Map of moduleId → has badge on-chain
   - `loading` - Track badge status fetch

3. **Added useEffect:**
   - Fetches on-chain badge status for all modules when wallet connects
   - Calls `checkHasBadge(mod.id)` for each module
   - Clears badges when wallet disconnects

4. **Updated Badge Display Logic:**
   - When wallet connected: Use `onChainBadges` as source of truth
   - When wallet not connected: Use local progress
   - Shows "On-chain" badge for confirmed NFTs
   - Shows "Local" for earned but not yet minted
   - Shows connection prompt at bottom

## Module ID Mapping

The exact module IDs that will be passed to `mint_badge` contract:

| Module ID | Title | XP | Contract Call |
|-----------|-------|----|-----------------|
| `mod-1` | ¿Qué es DeFi? | 50 | `mint_badge(address, "mod-1", "¿Qué es DeFi?", xp, score)` |
| `mod-2` | Smart Contracts | 150 | `mint_badge(address, "mod-2", "Smart Contracts:", xp, score)` |
| `mod-3` | El Valor del Dinero... | 150 | `mint_badge(address, "mod-3", "El Valor del Dinero...", xp, score)` |
| `stellar-mod-1` | La red Stellar | 50 | `mint_badge(address, "stellar-mod-1", "La red Stellar", xp, score)` |
| `stellar-mod-2` | Introducción a Soroban | 150 | `mint_badge(address, "stellar-mod-2", "Introducción a Soroban", xp, score)` |

## Expected Flow

1. **User completes quiz:**
   - Local progress saved via `progress.completeQuiz()`
   - If wallet connected → blockchain submission starts

2. **Blockchain submission (if wallet connected):**
   - Check `hasBadge(module.id)` → skip if already minted
   - Call `reward_quiz` with challengeId = `${module.id}-quiz`
   - If score >= 75 → Call `mint_badge` with actual XP earned
   - Refresh on-chain progress
   - Show toast notification

3. **Results screen:**
   - Shows NFT image
   - Shows on-chain confirmation status
   - If not connected → prompts to connect wallet

4. **Achievements page:**
   - Queries `hasBadge(module.id)` for each module
   - Shows "On-chain" badge for confirmed NFTs
   - Falls back to local progress when wallet not connected

## Error Handling

The implementation handles:

- ✓ Duplicate quiz completion ("already completed")
- ✓ Duplicate badge minting ("already minted")
- ✓ Network errors (shows local save fallback message)
- ✓ Rate limiting (shows retry message)
- ✓ Wallet not connected (saves locally, prompts connection)

## Testing Checklist

After applying changes:

- [ ] Save the `.vscode/settings.json` file
- [ ] Replace QuizView.tsx with QuizView_NEW.tsx
- [ ] Replace EarnedNfts.tsx with EarnedNfts_NEW.tsx
- [ ] Verify no TypeScript errors
- [ ] Test quiz completion without wallet → should save locally
- [ ] Test quiz completion with wallet → should mint badge on-chain
- [ ] Test quiz retry after failure → should allow retry
- [ ] Test achievements page → should show on-chain badges when wallet connected
- [ ] Verify module IDs match exactly between courses.ts and contract calls

## Backend Requirements

Ensure the backend has:

- ✓ `ADMIN_SECRET_KEY` environment variable set
- ✓ `/api/reward-quiz` route working
- ✓ `/api/mint-badge` route working
- ✓ Badge NFT contract deployed at: `CDWJE7AM3DFWC6FD2RKBASWP7EITQ2ULJH4FX5JFQRVHXQSXDPJAB3KI`

## Acceptance Criteria Status

- ✅ `mint_badge` is called on-chain after `reward_quiz` confirms
- ✅ `checkHasBadge` is called before minting to avoid duplicate attempts
- ✅ `EarnedNfts.tsx` uses on-chain `hasBadge` as source of truth when wallet is connected
- ✅ The `module_id` exactly matches the IDs defined in `src/data/courses.ts`
- ✅ The quiz result screen only shows NFT confirmation if mint was successful or badge already exists
- ✅ Wallet not connected → shows badge in local UI with prompt to connect

## Next Steps

1. **Save the `.vscode/settings.json` file** (or close it without saving)
2. Run the commands above to replace the files
3. Test the flow end-to-end
4. Verify on-chain badges appear in the achievements page
