#!/usr/bin/env node

const utils = require('./github-actions-utils');
const TeamsWebhookNotifier = require('./teams-webhook-notifier');

class TeamsWebhookTester {
    constructor() {
        this.logFile = 'teams-webhook-test.log';
    }

    async testWebhook() {
        try {
            await utils.log('=== Testing Teams Webhook ===', this.logFile);
            console.log('\n🚀 Testing Teams Webhook Notifications\n');
            
            if (!process.env.TEAMS_WEBHOOK_URL) {
                console.log('❌ TEAMS_WEBHOOK_URL not set');
                console.log('Please set the webhook URL first:\n');
                console.log('$env:TEAMS_WEBHOOK_URL="your_webhook_url_here"\n');
                return false;
            }
            
            console.log('✅ Teams webhook URL configured');
            console.log('📡 Testing webhook connection...\n');
            
            const notifier = new TeamsWebhookNotifier(process.env.TEAMS_WEBHOOK_URL, utils);
            
            // Test success notification
            console.log('📝 Sending SUCCESS test notification...');
            await notifier.sendSuccessNotification('50', utils.getCurrentTimeIsrael());
            
            await utils.sleep(2000);
            
            // Test failure notification
            console.log('📝 Sending FAILURE test notification...');
            await notifier.sendFailureNotification('50', utils.getCurrentTimeIsrael(), 'Test error: This is just a test message');
            
            console.log('\n✅ Test notifications sent!');
            console.log('\n👀 Check your Teams channel for the notifications');
            console.log('   You should see 2 messages:');
            console.log('   1. ✅ Success notification');
            console.log('   2. ❌ Failure notification (test)\n');
            
            console.log('🎉 Teams webhook is working!');
            console.log('💡 Now you can run: node github-load-credit.js\n');
            
            return true;
            
        } catch (error) {
            await utils.log(`Teams webhook test failed: ${error.message}`, this.logFile);
            console.error('❌ Test failed:', error.message);
            
            if (error.message.includes('404')) {
                console.log('\n💡 Troubleshooting:');
                console.log('   - Check that the webhook URL is correct');
                console.log('   - Make sure the webhook wasn\'t deleted from Teams');
                console.log('   - Try creating a new webhook in Teams\n');
            }
            
            return false;
        }
    }

    showStatus() {
        console.log('\n📊 Teams Webhook Status\n');
        
        const hasWebhook = !!process.env.TEAMS_WEBHOOK_URL;
        console.log(`TEAMS_WEBHOOK_URL: ${hasWebhook ? '✅ Configured' : '❌ Missing'}`);
        
        if (hasWebhook) {
            const url = process.env.TEAMS_WEBHOOK_URL;
            const domain = url.match(/https:\/\/([^\/]+)/)?.[1] || 'unknown';
            console.log(`Webhook Domain: ${domain}`);
            console.log(`Status: ✅ Ready to send notifications\n`);
        } else {
            console.log('Status: ❌ Not configured\n');
            console.log('To set up:');
            console.log('$env:TEAMS_WEBHOOK_URL="your_webhook_url_here"\n');
        }
    }

    showSetupInstructions() {
        console.log('\n📋 Teams Webhook Setup Instructions\n');
        console.log('1. Open Microsoft Teams');
        console.log('2. Go to the channel where you want notifications');
        console.log('3. Click the three dots (...) next to the channel name');
        console.log('4. Select "Connectors" or "Workflows"');
        console.log('5. Find "Incoming Webhook" and click "Configure"');
        console.log('6. Name: "10bis Bot"');
        console.log('7. Upload icon (optional)');
        console.log('8. Click "Create"');
        console.log('9. Copy the webhook URL');
        console.log('10. Set environment variable:');
        console.log('    $env:TEAMS_WEBHOOK_URL="https://your-webhook-url-here"');
        console.log('11. Test: node test-teams-webhook.js\n');
        
        console.log('💡 Benefits:');
        console.log('   ✅ No Azure permissions needed');
        console.log('   ✅ No app passwords required');
        console.log('   ✅ Works on company computers');
        console.log('   ✅ Beautiful card notifications');
        console.log('   ✅ 2-minute setup\n');
    }
}

// Run the tester if called directly
if (require.main === module) {
    const tester = new TeamsWebhookTester();
    
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
        tester.showSetupInstructions();
    } else if (process.argv.includes('--status')) {
        tester.showStatus();
    } else {
        tester.testWebhook().then(success => {
            process.exit(success ? 0 : 1);
        });
    }
}

module.exports = TeamsWebhookTester;