# Microsoft Teams Direct Messages Setup

This guide will help you set up Microsoft Teams direct messages from a "10bis Bot" for your credit loading automation system.

## Overview

The system will send direct chat messages to you from a "10bis Bot" whenever:
- ✅ Credit loading succeeds
- ❌ Credit loading fails

Each notification includes:
- Status (Success/Failed)
- Amount loaded
- Timestamp (Israel time)
- Error details (for failures)

## Setup Instructions

### Step 1: Create Azure App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Name: "10bis Bot"
5. Supported account types: "Accounts in this organizational directory only"
6. Click "Register"

### Step 2: Configure App Permissions

1. In your app registration, go to "API permissions"
2. Click "Add a permission"
3. Select "Microsoft Graph"
4. Choose "Application permissions"
5. Add these permissions:
   - `Chat.Create`
   - `Chat.ReadWrite.All`
   - `User.Read.All`
6. Click "Grant admin consent" (requires admin privileges)

### Step 3: Create Client Secret

1. Go to "Certificates & secrets"
2. Click "New client secret"
3. Description: "10bis Bot Secret"
4. Expires: Choose appropriate duration
5. Click "Add"
6. **Copy the secret value immediately** (you won't see it again)

### Step 4: Get Your User ID

1. Go to [Microsoft Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)
2. Sign in with your account
3. Run this query: `GET https://graph.microsoft.com/v1.0/me`
4. Copy your `id` from the response

### Step 5: Configure GitHub Actions Secrets

Add these repository secrets in GitHub:

1. `TEAMS_TENANT_ID` - Your Azure AD Tenant ID (from app registration overview)
2. `TEAMS_CLIENT_ID` - Your app's Application (client) ID
3. `TEAMS_CLIENT_SECRET` - The client secret you created
4. `TEAMS_USER_ID` - Your user ID from Graph Explorer

## Testing the Setup

### Test Direct Messages
```bash
# Set environment variables for testing
set TEAMS_TENANT_ID=your_tenant_id
set TEAMS_CLIENT_ID=your_client_id
set TEAMS_CLIENT_SECRET=your_client_secret
set TEAMS_USER_ID=your_user_id

# Test the connection
npm run test-teams-connection
```

## Notification Examples

You'll receive direct messages from "10bis Bot" that look like:

### Success Message
```
✅ 10bis Bot
Credit Loading Success

• Amount: ₪50
• Time: 13/09/2025 20:07:43 (Israel Time)
• Status: Success
```

### Failure Message
```
❌ 10bis Bot
Credit Loading Failed

• Amount: ₪50
• Time: 13/09/2025 20:07:43 (Israel Time)
• Status: Failed
• Error: Authentication failed (401)
```

## Troubleshooting

### Common Issues

1. **"Teams configuration not complete"**
   - Verify all 4 environment variables are set: `TEAMS_TENANT_ID`, `TEAMS_CLIENT_ID`, `TEAMS_CLIENT_SECRET`, `TEAMS_USER_ID`
   - Check that the values don't have extra spaces or quotes

2. **"Failed to get Microsoft Graph access token"**
   - Verify your client ID and secret are correct
   - Check that admin consent was granted for the app permissions
   - Ensure the tenant ID is correct

3. **"Failed to send Teams notification"**
   - Check that your user ID is correct
   - Verify the app has the required Graph API permissions
   - Network connectivity issue - notification will be logged but won't stop credit loading

4. **Messages not appearing**
   - Check your Teams chat list for messages from the bot
   - Verify your user ID is correct (use Graph Explorer to double-check)
   - Check that the app registration is active

### Required Permissions

Your Azure app registration needs these Microsoft Graph permissions:
- `Chat.Create` - To create chats
- `Chat.ReadWrite.All` - To send messages
- `User.Read.All` - To read user information

### Logs

Teams notification activities are logged to:
- `logs/credit.log` - Main credit loading log
- `logs/teams-test.log` - Teams notification test log
- `logs/error.log` - Error logs

### Manual Testing

Test the direct messaging by setting environment variables and running:

```bash
npm run test-teams-connection
```

## Security Notes

- Keep your client secret secure - it provides access to your Teams organization
- Don't commit secrets to version control
- Use GitHub repository secrets for GitHub Actions
- Client secrets can be regenerated in Azure if compromised
- Consider using certificate-based authentication for production

## Integration Details

The Teams direct messaging system is integrated into:
- `github-load-credit.js` - GitHub Actions credit loading script
- `.github/workflows/10bis-automation.yml` - GitHub Actions workflow

Messages are sent asynchronously and failures won't interrupt the credit loading process.