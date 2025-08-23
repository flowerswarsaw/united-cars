/**
 * Global Playwright Teardown
 * Cleans up test data and resources after test suite completion
 */

import { FullConfig } from '@playwright/test'
import fs from 'fs'
import path from 'path'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown for Playwright tests...')

  // Clean up authentication states
  await cleanupAuthStates()

  // Clean up test artifacts
  await cleanupTestArtifacts()

  // Log test completion
  console.log('✅ Global teardown completed')
}

async function cleanupAuthStates() {
  try {
    const authDir = 'playwright/.auth'
    if (fs.existsSync(authDir)) {
      const files = fs.readdirSync(authDir)
      for (const file of files) {
        fs.unlinkSync(path.join(authDir, file))
      }
      console.log('🗑️  Authentication states cleaned up')
    }
  } catch (error) {
    console.warn('⚠️  Could not clean up auth states:', error.message)
  }
}

async function cleanupTestArtifacts() {
  try {
    // Clean up any temporary test files
    const tempDirs = ['test-results', 'playwright-report']
    
    for (const dir of tempDirs) {
      if (fs.existsSync(dir)) {
        // Don't delete the directories in CI - they may be needed for reporting
        if (!process.env.CI) {
          fs.rmSync(dir, { recursive: true, force: true })
          console.log(`🗑️  Cleaned up ${dir}`)
        }
      }
    }

    // Clean up any downloaded files in tests
    const downloadsDir = 'downloads'
    if (fs.existsSync(downloadsDir)) {
      fs.rmSync(downloadsDir, { recursive: true, force: true })
      console.log('🗑️  Downloaded files cleaned up')
    }

  } catch (error) {
    console.warn('⚠️  Could not clean up test artifacts:', error.message)
  }
}

export default globalTeardown