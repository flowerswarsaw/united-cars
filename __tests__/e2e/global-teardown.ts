import { FullConfig } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🎭 Starting Playwright global teardown...');

  try {
    // Get setup state
    const setupState = global.__E2E_SETUP_STATE__;
    
    if (setupState) {
      console.log(`📊 E2E tests completed for environment: ${setupState.environment}`);
      console.log(`🌐 Base URL: ${setupState.baseURL}`);
      console.log(`👥 Test users: ${setupState.testUsers.join(', ')}`);
      
      const duration = Date.now() - new Date(setupState.timestamp).getTime();
      console.log(`⏱️  Total E2E session duration: ${(duration / 1000).toFixed(2)}s`);
    }

    // Clean up test artifacts
    console.log('🧹 Cleaning up E2E test artifacts...');
    
    const artifactsDir = path.join(process.cwd(), 'test-results', 'e2e-artifacts');
    try {
      // Only clean up old artifacts (keep recent ones for debugging)
      const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
      
      const files = await fs.readdir(artifactsDir);
      let cleanedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(artifactsDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          await fs.rm(filePath, { recursive: true, force: true });
          cleanedCount++;
        }
      }
      
      if (cleanedCount > 0) {
        console.log(`✅ Cleaned up ${cleanedCount} old test artifacts`);
      } else {
        console.log('ℹ️  No old test artifacts to clean');
      }
    } catch (error) {
      console.warn('⚠️  Could not clean test artifacts:', error);
    }

    // Generate E2E test report summary
    console.log('📈 Generating E2E test summary...');
    
    try {
      const testResultsDir = path.join(process.cwd(), 'test-results');
      
      // Check for various report files
      const reportFiles = [
        'e2e-results.json',
        'e2e-results.xml',
        'e2e-html-report/index.html'
      ];

      const availableReports = [];
      for (const reportFile of reportFiles) {
        try {
          await fs.access(path.join(testResultsDir, reportFile));
          availableReports.push(reportFile);
        } catch {
          // Report not available
        }
      }

      const summary = {
        timestamp: new Date().toISOString(),
        setupState,
        reports: availableReports,
        artifactsDirectory: artifactsDir,
        environment: {
          nodeEnv: process.env.NODE_ENV,
          ci: !!process.env.CI,
          persistenceType: process.env.CRM_PERSISTENCE_TYPE
        }
      };

      await fs.writeFile(
        path.join(testResultsDir, 'e2e-summary.json'),
        JSON.stringify(summary, null, 2)
      );

      console.log('✅ E2E test summary generated');
      
      if (availableReports.length > 0) {
        console.log(`📄 Available reports: ${availableReports.join(', ')}`);
      }

    } catch (error) {
      console.warn('⚠️  Could not generate E2E test summary:', error);
    }

    // Clean up global state
    if (global.__E2E_SETUP_STATE__) {
      delete global.__E2E_SETUP_STATE__;
    }

    // Force cleanup of any remaining resources
    if (global.gc) {
      global.gc();
      console.log('🗑️  Forced garbage collection');
    }

    console.log('✅ Playwright global teardown completed successfully');

  } catch (error) {
    console.error('❌ Playwright global teardown failed:', error);
    // Don't throw in teardown to avoid masking test failures
  }
}

export default globalTeardown;