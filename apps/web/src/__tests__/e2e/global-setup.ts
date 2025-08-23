/**
 * Global Playwright Setup
 * Sets up test database, authentication states, and test data
 */

import { chromium, FullConfig } from '@playwright/test'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup for Playwright tests...')

  // Ensure test database is ready
  await setupTestDatabase()

  // Create authentication states for different user types
  await createAuthenticationStates()

  console.log('✅ Global setup completed')
}

async function setupTestDatabase() {
  console.log('🗄️  Setting up test database...')

  try {
    // Set test database URL
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://postgres:password@localhost:5434/united_cars_test'

    // Reset and seed test database
    console.log('Resetting test database schema...')
    execSync('pnpm db:reset --force', { 
      stdio: 'inherit',
      env: { 
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL 
      }
    })

    console.log('Seeding test data...')
    execSync('pnpm db:seed', {
      stdio: 'inherit',
      env: { 
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL 
      }
    })

    console.log('✅ Test database ready')
  } catch (error) {
    console.warn('⚠️  Database setup failed, tests may use mocked data:', error.message)
  }
}

async function createAuthenticationStates() {
  console.log('🔐 Creating authentication states...')

  const browser = await chromium.launch()

  // Create dealer authentication state
  await createDealerAuthState(browser)
  
  // Create admin authentication state  
  await createAdminAuthState(browser)

  await browser.close()
  console.log('✅ Authentication states created')
}

async function createDealerAuthState(browser) {
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Navigate to login page
    await page.goto('http://localhost:3000/login')

    // Fill login form with test dealer credentials
    await page.fill('[data-testid="email"]', 'dealer@test.com')
    await page.fill('[data-testid="password"]', 'testpassword123')
    
    // Submit login form
    await page.click('[data-testid="login-button"]')

    // Wait for successful login redirect
    await page.waitForURL('**/dashboard', { timeout: 10000 })

    // Verify login was successful
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 5000 })

    // Save authentication state
    await context.storageState({ path: 'playwright/.auth/dealer.json' })
    console.log('✅ Dealer authentication state saved')

  } catch (error) {
    console.log('⚠️  Could not create dealer auth state, creating mock:', error.message)
    
    // Create mock authentication state
    const mockAuthState = {
      cookies: [
        {
          name: 'session',
          value: encodeURIComponent(JSON.stringify({
            user: {
              id: 'test-dealer-123',
              email: 'dealer@test.com',
              name: 'Test Dealer',
              roles: ['DEALER'],
              orgId: 'test-org-123'
            }
          })),
          domain: 'localhost',
          path: '/',
          expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          httpOnly: true,
          secure: false,
          sameSite: 'Lax'
        }
      ],
      origins: []
    }

    // Ensure directory exists
    fs.mkdirSync('playwright/.auth', { recursive: true })
    fs.writeFileSync('playwright/.auth/dealer.json', JSON.stringify(mockAuthState, null, 2))
  } finally {
    await context.close()
  }
}

async function createAdminAuthState(browser) {
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Navigate to login page
    await page.goto('http://localhost:3000/login')

    // Fill login form with test admin credentials
    await page.fill('[data-testid="email"]', 'admin@test.com')
    await page.fill('[data-testid="password"]', 'adminpassword123')
    
    // Submit login form
    await page.click('[data-testid="login-button"]')

    // Wait for successful login redirect
    await page.waitForURL('**/dashboard', { timeout: 10000 })

    // Verify login was successful
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 5000 })

    // Save authentication state
    await context.storageState({ path: 'playwright/.auth/admin.json' })
    console.log('✅ Admin authentication state saved')

  } catch (error) {
    console.log('⚠️  Could not create admin auth state, creating mock:', error.message)
    
    // Create mock authentication state
    const mockAuthState = {
      cookies: [
        {
          name: 'session',
          value: encodeURIComponent(JSON.stringify({
            user: {
              id: 'test-admin-123',
              email: 'admin@test.com',
              name: 'Test Admin',
              roles: ['ADMIN'],
              orgId: 'admin-org-123'
            }
          })),
          domain: 'localhost',
          path: '/',
          expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          httpOnly: true,
          secure: false,
          sameSite: 'Lax'
        }
      ],
      origins: []
    }

    fs.writeFileSync('playwright/.auth/admin.json', JSON.stringify(mockAuthState, null, 2))
  } finally {
    await context.close()
  }
}

export default globalSetup