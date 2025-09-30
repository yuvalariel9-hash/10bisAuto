# Fix for Unauthorized Error in Credit Loading

## Problem Description

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

## Flow After Fix

1. ✓ Create initial config.json with OLD tokens (for token refresh to work)
2. ✓ Run token refresh and get NEW tokens
3. ✓ Update GitHub secrets with NEW tokens
4. ✓ **[NEW]** Update config.json with NEW tokens
5. ✓ Run credit loading with NEW tokens (both in env vars AND config.json)

## Testing

To test the fix:

```bash
# Trigger the workflow manually
git push

# Or use GitHub CLI
gh workflow run "10bis Automation"
```

## Expected Behavior

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
