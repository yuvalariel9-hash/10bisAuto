# Docker Troubleshooting Guide

This guide helps resolve common Docker issues when testing the 10bis automation system.

## Common Issues and Solutions

### Issue 1: "version is obsolete" Warning

**Error:**
```
level=warning msg="the attribute `version` is obsolete, it will be ignored"
```

**Solution:**
This is just a warning and can be ignored. The docker-compose.yml has been updated to remove the version attribute.

### Issue 2: Docker API 500 Internal Server Error

**Error:**
```
unable to get image: request returned 500 Internal Server Error for API route
```

**Possible Causes and Solutions:**

#### Solution A: Restart Docker Desktop
1. Close Docker Desktop completely
2. Restart Docker Desktop
3. Wait for it to fully start (green icon in system tray)
4. Try again:
   ```bash
   docker-compose up --build
   ```

#### Solution B: Clean Docker System
```bash
# Stop all containers
docker stop $(docker ps -aq) 2>/dev/null || true

# Remove all containers
docker rm $(docker ps -aq) 2>/dev/null || true

# Remove all images
docker rmi $(docker images -q) 2>/dev/null || true

# Clean system
docker system prune -a -f

# Try building again
docker-compose up --build
```

#### Solution C: Use Direct Docker Commands
Instead of docker-compose, try building and running directly:

```bash
# Build the image
docker build -t tenbis-automation .

# Run the container
docker run -it --name tenbis-test -v "%cd%\logs:/app/logs" -v "%cd%\config.json:/app/config.json" tenbis-automation
```

#### Solution D: Check Docker Desktop Settings
1. Open Docker Desktop
2. Go to Settings → General
3. Ensure "Use Docker Compose V2" is enabled
4. Go to Settings → Resources
5. Ensure adequate memory is allocated (at least 2GB)
6. Restart Docker Desktop

### Issue 3: Volume Mount Issues on Windows

**Error:**
```
Error response from daemon: invalid mount config
```

**Solution:**
Use absolute paths for Windows:

```bash
# PowerShell
docker run -it --name tenbis-test -v "${PWD}\logs:/app/logs" -v "${PWD}\config.json:/app/config.json" tenbis-automation

# Command Prompt
docker run -it --name tenbis-test -v "%cd%\logs:/app/logs" -v "%cd%\config.json:/app/config.json" tenbis-automation
```

## Alternative Testing Methods

### Method 1: Test Without Docker (Node.js Required)

If Docker continues to have issues, you can test directly with Node.js:

```bash
# Install Node.js from https://nodejs.org (if not already installed)
# Then run:
npm install
node test.js
```

### Method 2: Simplified Docker Run

```bash
# Build image
docker build -t tenbis-automation .

# Run without volumes (logs will be inside container)
docker run -it --name tenbis-test tenbis-automation

# In another terminal, run tests
docker exec -it tenbis-test node test.js
```

### Method 3: Step-by-Step Docker Build

```bash
# Step 1: Build image with verbose output
docker build -t tenbis-automation . --progress=plain

# Step 2: Check if image was created
docker images | grep tenbis-automation

# Step 3: Run container
docker run -it --name tenbis-test tenbis-automation
```

## Verification Commands

### Check Docker Status
```bash
# Check Docker version
docker --version
docker-compose --version

# Check if Docker daemon is running
docker info

# List running containers
docker ps

# List all containers
docker ps -a

# List images
docker images
```

### Test Container Functionality
```bash
# Access container shell
docker exec -it tenbis-test /bin/bash

# Inside container, run tests
node test.js

# Check cron jobs
crontab -l

# Check timezone
date

# Check Node.js version
node --version
```

## Windows-Specific Solutions

### Enable WSL 2 (if using Windows)
1. Open PowerShell as Administrator
2. Run: `wsl --install`
3. Restart computer
4. In Docker Desktop Settings → General, ensure "Use the WSL 2 based engine" is checked

### File Sharing Issues
1. In Docker Desktop Settings → Resources → File Sharing
2. Add your project directory path
3. Apply & Restart

## Manual Testing Without Docker

If Docker continues to cause issues, you can test the system manually:

### Prerequisites
1. Install Node.js 18+ from https://nodejs.org
2. Install dependencies: `npm install`

### Run Tests
```bash
# Run all tests
node test.js

# Test with sample config
node test.js --sample-config

# Test individual components
node refresh-token.js
node load-credit.js --test
```

### Simulate Cron Environment
```bash
# Test scripts as they would run in cron
node refresh-token.js >> logs/cron.log 2>&1
node load-credit.js >> logs/cron.log 2>&1
```

## Getting Help

### Collect Debug Information
```bash
# Docker version info
docker version
docker-compose version

# System info
docker system info

# Container logs (if container exists)
docker logs tenbis-test

# Windows system info
systeminfo | findstr /B /C:"OS Name" /C:"OS Version"
```

### Common Docker Desktop Issues
1. **Insufficient Resources**: Increase memory allocation in Docker Desktop settings
2. **Antivirus Interference**: Add Docker Desktop to antivirus exclusions
3. **Windows Updates**: Ensure Windows is up to date
4. **WSL Issues**: Update WSL: `wsl --update`

## Success Indicators

When everything works correctly, you should see:
```
[INFO] Starting 10bis Automation in Docker...
[INFO] Current time: [timestamp]
[INFO] Timezone: Asia/Jerusalem
[INFO] Setting up cron jobs...
[INFO] Current crontab: [cron entries]
[INFO] Running system tests...
[INFO] ✅ All tests passed!
[INFO] System is running. Monitoring logs...
```

## Alternative: Use Linux VM

If Docker Desktop continues to cause issues, consider:
1. Install VirtualBox or VMware
2. Create Ubuntu VM
3. Transfer project files
4. Run natively on Linux

This provides the most accurate testing environment for your Linux server deployment.