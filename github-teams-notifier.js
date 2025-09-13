const axios = require('axios');

class GitHubTeamsNotifier {
    constructor(config, utils) {
        this.tenantId = config.tenantId;
        this.clientId = config.clientId;
        this.clientSecret = config.clientSecret;
        this.userId = config.userId; // The user to send direct message to
        this.utils = utils;
        this.accessToken = null;
    }

    /**
     * Get access token for Microsoft Graph API
     */
    async getAccessToken() {
        if (this.accessToken) {
            return this.accessToken;
        }

        try {
            const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
            
            const params = new URLSearchParams();
            params.append('client_id', this.clientId);
            params.append('client_secret', this.clientSecret);
            params.append('scope', 'https://graph.microsoft.com/.default');
            params.append('grant_type', 'client_credentials');

            const response = await axios.post(tokenUrl, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            this.accessToken = response.data.access_token;
            await this.utils.log('Microsoft Graph access token obtained');
            return this.accessToken;

        } catch (error) {
            await this.utils.log(`Failed to get Microsoft Graph access token: ${error.message}`, 'error.log');
            throw error;
        }
    }

    /**
     * Send a direct chat message to user via Microsoft Graph API
     * @param {string} status - 'success' or 'failure'
     * @param {string} amount - The amount that was loaded
     * @param {string} timestamp - The timestamp of the operation
     * @param {string} error - Error message (optional, for failures)
     */
    async sendNotification(status, amount, timestamp, error = null) {
        if (!this.tenantId || !this.clientId || !this.clientSecret || !this.userId) {
            await this.utils.log('Teams configuration not complete - skipping notification');
            return;
        }

        try {
            const accessToken = await this.getAccessToken();
            const message = this.formatMessage(status, amount, timestamp, error);
            
            // Create a chat message
            const chatMessage = {
                body: {
                    contentType: "html",
                    content: message.htmlContent
                }
            };

            await this.utils.log('Sending Teams direct message...');
            
            // Send message via Microsoft Graph API
            const graphUrl = `https://graph.microsoft.com/v1.0/chats`;
            
            // First, create or get existing chat with the user
            const chatResponse = await axios.post(graphUrl, {
                chatType: "oneOnOne",
                members: [
                    {
                        "@odata.type": "#microsoft.graph.aadUserConversationMember",
                        roles: ["owner"],
                        "user@odata.bind": `https://graph.microsoft.com/v1.0/users('${this.userId}')`
                    }
                ]
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const chatId = chatResponse.data.id;

            // Send the message to the chat
            const messageUrl = `https://graph.microsoft.com/v1.0/chats/${chatId}/messages`;
            const response = await axios.post(messageUrl, chatMessage, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            if (response.status === 201) {
                await this.utils.log('Teams direct message sent successfully');
                
                // Set GitHub Actions output
                if (process.env.GITHUB_ACTIONS) {
                    await this.utils.setOutput('teams_notification', 'sent');
                }
            } else {
                await this.utils.log(`Teams notification failed with status: ${response.status}`, 'error.log');
                
                if (process.env.GITHUB_ACTIONS) {
                    await this.utils.setOutput('teams_notification', 'failed');
                }
            }

        } catch (error) {
            await this.utils.log(`Failed to send Teams notification: ${error.message}`, 'error.log');
            
            if (process.env.GITHUB_ACTIONS) {
                await this.utils.setOutput('teams_notification', 'error');
                await this.utils.setOutput('teams_error', error.message);
            }
            
            // Don't throw error - notification failure shouldn't stop the main process
        }
    }

    /**
     * Format the message for Teams direct chat
     */
    formatMessage(status, amount, timestamp, error) {
        const isSuccess = status === 'success';
        const emoji = isSuccess ? '✅' : '❌';
        const statusText = isSuccess ? 'Success' : 'Failed';
        const color = isSuccess ? '#00FF00' : '#FF0000';
        
        let htmlContent = `
            <div style="border-left: 4px solid ${color}; padding-left: 12px; margin: 8px 0;">
                <h3 style="margin: 0; color: ${color};">${emoji} 10bis Bot</h3>
                <p style="margin: 4px 0; font-size: 14px;">
                    <strong>Credit Loading ${statusText}</strong>
                </p>
                <ul style="margin: 8px 0; padding-left: 20px; font-size: 13px;">
                    <li><strong>Amount:</strong> ₪${amount}</li>
                    <li><strong>Time:</strong> ${timestamp} (Israel Time)</li>
                    <li><strong>Status:</strong> ${statusText}</li>
        `;

        if (!isSuccess && error) {
            htmlContent += `<li><strong>Error:</strong> ${error}</li>`;
        }

        htmlContent += `
                </ul>
            </div>
        `;

        return {
            htmlContent: htmlContent
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
     * Test the Teams webhook connection
     */
    async testConnection() {
        try {
            await this.sendNotification('success', '50', new Date().toLocaleString('en-US', {
                timeZone: 'Asia/Jerusalem',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }));
            return true;
        } catch (error) {
            await this.utils.log(`Teams connection test failed: ${error.message}`, 'error.log');
            return false;
        }
    }
}

module.exports = GitHubTeamsNotifier;