#!/usr/bin/env node

const utils = require('./github-actions-utils');

class GitHubTokenRefresh {
    constructor() {
        this.logFile = 'refresh.log';
    }

    /**
     * Extract tokens from response headers/cookies
     */
    async extractTokensFromHeaders(response) {
        const tokens = {};
        
        try {
            // Method 1: Check for tokens in Set-Cookie headers
            const setCookieHeaders = response.headers['set-cookie'] || [];
            
            for (const cookie of setCookieHeaders) {
                // Extract Authorization token from Set-Cookie
                const authMatch = cookie.match(/Authorization=([^;]+)/);
                if (authMatch) {
                    tokens.AccessToken = authMatch[1];
                    utils.maskValue(authMatch[1]);
                    await utils.log('AccessToken extracted from Set-Cookie header', this.logFile);
                }
                
                // Extract RefreshToken from Set-Cookie
                const refreshMatch = cookie.match(/RefreshToken=([^;]+)/);
                if (refreshMatch) {
                    tokens.RefreshToken = refreshMatch[1];
                    utils.maskValue(refreshMatch[1]);
                    await utils.log('RefreshToken extracted from Set-Cookie header', this.logFile);
                }
            }
            
            // Method 2: Check for tokens in Authorization header
            if (response.headers['authorization']) {
                tokens.AccessToken = response.headers['authorization'].replace(/^Bearer\s+/i, '');
                utils.maskValue(tokens.AccessToken);
                await utils.log('AccessToken extracted from Authorization header', this.logFile);
            }
            
            // Method 3: Check for custom headers (adjust header names as needed)
            if (response.headers['x-access-token']) {
                tokens.AccessToken = response.headers['x-access-token'];
                utils.maskValue(tokens.AccessToken);
                await utils.log('AccessToken extracted from X-Access-Token header', this.logFile);
            }
            
            if (response.headers['x-refresh-token']) {
                tokens.RefreshToken = response.headers['x-refresh-token'];
                utils.maskValue(tokens.RefreshToken);
                await utils.log('RefreshToken extracted from X-Refresh-Token header', this.logFile);
            }
            
        } catch (error) {
            await utils.log(`Error extracting tokens from headers: ${error.message}`, this.logFile);
        }
        
        return tokens;
    }

    /**
     * Main function to refresh authentication tokens
     */
    async refreshTokens() {
        try {
            await utils.log('Starting token refresh process', this.logFile);
            
            // Read current configuration
            const config = utils.getConfig();
            
            // Validate required fields for token refresh
            utils.validateConfig(config, ['RefreshToken']);
            
            // Mask sensitive values
            utils.maskValue(config.AccessToken);
            utils.maskValue(config.RefreshToken);
            
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
            
            // Check if we got a response
            if (!response) {
                throw new Error('No response from refresh token API');
            }

            await utils.log('Response received, extracting tokens from headers/cookies', this.logFile);

            // Extract new tokens from response headers/cookies
            const headerTokens = await this.extractTokensFromHeaders(response);
            
            // Also check response body as fallback (keep your original logic as backup)
            const bodyTokens = {};
            if (response.data) {
                if (response.data.AccessToken) {
                    bodyTokens.AccessToken = response.data.AccessToken;
                    utils.maskValue(response.data.AccessToken);
                    await utils.log('AccessToken found in response body (fallback)', this.logFile);
                }
                
                if (response.data.RefreshToken) {
                    bodyTokens.RefreshToken = response.data.RefreshToken;
                    utils.maskValue(response.data.RefreshToken);
                    await utils.log('RefreshToken found in response body (fallback)', this.logFile);
                }
            }

            // Merge tokens (headers take priority over body)
            const updates = { ...bodyTokens, ...headerTokens };

            // Update other fields if present in response body
            if (response.data && response.data.Amount !== undefined) {
                updates.Amount = response.data.Amount;
                await utils.log('Amount updated from response', this.logFile);
            }

            if (Object.keys(updates).length === 0) {
                await utils.log('No token updates received from API (neither headers nor body)', this.logFile);
                
                // Log response headers for debugging
                await utils.log(`Response headers: ${JSON.stringify(response.headers, null, 2)}`, this.logFile);
                return;
            }

            // Log what tokens were found and from where
            const headerTokenCount = Object.keys(headerTokens).length;
            const bodyTokenCount = Object.keys(bodyTokens).length;
            await utils.log(`Tokens extracted - Headers: ${headerTokenCount}, Body: ${bodyTokenCount}`, this.logFile);

            // Update configuration
            await utils.updateConfig(updates);
            
            // Set outputs for GitHub Actions
            if (process.env.GITHUB_ACTIONS) {
                if (updates.AccessToken) {
                    utils.setOutput('access_token', updates.AccessToken);
                }
                if (updates.RefreshToken) {
                    utils.setOutput('refresh_token', updates.RefreshToken);
                }
                utils.setOutput('tokens_updated', 'true');
            }
            
            await utils.log(`Token refresh completed successfully. Updated fields: ${Object.keys(updates).join(', ')}`, this.logFile);
            
        } catch (error) {
            const errorMessage = `Token refresh failed: ${error.message}`;
            await utils.log(errorMessage, 'error.log');
            await utils.log(errorMessage, this.logFile);
            
            // Set failure output for GitHub Actions
            if (process.env.GITHUB_ACTIONS) {
                utils.setOutput('tokens_updated', 'false');
                utils.setOutput('error', error.message);
            }
            
            // Exit with error code for monitoring
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
    const tokenRefresh = new GitHubTokenRefresh();
    tokenRefresh.run();
}

module.exports = GitHubTokenRefresh;
