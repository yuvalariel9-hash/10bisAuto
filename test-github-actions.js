#!/usr/bin/env node

/**
 * Test script for GitHub Actions compatibility
 * This script validates that the GitHub Actions setup works correctly
 */

const fs = require('fs-extra');
const path = require('path');

class GitHubActionsTest {
    constructor() {
        this.testResults = [];
        this.logFile = 'test-github-actions.log';
    }

    async log(message, isError = false) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${isError ? 'ERROR: ' : ''}${message}`;
        console.log(logMessage);
        
        try {
            await fs.appendFile(path.join('logs', this.logFile), logMessage + '\n');
        } catch (error) {
            // Ignore log file errors during testing
        }
    }

    async test(testName, testFunction) {
        try {
            await this.log(`Running test: ${testName}`);
            await testFunction();
            this.testResults.push({ name: testName, status: 'PASS' });
            await this.log(`✅ PASS: ${testName}`);
        } catch (error) {
            this.testResults.push({ name: testName, status: 'FAIL', error: error.message });
            await this.log(`❌ FAIL: ${testName} - ${error.message}`, true);
        }
    }

    async testFileExists() {
        const requiredFiles = [
            '.github/workflows/10bis-automation.yml',
            'github-actions-utils.js',
            'github-refresh-token.js',
            'github-load-credit.js',
            'package.json',
            'GITHUB-ACTIONS-SETUP.md'
        ];

        for (const file of requiredFiles) {
            if (!await fs.pathExists(file)) {
                throw new Error(`Required file missing: ${file}`);
            }
        }
    }

    async testPackageJsonDependencies() {
        const packageJson = await fs.readJson('package.json');
        
        if (!packageJson.dependencies) {
            throw new Error('No dependencies found in package.json');
        }

        const requiredDeps = ['axios', 'fs-extra', 'tweetsodium'];
        for (const dep of requiredDeps) {
            if (!packageJson.dependencies[dep]) {
                throw new Error(`Missing required dependency: ${dep}`);
            }
        }
    }

    async testGitHubActionsWorkflow() {
        const workflowPath = '.github/workflows/10bis-automation.yml';
        const workflowContent = await fs.readFile(workflowPath, 'utf8');

        // Check for required workflow elements
        const requiredElements = [
            'name: 10bis Automation',
            'on:',
            'schedule:',
            'refresh-token:',
            'load-credit:',
            'manual-test:',
            'secrets.ACCESS_TOKEN',
            'secrets.REFRESH_TOKEN',
            'secrets.AMOUNT',
            'secrets.MONEYCARD_ID',
            'secrets.PERSONAL_ACCESS_TOKEN'
        ];

        for (const element of requiredElements) {
            if (!workflowContent.includes(element)) {
                throw new Error(`Workflow missing required element: ${element}`);
            }
        }
    }

    async testGitHubActionsUtils() {
        // Test that the GitHub Actions utils can be loaded
        const utils = require('./github-actions-utils');
        
        if (typeof utils.log !== 'function') {
            throw new Error('GitHub Actions utils missing log function');
        }

        if (typeof utils.getConfig !== 'function') {
            throw new Error('GitHub Actions utils missing getConfig function');
        }

        if (typeof utils.makeHttpRequest !== 'function') {
            throw new Error('GitHub Actions utils missing makeHttpRequest function');
        }
    }

    async testGitHubActionsScripts() {
        // Test that the GitHub Actions scripts can be loaded
        const RefreshToken = require('./github-refresh-token');
        const LoadCredit = require('./github-load-credit');

        if (typeof RefreshToken !== 'function') {
            throw new Error('GitHub refresh token script not properly exported');
        }

        if (typeof LoadCredit !== 'function') {
            throw new Error('GitHub load credit script not properly exported');
        }
    }

    async testEnvironmentVariableHandling() {
        // Test with mock environment variables
        const originalEnv = { ...process.env };
        
        try {
            // Set mock environment variables
            process.env.GITHUB_ACTIONS = 'true';
            process.env.ACCESS_TOKEN = 'mock_access_token';
            process.env.REFRESH_TOKEN = 'mock_refresh_token';
            process.env.AMOUNT = '100';
            process.env.MONEYCARD_ID = '12345';

            const utils = require('./github-actions-utils');
            const config = utils.getConfig();

            if (config.AccessToken !== 'mock_access_token') {
                throw new Error('Environment variable ACCESS_TOKEN not properly read');
            }

            if (config.RefreshToken !== 'mock_refresh_token') {
                throw new Error('Environment variable REFRESH_TOKEN not properly read');
            }

            if (config.Amount !== '100') {
                throw new Error('Environment variable AMOUNT not properly read');
            }

            if (config.MoneycardId !== '12345') {
                throw new Error('Environment variable MONEYCARD_ID not properly read');
            }

        } finally {
            // Restore original environment
            process.env = originalEnv;
        }
    }

    async testDocumentation() {
        const setupGuide = await fs.readFile('GITHUB-ACTIONS-SETUP.md', 'utf8');
        
        const requiredSections = [
            '# 10bis Automation - GitHub Actions Setup Guide',
            '## Step-by-Step Setup',
            '### 1. Push Your Code to GitHub',
            '### 2. Create a GitHub Personal Access Token',
            '### 3. Set Up GitHub Secrets',
            'ACCESS_TOKEN',
            'REFRESH_TOKEN',
            'AMOUNT',
            'MONEYCARD_ID',
            'PERSONAL_ACCESS_TOKEN'
        ];

        for (const section of requiredSections) {
            if (!setupGuide.includes(section)) {
                throw new Error(`Documentation missing required section: ${section}`);
            }
        }
    }

    async runAllTests() {
        await this.log('=== Starting GitHub Actions Compatibility Tests ===');
        
        await this.test('Required Files Exist', () => this.testFileExists());
        await this.test('Package.json Dependencies', () => this.testPackageJsonDependencies());
        await this.test('GitHub Actions Workflow', () => this.testGitHubActionsWorkflow());
        await this.test('GitHub Actions Utils', () => this.testGitHubActionsUtils());
        await this.test('GitHub Actions Scripts', () => this.testGitHubActionsScripts());
        await this.test('Environment Variable Handling', () => this.testEnvironmentVariableHandling());
        await this.test('Documentation', () => this.testDocumentation());

        await this.log('=== Test Results Summary ===');
        
        let passCount = 0;
        let failCount = 0;

        for (const result of this.testResults) {
            if (result.status === 'PASS') {
                passCount++;
                await this.log(`✅ ${result.name}`);
            } else {
                failCount++;
                await this.log(`❌ ${result.name}: ${result.error}`, true);
            }
        }

        await this.log(`=== Final Results: ${passCount} passed, ${failCount} failed ===`);

        if (failCount > 0) {
            await this.log('Some tests failed. Please review the errors above.', true);
            process.exit(1);
        } else {
            await this.log('🎉 All tests passed! GitHub Actions setup is ready.');
            process.exit(0);
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new GitHubActionsTest();
    tester.runAllTests().catch(error => {
        console.error('Test runner failed:', error.message);
        process.exit(1);
    });
}

module.exports = GitHubActionsTest;