# GitHub Configuration for Teams Notifications

## 🔧 GitHub Repository Setup

### Step 1: Add Repository Secret

1. **Go to your GitHub repository**
2. **Click "Settings"** (top menu)
3. **Click "Secrets and variables"** → **"Actions"** (left sidebar)
4. **Click "New repository secret"**
5. **Fill in:**
   - **Name**: `TEAMS_WEBHOOK_URL`
   - **Secret**: `https://prioritysoftwareltd.webhook.office.com/webhookb2/9b51d2be-48b0-46e0-9d45-e6b5444fdd8e@fc53548a-c893-4826-9428-d8921102f2ff/IncomingWebhook/656c6758022a4bb69ece4b7801afa25c/0af98c19-8358-4f76-9e81-de08a56b73e3/V2V_cg66BdrgKUb3svS-eK_ixB3dxV3FpH9VF45hVBfGA1`
6. **Click "Add secret"**

### Step 2: Update GitHub Actions Workflow

Your workflow file `.github/workflows/10bis-automation.yml` needs to include the Teams webhook URL as an environment variable.

**Add this to your workflow:**

```yaml
env:
  TEAMS_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}
  ACCESS_TOKEN: ${{ secrets.ACCESS_TOKEN }}
  REFRESH_TOKEN: ${{ secrets.REFRESH_TOKEN }}
  AMOUNT: ${{ secrets.AMOUNT }}
  MONEYCARD_ID: ${{ secrets.MONEYCARD_ID }}
```

## 📋 Complete GitHub Secrets List

Make sure you have ALL these secrets configured:

### Required for Credit Loading:
- ✅ `ACCESS_TOKEN` - Your 10bis access token
- ✅ `REFRESH_TOKEN` - Your 10bis refresh token  
- ✅ `AMOUNT` - Amount to load (e.g., "50")
- ✅ `MONEYCARD_ID` - Your moneycard ID

### Required for Teams Notifications:
- ✅ `TEAMS_WEBHOOK_URL` - Your Teams webhook URL (the one you provided)

## 🔍 How to Check Your Current Secrets

1. Go to your repository
2. Settings → Secrets and variables → Actions
3. You should see these secrets listed:
   - `ACCESS_TOKEN`
   - `REFRESH_TOKEN` 
   - `AMOUNT`
   - `MONEYCARD_ID`
   - `TEAMS_WEBHOOK_URL` ← **Add this one**

## ⚡ Quick Setup Commands

If you have GitHub CLI installed:

```bash
# Add the Teams webhook secret
gh secret set TEAMS_WEBHOOK_URL --body "https://prioritysoftwareltd.webhook.office.com/webhookb2/9b51d2be-48b0-46e0-9d45-e6b5444fdd8e@fc53548a-c893-4826-9428-d8921102f2ff/IncomingWebhook/656c6758022a4bb69ece4b7801afa25c/0af98c19-8358-4f76-9e81-de08a56b73e3/V2V_cg66BdrgKUb3svS-eK_ixB3dxV3FpH9VF45hVBfGA1"

# List all secrets to verify
gh secret list
```

## 🧪 Testing GitHub Actions

After adding the secret:

1. **Push any change** to trigger the workflow
2. **Go to Actions tab** in your repository
3. **Watch the workflow run**
4. **Check your Teams channel** for notifications

## 🔒 Security Notes

- ✅ **Webhook URL is secure** - only your Teams channel receives notifications
- ✅ **GitHub secrets are encrypted** - safe to store webhook URLs
- ✅ **Can be updated anytime** - just edit the secret if webhook changes
- ✅ **No Azure permissions needed** - webhook works independently

## 📱 What You'll See

When GitHub Actions runs your credit loading:
- ✅ **Success**: Green card in Teams with amount and timestamp
- ❌ **Failure**: Red card in Teams with error details
- 🤖 **From**: "10bis Bot"
- 📍 **Location**: Your Teams channel

---

**That's it!** Just add the `TEAMS_WEBHOOK_URL` secret to GitHub and your automated credit loading will send Teams notifications! 🎉