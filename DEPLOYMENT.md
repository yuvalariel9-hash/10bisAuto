# 10bis Automation - Linux Server Deployment Guide

This guide provides step-by-step instructions for deploying the 10bis automation system on a Linux server.

## Prerequisites

- Linux server (Ubuntu 18.04+, CentOS 7+, or similar)
- SSH access to the server
- sudo privileges (for initial setup)

## Quick Deployment

### Option 1: Automated Deployment (Recommended)

1. **Upload the project to your server:**
   ```bash
   # Using SCP
   scp -r 10bis-automation/ user@your-server:/home/user/
   
   # Or using rsync
   rsync -avz 10bis-automation/ user@your-server:/home/user/10bis-automation/
   ```

2. **SSH to your server and run the deployment script:**
   ```bash
   ssh user@your-server
   cd 10bis-automation
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Configure your credentials:**
   ```bash
   nano config.json
   ```
   Update the following fields:
   - `AccessToken`: Your 10bis access token
   - `RefreshToken`: Your 10bis refresh token
   - `Amount`: Credit amount to load (e.g., "100")
   - `MoneycardId`: Your money card ID

4. **Test the configuration:**
   ```bash
   node load-credit.js --test
   npm run refresh-token
   ```

### Option 2: Manual Deployment

1. **Install Node.js (if not already installed):**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # CentOS/RHEL
   curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
   sudo yum install -y nodejs
   ```

2. **Upload and setup the project:**
   ```bash
   cd /home/user/10bis-automation
   npm install
   chmod +x *.js deploy.sh
   chmod 600 config.json
   mkdir -p logs
   ```

3. **Test the installation:**
   ```bash
   node test.js
   ```

4. **Configure cron jobs:**
   ```bash
   crontab -e
   ```
   Add these lines (replace paths with your actual paths):
   ```bash
   # Token refresh every 10 minutes
   */10 * * * * /usr/bin/node /home/user/10bis-automation/refresh-token.js >> /home/user/10bis-automation/logs/cron.log 2>&1
   
   # Credit loading daily at 10 AM (excluding weekends)
   0 10 * * 0,1,2,3,4 /usr/bin/node /home/user/10bis-automation/load-credit.js >> /home/user/10bis-automation/logs/cron.log 2>&1
   ```

## Configuration Details

### config.json Structure
```json
{
  "AccessToken": "your_bearer_token_here",
  "RefreshToken": "your_refresh_token_here",
  "Amount": "100",
  "MoneycardId": "your_moneycard_id_here"
}
```

### How to Obtain 10bis Tokens

1. **Login to 10bis website** in your browser
2. **Open Developer Tools** (F12)
3. **Go to Network tab**
4. **Make a request** (like viewing your account)
5. **Find a request** to `api.10bis.co.il`
6. **Copy the Authorization header** (this is your AccessToken)
7. **Look for RefreshToken** in cookies or response data

## Monitoring and Maintenance

### Check System Status
```bash
# View recent logs
tail -f logs/refresh.log
tail -f logs/credit.log
tail -f logs/error.log

# Check cron jobs
crontab -l

# Test scripts manually
npm run refresh-token
node load-credit.js --test
```

### Log Rotation (Optional)
Add this to your crontab to prevent log files from growing too large:
```bash
# Clean logs daily at 2 AM
0 2 * * * find /home/user/10bis-automation/logs -name "*.log" -exec tail -n 1000 {} \; > {}.tmp && mv {}.tmp {} 2>/dev/null
```

### Troubleshooting

1. **Scripts not running:**
   - Check cron service: `systemctl status cron`
   - Verify file permissions: `ls -la *.js`
   - Check Node.js path: `which node`

2. **Authentication errors:**
   - Update tokens in config.json
   - Test token refresh: `npm run refresh-token`

3. **Network errors:**
   - Check internet connectivity
   - Verify 10bis API endpoints are accessible

## Security Best Practices

1. **File Permissions:**
   ```bash
   chmod 600 config.json          # Only owner can read/write
   chmod 755 logs/                # Standard directory permissions
   chmod +x *.js                  # Make scripts executable
   ```

2. **User Account:**
   - Run automation with a dedicated user account
   - Avoid running as root

3. **Monitoring:**
   - Regularly check logs for errors
   - Monitor for failed authentication attempts
   - Set up alerts for critical failures (optional)

## Backup and Recovery

### Backup Configuration
```bash
# Create backup
cp config.json config.json.backup.$(date +%Y%m%d)

# Restore backup
cp config.json.backup.20241201 config.json
```

### System Recovery
If the system fails:
1. Check logs in `logs/` directory
2. Verify configuration in `config.json`
3. Test scripts manually
4. Restart cron service if needed: `sudo systemctl restart cron`

## Updating the System

1. **Backup current configuration:**
   ```bash
   cp config.json config.json.backup
   ```

2. **Update files:**
   ```bash
   # Upload new files, then:
   npm install  # Update dependencies if needed
   ```

3. **Test the update:**
   ```bash
   node test.js
   ```

4. **Restore configuration:**
   ```bash
   cp config.json.backup config.json
   ```

## Support and Maintenance

- **Log Files**: Check `logs/` directory for detailed operation logs
- **Test Suite**: Run `node test.js` to validate system health
- **Manual Testing**: Use `npm run refresh-token` and `node load-credit.js --test`
- **Cron Monitoring**: Check `/var/log/syslog` for cron execution logs

## Schedule Summary

- **Token Refresh**: Every 10 minutes, 24/7
- **Credit Loading**: Daily at 10:00 AM Israel time
- **Weekend Skip**: Automatically skips Friday and Saturday
- **Timezone**: All times are in Israel timezone (Asia/Jerusalem)

For additional support, refer to the main README.md file or check the logs for detailed error messages.