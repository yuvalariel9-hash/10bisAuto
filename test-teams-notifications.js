#!/usr/bin/env node

const utils = require('./utils');
const TeamsNotifier = require('./teams-notifier');

class TeamsNotificationTester {
    constructor() {
        this.logFile = 'teams-test.log';
    }

    /**
     * Test Teams notifications with both success and failure scenarios
     */
    async runTests() {
        try {
            await utils.log('=== Starting Teams Notification Tests ===', this.logFile);
            
            // Read configuration
            const config = await utils.readConfig();
            
            if (!config.TeamsWebhookUrl || config.TeamsWebhookUrl.trim() === '') {
                await utils.log('ERROR: TeamsWebhookUrl not configured in config.json', this.logFile);
                await utils.log('Please add your Teams webhook URL to config.json before running tests', this.logFile);
                process.exit(1);
            }

            const teamsNotifier = new TeamsNotifier(config.TeamsWebhookUrl, utils);
            const timestamp = utils.getCurrentTimeIsrael();
            const testAmount = config.Amount || '50';

            await utils.log('Teams webhook URL configured, starting tests...', this.logFile);

            // Test 1: Success notification
            await utils.log('Test 1: Sending success notification...', this.logFile);
            await teamsNotifier.sendSuccessNotification(testAmount, timestamp);
            await utils.sleep(2000); // Wait 2 seconds between tests

            // Test 2: Failure notification
            await utils.log('Test 2: Sending failure notification...', this.logFile);
            await teamsNotifier.sendFailureNotification(testAmount, timestamp, 'Test error: Authentication failed (401)');
            await utils.sleep(2000); // Wait 2 seconds between tests

            // Test 3: Connection test
            await utils.log('Test 3: Running connection test...', this.logFile);
            const connectionResult = await teamsNotifier.testConnection();
            
            if (connectionResult) {
                await utils.log('✅ All Teams notification tests completed successfully!', this.logFile);
                await utils.log('Check your Microsoft Teams channel for the test messages', this.logFile);
            } else {
                await utils.log('❌ Connection test failed', this.logFile);
                process.exit(1);
            }

        } catch (error) {
            await utils.log(`Teams notification test failed: ${error.message}`, this.logFile);
            await utils.log(`Error details: ${error.stack}`, this.logFile);
            process.exit(1);
        }
    }

    /**
     * Test only the webhook connection without sending multiple messages
     */
    async testConnection() {
        try {
            await utils.log('=== Testing Teams Webhook Connection ===', this.logFile);
            
            const config = await utils.readConfig();
            
            if (!config.TeamsWebhookUrl || config.TeamsWebhookUrl.trim() === '') {
                await utils.log('ERROR: TeamsWebhookUrl not configured in config.json', this.logFile);
                return false;
            }

            const teamsNotifier = new TeamsNotifier(config.TeamsWebhookUrl, utils);
            const result = await teamsNotifier.testConnection();
            
            if (result) {
                await utils.log('✅ Teams webhook connection test successful!', this.logFile);
            } else {
                await utils.log('❌ Teams webhook connection test failed', this.logFile);
            }
            
            return result;

        } catch (error) {
            await utils.log(`Teams connection test error: ${error.message}`, this.logFile);
            return false;
        }
    }

    /**
     * Display setup instructions
     */
    async showSetupInstructions() {
        console.log('\n=== Microsoft Teams Webhook Setup Instructions ===\n');
        console.log('1. Open Microsoft Teams and navigate to the channel where you want notifications');
        console.log('2. Click on the three dots (...) next to the channel name');
        console.log('3. Select "Connectors" from the dropdown menu');
        console.log('4. Find "Incoming Webhook" and click "Configure"');
        console.log('5. Give your webhook a name (e.g., "10bis Credit Notifications")');
        console.log('6. Optionally upload an icon');
        console.log('7. Click "Create"');
        console.log('8. Copy the webhook URL that appears');
        console.log('9. Add the webhook URL to your config.json file:');
        console.log('   "TeamsWebhookUrl": "https://your-tenant.webhook.office.com/webhookb2/..."');
        console.log('10. For GitHub Actions, add the webhook URL as a repository secret named "TEAMS_WEBHOOK_URL"');
        console.log('\nAfter setup, run: node test-teams-notifications.js --test\n');
    }
}

// Run the script if called directly
if (require.main === module) {
    const tester = new TeamsNotificationTester();
    
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
        tester.showSetupInstructions();
    } else if (process.argv.includes('--test')) {
        tester.testConnection().then(success => {
            process.exit(success ? 0 : 1);
        });
    } else {
        tester.runTests().then(() => {
            process.exit(0);
        }).catch(() => {
            process.exit(1);
        });
    }
}

module.exports = TeamsNotificationTester;