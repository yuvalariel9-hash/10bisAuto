#!/usr/bin/env node

const utils = require('./utils');

class TokenRefresh {
    constructor() {
        this.logFile = 'refresh.log';
    }

    /**
     * Main function to refresh authentication tokens
     */
    async refreshTokens() {
        try {
            await utils.log('Starting token refresh process', this.logFile);
            
            // Read current configuration
            const config = await utils.readConfig();
            
            // Validate required fields for token refresh
            utils.validateConfig(config, ['RefreshToken']);
            
            // Prepare request options
            const requestOptions = {
                method: 'POST',
                url: 'https://api.10bis.co.il/api/v1/Authentication/RefreshToken',
                headers: {
                    'Accept': 'application/json, text/plain, */*',
                    'Language': 'he',
                    'X-App-Type': 'web',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36'
                },
                data: {
                    refreshToken: config.RefreshToken
                }
            };

            // Add cookie header if we have tokens
            if (config.AccessToken && config.RefreshToken) {
                requestOptions.headers['Cookie'] = `Authorization=${config.AccessToken}; RefreshToken=${config.RefreshToken}`;
            }

            await utils.log('Making refresh token request to 10bis API', this.logFile);
            
            // Make the API request
            const response = await utils.makeHttpRequest(requestOptions);
            
            // Check if response contains new tokens
            if (!response.data) {
                throw new Error('Empty response from refresh token API');
            }

            const responseData = response.data;
            
            // Extract new tokens from response
            const updates = {};
            
            if (responseData.AccessToken) {
                updates.AccessToken = responseData.AccessToken;
                await utils.log('New AccessToken received', this.logFile);
            }
            
            if (responseData.RefreshToken) {
                updates.RefreshToken = responseData.RefreshToken;
                await utils.log('New RefreshToken received', this.logFile);
            }

            // Update other fields if present in response
            if (responseData.Amount !== undefined) {
                updates.Amount = responseData.Amount;
                await utils.log('Amount updated from response', this.logFile);
            }

            if (Object.keys(updates).length === 0) {
                await utils.log('No token updates received from API', this.logFile);
                return;
            }

            // Update configuration file
            await utils.updateConfig(updates);
            
            await utils.log(`Token refresh completed successfully. Updated fields: ${Object.keys(updates).join(', ')}`, this.logFile);
            
        } catch (error) {
            const errorMessage = `Token refresh failed: ${error.message}`;
            await utils.log(errorMessage, 'error.log');
            await utils.log(errorMessage, this.logFile);
            
            // Exit with error code for cron monitoring
            process.exit(1);
        }
    }

    /**
     * Run the token refresh with proper error handling
     */
    async run() {
        try {
            await utils.log(`=== Token Refresh Started at ${utils.getCurrentTimeIsrael()} ===`, this.logFile);
            await this.refreshTokens();
            await utils.log(`=== Token Refresh Completed at ${utils.getCurrentTimeIsrael()} ===`, this.logFile);
            process.exit(0);
        } catch (error) {
            await utils.log(`=== Token Refresh Failed at ${utils.getCurrentTimeIsrael()}: ${error.message} ===`, this.logFile);
            process.exit(1);
        }
    }
}

// Run the script if called directly
if (require.main === module) {
    const tokenRefresh = new TokenRefresh();
    tokenRefresh.run();
}

module.exports = TokenRefresh;