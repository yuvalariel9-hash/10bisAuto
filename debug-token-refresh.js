#!/usr/bin/env node

const utils = require('./utils');

class TokenRefreshDebugger {
    constructor() {
        this.logFile = 'debug-token-refresh.log';
    }

    /**
     * Debug token refresh with detailed logging
     */
    async debugRefresh() {
        try {
            await utils.log('=== TOKEN REFRESH DEBUG SESSION ===', this.logFile);
            await utils.log(`Debug started at: ${utils.getCurrentTimeIsrael()}`, this.logFile);
            
            // Read current configuration
            const config = await utils.readConfig();
            
            // Show current configuration (masked)
            await utils.log('=== CURRENT CONFIGURATION ===', this.logFile);
            await utils.log(`AccessToken: ${config.AccessToken ? config.AccessToken.substring(0, 20) + '...' + config.AccessToken.substring(config.AccessToken.length - 10) : 'NOT_SET'}`, this.logFile);
            await utils.log(`RefreshToken: ${config.RefreshToken ? config.RefreshToken.substring(0, 20) + '...' + config.RefreshToken.substring(config.RefreshToken.length - 10) : 'NOT_SET'}`, this.logFile);
            await utils.log(`Amount: ${config.Amount || 'NOT_SET'}`, this.logFile);
            await utils.log(`MoneycardId: ${config.MoneycardId || 'NOT_SET'}`, this.logFile);
            await utils.log(`TeamsWebhookUrl: ${config.TeamsWebhookUrl ? 'SET' : 'NOT_SET'}`, this.logFile);
            
            if (!config.RefreshToken) {
                await utils.log('ERROR: RefreshToken is missing from configuration!', this.logFile);
                return false;
            }
            
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
                await utils.log('Cookie header added to request', this.logFile);
            } else {
                await utils.log('No cookie header added (missing tokens)', this.logFile);
            }

            await utils.log('=== REQUEST DETAILS ===', this.logFile);
            await utils.log(`URL: ${requestOptions.url}`, this.logFile);
            await utils.log(`Method: ${requestOptions.method}`, this.logFile);
            await utils.log(`Headers: ${JSON.stringify(requestOptions.headers, null, 2)}`, this.logFile);
            await utils.log(`Payload refreshToken: ${config.RefreshToken.substring(0, 20)}...${config.RefreshToken.substring(config.RefreshToken.length - 10)}`, this.logFile);
            
            await utils.log('=== MAKING API REQUEST ===', this.logFile);
            
            try {
                // Make the API request with detailed error handling
                const response = await utils.makeHttpRequest(requestOptions);
                
                await utils.log('=== RESPONSE DETAILS ===', this.logFile);
                await utils.log(`Status: ${response.status}`, this.logFile);
                await utils.log(`Status Text: ${response.statusText}`, this.logFile);
                await utils.log(`Headers: ${JSON.stringify(response.headers, null, 2)}`, this.logFile);
                
                if (response.data) {
                    await utils.log(`Response Data Type: ${typeof response.data}`, this.logFile);
                    await utils.log(`Response Data Keys: ${Object.keys(response.data).join(', ')}`, this.logFile);
                    await utils.log(`Full Response Data: ${JSON.stringify(response.data, null, 2)}`, this.logFile);
                    
                    // Check for tokens in response
                    if (response.data.AccessToken) {
                        await utils.log(`✅ AccessToken found in response: ${response.data.AccessToken.substring(0, 20)}...${response.data.AccessToken.substring(response.data.AccessToken.length - 10)}`, this.logFile);
                        await utils.log(`AccessToken length: ${response.data.AccessToken.length}`, this.logFile);
                    } else {
                        await utils.log('❌ No AccessToken in response data', this.logFile);
                    }
                    
                    if (response.data.RefreshToken) {
                        await utils.log(`✅ RefreshToken found in response: ${response.data.RefreshToken.substring(0, 20)}...${response.data.RefreshToken.substring(response.data.RefreshToken.length - 10)}`, this.logFile);
                        await utils.log(`RefreshToken length: ${response.data.RefreshToken.length}`, this.logFile);
                    } else {
                        await utils.log('❌ No RefreshToken in response data', this.logFile);
                    }
                } else {
                    await utils.log('❌ No response data received', this.logFile);
                }
                
                // Check Set-Cookie headers
                const setCookieHeaders = response.headers['set-cookie'] || [];
                if (setCookieHeaders.length > 0) {
                    await utils.log('=== SET-COOKIE HEADERS ===', this.logFile);
                    for (let i = 0; i < setCookieHeaders.length; i++) {
                        await utils.log(`Cookie ${i + 1}: ${setCookieHeaders[i]}`, this.logFile);
                    }
                } else {
                    await utils.log('❌ No Set-Cookie headers found', this.logFile);
                }
                
                await utils.log('=== DEBUG SESSION COMPLETED SUCCESSFULLY ===', this.logFile);
                return true;
                
            } catch (apiError) {
                await utils.log('=== API REQUEST FAILED ===', this.logFile);
                await utils.log(`Error: ${apiError.message}`, this.logFile);
                await utils.log(`Error Stack: ${apiError.stack}`, this.logFile);
                
                if (apiError.response) {
                    await utils.log(`Error Response Status: ${apiError.response.status}`, this.logFile);
                    await utils.log(`Error Response Headers: ${JSON.stringify(apiError.response.headers, null, 2)}`, this.logFile);
                    await utils.log(`Error Response Data: ${JSON.stringify(apiError.response.data, null, 2)}`, this.logFile);
                }
                
                return false;
            }
            
        } catch (error) {
            await utils.log(`=== DEBUG SESSION FAILED ===`, this.logFile);
            await utils.log(`Error: ${error.message}`, this.logFile);
            await utils.log(`Error Stack: ${error.stack}`, this.logFile);
            return false;
        }
    }

    /**
     * Show current token status
     */
    async showTokenStatus() {
        try {
            const config = await utils.readConfig();
            
            console.log('\n=== CURRENT TOKEN STATUS ===');
            console.log(`AccessToken: ${config.AccessToken ? '✅ SET (' + config.AccessToken.length + ' chars)' : '❌ NOT SET'}`);
            console.log(`RefreshToken: ${config.RefreshToken ? '✅ SET (' + config.RefreshToken.length + ' chars)' : '❌ NOT SET'}`);
            console.log(`Amount: ${config.Amount || '❌ NOT SET'}`);
            console.log(`MoneycardId: ${config.MoneycardId || '❌ NOT SET'}`);
            console.log(`TeamsWebhookUrl: ${config.TeamsWebhookUrl ? '✅ SET' : '❌ NOT SET'}`);
            
            if (config.AccessToken) {
                console.log(`\nAccessToken preview: ${config.AccessToken.substring(0, 20)}...${config.AccessToken.substring(config.AccessToken.length - 10)}`);
            }
            if (config.RefreshToken) {
                console.log(`RefreshToken preview: ${config.RefreshToken.substring(0, 20)}...${config.RefreshToken.substring(config.RefreshToken.length - 10)}`);
            }
            
        } catch (error) {
            console.error('Error reading configuration:', error.message);
        }
    }
}

// Run the script if called directly
if (require.main === module) {
    const tokenDebugger = new TokenRefreshDebugger();
    
    if (process.argv.includes('--status')) {
        tokenDebugger.showTokenStatus();
    } else {
        console.log('Starting token refresh debug session...');
        console.log('Check logs/debug-token-refresh.log for detailed output');
        
        tokenDebugger.debugRefresh().then(success => {
            if (success) {
                console.log('✅ Debug session completed successfully');
                console.log('Check logs/debug-token-refresh.log for detailed analysis');
            } else {
                console.log('❌ Debug session failed');
                console.log('Check logs/debug-token-refresh.log for error details');
            }
            process.exit(success ? 0 : 1);
        });
    }
}

module.exports = TokenRefreshDebugger;