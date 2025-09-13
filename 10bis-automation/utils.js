const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

class Utils {
    constructor() {
        this.configPath = path.join(__dirname, 'config.json');
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
     * Log message to file and console
     */
    async log(message, logFile = 'general.log') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        
        console.log(logMessage);
        
        try {
            const logPath = path.join(this.logsDir, logFile);
            await fs.appendFile(logPath, logMessage + '\n');
        } catch (error) {
            console.error('Failed to write to log file:', error.message);
        }
    }

    /**
     * Read configuration from config.json
     */
    async readConfig() {
        try {
            const configExists = await fs.pathExists(this.configPath);
            if (!configExists) {
                throw new Error('Config file does not exist');
            }
            
            const configData = await fs.readJson(this.configPath);
            return configData;
        } catch (error) {
            await this.log(`Error reading config: ${error.message}`, 'error.log');
            throw error;
        }
    }

    /**
     * Write configuration to config.json
     */
    async writeConfig(config) {
        try {
            // Create backup before writing
            const backupPath = this.configPath + '.backup';
            if (await fs.pathExists(this.configPath)) {
                await fs.copy(this.configPath, backupPath);
            }
            
            await fs.writeJson(this.configPath, config, { spaces: 2 });
            await this.log('Configuration updated successfully');
        } catch (error) {
            await this.log(`Error writing config: ${error.message}`, 'error.log');
            throw error;
        }
    }

    /**
     * Update specific fields in configuration
     */
    async updateConfig(updates) {
        try {
            const currentConfig = await this.readConfig();
            const newConfig = { ...currentConfig, ...updates };
            await this.writeConfig(newConfig);
            return newConfig;
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
}

module.exports = new Utils();