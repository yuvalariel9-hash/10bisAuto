# 10bis Automation System

An automated system for managing 10bis credit loading and token refresh operations. Choose from three deployment options: **GitHub Actions** (cloud-based, no server required), **Linux Server** (traditional cron-based), or **Docker** (containerized testing).

## Features

- **Automatic Token Refresh**: Refreshes authentication tokens every 10 minutes
- **Scheduled Credit Loading**: Loads 10bis credit daily at 10 AM (excluding weekends)
- **Microsoft Teams Notifications**: Real-time notifications for success/failure with amount and timestamp
- **Robust Error Handling**: Comprehensive logging and retry mechanisms
- **Secure Token Management**: Automatic token updates and encrypted storage
- **Weekend Detection**: Automatically skips credit loading on Friday and Saturday
- **Multiple Deployment Options**: GitHub Actions, Linux Server, or Docker
- **Zero Maintenance**: GitHub Actions option requires no server maintenance

## Deployment

### 🚀 GitHub Actions (Cloud-based)

**This system is designed for GitHub Actions deployment**

✅ **Advantages:**
- No server required - runs in GitHub's cloud
- Automatic token updates stored securely in GitHub secrets
- Built-in logging and monitoring
- Free for most usage (2,000 minutes/month)
- Zero maintenance and security updates
- Microsoft Teams notifications

❌ **Requirements:**
- GitHub repository (free)
- GitHub Personal Access Token

📖 **Setup Guide**: [`GITHUB-ACTIONS-SETUP.md`](GITHUB-ACTIONS-SETUP.md)

## Quick Start

### GitHub Actions Setup

```bash
# 1. Push your code to GitHub
git init
git add .
git commit -m "Initial commit"
git push origin main

# 2. Set up GitHub secrets (see GITHUB-ACTIONS-SETUP.md)
# 3. Update tokens when needed:
npm run update-github-secrets

# 4. The automation starts running automatically!
```

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url> 10bis-automation
cd 10bis-automation
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set up GitHub Repository Secrets

Follow the [`GITHUB-ACTIONS-SETUP.md`](GITHUB-ACTIONS-SETUP.md) guide to configure:
- `ACCESS_TOKEN`
- `REFRESH_TOKEN`
- `AMOUNT`
- `MONEYCARD_ID`
- `TEAMS_WEBHOOK_URL` (optional)
- `PERSONAL_ACCESS_TOKEN`

### 4. Update Tokens When Needed

```bash
# Update GitHub repository secrets with fresh tokens
npm run update-github-secrets

# Test Teams notifications
npm run test-teams-connection
```

📖 **Teams Setup Guide**: [`TEAMS-SETUP.md`](TEAMS-SETUP.md)

## Cron Job Setup

### 1. Find Node.js Path

```bash
which node
# Example output: /usr/bin/node
```

### 2. Get Project Path

```bash
pwd
# Example output: /home/user/10bis-automation
```

### 3. Edit Crontab

```bash
crontab -e
```

### 4. Add Cron Jobs

Copy the following lines to your crontab, replacing the paths with your actual paths:

```bash
# Token Refresh - Every 10 minutes
*/10 * * * * /usr/bin/node /home/user/10bis-automation/refresh-token.js >> /home/user/10bis-automation/logs/cron.log 2>&1

# Credit Loading - Daily at 10 AM (excluding Friday and Saturday)
0 10 * * 0,1,2,3,4 /usr/bin/node /home/user/10bis-automation/load-credit.js >> /home/user/10bis-automation/logs/cron.log 2>&1
```

### 5. Verify Cron Jobs

```bash
crontab -l
```

## File Structure

