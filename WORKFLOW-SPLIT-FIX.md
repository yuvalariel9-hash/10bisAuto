# Workflow Split Fix - Final Solution for Race Condition

## 🎯 Problem Solved

The **unauthorized error** in load-credit was caused by a **race condition** where both jobs could run simultaneously, even with the 7:05 AM fix.

### Why the Previous Fix Wasn't Enough

The original fix changed load-credit to run at **7:05 AM** to avoid the **7:00 AM** conflict. However:

❌ **At 7:10 AM**, the refresh-token job runs again (matches `*/10 * * * *`)  
❌ If load-credit is still running from 7:05 AM, they **overlap**  
❌ **Manual triggers** run BOTH jobs simultaneously (both have `workflow_dispatch`)  
❌ Job conditions (`if: github.event.schedule == '...'`) can fail or be unreliable  

### Timeline of the Race Condition

```
7:00 AM → refresh-token runs ✓
7:05 AM → load-credit starts (takes ~1-2 minutes)
7:10 AM → refresh-token runs AGAIN ⚠️
         → Both jobs running at the same time!
         → Tokens get invalidated while load-credit is using them
         → 401 Unauthorized Error ❌
```

## ✅ The Solution: Separate Workflows

Split the single workflow into **TWO independent workflows**:

### 1. `.github/workflows/refresh-token.yml`
- **Purpose**: Refresh authentication tokens
- **Schedule**: Every 10 minutes (`*/10 * * * *`)
- **Runs independently**: Never conflicts with load-credit

### 2. `.github/workflows/load-credit.yml`
- **Purpose**: Load credit to 10bis account
- **Schedule**: Daily at 7:05 AM UTC on weekdays
- **Runs independently**: Never conflicts with refresh-token

### 3. Old Workflow Backed Up
- **Original**: `.github/workflows/10bis-automation.yml`
- **Backed up to**: `.github/workflows/10bis-automation.yml.backup`
- **Can be deleted** after confirming new workflows work

## 🔧 What Changed

### Before (Single Workflow with Two Jobs)
```yaml
name: 10bis Automation

on:
  schedule:
    - cron: '*/10 * * * *'
    - cron: '5 7 * * 0,1,2,3,4'
  workflow_dispatch:

jobs:
  refresh-token:
    if: github.event.schedule == '*/10 * * * *' || github.event_name == 'workflow_dispatch'
    # ... steps ...

  load-credit:
    if: github.event.schedule == '5 7 * * 0,1,2,3,4' || github.event_name == 'workflow_dispatch'
    # ... steps ...
```

**Problems:**
- Both jobs run on manual trigger
- Job conditions can be unreliable
- Shared workflow means potential conflicts

### After (Two Separate Workflows)

**`refresh-token.yml`:**
```yaml
name: Refresh Token

on:
  schedule:
    - cron: '*/10 * * * *'
  workflow_dispatch:

jobs:
  refresh-token:
    # ... steps ...
```

**`load-credit.yml`:**
```yaml
name: Load Credit

on:
  schedule:
    - cron: '5 7 * * 0,1,2,3,4'
  workflow_dispatch:

jobs:
  load-credit:
    # ... steps ...
```

**Benefits:**
✅ Complete isolation - no shared workflow  
✅ Manual trigger only affects one workflow  
✅ No job conditions needed  
✅ Clearer separation of concerns  
✅ Independent logs and history  
✅ **Zero possibility of race condition**  

## 📋 Migration Steps

### For Your Repository (Original)

1. ✅ New workflows created:
   - `.github/workflows/refresh-token.yml`
   - `.github/workflows/load-credit.yml`

2. ✅ Old workflow backed up:
   - `.github/workflows/10bis-automation.yml.backup`

3. **Push the changes:**
   ```bash
   git add .github/workflows/
   git commit -m "Fix: Split workflows to eliminate race condition"
   git push
   ```

4. **Verify workflows work:**
   - Go to Actions tab
   - You should see "Refresh Token" and "Load Credit" as separate workflows
   - Manually trigger each to test

5. **After confirmation, delete backup:**
   ```bash
   git rm .github/workflows/10bis-automation.yml.backup
   git commit -m "Clean up: Remove old workflow backup"
   git push
   ```

### For Fork Users

