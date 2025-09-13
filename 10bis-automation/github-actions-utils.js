const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

class GitHubActionsUtils {
    constructor() {
        this.logsDir = path.join(__dirname, 'logs');
        this.ensureLogsDirectory();
    }

    /**
     * Ensure logs directory exists
     */
    async ensureLogsDirectory() {
        try {
            await fs.ensureDir(this.logsDir);
        } catch (error) {
            console.error('Failed to create logs directory:', error.message);
        }
    }

    /**
     * Log message to console and file (GitHub Actions compatible)
     */
    async log(message, logFile = 'general.log') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        
        // Log to console (GitHub Actions will capture this)
        console.log(logMessage);
        
        // Also log to file for artifact upload
        try {
            const logPath = path.join(this.logsDir, logFile);
            await fs.appendFile(logPath, logMessage + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error.message);
        }
    }

    /**
     * Read configuration from environment or config file
     */
    getConfig() {
        // Try environment variables first (GitHub Actions)
        if (process.env.ACCESS_TOKEN || process.env.GITHUB_ACTIONS) {
            return {
                AccessToken: process.env.ACCESS_TOKEN,
                RefreshToken: process.env.REFRESH_TOKEN,
                Amount: process.env.AMOUNT,
                MoneycardId: process.env.MONEYCARD_ID
            };
        }

        // Fallback to config file for local development
        try {
            const configPath = path.join(__dirname, 'config.json');
            if (fs.existsSync(configPath)) {
                return fs.readJsonSync(configPath);
            }
        } catch (error) {
            console.error('Error reading config file:', error.message);
        }

        throw new Error('No configuration found. Set environment variables or create config.json');
    }

    /**
     * Update configuration (for GitHub Actions, output new tokens)
     */
    async updateConfig(updates) {
        // In GitHub Actions, we output the new tokens for the workflow to handle
        if (process.env.GITHUB_ACTIONS) {
            if (updates.AccessToken) {
                console.log(`::add-mask::${updates.AccessToken}`);
                console.log(`::set-output name=access_token::${updates.AccessToken}`);
            }
            if (updates.RefreshToken) {
                console.log(`::add-mask::${updates.RefreshToken}`);
                console.log(`::set-output name=refresh_token::${updates.RefreshToken}`);
            }
            await this.log(`Tokens updated for GitHub Actions: ${Object.keys(updates).join(', ')}`);
            return;
        }

        // For local development, update the config file
        try {
            const configPath = path.join(__dirname, 'config.json');
            let currentConfig = {};
            
            if (fs.existsSync(configPath)) {
                currentConfig = fs.readJsonSync(configPath);
            }
            
            const newConfig = { ...currentConfig, ...updates };
            fs.writeJsonSync(configPath, newConfig, { spaces: 2 });
            await this.log(`Configuration updated: ${Object.keys(updates).join(', ')}`);
        } catch (error) {
            await this.log(`Error updating config: ${error.message}`, 'error.log');
            throw error;
        }
    }

    /**
     * Make HTTP request with retry logic
     */
    async makeHttpRequest(options, retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                await this.log(`Making HTTP request (attempt ${attempt}/${retries}): ${options.method} ${options.url}`);
                
                const response = await axios({
                    ...options,
                    timeout: 30000, // 30 second timeout
                    validateStatus: (status) => status < 500 // Don't throw on 4xx errors
                });

                if (response.status >= 400) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                await this.log(`HTTP request successful: ${response.status}`);
                return response;
            } catch (error) {
                const errorMessage = `HTTP request failed (attempt ${attempt}/${retries}): ${error.message}`;
                await this.log(errorMessage, 'error.log');
                
                if (attempt === retries) {
                    throw new Error(`All ${retries} attempts failed. Last error: ${error.message}`);
                }
                
                // Wait before retry (exponential backoff)
                const waitTime = Math.pow(2, attempt) * 1000;
                await this.log(`Waiting ${waitTime}ms before retry...`);
                await this.sleep(waitTime);
            }
        }
    }

    /**
     * Sleep for specified milliseconds
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Check if current day is Friday (5) or Saturday (6)
     */
    isWeekend() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        return dayOfWeek === 5 || dayOfWeek === 6; // Friday or Saturday
    }

    /**
     * Get current time in Israel timezone
     */
    getCurrentTimeIsrael() {
        return new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Jerusalem',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * Validate required config fields
     */
    validateConfig(config, requiredFields) {
        const missingFields = requiredFields.filter(field => !config[field] || config[field].trim() === '');
        if (missingFields.length > 0) {
            throw new Error(`Missing required configuration fields: ${missingFields.join(', ')}`);
        }
    }

    /**
     * Set GitHub Actions output
     */
    setOutput(name, value) {
        if (process.env.GITHUB_ACTIONS) {
            console.log(`::set-output name=${name}::${value}`);
        }
    }

    /**
     * Mask sensitive value in GitHub Actions
     */
    maskValue(value) {
        if (process.env.GITHUB_ACTIONS && value) {
            console.log(`::add-mask::${value}`);
        }
    }
}

module.exports = new GitHubActionsUtils();