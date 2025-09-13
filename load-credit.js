#!/usr/bin/env node

const utils = require('./utils');

class CreditLoader {
    constructor() {
        this.logFile = 'credit.log';
    }

    /**
     * Main function to load 10bis credit
     */
    async loadCredit() {
        try {
            await utils.log('Starting credit loading process', this.logFile);
            
            // Check if today is weekend (Friday or Saturday)
            if (utils.isWeekend()) {
                await utils.log('Skipping credit loading - today is weekend (Friday or Saturday)', this.logFile);
                return;
            }
            
            // Read current configuration
            const config = await utils.readConfig();
            
            // Validate required fields for credit loading
            utils.validateConfig(config, ['AccessToken', 'RefreshToken', 'Amount', 'MoneycardId']);
            
            // Prepare request options based on your specifications
            const requestOptions = {
                method: 'PATCH',
                url: 'https://api.10bis.co.il/api/v1/Payments/LoadTenbisCredit',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/plain, */*',
                    'Language': 'he',
                    'X-App-Type': 'web',
                    'Authorization': `Bearer ${config.AccessToken}`,
                    'Origin': 'https://www.10bis.co.il',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
                    'Cookie': `_gcl_au=1.1.283592624.1745399880; _ga=GA1.1.901790421.1745399881; Authorization=${config.AccessToken}; RefreshToken=${config.RefreshToken}`
                },
                data: {
                    amount: config.Amount,
                    moneycardIdToCharge: config.MoneycardId
                }
            };

            await utils.log(`Attempting to load credit: Amount=${config.Amount}, MoneycardId=${config.MoneycardId}`, this.logFile);
            
            // Make the API request
            const response = await utils.makeHttpRequest(requestOptions);
            
            // Log successful response
            await utils.log(`Credit loading API response status: ${response.status}`, this.logFile);
            
            if (response.data) {
                await utils.log(`Credit loading response: ${JSON.stringify(response.data)}`, this.logFile);
                
                // Check if the response indicates success
                if (response.status === 200 || response.status === 201) {
                    await utils.log('Credit loaded successfully!', this.logFile);
                } else {
                    await utils.log(`Unexpected response status: ${response.status}`, this.logFile);
                }
            } else {
                await utils.log('Credit loading completed - no response data', this.logFile);
            }
            
        } catch (error) {
            const errorMessage = `Credit loading failed: ${error.message}`;
            await utils.log(errorMessage, 'error.log');
            await utils.log(errorMessage, this.logFile);
            
            // If it's an authentication error, suggest token refresh
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                await utils.log('Authentication error detected - tokens may need refresh', this.logFile);
            }
            
            // Exit with error code for cron monitoring
            process.exit(1);
        }
    }

    /**
     * Run the credit loading with proper error handling
     */
    async run() {
        try {
            await utils.log(`=== Credit Loading Started at ${utils.getCurrentTimeIsrael()} ===`, this.logFile);
            await this.loadCredit();
            await utils.log(`=== Credit Loading Completed at ${utils.getCurrentTimeIsrael()} ===`, this.logFile);
            process.exit(0);
        } catch (error) {
            await utils.log(`=== Credit Loading Failed at ${utils.getCurrentTimeIsrael()}: ${error.message} ===`, this.logFile);
            process.exit(1);
        }
    }

    /**
     * Test function to check configuration without making API call
     */
    async testConfiguration() {
        try {
            await utils.log('Testing configuration for credit loading', this.logFile);
            
            const config = await utils.readConfig();
            utils.validateConfig(config, ['AccessToken', 'RefreshToken', 'Amount', 'MoneycardId']);
            
            await utils.log('Configuration test passed - all required fields present', this.logFile);
            await utils.log(`Amount: ${config.Amount}`, this.logFile);
            await utils.log(`MoneycardId: ${config.MoneycardId}`, this.logFile);
            await utils.log(`AccessToken: ${config.AccessToken ? 'Present' : 'Missing'}`, this.logFile);
            await utils.log(`RefreshToken: ${config.RefreshToken ? 'Present' : 'Missing'}`, this.logFile);
            
            return true;
        } catch (error) {
            await utils.log(`Configuration test failed: ${error.message}`, this.logFile);
            return false;
        }
    }
}

// Run the script if called directly
if (require.main === module) {
    const creditLoader = new CreditLoader();
    
    // Check if running in test mode
    if (process.argv.includes('--test')) {
        creditLoader.testConfiguration().then(success => {
            process.exit(success ? 0 : 1);
        });
    } else {
        creditLoader.run();
    }
}

module.exports = CreditLoader;