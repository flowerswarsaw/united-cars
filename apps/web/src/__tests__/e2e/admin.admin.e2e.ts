/**
 * End-to-End Tests - Admin Functions
 * Tests admin-specific workflows and system administration features
 */

import { test, expect } from '@playwright/test'

test.describe('Admin Functions', () => {
  test('should access admin dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard')
    
    // Admin dashboard should be accessible
    await expect(page.locator('[data-testid="admin-dashboard"]')).toBeVisible()
    await expect(page.locator('h1')).toContainText('Admin Dashboard')
    
    // Admin-specific navigation should be visible
    await expect(page.locator('[data-testid="admin-nav"]')).toBeVisible()
    await expect(page.locator('[data-testid="admin-nav"] [data-testid="nav-performance"]')).toBeVisible()
    await expect(page.locator('[data-testid="admin-nav"] [data-testid="nav-users"]')).toBeVisible()
  })

  test('should view system performance metrics', async ({ page }) => {
    await page.goto('/admin/performance')
    
    // Performance page should load
    await expect(page.locator('[data-testid="performance-dashboard"]')).toBeVisible()
    
    // Should display key metrics
    await expect(page.locator('[data-testid="response-time-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-rate-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="active-users-count"]')).toBeVisible()
    
    // Should have real-time updates
    const activeUsers = page.locator('[data-testid="active-users-count"]')
    const initialCount = await activeUsers.textContent()
    
    // Wait for potential update
    await page.waitForTimeout(2000)
    
    // Verify metric is displaying a number
    expect(initialCount).toMatch(/\d+/)
  })

  test('should manage user access across all orgs', async ({ page }) => {
    await page.goto('/admin/users')
    
    // Users management page should be accessible
    await expect(page.locator('[data-testid="users-list"]')).toBeVisible()
    
    // Should show users from all organizations (admin privilege)
    const userItems = page.locator('[data-testid="user-item"]')
    await expect(userItems).toHaveCountGreaterThan(0)
    
    // Should be able to see org information for each user
    const firstUser = userItems.first()
    await expect(firstUser.locator('[data-testid="user-org"]')).toBeVisible()
    
    // Should have admin controls
    await expect(firstUser.locator('[data-testid="user-actions"]')).toBeVisible()
  })

  test('should view cross-org claims and services', async ({ page }) => {
    await page.goto('/claims')
    
    // Wait for claims to load
    await page.waitForSelector('[data-testid="claims-list"]')
    
    // Admin should see claims from all orgs
    const claimItems = page.locator('[data-testid="claim-item"]')
    await expect(claimItems).toHaveCountGreaterThan(0)
    
    // Should show org information for each claim
    const firstClaim = claimItems.first()
    await expect(firstClaim.locator('[data-testid="claim-org"]')).toBeVisible()
    
    // Should be able to filter by org
    await page.click('[data-testid="org-filter"]')
    await expect(page.locator('[data-testid="org-options"]')).toBeVisible()
  })

  test('should access system configuration', async ({ page }) => {
    await page.goto('/admin/config')
    
    // Configuration page should be accessible
    await expect(page.locator('[data-testid="admin-config"]')).toBeVisible()
    
    // Should display system settings
    await expect(page.locator('[data-testid="system-settings"]')).toBeVisible()
    await expect(page.locator('[data-testid="feature-flags"]')).toBeVisible()
    
    // Should be able to update settings (read-only test)
    const featureToggle = page.locator('[data-testid="feature-toggle"]').first()
    if (await featureToggle.isVisible()) {
      await expect(featureToggle).toBeEnabled()
    }
  })

  test('should handle emergency system actions', async ({ page }) => {
    await page.goto('/admin/dashboard')
    
    // Emergency controls should be present
    const emergencySection = page.locator('[data-testid="emergency-controls"]')
    if (await emergencySection.isVisible()) {
      // Should have maintenance mode toggle
      await expect(emergencySection.locator('[data-testid="maintenance-toggle"]')).toBeVisible()
      
      // Should require confirmation for destructive actions
      const maintenanceToggle = emergencySection.locator('[data-testid="maintenance-toggle"]')
      await maintenanceToggle.click()
      
      // Should show confirmation dialog
      await expect(page.locator('[data-testid="maintenance-confirm-dialog"]')).toBeVisible()
      
      // Cancel the action
      await page.click('[data-testid="cancel-maintenance"]')
      await expect(page.locator('[data-testid="maintenance-confirm-dialog"]')).not.toBeVisible()
    }
  })
})