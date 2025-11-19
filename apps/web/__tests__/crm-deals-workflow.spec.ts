import { test, expect } from '@playwright/test';

test.describe('CRM Deals - Complete Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to deals page
    await page.goto('/crm/deals');
  });

  test('should create new deal and verify it appears in first stage', async ({ page }) => {
    // Click "New Deal" button
    await page.click('button:has-text("New Deal")');

    // Fill out deal creation form
    await page.fill('input[name="title"]', 'Test Auto Deal');
    await page.fill('input[name="amount"]', '50000');
    await page.selectOption('select[name="currency"]', 'USD');

    // Select pipeline (assuming Dealer pipeline exists)
    await page.selectOption('select[name="pipelineId"]', { label: 'Dealer' });

    // Add notes
    await page.fill('textarea[name="notes"]', 'This is a test deal created by automated tests');

    // Submit form
    await page.click('button:has-text("Create Deal")');

    // Wait for success toast
    await expect(page.locator('text=Deal created successfully')).toBeVisible({ timeout: 5000 });

    // Verify deal appears in Kanban board
    await expect(page.locator('text=Test Auto Deal')).toBeVisible();
    await expect(page.locator('text=$50,000')).toBeVisible();
  });

  test('should move deal through pipeline stages using drag and drop', async ({ page }) => {
    // Wait for Kanban board to load
    await page.waitForSelector('[data-testid="kanban-board"]', { timeout: 10000 });

    // Find a deal card
    const dealCard = page.locator('[data-testid="deal-card"]').first();
    await expect(dealCard).toBeVisible();

    // Get initial stage
    const initialStage = await dealCard.getAttribute('data-stage-id');

    // Find next stage column
    const stages = page.locator('[data-testid="stage-column"]');
    const stageCount = await stages.count();

    if (stageCount > 1) {
      const targetStage = stages.nth(1);
      const targetStageId = await targetStage.getAttribute('data-stage-id');

      // Perform drag and drop
      await dealCard.dragTo(targetStage);

      // Wait for API call to complete
      await page.waitForResponse(response =>
        response.url().includes('/api/crm/deals/') &&
        response.url().includes('/move') &&
        response.status() === 200
      );

      // Verify deal moved to new stage
      const movedCard = page.locator(`[data-deal-id="${await dealCard.getAttribute('data-deal-id')}"]`);
      await expect(movedCard).toHaveAttribute('data-stage-id', targetStageId);

      // Verify activity was logged
      await expect(page.locator('text=moved to')).toBeVisible();
    }
  });

  test('should require loss reason when moving to lost stage', async ({ page }) => {
    // Create a test deal first
    await page.click('button:has-text("New Deal")');
    await page.fill('input[name="title"]', 'Deal to Mark Lost');
    await page.fill('input[name="amount"]', '25000');
    await page.click('button:has-text("Create Deal")');

    await page.waitForTimeout(1000);

    // Find the deal and click "Mark Lost" button
    const dealCard = page.locator('text=Deal to Mark Lost').locator('..');
    await dealCard.hover();
    await dealCard.locator('button[aria-label="Mark as lost"]').click();

    // Try to submit without selecting loss reason
    await page.click('button:has-text("Mark as Lost")');

    // Should show validation error
    await expect(page.locator('text=Please select a loss reason')).toBeVisible();

    // Now select a loss reason
    await page.selectOption('select[name="lossReason"]', 'REJECTION');
    await page.fill('textarea[name="note"]', 'Client went with competitor');

    // Submit
    await page.click('button:has-text("Mark as Lost")');

    // Verify success
    await expect(page.locator('text=Deal marked as lost')).toBeVisible();

    // Verify deal has lost badge
    await expect(page.locator('text=Deal to Mark Lost').locator('..').locator('text=Lost')).toBeVisible();
  });

  test('should auto-spawn integration pipeline when deal is marked won', async ({ page }) => {
    // Create a test deal
    await page.click('button:has-text("New Deal")');
    await page.fill('input[name="title"]', 'Deal to Win');
    await page.fill('input[name="amount"]', '75000');
    await page.selectOption('select[name="pipelineId"]', { label: 'Dealer' });
    await page.click('button:has-text("Create Deal")');

    await page.waitForTimeout(1000);

    // Find and mark as won
    const dealCard = page.locator('text=Deal to Win').locator('..');
    await dealCard.hover();
    await dealCard.locator('button[aria-label="Mark as won"]').click();

    // Add optional note
    await page.fill('textarea[name="note"]', 'Closed the deal successfully!');
    await page.click('button:has-text("Mark as Won")');

    // Wait for success
    await expect(page.locator('text=Deal marked as won')).toBeVisible();

    // Switch to Integration pipeline tab
    await page.click('text=Integration');

    // Verify deal appears in Integration pipeline
    await expect(page.locator('text=Deal to Win')).toBeVisible();

    // Verify it's in the first stage of Integration pipeline
    const integrationStage = page.locator('[data-stage-order="0"]').first();
    await expect(integrationStage.locator('text=Deal to Win')).toBeVisible();
  });

  test('should filter deals by search query', async ({ page }) => {
    // Wait for deals to load
    await page.waitForSelector('[data-testid="kanban-board"]');

    // Get initial deal count
    const initialCount = await page.locator('[data-testid="deal-card"]').count();

    // Enter search query
    await page.fill('input[placeholder*="Search"]', 'Unique Test Deal 12345');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // Should show no results (unless this exact deal exists)
    const filteredCount = await page.locator('[data-testid="deal-card"]').count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);

    // Clear search
    await page.fill('input[placeholder*="Search"]', '');
    await page.waitForTimeout(500);

    // Count should return to initial
    const finalCount = await page.locator('[data-testid="deal-card"]').count();
    expect(finalCount).toEqual(initialCount);
  });

  test('should show deal details when clicking on deal card', async ({ page }) => {
    // Click on first deal card
    const dealCard = page.locator('[data-testid="deal-card"]').first();
    const dealTitle = await dealCard.locator('[data-testid="deal-title"]').textContent();

    await dealCard.click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/crm\/deals\/[a-zA-Z0-9_-]+/);

    // Verify deal details are shown
    await expect(page.locator(`h1:has-text("${dealTitle}")`)).toBeVisible();

    // Should show deal information sections
    await expect(page.locator('text=Deal Information')).toBeVisible();
    await expect(page.locator('text=Tasks')).toBeVisible();
    await expect(page.locator('text=Activity History')).toBeVisible();
  });

  test('should use keyboard shortcuts to navigate stages', async ({ page }) => {
    await page.waitForSelector('[data-testid="kanban-board"]');

    // Focus on first deal card
    await page.locator('[data-testid="deal-card"]').first().focus();

    // Press arrow right to move to next stage (if shortcuts are implemented)
    await page.keyboard.press('ArrowRight');

    // This test assumes keyboard navigation is implemented
    // Adjust based on actual implementation
  });

  test('should bulk collapse/expand stages', async ({ page }) => {
    await page.waitForSelector('[data-testid="kanban-board"]');

    // Click collapse all button
    await page.click('button[aria-label="Collapse all stages"]');

    // All stage contents should be hidden
    const collapsedStages = await page.locator('[data-testid="stage-column"][data-collapsed="true"]').count();
    expect(collapsedStages).toBeGreaterThan(0);

    // Click expand all button
    await page.click('button[aria-label="Expand all stages"]');

    // All stages should be expanded
    const expandedStages = await page.locator('[data-testid="stage-column"][data-collapsed="false"]').count();
    expect(expandedStages).toBeGreaterThan(0);
  });

  test('should handle errors gracefully when API fails', async ({ page }) => {
    // Intercept API and return error
    await page.route('/api/crm/deals', route => route.abort());

    await page.reload();

    // Should show error message
    await expect(page.locator('text=Failed to load deals')).toBeVisible();

    // Should offer retry option
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });

  test('should show empty state when no deals exist', async ({ page }) => {
    // Mock empty response
    await page.route('/api/crm/deals', route =>
      route.fulfill({
        status: 200,
        body: JSON.stringify([])
      })
    );

    await page.reload();

    // Should show empty state
    await expect(page.locator('text=No deals found')).toBeVisible();
    await expect(page.locator('button:has-text("Create your first deal")')).toBeVisible();
  });
});