```
10bis-automation/
├── package.json                        # Node.js project configuration
├── config.json                         # Authentication tokens and settings (local dev)
├── README.md                           # Main documentation
├── GITHUB-ACTIONS-SETUP.md             # GitHub Actions deployment guide
├── DEPLOYMENT.md                       # Linux server deployment guide
├── DOCKER-TESTING.md                   # Docker testing guide
├── TEAMS-SETUP.md                      # Microsoft Teams notifications setup guide
├── TOKEN-TROUBLESHOOTING.md            # Token refresh troubleshooting guide
├── .github/
│   └── workflows/
│       └── 10bis-automation.yml        # GitHub Actions workflow
├── github-actions-utils.js             # GitHub Actions compatible utilities
├── github-refresh-token.js             # Token refresh for GitHub Actions
├── github-load-credit.js               # Credit loading for GitHub Actions
├── utils.js                            # Utility functions (server deployment)
├── refresh-token.js                    # Token refresh script (server deployment)
├── load-credit.js                      # Credit loading script (server deployment)
├── teams-notifier.js                   # Teams notification utility (server deployment)
├── github-teams-notifier.js            # Teams notification utility (GitHub Actions)
├── test.js                             # Comprehensive test suite
├── test-teams-notifications.js         # Teams notification testing script
├── debug-token-refresh.js              # Token refresh debugging utility
├── update-tokens.js                    # Token update utility for local config
├── update-github-secrets.js            # GitHub repository secrets update utility
├── deploy.sh                           # Automated deployment script for Linux
├── crontab-setup.txt                   # Cron job configuration examples
├── Dockerfile                          # Docker container configuration
├── docker-compose.yml                  # Docker Compose configuration
├── .dockerignore                       # Docker build optimization
└── logs/                               # Log files directory (created automatically)
    ├── refresh.log                     # Token refresh logs
    ├── credit.log                      # Credit loading logs
    ├── error.log                       # Error logs
    ├── test.log                        # Test execution logs
    ├── teams-test.log                  # Teams notification test logs
    ├── debug-token-refresh.log         # Token refresh debug logs
    ├── token-update.log                # Token update logs
    ├── github-secrets-update.log       # GitHub secrets update logs
    └── cron.log                        # Cron job execution logs
```

## Monitoring and Logs

### Log Files

- **refresh.log**: Token refresh operations
- **credit.log**: Credit loading operations
- **error.log**: All error messages
- **cron.log**: Cron job execution output

### View Recent Logs

```bash
# View last 50 lines of refresh logs
tail -n 50 logs/refresh.log

# View last 50 lines of credit logs
tail -n 50 logs/credit.log

# View error logs
tail -n 50 logs/error.log

# Monitor logs in real-time
tail -f logs/refresh.log
```

### Check Cron Job Status

```bash
# Check if cron service is running
systemctl status cron

# View cron logs (Ubuntu/Debian)
grep CRON /var/log/syslog

# View cron logs (CentOS/RHEL)
grep CRON /var/log/messages
```

## Troubleshooting

### Common Issues

1. **Scripts not running via cron**
   - Check file permissions: `ls -la *.js`
   - Verify Node.js path: `which node`
   - Check cron service: `systemctl status cron`

2. **Authentication errors (HTTP 401)**
   - **Quick fix for local**: Update tokens manually: `npm run update-tokens`
   - **Quick fix for GitHub Actions**: Update repository secrets: `npm run update-github-secrets`
   - Check current token status: `npm run token-status`
   - Run detailed debug: `npm run debug-tokens`
   - See [`TOKEN-TROUBLESHOOTING.md`](TOKEN-TROUBLESHOOTING.md) for detailed solutions
   - Verify tokens in `config.json` are current
   - Check if manual token refresh works: `npm run refresh-token`

3. **Missing dependencies**
   - Run `npm install` in the project directory
   - Check Node.js version: `node --version`

4. **Permission denied errors**
   - Set proper permissions: `chmod +x *.js`
   - Secure config file: `chmod 600 config.json`

### Manual Testing

```bash
# Test token refresh manually
node refresh-token.js

# Test credit loading configuration
node load-credit.js --test

# Test credit loading (respects weekend check)
node load-credit.js

# Test Teams notifications
npm run test-teams-connection

# Test Teams notifications with full messages
npm run test-teams

# View Teams setup instructions
npm run teams-setup

# Debug token refresh issues
npm run debug-tokens

# Check current token status
npm run token-status

# Update tokens manually for local development
npm run update-tokens

# Update GitHub repository secrets for GitHub Actions
npm run update-github-secrets

# Get help for GitHub Personal Access Token setup
npm run github-token-help
```

### Debug Mode

Add debug logging by modifying the log level in `utils.js` or check the detailed logs in the `logs/` directory.

## Security Considerations

- Keep `config.json` secure with restricted permissions (600)
- Regularly rotate authentication tokens
- Monitor log files for suspicious activity
- Consider using environment variables for sensitive data in production

## API Endpoints

The system interacts with these 10bis API endpoints:

- **Token Refresh**: `POST https://api.10bis.co.il/api/v1/Authentication/RefreshToken`
- **Credit Loading**: `PATCH https://api.10bis.co.il/api/v1/Payments/LoadTenbisCredit`

## Schedule Details

- **Token Refresh**: Every 10 minutes, 24/7
- **Credit Loading**: Daily at 10:00 AM Israel time, Monday through Thursday and Sunday
- **Weekend Skip**: Automatically skips Friday and Saturday

## Support

For issues or questions:
1. Check the log files in the `logs/` directory
2. Verify your configuration in `config.json`
3. Test scripts manually before troubleshooting cron issues
4. Ensure all dependencies are installed with `npm install`