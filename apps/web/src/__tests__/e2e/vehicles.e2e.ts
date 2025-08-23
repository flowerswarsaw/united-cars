/**
 * End-to-End Tests - Vehicles Management
 * Tests critical vehicle management workflows from the user's perspective
 */

import { test, expect } from '@playwright/test'

test.describe('Vehicles Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to vehicles page
    await page.goto('/vehicles')
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="vehicles-list"]')
  })

  test('should display vehicles list with correct information', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Vehicles')
    
    // Verify vehicles table/list is present
    await expect(page.locator('[data-testid="vehicles-list"]')).toBeVisible()
    
    // Check if at least one vehicle is displayed
    await expect(page.locator('[data-testid="vehicle-item"]').first()).toBeVisible()
    
    // Verify vehicle information is displayed
    const firstVehicle = page.locator('[data-testid="vehicle-item"]').first()
    await expect(firstVehicle.locator('[data-testid="vehicle-vin"]')).toBeVisible()
    await expect(firstVehicle.locator('[data-testid="vehicle-make-model"]')).toBeVisible()
    await expect(firstVehicle.locator('[data-testid="vehicle-status"]')).toBeVisible()
  })

  test('should filter vehicles by status', async ({ page }) => {
    // Click on status filter dropdown
    await page.click('[data-testid="status-filter"]')
    
    // Select 'available' status
    await page.click('[data-testid="status-available"]')
    
    // Wait for filter to be applied
    await page.waitForResponse(response => 
      response.url().includes('/api/vehicles') && response.url().includes('status=available')
    )
    
    // Verify that filtered results are displayed
    const vehicleStatuses = page.locator('[data-testid="vehicle-status"]')
    const count = await vehicleStatuses.count()
    
    for (let i = 0; i < count; i++) {
      await expect(vehicleStatuses.nth(i)).toContainText('available')
    }
  })

  test('should search vehicles by VIN, make, or model', async ({ page }) => {
    // Enter search term
    await page.fill('[data-testid="vehicle-search"]', 'Honda')
    
    // Trigger search
    await page.press('[data-testid="vehicle-search"]', 'Enter')
    
    // Wait for search results
    await page.waitForResponse(response => 
      response.url().includes('/api/vehicles') && response.url().includes('search=Honda')
    )
    
    // Verify search results contain the search term
    const vehicleItems = page.locator('[data-testid="vehicle-item"]')
    const count = await vehicleItems.count()
    
    // At least one result should contain 'Honda' in make or model
    let foundMatch = false
    for (let i = 0; i < count; i++) {
      const makeModel = await vehicleItems.nth(i).locator('[data-testid="vehicle-make-model"]').textContent()
      if (makeModel?.includes('Honda')) {
        foundMatch = true
        break
      }
    }
    expect(foundMatch).toBeTruthy()
  })

  test('should navigate to vehicle detail page', async ({ page }) => {
    // Click on the first vehicle
    await page.click('[data-testid="vehicle-item"]')
    
    // Should navigate to vehicle detail page
    await page.waitForURL('**/vehicles/**')
    
    // Verify vehicle detail page is loaded
    await expect(page.locator('[data-testid="vehicle-details"]')).toBeVisible()
    
    // Check that vehicle information is displayed
    await expect(page.locator('[data-testid="vehicle-vin-detail"]')).toBeVisible()
    await expect(page.locator('[data-testid="vehicle-specifications"]')).toBeVisible()
  })

  test('should handle pagination correctly', async ({ page }) => {
    // Check if pagination controls are present
    const pagination = page.locator('[data-testid="pagination"]')
    
    if (await pagination.isVisible()) {
      // Check current page indicator
      await expect(page.locator('[data-testid="current-page"]')).toContainText('1')
      
      // If next page exists, test navigation
      const nextButton = page.locator('[data-testid="next-page"]')
      if (await nextButton.isEnabled()) {
        await nextButton.click()
        
        // Wait for page navigation
        await page.waitForResponse(response => 
          response.url().includes('/api/vehicles') && response.url().includes('page=2')
        )
        
        // Verify page changed
        await expect(page.locator('[data-testid="current-page"]')).toContainText('2')
      }
    }
  })

  test('should display loading states during data fetching', async ({ page }) => {
    // Intercept API call to delay response
    await page.route('**/api/vehicles**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      await route.continue()
    })
    
    // Navigate to vehicles page
    await page.goto('/vehicles')
    
    // Should show loading state
    await expect(page.locator('[data-testid="vehicles-loading"]')).toBeVisible()
    
    // Loading state should disappear after data loads
    await expect(page.locator('[data-testid="vehicles-loading"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="vehicles-list"]')).toBeVisible()
  })

  test('should handle empty states gracefully', async ({ page }) => {
    // Mock empty response
    await page.route('**/api/vehicles**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          vehicles: [],
          pagination: { page: 1, perPage: 25, total: 0, totalPages: 0 }
        })
      })
    })
    
    // Navigate to vehicles page
    await page.goto('/vehicles')
    
    // Should show empty state
    await expect(page.locator('[data-testid="vehicles-empty"]')).toBeVisible()
    await expect(page.locator('[data-testid="vehicles-empty"]')).toContainText('No vehicles found')
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock error response
    await page.route('**/api/vehicles**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
        })
      })
    })
    
    // Navigate to vehicles page
    await page.goto('/vehicles')
    
    // Should show error state
    await expect(page.locator('[data-testid="vehicles-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="vehicles-error"]')).toContainText('error')
  })

  test('should refresh data when refresh button is clicked', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('[data-testid="vehicles-list"]')
    
    // Click refresh button
    await page.click('[data-testid="refresh-vehicles"]')
    
    // Should trigger new API call
    await page.waitForResponse(response => response.url().includes('/api/vehicles'))
    
    // Data should refresh (loading indicator should appear and disappear)
    await expect(page.locator('[data-testid="vehicles-loading"]')).toBeVisible()
    await expect(page.locator('[data-testid="vehicles-loading"]')).not.toBeVisible()
  })

  test('should maintain filter state during navigation', async ({ page }) => {
    // Apply a filter
    await page.click('[data-testid="status-filter"]')
    await page.click('[data-testid="status-available"]')
    
    // Wait for filter to be applied
    await page.waitForResponse(response => 
      response.url().includes('/api/vehicles') && response.url().includes('status=available')
    )
    
    // Navigate away and back
    await page.goto('/dashboard')
    await page.goto('/vehicles')
    
    // Filter should be maintained
    await expect(page.locator('[data-testid="status-filter"]')).toContainText('available')
  })
})