# Docker Testing Guide for 10bis Automation

This guide explains how to test the 10bis automation system using Docker Desktop on Windows, Mac, or Linux.

## Prerequisites

- Docker Desktop installed and running
- Basic familiarity with Docker commands
- The 10bis automation project files

## Quick Start

### 1. Build and Run with Docker Compose (Recommended)

```bash
# Navigate to the project directory
cd 10bis-automation

# Build and start the container
docker-compose up --build
```

This will:
- Build the Docker image
- Start the container with cron jobs
- Show real-time logs
- Set up proper timezone (Israel)

### 2. Alternative: Build and Run with Docker Commands

```bash
# Build the image
docker build -t tenbis-automation .

# Run the container
docker run -it --name tenbis-test \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/config.json:/app/config.json \
  tenbis-automation
```

## Testing Scenarios

### Scenario 1: Basic System Test (No API Calls)

This tests the system without making actual API calls to 10bis:

```bash
# Start container in test mode
docker-compose up --build

# In another terminal, run tests inside container
docker exec -it tenbis-automation node test.js

# Test with sample configuration
docker exec -it tenbis-automation node test.js --sample-config
```

### Scenario 2: Configuration Test

Test the configuration management:

```bash
# Access the container shell
docker exec -it tenbis-automation /bin/bash

# Inside container, test configuration
node load-credit.js --test

# Check weekend detection
node -e "const utils = require('./utils'); console.log('Is weekend:', utils.isWeekend());"
```

### Scenario 3: Cron Job Testing

Test the cron job scheduling:

```bash
# View current crontab inside container
docker exec -it tenbis-automation crontab -l

# Check cron logs
docker exec -it tenbis-automation tail -f logs/cron.log

# Manually trigger scripts (for testing)
docker exec -it tenbis-automation node refresh-token.js
docker exec -it tenbis-automation node load-credit.js
```

### Scenario 4: Full Integration Test (With Real Credentials)

⚠️ **Warning**: This will make actual API calls to 10bis. Only use with valid credentials and small amounts.

1. **Update config.json with real credentials:**
   ```json
   {
     "AccessToken": "your_real_access_token",
     "RefreshToken": "your_real_refresh_token",
     "Amount": "1",
     "MoneycardId": "your_real_moneycard_id"
   }
   ```

2. **Run the container:**
   ```bash
   docker-compose up --build
   ```

3. **Monitor the logs:**
   ```bash
   # In another terminal
   docker exec -it tenbis-automation tail -f logs/refresh.log
   docker exec -it tenbis-automation tail -f logs/credit.log
   ```

## Docker Commands Reference

### Container Management

```bash
# Start container in background
docker-compose up -d

# Stop container
docker-compose down

# View logs
docker-compose logs -f

# Restart container
docker-compose restart

# Access container shell
docker exec -it tenbis-automation /bin/bash
```

### Monitoring and Debugging

```bash
# Check container status
docker ps

# View container logs
docker logs tenbis-automation

# Check container health
docker inspect tenbis-automation | grep -A 10 "Health"

# View resource usage
docker stats tenbis-automation
```

### File Operations

```bash
# Copy files from container
docker cp tenbis-automation:/app/logs/refresh.log ./refresh.log

# Copy files to container
docker cp ./new-config.json tenbis-automation:/app/config.json

# View files inside container
docker exec -it tenbis-automation ls -la logs/
```

## Testing Schedule

The Docker container runs with Israel timezone and the following schedule:

- **Token Refresh**: Every 10 minutes
- **Credit Loading**: Daily at 10:00 AM (excluding Friday/Saturday)

### Testing Different Times

To test the scheduling logic without waiting:

```bash
# Test weekend detection
docker exec -it tenbis-automation node -e "
const utils = require('./utils');
console.log('Current time (Israel):', utils.getCurrentTimeIsrael());
console.log('Is weekend:', utils.isWeekend());
"

# Manually trigger scripts
docker exec -it tenbis-automation node refresh-token.js
docker exec -it tenbis-automation node load-credit.js
```

## Troubleshooting

### Common Issues

1. **Container won't start:**
   ```bash
   # Check Docker Desktop is running
   docker version
   
   # Check for port conflicts
   docker ps -a
   
   # Remove old containers
   docker-compose down
   docker system prune
   ```

2. **Cron jobs not running:**
   ```bash
   # Check cron service inside container
   docker exec -it tenbis-automation ps aux | grep cron
   
   # Check crontab
   docker exec -it tenbis-automation crontab -l
   
   # Check timezone
   docker exec -it tenbis-automation date
   ```

3. **Permission errors:**
   ```bash
   # Check file permissions
   docker exec -it tenbis-automation ls -la
   
   # Fix permissions if needed
   docker exec -it tenbis-automation chmod +x *.js
   ```

4. **Network issues:**
   ```bash
   # Test internet connectivity from container
   docker exec -it tenbis-automation curl -I https://api.10bis.co.il
   
   # Check DNS resolution
   docker exec -it tenbis-automation nslookup api.10bis.co.il
   ```

## Log Analysis

### View Different Log Types

```bash
# Refresh token logs
docker exec -it tenbis-automation tail -f logs/refresh.log

# Credit loading logs
docker exec -it tenbis-automation tail -f logs/credit.log

# Error logs
docker exec -it tenbis-automation tail -f logs/error.log

# Cron execution logs
docker exec -it tenbis-automation tail -f logs/cron.log

# All logs combined
docker exec -it tenbis-automation tail -f logs/*.log
```

### Log Analysis Commands

```bash
# Count successful operations
docker exec -it tenbis-automation grep -c "successfully" logs/refresh.log

# Find errors
docker exec -it tenbis-automation grep -i "error\|failed" logs/*.log

# Check last 24 hours of activity
docker exec -it tenbis-automation find logs/ -name "*.log" -exec grep "$(date -d '1 day ago' '+%Y-%m-%d')" {} +
```

## Cleanup

### Stop and Remove Everything

```bash
# Stop and remove containers
docker-compose down

# Remove images (optional)
docker rmi tenbis-automation

# Clean up Docker system (optional)
docker system prune -a
```

### Keep Logs

The logs are mounted as volumes, so they persist even after container removal. To clean logs:

```bash
# Clear all logs
rm -rf logs/*

# Or keep only recent logs
find logs/ -name "*.log" -exec tail -n 100 {} \; > {}.tmp && mv {}.tmp {}
```

## Production Deployment

After successful Docker testing, you can deploy to production using:

1. **Docker on production server:**
   ```bash
   # Copy project to server
   scp -r 10bis-automation/ user@server:/home/user/
   
   # On server
   cd 10bis-automation
   docker-compose up -d
   ```

2. **Traditional Linux deployment:**
   Use the regular deployment guide in `DEPLOYMENT.md`

## Security Notes

- Never commit real credentials to version control
- Use environment variables for sensitive data in production
- Regularly update the base Docker image
- Monitor logs for suspicious activity

## Support

If you encounter issues:
1. Check the container logs: `docker-compose logs`
2. Run the test suite: `docker exec -it tenbis-automation node test.js`
3. Verify configuration: `docker exec -it tenbis-automation node load-credit.js --test`
4. Check the main documentation in `README.md`

This Docker setup provides a complete Linux environment for testing the 10bis automation system safely before production deployment.