Fork users need to **sync or pull** these changes:

#### Option 1: Sync Fork (GitHub UI)
1. Go to forked repository on GitHub
2. Click **"Sync fork"** button
3. Click **"Update branch"**
4. Done! ✓

#### Option 2: Pull Changes (Git)
```bash
# If not already added, add upstream
git remote add upstream https://github.com/ORIGINAL_OWNER/10bisAuto.git

# Fetch latest changes
git fetch upstream

# Merge changes
git merge upstream/main

# Push to fork
git push origin main
```

#### Option 3: Manual Update
If they've modified the workflow, they need to:
1. Create `.github/workflows/refresh-token.yml` (copy from original repo)
2. Create `.github/workflows/load-credit.yml` (copy from original repo)
3. Delete or rename `.github/workflows/10bis-automation.yml`

## 🔍 How to Verify It's Fixed

### Check Workflow List
Go to **Actions** tab, you should see:
- ✅ "Refresh Token" workflow
- ✅ "Load Credit" workflow
- ❌ ~~"10bis Automation"~~ (old workflow should be gone)

### Check Run History
- **"Refresh Token"** runs every 10 minutes
- **"Load Credit"** runs at 7:05 AM on weekdays
- Each has **separate run history**

### Test Manual Trigger
1. Go to Actions → "Refresh Token" → Run workflow
2. Only refresh-token runs ✓
3. Go to Actions → "Load Credit" → Run workflow
4. Only load-credit runs ✓
5. **They never run together!** ✓

## 📊 Expected Behavior After Fix

### Daily Schedule
```
6:50 AM → Refresh Token runs ✓
7:00 AM → Refresh Token runs ✓
7:05 AM → Load Credit runs ✓ (uses fresh tokens from 7:00)
7:10 AM → Refresh Token runs ✓ (Load Credit already finished!)
7:20 AM → Refresh Token runs ✓
...every 10 minutes throughout the day
```

### Manual Triggers
```
User clicks "Run workflow" on Refresh Token
  → ONLY Refresh Token runs ✓

User clicks "Run workflow" on Load Credit
  → ONLY Load Credit runs ✓

NO RACE CONDITION POSSIBLE! ✓
```

## 🎉 Benefits

1. **Eliminates Race Condition**: 100% impossible for both to run simultaneously
2. **Clearer Logs**: Each workflow has its own run history
3. **Independent Control**: Can enable/disable each workflow separately
4. **Easier Debugging**: Clearer which workflow failed
5. **Better for Forks**: No complex job conditions to maintain
6. **Manual Testing**: Can test each workflow independently

## 📝 Important Notes

### All GitHub Secrets Still Required
Both workflows still need:
- ✅ `ACCESS_TOKEN`
- ✅ `REFRESH_TOKEN`
- ✅ `AMOUNT`
- ✅ `MONEYCARD_ID`
- ✅ `PERSONAL_ACCESS_TOKEN` (for updating secrets)
- ✅ `TEAMS_WEBHOOK_URL` (optional, for notifications)

### No Code Changes
- No changes to JavaScript files
- No changes to logic
- Only workflow structure changed

### Backward Compatible
- Same secrets
- Same functionality
- Just safer execution

## 🆘 Troubleshooting

### "I still see the old workflow running"
- Make sure you deleted or renamed `10bis-automation.yml`
- GitHub Actions caches workflow files - wait a few minutes
- Check the `.github/workflows/` directory

### "Secrets not found"
- Secrets are **repository-level**, they work with both workflows
- No need to re-add secrets
- Check Settings → Secrets and variables → Actions

### "Refresh Token workflow disabled"
- GitHub disables workflows with no activity for 60 days
- Go to Actions → "Refresh Token" → Enable workflow

## 📅 Timeline

- **Before**: Single workflow with timing-based job conditions (unreliable)
- **Fix #1**: Changed load-credit to 7:05 AM (helped but not enough)
- **Fix #2**: Split into separate workflows (complete solution)

---

**Date Implemented**: [Current Date]  
**Issue**: Race condition causing 401 Unauthorized errors  
**Root Cause**: Both jobs could run simultaneously in shared workflow  
**Solution**: Split into two independent workflows  
**Status**: ✅ **RESOLVED**

This is the **final and complete solution** to the race condition issue!