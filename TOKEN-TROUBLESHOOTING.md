# Token Refresh Troubleshooting Guide

This guide helps you diagnose and fix token refresh issues in your 10bis automation system.

## Quick Fix: Update Tokens Manually

### For GitHub Actions (Repository Secrets)
```bash
npm run update-github-secrets
```

This will update your GitHub repository secrets with the new tokens.

## Quick Diagnosis

### Step 1: Check Current Token Status
```bash
npm run token-status
```

This will show you:
- Whether tokens are set in your configuration
- Token lengths (to verify they're not truncated)
- Preview of token values (masked for security)

### Step 2: Run Debug Session
```bash
npm run debug-tokens
```

This will create a detailed log in `logs/debug-token-refresh.log` showing:
- Current configuration
- Request details sent to 10bis API
- Full response from the API
- Any errors encountered

## Common Issues and Solutions

### Issue 1: HTTP 401 Unauthorized

**Symptoms:**
```
HTTP request failed: HTTP 401: Unauthorized
Token refresh failed: All 3 attempts failed
```

**Possible Causes:**
1. **Refresh token is expired or invalid**
2. **Refresh token was corrupted during copy/paste**
3. **10bis changed their API requirements**

**Solutions:**
1. **Get fresh tokens manually (Easy Method):**
   - Log into 10bis website
   - Open browser developer tools (F12)
   - Go to Application tab → Storage → Cookies → https://www.10bis.co.il
   - Copy `Authorization` and `RefreshToken` cookie values
   - Run `npm run update-github-secrets`

2. **Alternative method:**
   - Log into 10bis website
   - Open browser developer tools (F12)
   - Go to Network tab
   - Perform any action (like loading credit)
   - Find the API request and copy new tokens
   - Update your `config.json`

3. **Verify token format:**
   - Tokens should be long strings (usually 100+ characters)
   - No spaces or line breaks
   - No quotes around the token values

### Issue 2: No Token Updates Received

**Symptoms:**
```
No token updates received from API
This might indicate the refresh token is invalid or expired
```

**Possible Causes:**
1. **API response format changed**
2. **Tokens are in response headers instead of body**
3. **Different field names in response**

**Solutions:**
1. **Check debug logs:**
   ```bash
   npm run debug-tokens
   tail -f logs/debug-token-refresh.log
   ```

2. **Look for tokens in different locations:**
   - Response body (current implementation)
   - Set-Cookie headers
   - Custom headers

### Issue 3: Tokens Not Changing

**Symptoms:**
```
AccessToken changed: false
RefreshToken changed: false
```

**Possible Causes:**
1. **API returns same tokens when they're still valid**
2. **Tokens have long expiration times**

**Solutions:**
1. **This might be normal behavior** - 10bis may not issue new tokens on every refresh
2. **Monitor for actual failures** - if credit loading works, tokens are probably fine

### Issue 4: Configuration File Issues

**Symptoms:**
```
Error reading config: Config file does not exist
Missing required configuration fields: RefreshToken
```

**Solutions:**
1. **Verify config.json exists and has correct format:**
   ```json
   {
     "AccessToken": "your_access_token_here",
     "RefreshToken": "your_refresh_token_here",
     "Amount": "50",
     "MoneycardId": "your_moneycard_id",
     "TeamsWebhookUrl": "your_teams_webhook_url"
   }
   ```

2. **Check file permissions:**
   ```bash
   ls -la config.json
   chmod 600 config.json
   ```

## Advanced Debugging

### Manual Token Extraction

If automatic token refresh fails, you can manually extract tokens:

1. **Open 10bis website in browser**
2. **Open Developer Tools (F12)**
3. **Go to Network tab**
4. **Perform any action (load credit, view orders, etc.)**
5. **Find API requests to `api.10bis.co.il`**
6. **Look for tokens in:**
   - Request headers (Authorization, Cookie)
   - Response headers (Set-Cookie)
   - Response body

### API Request Analysis

Use the debug script to analyze the exact request/response:

```bash
npm run debug-tokens
```

Then check `logs/debug-token-refresh.log` for:
- **Request headers** - verify they match browser requests
- **Response status** - should be 200, not 401/403
- **Response headers** - look for Set-Cookie with new tokens
- **Response body** - check for token fields

### Network Issues

If you get timeout or connection errors:

1. **Check internet connectivity**
2. **Verify 10bis API is accessible:**
   ```bash
   curl -I https://api.10bis.co.il/api/v1/Authentication/RefreshToken
   ```
3. **Check for proxy/firewall issues**

## Log Files

The system creates several log files to help with debugging:

- **`logs/refresh.log`** - Regular token refresh logs
- **`logs/debug-token-refresh.log`** - Detailed debug information
- **`logs/error.log`** - All error messages
- **`logs/credit.log`** - Credit loading logs

### Useful Log Commands

```bash
# View recent refresh logs
tail -n 50 logs/refresh.log

# Monitor logs in real-time
tail -f logs/refresh.log

# Search for specific errors
grep -i "401\|unauthorized\|failed" logs/refresh.log

# View debug session
cat logs/debug-token-refresh.log
```

## Getting Fresh Tokens

When all else fails, get fresh tokens manually:

### Method 1: Browser Developer Tools

1. Open https://www.10bis.co.il in your browser
2. Log in to your account
3. Open Developer Tools (F12)
4. Go to Application/Storage tab
5. Look under Cookies for `www.10bis.co.il`
6. Find `Authorization` and `RefreshToken` cookies
7. Copy their values to your `config.json`

### Method 2: Network Tab

1. Open https://www.10bis.co.il in your browser
2. Log in to your account
3. Open Developer Tools (F12)
4. Go to Network tab
5. Perform any action (load credit, view orders)
6. Find requests to `api.10bis.co.il`
7. Check request headers for `Authorization` and `Cookie`
8. Copy token values to your `config.json`

## Testing After Fixes

After updating tokens:

1. **Check token status:**
   ```bash
   npm run token-status
   ```

2. **Test token refresh:**
   ```bash
   npm run refresh-token
   ```

3. **Test credit loading:**
   ```bash
   npm run load-credit
   ```

4. **Check logs for success:**
   ```bash
   tail -n 20 logs/refresh.log
   tail -n 20 logs/credit.log
   ```

## Quick Commands Reference

```bash
# Update tokens interactively
npm run update-tokens

# Check current token status
npm run token-status

# Debug token refresh issues
npm run debug-tokens

# Test token refresh
npm run refresh-token

# Test credit loading
npm run load-credit
```

## When to Contact Support

Contact support if:
- Fresh tokens still result in 401 errors
- API responses have completely different format
- Multiple different token sources all fail
- 10bis website behavior has changed significantly

Include in your support request:
- Contents of `logs/debug-token-refresh.log`
- Masked token previews from `npm run token-status`
- Description of when the issue started
- Any recent changes to your setup