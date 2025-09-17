const axios = require('axios');

class TeamsWebhookNotifier {
    constructor(webhookUrl, utils) {
        this.webhookUrl = webhookUrl;
        this.utils = utils;
    }

    /**
     * Send notification using Teams webhook (much simpler approach)
     * @param {string} status - 'success' or 'failure'
     * @param {string} amount - The amount that was loaded
     * @param {string} timestamp - The timestamp of the operation
     * @param {string} error - Error message (optional, for failures)
     */
    async sendNotification(status, amount, timestamp, error = null) {
        if (!this.webhookUrl || this.webhookUrl.trim() === '') {
            await this.utils.log('Teams webhook URL not configured - skipping notification');
            return;
        }

        try {
            const message = this.formatWebhookMessage(status, amount, timestamp, error);
            
            await this.utils.log('Sending Teams webhook notification...');

            const response = await axios.post(this.webhookUrl, message, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });

            if (response.status === 200) {
                await this.utils.log('Teams webhook notification sent successfully');
                
                if (process.env.GITHUB_ACTIONS) {
                    await this.utils.setOutput('teams_notification', 'sent_webhook');
                }
            } else {
                throw new Error(`Webhook returned status ${response.status}`);
            }

        } catch (error) {
            const errorMsg = `Failed to send Teams webhook notification: ${error.message}`;
            await this.utils.log(errorMsg, 'error.log');
            
            if (process.env.GITHUB_ACTIONS) {
                await this.utils.setOutput('teams_notification', 'failed');
                await this.utils.setOutput('teams_error', error.message);
            }
            
            // Don't throw error - notification failure shouldn't stop the main process
        }
    }

    /**
     * Format message for Teams webhook using Adaptive Cards
     */
    formatWebhookMessage(status, amount, timestamp, error) {
        const isSuccess = status === 'success';
        const emoji = isSuccess ? '✅' : '❌';
        const statusText = isSuccess ? 'Success' : 'Failed';
        const color = isSuccess ? 'good' : 'attention';
        const accentColor = isSuccess ? '#28a745' : '#dc3545';
        
        const facts = [
            {
                "name": "Amount",
                "value": `₪${amount}`
            },
            {
                "name": "Time",
                "value": `${timestamp} (Israel Time)`
            },
            {
                "name": "Status",
                "value": statusText
            }
        ];

        if (!isSuccess && error) {
            facts.push({
                "name": "Error",
                "value": error
            });
        }

        return {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "themeColor": accentColor,
            "summary": `10bis Credit Loading ${statusText}`,
            "sections": [
                {
                    "activityTitle": `${emoji} 10bis Bot`,
                    "activitySubtitle": `Credit Loading ${statusText}`,
                    "activityImage": "https://www.10bis.co.il/favicon.ico",
                    "facts": facts,
                    "markdown": true
                }
            ],
            "potentialAction": [
                {
                    "@type": "OpenUri",
                    "name": "Open 10bis",
                    "targets": [
                        {
                            "os": "default",
                            "uri": "https://www.10bis.co.il"
                        }
                    ]
                }
            ]
        };
    }

    /**
     * Send success notification
     */
    async sendSuccessNotification(amount, timestamp) {
        await this.sendNotification('success', amount, timestamp);
    }

    /**
     * Send failure notification
     */
    async sendFailureNotification(amount, timestamp, error) {
        await this.sendNotification('failure', amount, timestamp, error);
    }

    /**
     * Test the webhook connection
     */
    async testConnection() {
        try {
            await this.utils.log('Testing Teams webhook connection...');
            
            const testTimestamp = new Date().toLocaleString('en-US', {
                timeZone: 'Asia/Jerusalem',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            await this.sendNotification('success', '50', testTimestamp, null);
            await this.utils.log('Teams webhook test completed successfully');
            return true;
            
        } catch (error) {
            await this.utils.log(`Teams webhook test failed: ${error.message}`, 'error.log');
            return false;
        }
    }
}

module.exports = TeamsWebhookNotifier;