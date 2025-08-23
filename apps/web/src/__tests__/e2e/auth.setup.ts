/**
 * Authentication Setup for Playwright Tests
 * Creates authenticated browser states for different user roles
 */

import { test as setup, expect } from '@playwright/test'

const dealerFile = 'playwright/.auth/dealer.json'
const adminFile = 'playwright/.auth/admin.json'

setup('authenticate as dealer', async ({ page }) => {
  // Go to login page
  await page.goto('/login')

  // Perform authentication steps
  await page.fill('[data-testid="email"]', 'dealer@test.com')
  await page.fill('[data-testid="password"]', 'testpassword123')
  await page.click('[data-testid="login-button"]')

  // Wait until the page redirects to the dashboard
  await page.waitForURL('**/dashboard')
  
  // Verify we are logged in
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()

  // Save signed-in state
  await page.context().storageState({ path: dealerFile })
})

setup('authenticate as admin', async ({ page }) => {
  // Go to login page
  await page.goto('/login')

  // Perform authentication steps
  await page.fill('[data-testid="email"]', 'admin@test.com')
  await page.fill('[data-testid="password"]', 'adminpassword123')
  await page.click('[data-testid="login-button"]')

  // Wait until the page redirects to the dashboard
  await page.waitForURL('**/dashboard')
  
  // Verify we are logged in as admin
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible()
  
  // Verify admin privileges (admin menu should be visible)
  await expect(page.locator('[data-testid="admin-menu"]')).toBeVisible()

  // Save signed-in state
  await page.context().storageState({ path: adminFile })
})