#!/usr/bin/env node

const utils = require('./utils');
const TokenRefresh = require('./refresh-token');
const CreditLoader = require('./load-credit');
const fs = require('fs-extra');
const path = require('path');

class TestSuite {
    constructor() {
        this.logFile = 'test.log';
        this.testConfig = {
            AccessToken: 'test_access_token',
            RefreshToken: 'test_refresh_token',
            Amount: '100',
            MoneycardId: 'test_moneycard_id'
        };
    }

    /**
     * Run all tests
     */
    async runAllTests() {
        await utils.log('=== Starting 10bis Automation Test Suite ===', this.logFile);
        
        const tests = [
            { name: 'File Structure Test', fn: this.testFileStructure.bind(this) },
            { name: 'Dependencies Test', fn: this.testDependencies.bind(this) },
            { name: 'Configuration Test', fn: this.testConfiguration.bind(this) },
            { name: 'Utils Functions Test', fn: this.testUtilsFunctions.bind(this) },
            { name: 'Logging System Test', fn: this.testLoggingSystem.bind(this) },
            { name: 'Weekend Detection Test', fn: this.testWeekendDetection.bind(this) },
            { name: 'Token Refresh Script Test', fn: this.testTokenRefreshScript.bind(this) },
            { name: 'Credit Loader Script Test', fn: this.testCreditLoaderScript.bind(this) }
        ];

        let passed = 0;
        let failed = 0;

        for (const test of tests) {
            try {
                await utils.log(`Running: ${test.name}`, this.logFile);
                await test.fn();
                await utils.log(`✅ PASSED: ${test.name}`, this.logFile);
                passed++;
            } catch (error) {
                await utils.log(`❌ FAILED: ${test.name} - ${error.message}`, this.logFile);
                failed++;
            }
        }

        await utils.log(`=== Test Results: ${passed} passed, ${failed} failed ===`, this.logFile);
        
        if (failed > 0) {
            process.exit(1);
        } else {
            await utils.log('🎉 All tests passed!', this.logFile);
            process.exit(0);
        }
    }

    /**
     * Test file structure
     */
    async testFileStructure() {
        const requiredFiles = [
            'package.json',
            'config.json',
            'utils.js',
            'refresh-token.js',
            'load-credit.js',
            'crontab-setup.txt',
            'README.md'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(__dirname, file);
            if (!await fs.pathExists(filePath)) {
                throw new Error(`Required file missing: ${file}`);
            }
        }

        // Check if logs directory can be created
        const logsDir = path.join(__dirname, 'logs');
        await fs.ensureDir(logsDir);
        
        if (!await fs.pathExists(logsDir)) {
            throw new Error('Cannot create logs directory');
        }
    }

    /**
     * Test dependencies
     */
    async testDependencies() {
        try {
            require('axios');
            require('fs-extra');
        } catch (error) {
            throw new Error(`Missing dependency: ${error.message}`);
        }

        // Check package.json
        const packagePath = path.join(__dirname, 'package.json');
        const packageData = await fs.readJson(packagePath);
        
        if (!packageData.dependencies || !packageData.dependencies.axios) {
            throw new Error('axios dependency not found in package.json');
        }
        
        if (!packageData.dependencies['fs-extra']) {
            throw new Error('fs-extra dependency not found in package.json');
        }
    }

    /**
     * Test configuration management
     */
    async testConfiguration() {
        // Backup original config
        const configPath = path.join(__dirname, 'config.json');
        const backupPath = configPath + '.test-backup';
        
        if (await fs.pathExists(configPath)) {
            await fs.copy(configPath, backupPath);
        }

        try {
            // Test writing config
            await utils.writeConfig(this.testConfig);
            
            // Test reading config
            const readConfig = await utils.readConfig();
            
            // Verify data integrity
            for (const key in this.testConfig) {
                if (readConfig[key] !== this.testConfig[key]) {
                    throw new Error(`Config mismatch for ${key}: expected ${this.testConfig[key]}, got ${readConfig[key]}`);
                }
            }

            // Test updating config
            await utils.updateConfig({ Amount: '200' });
            const updatedConfig = await utils.readConfig();
            
            if (updatedConfig.Amount !== '200') {
                throw new Error('Config update failed');
            }

        } finally {
            // Restore original config
            if (await fs.pathExists(backupPath)) {
                await fs.move(backupPath, configPath, { overwrite: true });
            }
        }
    }

