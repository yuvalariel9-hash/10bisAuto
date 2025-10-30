# Fix for Unauthorized Error in Credit Loading

## Problem Description

<<<<<<< HEAD
The credit loading process was failing with an **unauthorized error** on the first run, but working successfully when run manually again. This was caused by **TWO race conditions**:
1. Token refresh and credit loading jobs running simultaneously at 7:00 AM
2. Config.json not being updated with fresh tokens before credit loading

## Root Cause #1: Simultaneous Job Execution ⚠️

### The Timing Issue

Both scheduled jobs were triggering at **7:00 AM UTC**:

```yaml
on:
  schedule:
    - cron: '*/10 * * * *'        # Runs every 10 minutes (including 7:00 AM)
    - cron: '0 7 * * 0,1,2,3,4'   # Runs at 7:00 AM on weekdays
```

### What Was Happening:

```
7:00 AM → Both jobs start at the same time!
    ↓
refresh-token job (starts first):
    - Uses OLD tokens from GitHub secrets
    - Gets NEW tokens from 10bis API ✓
    - Updates GitHub secrets with NEW tokens
    - OLD tokens become INVALID
    ↓
load-credit job (starts 20 seconds later):
    - Still reads OLD tokens from GitHub secrets
    - Tries to refresh with OLD (now invalid) tokens
    - 10bis API rejects: 401 Unauthorized ❌
```

### Why Manual Re-run Worked:

- GitHub secrets had already been updated with fresh tokens
- Load-credit job used the fresh tokens
- Everything worked! ✓

## Root Cause #2: Config.json Not Updated

The `load-credit` job was also creating `config.json` with old tokens and not updating it after token refresh:

1. Create config.json with OLD tokens
2. Refresh tokens → get NEW tokens
3. Update GitHub secrets
4. Run credit loading → but config.json still has OLD tokens!

## The Fixes

### Fix #1: Change Credit Loading Time ✅

Changed the schedule to avoid the conflict:

```yaml
on:
  schedule:
    - cron: '*/10 * * * *'        # Token refresh every 10 minutes
    - cron: '5 7 * * 0,1,2,3,4'   # Credit loading at 7:05 AM (not 7:00)
```

**Result:** No more simultaneous execution at 7:00 AM!

### Fix #2: Update Config.json with Fresh Tokens ✅

Added a new step (lines 187-201) that updates `config.json` AFTER token refresh:
=======
The credit loading process was failing with an **unauthorized error** on the first run, but working successfully when run manually again. This was caused by a **race condition** between token refresh and credit loading.

## Root Cause

The issue occurred in the `load-credit` job in the GitHub Actions workflow:

1. **Step 1 (lines 118-127)**: A `config.json` file was created with **OLD tokens** from GitHub secrets
2. **Step 2 (lines 129-136)**: Token refresh runs and generates **NEW tokens**
3. **Step 3 (lines 138-185)**: GitHub secrets are updated with the new tokens (asynchronous)
4. **Step 4 (lines 203-211)**: Credit loading runs with:
   - Environment variables pointing to new tokens ✓
   - BUT `config.json` still contains OLD tokens ✗

### Why It Failed

The `github-actions-utils.js` script reads configuration from **both** environment variables and `config.json`. If there was any fallback to the config file, it would use the stale/unauthorized tokens, causing a 401 Unauthorized error.

### Why Manual Re-run Worked

When you manually re-ran the workflow:
- The GitHub secrets had already been updated with fresh tokens from the previous run
- So the `config.json` created at the start of the job had the refreshed tokens
- Everything worked! ✓

## The Fix

Added a new step (lines 187-201) that **updates config.json with fresh tokens** AFTER the token refresh:
>>>>>>> 6c5768abb0494ab12ba2cc526018e71425556418

```yaml
- name: Update config.json with fresh tokens
  run: |
    if [ "${{ steps.refresh.outputs.tokens_updated }}" == "true" ]; then
      cat > config.json << EOF
    {
      "AccessToken": "${{ steps.refresh.outputs.access_token }}",
      "RefreshToken": "${{ steps.refresh.outputs.refresh_token }}",
      "Amount": "${{ secrets.AMOUNT }}",
      "MoneycardId": "${{ secrets.MONEYCARD_ID }}"
    }
    EOF
      echo "✓ Config file updated with fresh tokens from refresh step"
    else
      echo "✓ Using existing config.json with original tokens (no refresh needed)"
    fi
```

<<<<<<< HEAD
## Flow After Fixes

### Timeline:
```
7:00 AM - refresh-token job runs, updates tokens
7:05 AM - load-credit job runs (5 minutes later)
    ↓
1. ✓ Create initial config.json with current tokens
2. ✓ Run token refresh and get NEW tokens
3. ✓ Update GitHub secrets with NEW tokens
4. ✓ Update config.json with NEW tokens
5. ✓ Run credit loading with NEW tokens (both in env vars AND config.json)
```
=======
## Flow After Fix

1. ✓ Create initial config.json with OLD tokens (for token refresh to work)
2. ✓ Run token refresh and get NEW tokens
3. ✓ Update GitHub secrets with NEW tokens
4. ✓ **[NEW]** Update config.json with NEW tokens
5. ✓ Run credit loading with NEW tokens (both in env vars AND config.json)
>>>>>>> 6c5768abb0494ab12ba2cc526018e71425556418

## Testing

To test the fix:

```bash
<<<<<<< HEAD
# Push the changes
git push

# Or trigger manually
=======
# Trigger the workflow manually
git push

# Or use GitHub CLI
>>>>>>> 6c5768abb0494ab12ba2cc526018e71425556418
gh workflow run "10bis Automation"
```

## Expected Behavior

<<<<<<< HEAD
- ✅ Token refresh runs every 10 minutes (including 7:00 AM)
- ✅ Credit loading runs at 7:05 AM (no conflict!)
- ✅ Config file is updated with fresh tokens before credit loading
- ✅ No more unauthorized errors

## Files Modified

- `.github/workflows/10bis-automation.yml`:
  - Changed credit loading schedule from `0 7` to `5 7` (line 8)
  - Updated job condition to match new schedule (line 103)
  - Added config.json update step (lines 187-201)

---

**Date Fixed**: October 20, 2025  
**Issue**: Unauthorized error on credit loading (401)  
**Root Causes**: 
1. Jobs running simultaneously at 7:00 AM causing token invalidation
2. Config.json not updated with fresh tokens

**Solutions**: 
1. Changed credit loading to 7:05 AM to avoid conflict
2. Update config.json with fresh tokens before credit loading

=======
- ✓ Token refresh runs and updates tokens
- ✓ Config file is updated with fresh tokens
- ✓ Credit loading succeeds on first run
- ✓ No more unauthorized errors

## Files Modified

- `.github/workflows/10bis-automation.yml` - Added config.json update step (lines 187-201)

---

**Date Fixed**: September 30, 2025  
**Issue**: Unauthorized error on credit loading (first run)  
**Solution**: Update config.json with fresh tokens before credit loading
>>>>>>> 6c5768abb0494ab12ba2cc526018e71425556418