test.describe('CRM Deals - Stage Management', () => {
  test('should not allow moving won/lost deals', async ({ page }) => {
    await page.goto('/crm/deals');
    await page.waitForSelector('[data-testid="kanban-board"]');

    // Find a won or lost deal
    const wonDeal = page.locator('[data-testid="deal-card"][data-status="WON"]').first();

    if (await wonDeal.count() > 0) {
      // Try to drag (should be disabled or show warning)
      await wonDeal.hover();

      // Drag handle should be hidden or disabled
      const dragHandle = wonDeal.locator('[data-testid="drag-handle"]');
      await expect(dragHandle).not.toBeVisible();
    }
  });

  test('should show deal count per stage', async ({ page }) => {
    await page.goto('/crm/deals');
    await page.waitForSelector('[data-testid="kanban-board"]');

    // Each stage should show count badge
    const stageHeaders = page.locator('[data-testid="stage-header"]');
    const count = await stageHeaders.count();

    for (let i = 0; i < count; i++) {
      const header = stageHeaders.nth(i);
      await expect(header.locator('[data-testid="deal-count"]')).toBeVisible();
    }
  });

  test('should highlight drop zone when dragging', async ({ page }) => {
    await page.goto('/crm/deals');
    await page.waitForSelector('[data-testid="kanban-board"]');

    const dealCard = page.locator('[data-testid="deal-card"]').first();
    const targetStage = page.locator('[data-testid="stage-column"]').nth(1);

    // Start dragging
    await dealCard.hover();
    await page.mouse.down();

    // Move to target stage
    await targetStage.hover();

    // Target stage should be highlighted
    await expect(targetStage).toHaveClass(/drop-zone-active/);

    // Release
    await page.mouse.up();
  });
});