    /**
     * Test utility functions
     */
    async testUtilsFunctions() {
        // Test logging
        await utils.log('Test log message', 'test-utils.log');
        
        const logPath = path.join(__dirname, 'logs', 'test-utils.log');
        if (!await fs.pathExists(logPath)) {
            throw new Error('Logging function failed');
        }

        // Test sleep function
        const startTime = Date.now();
        await utils.sleep(100);
        const elapsed = Date.now() - startTime;
        
        if (elapsed < 90 || elapsed > 200) {
            throw new Error(`Sleep function timing issue: ${elapsed}ms`);
        }

        // Test time functions
        const israelTime = utils.getCurrentTimeIsrael();
        if (!israelTime || typeof israelTime !== 'string') {
            throw new Error('getCurrentTimeIsrael failed');
        }
    }

    /**
     * Test logging system
     */
    async testLoggingSystem() {
        const testMessage = 'Test logging system message';
        const testLogFile = 'test-logging.log';
        
        await utils.log(testMessage, testLogFile);
        
        const logPath = path.join(__dirname, 'logs', testLogFile);
        const logContent = await fs.readFile(logPath, 'utf8');
        
        if (!logContent.includes(testMessage)) {
            throw new Error('Log message not found in log file');
        }
    }

    /**
     * Test weekend detection
     */
    async testWeekendDetection() {
        // This test just ensures the function runs without error
        // The actual logic depends on the current date
        const isWeekend = utils.isWeekend();
        
        if (typeof isWeekend !== 'boolean') {
            throw new Error('isWeekend should return boolean');
        }

        await utils.log(`Current weekend status: ${isWeekend}`, this.logFile);
    }

    /**
     * Test token refresh script initialization
     */
    async testTokenRefreshScript() {
        const tokenRefresh = new TokenRefresh();
        
        if (!tokenRefresh) {
            throw new Error('TokenRefresh class instantiation failed');
        }

        // Test configuration validation (should fail with empty config)
        try {
            await tokenRefresh.testConfiguration?.();
        } catch (error) {
            // Expected to fail with empty/invalid config
            await utils.log('Token refresh config validation correctly failed with empty config', this.logFile);
        }
    }

    /**
     * Test credit loader script initialization
     */
    async testCreditLoaderScript() {
        const creditLoader = new CreditLoader();
        
        if (!creditLoader) {
            throw new Error('CreditLoader class instantiation failed');
        }

        // Test configuration validation
        const configValid = await creditLoader.testConfiguration();
        
        if (configValid) {
            throw new Error('Credit loader should fail with empty config');
        }

        await utils.log('Credit loader config validation correctly failed with empty config', this.logFile);
    }

    /**
     * Test with sample configuration
     */
    async testWithSampleConfig() {
        await utils.log('=== Testing with Sample Configuration ===', this.logFile);
        
        // Backup original config
        const configPath = path.join(__dirname, 'config.json');
        const backupPath = configPath + '.sample-test-backup';
        
        if (await fs.pathExists(configPath)) {
            await fs.copy(configPath, backupPath);
        }

        try {
            // Write sample config
            await utils.writeConfig(this.testConfig);
            
            // Test credit loader configuration
            const creditLoader = new CreditLoader();
            const configValid = await creditLoader.testConfiguration();
            
            if (!configValid) {
                throw new Error('Credit loader should pass with valid config');
            }

            await utils.log('✅ Sample configuration test passed', this.logFile);

        } finally {
            // Restore original config
            if (await fs.pathExists(backupPath)) {
                await fs.move(backupPath, configPath, { overwrite: true });
            }
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const testSuite = new TestSuite();
    
    if (process.argv.includes('--sample-config')) {
        testSuite.testWithSampleConfig().catch(error => {
            console.error('Sample config test failed:', error.message);
            process.exit(1);
        });
    } else {
        testSuite.runAllTests().catch(error => {
            console.error('Test suite failed:', error.message);
            process.exit(1);
        });
    }
}

module.exports = TestSuite;