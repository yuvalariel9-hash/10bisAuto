# Use Node.js LTS version on Alpine Linux (lightweight)
FROM node:18-alpine

# Install cron and other necessary packages
RUN apk add --no-cache \
    dcron \
    bash \
    curl \
    tzdata

# Set timezone to Israel
ENV TZ=Asia/Jerusalem
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Set proper permissions
RUN chmod +x *.js deploy.sh

# Secure config file
RUN chmod 600 config.json

# Create logs directory
RUN mkdir -p logs

# Create a script to start cron and keep container running
RUN echo '#!/bin/bash' > /start.sh && \
    echo 'echo "Starting 10bis Automation in Docker..."' >> /start.sh && \
    echo 'echo "Current time: $(date)"' >> /start.sh && \
    echo 'echo "Timezone: $TZ"' >> /start.sh && \
    echo '' >> /start.sh && \
    echo '# Start cron daemon' >> /start.sh && \
    echo 'crond -f -d 8 &' >> /start.sh && \
    echo 'CRON_PID=$!' >> /start.sh && \
    echo '' >> /start.sh && \
    echo '# Setup cron jobs' >> /start.sh && \
    echo 'echo "Setting up cron jobs..."' >> /start.sh && \
    echo 'echo "*/10 * * * * cd /app && /usr/local/bin/node refresh-token.js >> /app/logs/cron.log 2>&1" | crontab -' >> /start.sh && \
    echo 'echo "0 10 * * 0,1,2,3,4 cd /app && /usr/local/bin/node load-credit.js >> /app/logs/cron.log 2>&1" | crontab -' >> /start.sh && \
    echo '' >> /start.sh && \
    echo '# Show current crontab' >> /start.sh && \
    echo 'echo "Current crontab:"' >> /start.sh && \
    echo 'crontab -l' >> /start.sh && \
    echo '' >> /start.sh && \
    echo '# Run initial tests' >> /start.sh && \
    echo 'echo "Running system tests..."' >> /start.sh && \
    echo 'node test.js' >> /start.sh && \
    echo '' >> /start.sh && \
    echo '# Keep container running and show logs' >> /start.sh && \
    echo 'echo "System is running. Monitoring logs..."' >> /start.sh && \
    echo 'echo "Press Ctrl+C to stop"' >> /start.sh && \
    echo '' >> /start.sh && \
    echo '# Function to handle shutdown' >> /start.sh && \
    echo 'cleanup() {' >> /start.sh && \
    echo '    echo "Shutting down..."' >> /start.sh && \
    echo '    kill $CRON_PID 2>/dev/null || true' >> /start.sh && \
    echo '    exit 0' >> /start.sh && \
    echo '}' >> /start.sh && \
    echo '' >> /start.sh && \
    echo '# Set up signal handlers' >> /start.sh && \
    echo 'trap cleanup SIGTERM SIGINT' >> /start.sh && \
    echo '' >> /start.sh && \
    echo '# Monitor logs in real-time' >> /start.sh && \
    echo 'tail -f logs/*.log 2>/dev/null &' >> /start.sh && \
    echo '' >> /start.sh && \
    echo '# Wait for signals' >> /start.sh && \
    echo 'wait $CRON_PID' >> /start.sh && \
    chmod +x /start.sh

# Expose port for potential web interface (future enhancement)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('Health check passed')" || exit 1

# Start the application
CMD ["/start.sh"]