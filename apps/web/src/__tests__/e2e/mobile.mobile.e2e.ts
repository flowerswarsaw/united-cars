/**
 * End-to-End Tests - Mobile Experience
 * Tests critical workflows on mobile devices and responsive behavior
 */

import { test, expect } from '@playwright/test'

test.describe('Mobile Experience', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport (already set by device config, but explicitly ensure it)
    await page.setViewportSize({ width: 375, height: 667 })
  })

  test('should display mobile-optimized navigation', async ({ page }) => {
    await page.goto('/')
    
    // Mobile menu button should be visible
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
    
    // Desktop navigation should be hidden
    await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible()
    
    // Tap mobile menu button
    await page.click('[data-testid="mobile-menu-button"]')
    
    // Mobile menu should slide out
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
    
    // Verify navigation links are accessible
    await expect(page.locator('[data-testid="mobile-menu"] [data-testid="nav-vehicles"]')).toBeVisible()
    await expect(page.locator('[data-testid="mobile-menu"] [data-testid="nav-claims"]')).toBeVisible()
    await expect(page.locator('[data-testid="mobile-menu"] [data-testid="nav-services"]')).toBeVisible()
  })

  test('should have touch-friendly button sizes', async ({ page }) => {
    await page.goto('/vehicles')
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="vehicles-list"]')
    
    // Check that interactive elements have minimum touch target size (44px)
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i)
      const box = await button.boundingBox()
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44)
        expect(box.width).toBeGreaterThanOrEqual(44)
      }
    }
  })

  test('should handle mobile form interactions correctly', async ({ page }) => {
    await page.goto('/claims')
    
    // Create new claim on mobile
    await page.click('[data-testid="create-claim-button"]')
    
    // Form should be mobile-optimized
    await expect(page.locator('[data-testid="claim-form"]')).toBeVisible()
    
    // Form fields should be appropriately sized for mobile
    const descriptionField = page.locator('[data-testid="claim-description"]')
    const fieldBox = await descriptionField.boundingBox()
    expect(fieldBox?.height).toBeGreaterThanOrEqual(44)
    
    // Test mobile keyboard interaction
    await descriptionField.focus()
    
    // Virtual keyboard should not obscure form fields
    // (We can't directly test the keyboard, but ensure form remains accessible)
    await expect(descriptionField).toBeVisible()
    
    // Fill form with mobile-friendly input
    await page.fill('[data-testid="claim-description"]', 'Mobile test claim description with sufficient detail')
    
    // Test select dropdown on mobile
    await page.click('[data-testid="claim-vehicle-select"]')
    await expect(page.locator('[data-testid="vehicle-options"]')).toBeVisible()
    
    // Select an option
    await page.click('[data-testid="vehicle-option-1"]')
    
    // Verify selection
    await expect(page.locator('[data-testid="claim-vehicle-select"]')).not.toContainText('Select a vehicle')
  })

  test('should handle mobile photo uploads', async ({ page }) => {
    await page.goto('/claims')
    await page.click('[data-testid="create-claim-button"]')
    
    // Photo upload should be mobile-optimized
    const uploadButton = page.locator('[data-testid="claim-photos-upload-button"]')
    await expect(uploadButton).toBeVisible()
    
    // Click upload button (on mobile, this might trigger camera or gallery)
    await uploadButton.click()
    
    // File input should become active
    const fileInput = page.locator('[data-testid="claim-photos-upload"]')
    
    // Simulate mobile photo capture
    await fileInput.setInputFiles([
      {
        name: 'mobile-photo.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('mock-mobile-image-content')
      }
    ])
    
    // Photo preview should be mobile-friendly
    await expect(page.locator('[data-testid="photo-preview"]')).toBeVisible()
    
    // Preview should be appropriately sized for mobile
    const preview = page.locator('[data-testid="photo-preview"] img')
    const previewBox = await preview.boundingBox()
    expect(previewBox?.width).toBeLessThanOrEqual(375) // Should not exceed viewport width
  })

  test('should display tables responsively on mobile', async ({ page }) => {
    await page.goto('/vehicles')
    
    // Wait for vehicles to load
    await page.waitForSelector('[data-testid="vehicles-list"]')
    
    // On mobile, table should be stacked or horizontally scrollable
    const table = page.locator('[data-testid="vehicles-table"]')
    
    if (await table.isVisible()) {
      // If using horizontal scroll, verify it's scrollable
      const tableBox = await table.boundingBox()
      expect(tableBox?.width).toBeGreaterThanOrEqual(300)
      
      // Test horizontal scrolling
      await table.evaluate(el => el.scrollLeft = 100)
      const scrollLeft = await table.evaluate(el => el.scrollLeft)
      expect(scrollLeft).toBeGreaterThan(0)
    } else {
      // If using card/stack layout, verify cards are visible
      await expect(page.locator('[data-testid="vehicle-card"]').first()).toBeVisible()
    }
  })

  test('should handle mobile gestures and interactions', async ({ page }) => {
    await page.goto('/claims/claim-123')
    
    // Test swipe gestures on mobile (if implemented)
    const claimDetails = page.locator('[data-testid="claim-details"]')
    
    // Test pull-to-refresh (if implemented)
    await page.evaluate(() => {
      window.scrollTo(0, 0)
    })
    
    // Simulate pull down gesture
    await page.touchscreen.tap(100, 100)
    await page.touchscreen.tap(100, 200)
    
    // Test long press interactions (if implemented)
    const photoThumbnail = page.locator('[data-testid="photo-thumbnail"]').first()
    if (await photoThumbnail.isVisible()) {
      // Long press should open context menu or full view
      await photoThumbnail.click({ force: true })
      await page.waitForTimeout(1000) // Simulate long press duration
    }
  })

  test('should maintain performance on mobile', async ({ page }) => {
    // Start performance measurement
    const startTime = Date.now()
    
    await page.goto('/vehicles')
    
    // Wait for page to be fully loaded
    await page.waitForSelector('[data-testid="vehicles-list"]')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Page should load within reasonable time on mobile
    expect(loadTime).toBeLessThan(5000) // 5 seconds maximum
    
    // Test scroll performance
    const scrollStart = Date.now()
    
    // Simulate mobile scrolling
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, 200))
      await page.waitForTimeout(100)
    }
    
    const scrollTime = Date.now() - scrollStart
    expect(scrollTime).toBeLessThan(2000) // Scrolling should be smooth
  })

  test('should display appropriate mobile notifications', async ({ page }) => {
    await page.goto('/claims')
    
    // Create a claim to trigger mobile notification
    await page.click('[data-testid="create-claim-button"]')
    
    // Fill minimum required fields
    await page.selectOption('[data-testid="claim-vehicle-select"]', { index: 1 })
    await page.fill('[data-testid="claim-description"]', 'Mobile test claim')
    
    // Submit claim
    await page.click('[data-testid="submit-claim-button"]')
    
    // Mobile notification should appear
    await expect(page.locator('[data-testid="mobile-notification"]')).toBeVisible()
    
    // Notification should be appropriately positioned for mobile
    const notification = page.locator('[data-testid="mobile-notification"]')
    const notificationBox = await notification.boundingBox()
    
    // Should not extend beyond viewport width
    expect(notificationBox?.width).toBeLessThanOrEqual(375)
    
    // Should be positioned at top or bottom of screen
    expect(notificationBox?.y).toBeLessThanOrEqual(50) // Top notification
    // OR expect(notificationBox?.y).toBeGreaterThanOrEqual(600) // Bottom notification
  })

  test('should handle mobile connectivity issues gracefully', async ({ page }) => {
    // Navigate to page
    await page.goto('/vehicles')
    await page.waitForSelector('[data-testid="vehicles-list"]')
    
    // Simulate network disconnection
    await page.context().setOffline(true)
    
    // Try to refresh data
    await page.click('[data-testid="refresh-vehicles"]')
    
    // Should show offline state
    await expect(page.locator('[data-testid="offline-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="offline-message"]')).toContainText('offline')
    
    // Restore connection
    await page.context().setOffline(false)
    
    // Try refresh again
    await page.click('[data-testid="refresh-vehicles"]')
    
    // Should recover and show data
    await expect(page.locator('[data-testid="offline-message"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="vehicles-list"]')).toBeVisible()
  })

  test('should support mobile accessibility features', async ({ page }) => {
    await page.goto('/claims')
    
    // Test focus management for mobile screen readers
    await page.keyboard.press('Tab')
    
    // First focusable element should be highlighted
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Test aria labels on mobile
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]')
    const ariaLabel = await mobileMenuButton.getAttribute('aria-label')
    expect(ariaLabel).toBeTruthy()
    expect(ariaLabel).toContain('menu')
    
    // Test mobile-specific accessibility features
    const touchElements = page.locator('[data-touchable="true"]')
    const touchCount = await touchElements.count()
    
    // Touch elements should have appropriate accessibility attributes
    for (let i = 0; i < Math.min(touchCount, 3); i++) {
      const element = touchElements.nth(i)
      const role = await element.getAttribute('role')
      const ariaLabel = await element.getAttribute('aria-label')
      
      // Should have either role or aria-label for screen readers
      expect(role || ariaLabel).toBeTruthy()
    }
  })
})