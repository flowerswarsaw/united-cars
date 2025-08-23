/**
 * End-to-End Tests - Insurance Claims Management
 * Tests critical insurance claims workflows including creation, review, and approval
 */

import { test, expect } from '@playwright/test'

test.describe('Insurance Claims Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to claims page
    await page.goto('/claims')
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="claims-list"]')
  })

  test('should display claims list with correct information', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Insurance Claims')
    
    // Verify claims table/list is present
    await expect(page.locator('[data-testid="claims-list"]')).toBeVisible()
    
    // Check if at least one claim is displayed
    await expect(page.locator('[data-testid="claim-item"]').first()).toBeVisible()
    
    // Verify claim information is displayed
    const firstClaim = page.locator('[data-testid="claim-item"]').first()
    await expect(firstClaim.locator('[data-testid="claim-status"]')).toBeVisible()
    await expect(firstClaim.locator('[data-testid="claim-vehicle"]')).toBeVisible()
    await expect(firstClaim.locator('[data-testid="claim-date"]')).toBeVisible()
  })

  test('should create new insurance claim', async ({ page }) => {
    // Click create new claim button
    await page.click('[data-testid="create-claim-button"]')
    
    // Should open claim creation modal or navigate to form page
    await expect(page.locator('[data-testid="claim-form"]')).toBeVisible()
    
    // Fill out claim form
    await page.selectOption('[data-testid="claim-vehicle-select"]', { index: 1 })
    await page.fill('[data-testid="claim-description"]', 'Vehicle collision on highway - minor damage to front bumper')
    await page.fill('[data-testid="claim-incident-date"]', '2024-01-15')
    
    // Upload photos (mock file upload)
    const fileInput = page.locator('[data-testid="claim-photos-upload"]')
    await fileInput.setInputFiles([
      {
        name: 'damage-photo-1.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('mock-image-content')
      }
    ])
    
    // Submit the form
    await page.click('[data-testid="submit-claim-button"]')
    
    // Wait for submission to complete
    await page.waitForResponse(response => 
      response.url().includes('/api/claims') && response.request().method() === 'POST'
    )
    
    // Should show success message
    await expect(page.locator('[data-testid="claim-success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="claim-success-message"]')).toContainText('successfully created')
    
    // Should redirect back to claims list
    await page.waitForURL('**/claims')
    
    // New claim should appear in the list
    await expect(page.locator('[data-testid="claim-item"]').first().locator('[data-testid="claim-status"]')).toContainText('new')
  })

  test('should validate claim form fields', async ({ page }) => {
    // Click create new claim button
    await page.click('[data-testid="create-claim-button"]')
    
    // Try to submit without required fields
    await page.click('[data-testid="submit-claim-button"]')
    
    // Should show validation errors
    await expect(page.locator('[data-testid="vehicle-error"]')).toContainText('Vehicle selection is required')
    await expect(page.locator('[data-testid="description-error"]')).toContainText('Description is required')
    
    // Fill description with too short text
    await page.fill('[data-testid="claim-description"]', 'Short')
    await page.click('[data-testid="submit-claim-button"]')
    
    // Should show length validation error
    await expect(page.locator('[data-testid="description-error"]')).toContainText('at least 10 characters')
  })

  test('should filter claims by status', async ({ page }) => {
    // Click on status filter dropdown
    await page.click('[data-testid="claims-status-filter"]')
    
    // Select 'pending review' status
    await page.click('[data-testid="status-review"]')
    
    // Wait for filter to be applied
    await page.waitForResponse(response => 
      response.url().includes('/api/claims') && response.url().includes('status=review')
    )
    
    // Verify that filtered results are displayed
    const claimStatuses = page.locator('[data-testid="claim-status"]')
    const count = await claimStatuses.count()
    
    for (let i = 0; i < count; i++) {
      await expect(claimStatuses.nth(i)).toContainText('review')
    }
  })

  test('should search claims by vehicle VIN', async ({ page }) => {
    // Enter VIN in search field
    await page.fill('[data-testid="claims-search"]', '1HGBH41JXMN109186')
    
    // Trigger search
    await page.press('[data-testid="claims-search"]', 'Enter')
    
    // Wait for search results
    await page.waitForResponse(response => 
      response.url().includes('/api/claims') && response.url().includes('search=1HGBH41JXMN109186')
    )
    
    // Verify search results
    const claimItems = page.locator('[data-testid="claim-item"]')
    const count = await claimItems.count()
    
    // All results should contain the searched VIN
    for (let i = 0; i < count; i++) {
      const vehicleInfo = await claimItems.nth(i).locator('[data-testid="claim-vehicle"]').textContent()
      expect(vehicleInfo).toContain('1HGBH41JXMN109186')
    }
  })

  test('should view claim details', async ({ page }) => {
    // Click on the first claim
    await page.click('[data-testid="claim-item"]')
    
    // Should navigate to claim detail page
    await page.waitForURL('**/claims/**')
    
    // Verify claim detail page is loaded
    await expect(page.locator('[data-testid="claim-details"]')).toBeVisible()
    
    // Check that claim information is displayed
    await expect(page.locator('[data-testid="claim-description-detail"]')).toBeVisible()
    await expect(page.locator('[data-testid="claim-vehicle-detail"]')).toBeVisible()
    await expect(page.locator('[data-testid="claim-photos"]')).toBeVisible()
    await expect(page.locator('[data-testid="claim-status-detail"]')).toBeVisible()
  })

  test('should upload additional photos to existing claim', async ({ page }) => {
    // Navigate to a specific claim detail page
    await page.goto('/claims/claim-123')
    
    // Click add photos button
    await page.click('[data-testid="add-photos-button"]')
    
    // Upload additional photos
    const fileInput = page.locator('[data-testid="additional-photos-upload"]')
    await fileInput.setInputFiles([
      {
        name: 'damage-photo-2.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('mock-image-content-2')
      },
      {
        name: 'damage-photo-3.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('mock-image-content-3')
      }
    ])
    
    // Submit photos
    await page.click('[data-testid="upload-photos-button"]')
    
    // Wait for upload to complete
    await page.waitForResponse(response => 
      response.url().includes('/api/claims/claim-123/photos') && response.request().method() === 'POST'
    )
    
    // Should show success message
    await expect(page.locator('[data-testid="photos-upload-success"]')).toBeVisible()
    
    // Photos should appear in the gallery
    await expect(page.locator('[data-testid="claim-photos"] img')).toHaveCount(3)
  })

  test('should handle claim status updates', async ({ page }) => {
    // Navigate to a claim in 'new' status
    await page.goto('/claims/new-claim-123')
    
    // Should show status update options for authorized users
    await expect(page.locator('[data-testid="status-actions"]')).toBeVisible()
    
    // Click move to review
    await page.click('[data-testid="move-to-review-button"]')
    
    // Should show confirmation dialog
    await expect(page.locator('[data-testid="status-change-dialog"]')).toBeVisible()
    await expect(page.locator('[data-testid="status-change-dialog"]')).toContainText('Move claim to review status')
    
    // Confirm status change
    await page.click('[data-testid="confirm-status-change"]')
    
    // Wait for status update
    await page.waitForResponse(response => 
      response.url().includes('/api/claims/new-claim-123/status') && response.request().method() === 'PUT'
    )
    
    // Status should be updated
    await expect(page.locator('[data-testid="claim-status-detail"]')).toContainText('review')
    
    // Should show success notification
    await expect(page.locator('[data-testid="status-update-success"]')).toBeVisible()
  })

  test('should prevent invalid status transitions', async ({ page }) => {
    // Navigate to a claim in 'approved' status
    await page.goto('/claims/approved-claim-123')
    
    // Status should be displayed correctly
    await expect(page.locator('[data-testid="claim-status-detail"]')).toContainText('approved')
    
    // Should not show option to move backwards to 'new' status
    await expect(page.locator('[data-testid="move-to-new-button"]')).not.toBeVisible()
    
    // Should only show valid next transitions
    await expect(page.locator('[data-testid="move-to-paid-button"]')).toBeVisible()
  })

  test('should display claim history and audit trail', async ({ page }) => {
    // Navigate to claim detail page
    await page.goto('/claims/claim-with-history-123')
    
    // Click on history tab
    await page.click('[data-testid="claim-history-tab"]')
    
    // Verify history is displayed
    await expect(page.locator('[data-testid="claim-history"]')).toBeVisible()
    
    // Check that history entries are shown
    const historyEntries = page.locator('[data-testid="history-entry"]')
    await expect(historyEntries).toHaveCountGreaterThan(0)
    
    // Verify history entry details
    const firstEntry = historyEntries.first()
    await expect(firstEntry.locator('[data-testid="history-action"]')).toBeVisible()
    await expect(firstEntry.locator('[data-testid="history-user"]')).toBeVisible()
    await expect(firstEntry.locator('[data-testid="history-timestamp"]')).toBeVisible()
  })

  test('should handle file size and type validation for photo uploads', async ({ page }) => {
    // Click create new claim button
    await page.click('[data-testid="create-claim-button"]')
    
    // Try to upload invalid file type
    const fileInput = page.locator('[data-testid="claim-photos-upload"]')
    await fileInput.setInputFiles([
      {
        name: 'document.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('This is not an image')
      }
    ])
    
    // Should show file type validation error
    await expect(page.locator('[data-testid="file-type-error"]')).toContainText('Only image files are allowed')
    
    // Try to upload oversized file (mock large file)
    await fileInput.setInputFiles([
      {
        name: 'huge-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.alloc(11 * 1024 * 1024) // 11MB file
      }
    ])
    
    // Should show file size validation error
    await expect(page.locator('[data-testid="file-size-error"]')).toContainText('File size exceeds maximum limit')
  })

  test('should handle concurrent claim modifications', async ({ page }) => {
    // Navigate to claim detail page
    await page.goto('/claims/claim-123')
    
    // Mock concurrent modification by another user
    await page.route('**/api/claims/claim-123/status', async route => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { 
              code: 'CONCURRENT_MODIFICATION',
              message: 'Claim was modified by another user'
            }
          })
        })
      }
    })
    
    // Try to update status
    await page.click('[data-testid="move-to-review-button"]')
    await page.click('[data-testid="confirm-status-change"]')
    
    // Should show concurrent modification error
    await expect(page.locator('[data-testid="concurrent-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="concurrent-error"]')).toContainText('modified by another user')
    
    // Should offer to reload with latest data
    await expect(page.locator('[data-testid="reload-claim-button"]')).toBeVisible()
  })
})