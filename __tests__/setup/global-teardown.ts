import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export default async function globalTeardown() {
  console.log('🧹 Starting global test teardown...');

  try {
    // Calculate total test duration
    if (global.__TEST_START_TIME__) {
      const duration = Date.now() - global.__TEST_START_TIME__;
      console.log(`⏱️  Total test suite duration: ${(duration / 1000).toFixed(2)}s`);
    }

    // Clean up temporary test files
    console.log('🗂️  Cleaning up temporary test files...');
    
    const tempDir = path.join(process.cwd(), '__tests__', '.temp');
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log('✅ Temporary test files cleaned');
    } catch (error) {
      console.warn('⚠️  Could not clean temporary files:', error);
    }

    // Generate test summary report
    console.log('📊 Generating test summary...');
    
    try {
      const coverageDir = path.join(process.cwd(), 'coverage');
      const testResultsDir = path.join(process.cwd(), 'test-results');
      
      // Check if coverage was generated
      try {
        await fs.access(path.join(coverageDir, 'coverage-summary.json'));
        console.log('✅ Coverage report generated');
      } catch {
        console.log('ℹ️  No coverage report found');
      }

      // Check if test results were generated
      try {
        await fs.access(path.join(testResultsDir, 'jest-results.xml'));
        console.log('✅ Test results XML generated');
      } catch {
        console.log('ℹ️  No test results XML found');
      }

      // Create test summary
      const summary = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        duration: global.__TEST_START_TIME__ ? Date.now() - global.__TEST_START_TIME__ : null,
        coverage: {
          directory: coverageDir,
          available: await fs.access(coverageDir).then(() => true).catch(() => false)
        },
        testResults: {
          directory: testResultsDir,
          available: await fs.access(testResultsDir).then(() => true).catch(() => false)
        }
      };

      await fs.writeFile(
        path.join(testResultsDir, 'test-summary.json'),
        JSON.stringify(summary, null, 2)
      );

      console.log('✅ Test summary generated');

    } catch (error) {
      console.warn('⚠️  Could not generate test summary:', error);
    }

    // Clean up environment
    console.log('🔧 Cleaning up test environment...');
    
    // Reset environment variables
    delete process.env.CRM_PERSISTENCE_TYPE;
    delete process.env.DISABLE_TELEMETRY;
    
    // Clear any global test state
    if (global.__TEST_START_TIME__) {
      delete global.__TEST_START_TIME__;
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log('🗑️  Garbage collection completed');
    }

    // Log memory usage
    const memUsage = process.memoryUsage();
    console.log(`📈 Memory usage: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB heap, ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB RSS`);

    console.log('✅ Global test teardown completed successfully');

  } catch (error) {
    console.error('❌ Global test teardown failed:', error);
    // Don't throw in teardown to avoid masking test failures
  }
};