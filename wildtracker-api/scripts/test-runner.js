#!/usr/bin/env node

/**
 * Comprehensive Test Runner for WildTracker API
 * Following Kent Beck's TDD principles
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      coverage: null,
      suites: []
    };
    
    this.startTime = Date.now();
  }

  /**
   * Run all tests with comprehensive reporting
   */
  async runAllTests() {
    console.log('🚀 Starting WildTracker API Test Suite');
    console.log('=' .repeat(60));
    
    try {
      // Run unit tests
      await this.runTestSuite('Unit Tests', ['npm', 'test', '--', '--testPathPattern=telemetryController.test.js']);
      
      // Run integration tests
      await this.runTestSuite('Integration Tests', ['npm', 'test', '--', '--testPathPattern=integration.test.js']);
      
      // Run performance tests
      await this.runTestSuite('Performance Tests', ['npm', 'test', '--', '--testPathPattern=performance.test.js']);
      
      // Run all tests together for coverage
      await this.runTestSuite('Full Test Suite', ['npm', 'test', '--', '--coverage', '--verbose']);
      
      // Generate test report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Run a specific test suite
   */
  async runTestSuite(suiteName, command) {
    console.log(`\n📋 Running ${suiteName}...`);
    console.log('-'.repeat(40));
    
    return new Promise((resolve, reject) => {
      const child = spawn(command[0], command.slice(1), {
        stdio: 'pipe',
        shell: true
      });
      
      let output = '';
      let errorOutput = '';
      
      child.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        process.stdout.write(text);
      });
      
      child.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        process.stderr.write(text);
      });
      
      child.on('close', (code) => {
        const suiteResult = {
          name: suiteName,
          command: command.join(' '),
          exitCode: code,
          output,
          errorOutput,
          success: code === 0
        };
        
        this.testResults.suites.push(suiteResult);
        
        if (code === 0) {
          console.log(`✅ ${suiteName} completed successfully`);
        } else {
          console.log(`❌ ${suiteName} failed with exit code ${code}`);
        }
        
        resolve(suiteResult);
      });
      
      child.on('error', (error) => {
        console.error(`❌ Failed to start ${suiteName}:`, error.message);
        reject(error);
      });
    });
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    this.testResults.duration = Date.now() - this.startTime;
    
    console.log('\n📊 Test Execution Summary');
    console.log('=' .repeat(60));
    
    // Calculate totals
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;
    
    this.testResults.suites.forEach(suite => {
      // Parse Jest output to extract test counts
      const testMatch = suite.output.match(/(\d+) tests?/);
      const passedMatch = suite.output.match(/(\d+) passed/);
      const failedMatch = suite.output.match(/(\d+) failed/);
      const skippedMatch = suite.output.match(/(\d+) skipped/);
      
      if (testMatch) totalTests += parseInt(testMatch[1]);
      if (passedMatch) passedTests += parseInt(passedMatch[1]);
      if (failedMatch) failedTests += parseInt(failedMatch[1]);
      if (skippedMatch) skippedTests += parseInt(skippedMatch[1]);
    });
    
    this.testResults.total = totalTests;
    this.testResults.passed = passedTests;
    this.testResults.failed = failedTests;
    this.testResults.skipped = skippedTests;
    
    // Display summary
    console.log(`Total Test Suites: ${this.testResults.suites.length}`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Skipped: ${skippedTests} ⏭️`);
    console.log(`Duration: ${(this.testResults.duration / 1000).toFixed(2)}s`);
    
    // Display suite results
    console.log('\n📋 Suite Results:');
    this.testResults.suites.forEach(suite => {
      const status = suite.success ? '✅' : '❌';
      console.log(`${status} ${suite.name} (${suite.exitCode})`);
    });
    
    // Check coverage
    this.checkCoverage();
    
    // Generate detailed report file
    this.writeDetailedReport();
    
    // Final status
    const success = failedTests === 0 && this.testResults.suites.every(s => s.success);
    if (success) {
      console.log('\n🎉 All tests passed! The API is ready for production.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the results above.');
      process.exit(1);
    }
  }

  /**
   * Check test coverage
   */
  checkCoverage() {
    const coveragePath = path.join(__dirname, '..', 'coverage', 'lcov-report', 'index.html');
    
    if (fs.existsSync(coveragePath)) {
      console.log('\n📈 Coverage Report:');
      console.log(`Coverage report generated at: ${coveragePath}`);
      
      // Try to parse coverage summary
      const coverageSummaryPath = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');
      if (fs.existsSync(coverageSummaryPath)) {
        try {
          const coverage = JSON.parse(fs.readFileSync(coverageSummaryPath, 'utf8'));
          this.testResults.coverage = coverage;
          
          console.log('Coverage Summary:');
          Object.entries(coverage.total).forEach(([metric, value]) => {
            const percentage = value.pct;
            const status = percentage >= 80 ? '✅' : percentage >= 60 ? '⚠️' : '❌';
            console.log(`${status} ${metric}: ${percentage}%`);
          });
        } catch (error) {
          console.log('Could not parse coverage summary');
        }
      }
    } else {
      console.log('\n⚠️  No coverage report found');
    }
  }

  /**
   * Write detailed test report to file
   */
  writeDetailedReport() {
    const reportPath = path.join(__dirname, '..', 'test-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      ...this.testResults
    };
    
    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    } catch (error) {
      console.error('Failed to write detailed report:', error.message);
    }
  }

  /**
   * Run specific test categories
   */
  async runUnitTests() {
    console.log('🧪 Running Unit Tests Only...');
    await this.runTestSuite('Unit Tests', ['npm', 'test', '--', '--testPathPattern=telemetryController.test.js']);
  }

  async runIntegrationTests() {
    console.log('🔗 Running Integration Tests Only...');
    await this.runTestSuite('Integration Tests', ['npm', 'test', '--', '--testPathPattern=integration.test.js']);
  }

  async runPerformanceTests() {
    console.log('⚡ Running Performance Tests Only...');
    await this.runTestSuite('Performance Tests', ['npm', 'test', '--', '--testPathPattern=performance.test.js']);
  }

  /**
   * Run tests in watch mode
   */
  async runTestsInWatchMode() {
    console.log('👀 Running Tests in Watch Mode...');
    return new Promise((resolve, reject) => {
      const child = spawn('npm', ['run', 'test:watch'], {
        stdio: 'inherit',
        shell: true
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Watch mode exited with code ${code}`));
        }
      });
      
      child.on('error', (error) => {
        reject(error);
      });
    });
  }
}

// CLI interface
async function main() {
  const runner = new TestRunner();
  const args = process.argv.slice(2);
  
  try {
    switch (args[0]) {
      case 'unit':
        await runner.runUnitTests();
        break;
      case 'integration':
        await runner.runIntegrationTests();
        break;
      case 'performance':
        await runner.runPerformanceTests();
        break;
      case 'watch':
        await runner.runTestsInWatchMode();
        break;
      case 'all':
      default:
        await runner.runAllTests();
        break;
    }
  } catch (error) {
    console.error('Test runner failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = TestRunner; 