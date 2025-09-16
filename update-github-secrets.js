#!/usr/bin/env node

const { Octokit } = require('@octokit/rest');
const sodium = require('libsodium-wrappers');

class GitHubSecretsUpdater {
    constructor() {
        this.logFile = 'github-secrets-update.log';
    }

    /**
     * Update GitHub repository secrets with new tokens
     */
    async updateGitHubSecrets() {
        try {
            const readline = require('readline');
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const question = (prompt) => {
                return new Promise((resolve) => {
                    rl.question(prompt, resolve);
                });
            };

            console.log('\n=== GitHub Secrets Token Update ===');
            console.log('This will update your GitHub repository secrets with new tokens');
            console.log('');

            // Get GitHub details
            const owner = await question('Enter GitHub username/organization: ');
            if (!owner.trim()) {
                console.log('❌ GitHub owner is required');
                rl.close();
                return false;
            }

            const repo = await question('Enter repository name: ');
            if (!repo.trim()) {
                console.log('❌ Repository name is required');
                rl.close();
                return false;
            }

            const token = await question('Enter GitHub Personal Access Token (with repo permissions): ');
            if (!token.trim()) {
                console.log('❌ GitHub token is required');
                rl.close();
                return false;
            }

            console.log('');
            console.log('Now paste the token values from your browser:');
            console.log('(Application > Storage > Cookies > https://www.10bis.co.il)');
            console.log('');

            const accessToken = await question('Enter AccessToken (Authorization cookie value): ');
            if (!accessToken.trim()) {
                console.log('❌ AccessToken is required');
                rl.close();
                return false;
            }

            const refreshToken = await question('Enter RefreshToken (RefreshToken cookie value): ');
            if (!refreshToken.trim()) {
                console.log('❌ RefreshToken is required');
                rl.close();
                return false;
            }

            rl.close();

            console.log('\n🔄 Updating GitHub secrets...');

            // Initialize Octokit
            const octokit = new Octokit({
                auth: token.trim()
            });

            // Initialize libsodium
            await sodium.ready;

            // Get repository public key
            console.log('📡 Getting repository public key...');
            const { data: publicKey } = await octokit.rest.actions.getRepoPublicKey({
                owner: owner.trim(),
                repo: repo.trim(),
            });

            // Encrypt and update ACCESS_TOKEN
            console.log('🔐 Encrypting and updating ACCESS_TOKEN...');
            const accessTokenBytes = Buffer.from(accessToken.trim());
            const publicKeyBytes = Buffer.from(publicKey.key, 'base64');
            const accessTokenEncrypted = sodium.crypto_box_seal(accessTokenBytes, publicKeyBytes);

            await octokit.rest.actions.createOrUpdateRepoSecret({
                owner: owner.trim(),
                repo: repo.trim(),
                secret_name: 'ACCESS_TOKEN',
                encrypted_value: Buffer.from(accessTokenEncrypted).toString('base64'),
                key_id: publicKey.key_id,
            });

            // Encrypt and update REFRESH_TOKEN
            console.log('🔐 Encrypting and updating REFRESH_TOKEN...');
            const refreshTokenBytes = Buffer.from(refreshToken.trim());
            const refreshTokenEncrypted = sodium.crypto_box_seal(refreshTokenBytes, publicKeyBytes);

            await octokit.rest.actions.createOrUpdateRepoSecret({
                owner: owner.trim(),
                repo: repo.trim(),
                secret_name: 'REFRESH_TOKEN',
                encrypted_value: Buffer.from(refreshTokenEncrypted).toString('base64'),
                key_id: publicKey.key_id,
            });

            console.log('✅ GitHub secrets updated successfully!');
            console.log(`Repository: ${owner.trim()}/${repo.trim()}`);
            console.log('Updated secrets:');
            console.log('  - ACCESS_TOKEN');
            console.log('  - REFRESH_TOKEN');
            console.log('');
            console.log('Your GitHub Actions workflow will now use the new tokens.');

            return true;

        } catch (error) {
            console.error('❌ Failed to update GitHub secrets:', error.message);
            
            if (error.status === 401) {
                console.error('Authentication failed. Please check your GitHub Personal Access Token.');
            } else if (error.status === 404) {
                console.error('Repository not found. Please check the owner/repo names.');
            } else if (error.status === 403) {
                console.error('Permission denied. Make sure your token has "repo" permissions.');
            }
            
            return false;
        }
    }

    /**
     * Show instructions for creating GitHub Personal Access Token
     */
    showTokenInstructions() {
        console.log('\n=== GitHub Personal Access Token Setup ===');
        console.log('');
        console.log('To update GitHub secrets, you need a Personal Access Token with "repo" permissions:');
        console.log('');
        console.log('1. Go to https://github.com/settings/tokens');
        console.log('2. Click "Generate new token" → "Generate new token (classic)"');
        console.log('3. Give it a name like "10bis Token Updater"');
        console.log('4. Select the "repo" scope (full control of private repositories)');
        console.log('5. Click "Generate token"');
        console.log('6. Copy the token (you won\'t see it again!)');
        console.log('7. Run this script again with the token');
        console.log('');
    }
}

// Run the script if called directly
if (require.main === module) {
    const updater = new GitHubSecretsUpdater();
    
    if (process.argv.includes('--help') || process.argv.includes('-h')) {
        updater.showTokenInstructions();
    } else {
        console.log('Checking dependencies...');
        
        // Check if required packages are installed
        try {
            require('@octokit/rest');
            require('libsodium-wrappers');
        } catch (error) {
            console.error('❌ Missing required dependencies.');
            console.error('Please install them with: npm install @octokit/rest libsodium-wrappers');
            process.exit(1);
        }

        updater.updateGitHubSecrets().then(success => {
            process.exit(success ? 0 : 1);
        });
    }
}

module.exports = GitHubSecretsUpdater;