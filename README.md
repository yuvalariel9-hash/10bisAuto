# 10bis Automation System

An automated system for managing 10bis credit loading and token refresh operations. Choose from three deployment options: **GitHub Actions** (cloud-based, no server required), **Linux Server** (traditional cron-based), or **Docker** (containerized testing).

## Features

- **Automatic Token Refresh**: Refreshes authentication tokens every 10 minutes
- **Scheduled Credit Loading**: Loads 10bis credit daily at 10 AM (excluding weekends)
- **Robust Error Handling**: Comprehensive logging and retry mechanisms
- **Secure Token Management**: Automatic token updates and encrypted storage
- **Weekend Detection**: Automatically skips credit loading on Friday and Saturday
- **Multiple Deployment Options**: GitHub Actions, Linux Server, or Docker
- **Zero Maintenance**: GitHub Actions option requires no server maintenance

## Deployment Options

### 🚀 Option 1: GitHub Actions (Recommended)

**Best for**: Most users who want a maintenance-free, cloud-based solution

✅ **Advantages:**
- No server required - runs in GitHub's cloud
- Automatic token updates stored securely in GitHub secrets
- Built-in logging and monitoring
- Free for most usage (2,000 minutes/month)
- Zero maintenance and security updates

❌ **Requirements:**
- GitHub repository (free)
- GitHub Personal Access Token

📖 **Setup Guide**: [`GITHUB-ACTIONS-SETUP.md`](GITHUB-ACTIONS-SETUP.md)

### 🖥️ Option 2: Linux Server Deployment

**Best for**: Users who prefer self-hosted solutions or have existing server infrastructure

✅ **Advantages:**
- Full control over the environment
- No dependency on external services
- Can integrate with existing monitoring systems

❌ **Requirements:**
- Linux server (Ubuntu, CentOS, etc.)
- Node.js (version 14 or higher)
- npm (Node Package Manager)
- Cron daemon
- Server maintenance and security updates

📖 **Setup Guide**: [`DEPLOYMENT.md`](DEPLOYMENT.md)

### 🐳 Option 3: Docker Testing

**Best for**: Testing the system safely before production deployment

✅ **Advantages:**
- Isolated testing environment
- Easy to set up and tear down
- Perfect for development and testing

❌ **Requirements:**
- Docker Desktop (Windows, Mac, or Linux)
- Basic Docker knowledge

📖 **Setup Guide**: [`DOCKER-TESTING.md`](DOCKER-TESTING.md)

## Quick Start

### GitHub Actions (Cloud-based - Recommended)

```bash
# 1. Push your code to GitHub
git init
git add .
git commit -m "Initial commit"
git push origin main

# 2. Set up GitHub secrets (see GITHUB-ACTIONS-SETUP.md)
# 3. The automation starts running automatically!
```

### Docker Testing

```bash
# Navigate to project directory
cd 10bis-automation

# Build and run with Docker Compose
docker-compose up --build

# In another terminal, run tests
docker exec -it tenbis-automation node test.js
```

### Linux Server

```bash
# Install dependencies
npm install

# Configure credentials
nano config.json

# Set up cron jobs (see DEPLOYMENT.md)
crontab -e
```

## Installation

### 1. Clone or Download the Project

```bash
# If using git
git clone <repository-url> 10bis-automation
cd 10bis-automation

# Or create directory and copy files
mkdir 10bis-automation
cd 10bis-automation
# Copy all project files to this directory
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure the System

Edit the `config.json` file with your 10bis credentials and settings:

```json
{
  "AccessToken": "your_access_token_here",
  "RefreshToken": "your_refresh_token_here",
  "Amount": "your_credit_amount",
  "MoneycardId": "your_moneycard_id"
}
```

**Important**: You need to obtain these values from your 10bis account:
- **AccessToken**: Current authentication token
- **RefreshToken**: Token used to refresh the access token
- **Amount**: Amount of credit to load (e.g., "100")
- **MoneycardId**: Your money card ID for charging

### 4. Set File Permissions

```bash
# Make scripts executable
chmod +x refresh-token.js
chmod +x load-credit.js

# Secure the config file
chmod 600 config.json
```

### 5. Test the Scripts

```bash
# Test token refresh
npm run refresh-token

# Test credit loading configuration
node load-credit.js --test

# Test credit loading (will skip if weekend)
npm run load-credit
```

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
├── .github/
│   └── workflows/
│       └── 10bis-automation.yml        # GitHub Actions workflow
├── github-actions-utils.js             # GitHub Actions compatible utilities
├── github-refresh-token.js             # Token refresh for GitHub Actions
├── github-load-credit.js               # Credit loading for GitHub Actions
├── utils.js                            # Utility functions (server deployment)
├── refresh-token.js                    # Token refresh script (server deployment)
├── load-credit.js                      # Credit loading script (server deployment)
├── test.js                             # Comprehensive test suite
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

2. **Authentication errors**
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