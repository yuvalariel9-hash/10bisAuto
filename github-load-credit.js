#!/usr/bin/env node

const utils = require('./github-actions-utils');
const GitHubTeamsNotifier = require('./github-teams-notifier');

class GitHubCreditLoader {
    constructor() {
        this.logFile = 'credit.log';
        this.teamsNotifier = null;
    }

    /**
     * Initialize Teams notifier if configuration is available
     */
    async initializeTeamsNotifier() {
        try {
            const teamsConfig = {
                tenantId: process.env.TEAMS_TENANT_ID,
                clientId: process.env.TEAMS_CLIENT_ID,
                clientSecret: process.env.TEAMS_CLIENT_SECRET,
                userId: process.env.TEAMS_USER_ID
            };

            if (teamsConfig.tenantId && teamsConfig.clientId && teamsConfig.clientSecret && teamsConfig.userId) {
                this.teamsNotifier = new GitHubTeamsNotifier(teamsConfig, utils);
                await utils.log('Teams notifier initialized for direct messaging');
            } else {
                await utils.log('Teams configuration not complete - notifications disabled');
                await utils.log('Required: TEAMS_TENANT_ID, TEAMS_CLIENT_ID, TEAMS_CLIENT_SECRET, TEAMS_USER_ID');
            }
        } catch (error) {
            await utils.log(`Failed to initialize Teams notifier: ${error.message}`, 'error.log');
        }
    }

    /**
     * Main function to load 10bis credit
     */
    async loadCredit() {
        const timestamp = utils.getCurrentTimeIsrael();
        let amount = 'Unknown';
        
        try {
            await utils.log('Starting credit loading process', this.logFile);
            
            // Initialize Teams notifier
            await this.initializeTeamsNotifier();
            
            // Check if today is weekend (Friday or Saturday)
            if (utils.isWeekend()) {
                await utils.log('Skipping credit loading - today is weekend (Friday or Saturday)', this.logFile);
                if (process.env.GITHUB_ACTIONS) {
                    await utils.setOutput('credit_loaded', 'skipped_weekend');
                }
                return;
            }
            
            // Read current configuration
            const config = utils.getConfig();
            amount = config.Amount;
            
            // Validate required fields for credit loading
            utils.validateConfig(config, ['AccessToken', 'RefreshToken', 'Amount', 'MoneycardId']);
            
            // Mask sensitive values
            utils.maskValue(config.AccessToken);
            utils.maskValue(config.RefreshToken);
            
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
                    amount: parseInt(config.Amount, 10),
                    moneycardIdToCharge: parseInt(config.MoneycardId, 10)
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
                    if (process.env.GITHUB_ACTIONS) {
                        await utils.setOutput('credit_loaded', 'success');
                        await utils.setOutput('amount_loaded', config.Amount);
                    }
                    
                    // Send success notification to Teams
                    if (this.teamsNotifier) {
                        await this.teamsNotifier.sendSuccessNotification(amount, timestamp);
                    }
                } else {
                    await utils.log(`Unexpected response status: ${response.status}`, this.logFile);
                    if (process.env.GITHUB_ACTIONS) {
                        await utils.setOutput('credit_loaded', 'unexpected_status');
                        await utils.setOutput('response_status', response.status.toString());
                    }
                    
                    // Send failure notification to Teams
                    if (this.teamsNotifier) {
                        await this.teamsNotifier.sendFailureNotification(amount, timestamp, `Unexpected response status: ${response.status}`);
                    }
                }
            } else {
                await utils.log('Credit loading completed - no response data', this.logFile);
                if (process.env.GITHUB_ACTIONS) {
                    await utils.setOutput('credit_loaded', 'no_response_data');
                }
                
                // Send failure notification to Teams (no response data might indicate an issue)
                if (this.teamsNotifier) {
                    await this.teamsNotifier.sendFailureNotification(amount, timestamp, 'No response data received');
                }
            }
            
        } catch (error) {
            const errorMessage = `Credit loading failed: ${error.message}`;
            await utils.log(errorMessage, 'error.log');
            await utils.log(errorMessage, this.logFile);
            
            // Set failure output for GitHub Actions
            if (process.env.GITHUB_ACTIONS) {
                await utils.setOutput('credit_loaded', 'failed');
                await utils.setOutput('error', error.message);
            }
            
            // Send failure notification to Teams
            if (this.teamsNotifier) {
                await this.teamsNotifier.sendFailureNotification(amount, timestamp, error.message);
            }
            
            // If it's an authentication error, suggest token refresh
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                await utils.log('Authentication error detected - tokens may need refresh', this.logFile);
                if (process.env.GITHUB_ACTIONS) {
                    await utils.setOutput('auth_error', 'true');
                }
            }
            
            // Exit with error code for monitoring
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
            
            const config = utils.getConfig();
            utils.validateConfig(config, ['AccessToken', 'RefreshToken', 'Amount', 'MoneycardId']);
            
            await utils.log('Configuration test passed - all required fields present', this.logFile);
            await utils.log(`Amount: ${config.Amount}`, this.logFile);
            await utils.log(`MoneycardId: ${config.MoneycardId}`, this.logFile);
            await utils.log(`AccessToken: ${config.AccessToken ? 'Present' : 'Missing'}`, this.logFile);
            await utils.log(`RefreshToken: ${config.RefreshToken ? 'Present' : 'Missing'}`, this.logFile);
            
            if (process.env.GITHUB_ACTIONS) {
                await utils.setOutput('config_test', 'passed');
            }
            
            return true;
        } catch (error) {
            await utils.log(`Configuration test failed: ${error.message}`, this.logFile);
            if (process.env.GITHUB_ACTIONS) {
                await utils.setOutput('config_test', 'failed');
                await utils.setOutput('config_error', error.message);
            }
            return false;
        }
    }
}

// Run the script if called directly
if (require.main === module) {
    const creditLoader = new GitHubCreditLoader();
    
    // Check if running in test mode
    if (process.argv.includes('--test')) {
        creditLoader.testConfiguration().then(success => {
            process.exit(success ? 0 : 1);
        });
    } else {
        creditLoader.run();
    }
}

module.exports = GitHubCreditLoader;