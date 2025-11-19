import { test, expect } from '@playwright/test';

test.describe('CRM Leads - Conversion Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/crm/leads');
  });

  test('should only allow converting target leads to deals', async ({ page }) => {
    // Wait for leads table to load
    await page.waitForSelector('[data-testid="leads-table"]', { timeout: 10000 });

    // Find a non-target lead
    const nonTargetLead = page.locator('[data-testid="lead-row"][data-is-target="false"]').first();

    if (await nonTargetLead.count() > 0) {
      // Convert button should be disabled
      const convertButton = nonTargetLead.locator('button[aria-label="Convert lead"]');
      await expect(convertButton).toBeDisabled();

      // Tooltip should explain why
      await convertButton.hover();
      await expect(page.locator('text=Mark as target first')).toBeVisible();
    }
  });

  test('should toggle lead target status', async ({ page }) => {
    await page.waitForSelector('[data-testid="leads-table"]');

    const leadRow = page.locator('[data-testid="lead-row"]').first();
    const targetToggle = leadRow.locator('[data-testid="target-toggle"]');

    // Get initial state
    const initialState = await targetToggle.getAttribute('data-is-target');

    // Click toggle
    await targetToggle.click();

    // Wait for API response
    await page.waitForResponse(response =>
      response.url().includes('/api/crm/leads/') &&
      response.status() === 200
    );

    // State should be opposite
    const newState = await targetToggle.getAttribute('data-is-target');
    expect(newState).not.toBe(initialState);

    // Visual indication should change
    if (newState === 'true') {
      await expect(targetToggle).toHaveClass(/text-green-600/);
    } else {
      await expect(targetToggle).toHaveClass(/text-gray-400/);
    }
  });

  test('should convert target lead to deal successfully', async ({ page }) => {
    await page.waitForSelector('[data-testid="leads-table"]');

    // Find a target lead or create one
    let targetLead = page.locator('[data-testid="lead-row"][data-is-target="true"]').first();

    if (await targetLead.count() === 0) {
      // Create a new target lead
      await page.click('button:has-text("New Lead")');
      await page.fill('input[name="firstName"]', 'John');
      await page.fill('input[name="lastName"]', 'Conversion');
      await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
      await page.fill('input[name="phone"]', '+1234567890');
      await page.check('input[name="isTarget"]');
      await page.click('button:has-text("Create Lead")');

      await page.waitForTimeout(1000);
      targetLead = page.locator('text=John Conversion').locator('..');
    }

    // Get lead details for verification
    const leadName = await targetLead.locator('[data-testid="lead-name"]').textContent();

    // Click convert button
    await targetLead.locator('button[aria-label="Convert lead"]').click();

    // Conversion dialog should open
    await expect(page.locator('text=Convert Lead to Deal')).toBeVisible();

    // Form should be pre-filled with lead data
    const titleInput = page.locator('input[name="title"]');
    await expect(titleInput).toHaveValue(new RegExp(leadName || ''));

    // Fill deal details
    await page.fill('input[name="amount"]', '35000');
    await page.selectOption('select[name="currency"]', 'USD');
    await page.selectOption('select[name="pipelineId"]', { index: 0 }); // First pipeline

    // Select first stage
    await page.waitForTimeout(500); // Wait for stages to load
    await page.selectOption('select[name="stageId"]', { index: 0 });

    await page.fill('textarea[name="notes"]', 'Converted from lead - high potential');

    // Submit conversion
    await page.click('button:has-text("Convert to Deal")');

    // Wait for success
    await expect(page.locator('text=Lead converted to deal')).toBeVisible({ timeout: 5000 });

    // Lead should disappear from active leads (moved to archive)
    await expect(page.locator(`text=${leadName}`)).not.toBeVisible();

    // Navigate to deals to verify
    await page.goto('/crm/deals');
    await page.waitForSelector('[data-testid="kanban-board"]');

    // Deal should exist with correct amount
    await expect(page.locator('text=$35,000')).toBeVisible();
  });

  test('should show archived tab and restore leads', async ({ page }) => {
    await page.waitForSelector('[data-testid="leads-table"]');

    // Switch to archived tab
    await page.click('text=Archived');

    // Should show archived leads (if any)
    await expect(page.locator('[data-testid="leads-table"]')).toBeVisible();

    // Find an archived lead
    const archivedLead = page.locator('[data-testid="lead-row"]').first();

    if (await archivedLead.count() > 0) {
      // Click restore button
      await archivedLead.locator('button[aria-label="Restore lead"]').click();

      // Wait for success
      await expect(page.locator('text=Lead restored')).toBeVisible();

      // Lead should disappear from archived
      // Switch back to active
      await page.click('text=Active');

      // Lead should reappear
      await expect(page.locator('[data-testid="lead-row"]')).toBeVisible();
    }
  });

  test('should filter leads by multiple criteria', async ({ page }) => {
    await page.waitForSelector('[data-testid="leads-table"]');

    // Expand filters
    await page.click('button:has-text("Filters")');

    // Apply target filter
    await page.selectOption('select[name="target"]', 'target');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    // All visible leads should be targets
    const leads = page.locator('[data-testid="lead-row"]');
    const count = await leads.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const lead = leads.nth(i);
      await expect(lead).toHaveAttribute('data-is-target', 'true');
    }

    // Add score range filter
    await page.fill('input[name="minScore"]', '70');
    await page.fill('input[name="maxScore"]', '100');

    await page.waitForTimeout(500);

    // Should show filtered results or empty state
    const filteredCount = await leads.count();
    expect(filteredCount).toBeLessThanOrEqual(count);
  });

  test('should validate lead email uniqueness', async ({ page }) => {
    await page.click('button:has-text("New Lead")');

    // Use an email that likely exists (from seeded data)
    await page.fill('input[name="email"]', 'existing@example.com');

    // Blur to trigger validation
    await page.locator('input[name="email"]').blur();

    // Wait for duplicate check
    await page.waitForTimeout(1000);

    // May show duplicate warning
    const duplicateWarning = page.locator('text=already exists');
    if (await duplicateWarning.count() > 0) {
      // Should show which entity has this email
      await expect(page.locator('[data-testid="duplicate-warning"]')).toBeVisible();

      // Should still allow creation (soft warning, not blocking)
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'Duplicate');
      await page.click('button:has-text("Create Lead")');

      // May show confirmation dialog
      const confirmButton = page.locator('button:has-text("Create Anyway")');
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
      }
    }
  });

  test('should handle lead creation with organization link', async ({ page }) => {
    await page.click('button:has-text("New Lead")');

    await page.fill('input[name="firstName"]', 'Jane');
    await page.fill('input[name="lastName"]', 'Corporate');
    await page.fill('input[name="email"]', `jane-${Date.now()}@example.com`);

    // Select an organization
    await page.selectOption('select[name="organisationId"]', { index: 1 });

    await page.fill('input[name="source"]', 'Website');
    await page.fill('input[name="score"]', '85');

    await page.click('button:has-text("Create Lead")');

    await expect(page.locator('text=Lead created successfully')).toBeVisible();

    // Verify lead shows organization
    const newLead = page.locator('text=Jane Corporate').locator('..');
    await expect(newLead.locator('[data-testid="organization-badge"]')).toBeVisible();
  });

  test('should search leads across multiple fields', async ({ page }) => {
    await page.waitForSelector('[data-testid="leads-table"]');

    // Get initial count
    const initialCount = await page.locator('[data-testid="lead-row"]').count();

    // Search by name
    await page.fill('input[placeholder*="Search"]', 'John');
    await page.waitForTimeout(500);

    const nameSearchCount = await page.locator('[data-testid="lead-row"]').count();
    expect(nameSearchCount).toBeLessThanOrEqual(initialCount);

    // Clear and search by email
    await page.fill('input[placeholder*="Search"]', '@example.com');
    await page.waitForTimeout(500);

    const emailSearchCount = await page.locator('[data-testid="lead-row"]').count();
    expect(emailSearchCount).toBeGreaterThan(0);

    // Clear search
    await page.fill('input[placeholder*="Search"]', '');
    await page.waitForTimeout(500);

    const finalCount = await page.locator('[data-testid="lead-row"]').count();
    expect(finalCount).toEqual(initialCount);
  });
});

test.describe('CRM Leads - Duplicate Detection', () => {
  test('should detect duplicate email before creation', async ({ page }) => {
    await page.goto('/crm/leads');

    // Create first lead
    await page.click('button:has-text("New Lead")');
    const uniqueEmail = `duplicate-test-${Date.now()}@example.com`;

    await page.fill('input[name="firstName"]', 'First');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.fill('input[name="phone"]', '+1111111111');
    await page.click('button:has-text("Create Lead")');

    await expect(page.locator('text=Lead created successfully')).toBeVisible();

    // Try to create second lead with same email
    await page.click('button:has-text("New Lead")');
    await page.fill('input[name="firstName"]', 'Second');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', uniqueEmail);

    // Blur to trigger validation
    await page.locator('input[name="email"]').blur();
    await page.waitForTimeout(1000);

    // Should show duplicate warning
    await expect(page.locator('text=Email already exists')).toBeVisible();
  });

  test('should detect duplicate phone number', async ({ page }) => {
    await page.goto('/crm/leads');

    await page.click('button:has-text("New Lead")');
    const uniquePhone = `+1${Date.now().toString().slice(-9)}`;

    await page.fill('input[name="firstName"]', 'Phone');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', `phone-${Date.now()}@example.com`);
    await page.fill('input[name="phone"]', uniquePhone);
    await page.click('button:has-text("Create Lead")');

    await expect(page.locator('text=Lead created successfully')).toBeVisible();

    // Try duplicate phone
    await page.click('button:has-text("New Lead")');
    await page.fill('input[name="phone"]', uniquePhone);
    await page.locator('input[name="phone"]').blur();
    await page.waitForTimeout(1000);

    await expect(page.locator('text=Phone number already exists')).toBeVisible();
  });

  test('should allow bypassing duplicate warning', async ({ page }) => {
    await page.goto('/crm/leads');

    // Create lead with potential duplicate data
    await page.click('button:has-text("New Lead")');
    await page.fill('input[name="firstName"]', 'Bypass');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', 'common@example.com');

    // If duplicate warning appears
    if (await page.locator('text=already exists').count() > 0) {
      // Should have option to proceed anyway
      await page.fill('input[name="phone"]', '+9999999999');
      await page.click('button:has-text("Create Lead")');

      // May need to confirm
      const confirmButton = page.locator('button:has-text("Create Anyway")');
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
      }

      // Should still create
      await expect(page.locator('text=Lead created')).toBeVisible();
    }
  });
});

test.describe('CRM Leads - Edge Cases', () => {
  test('should handle lead creation without optional fields', async ({ page }) => {
    await page.goto('/crm/leads');

    await page.click('button:has-text("New Lead")');

    // Fill only required fields
    await page.fill('input[name="firstName"]', 'Minimal');
    await page.fill('input[name="lastName"]', 'Lead');
    await page.fill('input[name="email"]', `minimal-${Date.now()}@example.com`);

    // Create without phone, organization, source, etc.
    await page.click('button:has-text("Create Lead")');

    await expect(page.locator('text=Lead created successfully')).toBeVisible();
  });

  test('should prevent converting non-target lead via URL manipulation', async ({ page }) => {
    // Direct API test - try to convert non-target lead
    const response = await page.request.post('/api/crm/leads/non-target-id/convert', {
      data: {
        title: 'Hacked Deal',
        pipelineId: 'some-pipeline',
        stageId: 'some-stage'
      }
    });

    // Should return error
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toContain('target');
  });

  test('should maintain lead score validation (0-100)', async ({ page }) => {
    await page.goto('/crm/leads');

    await page.click('button:has-text("New Lead")');

    await page.fill('input[name="firstName"]', 'Score');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', `score-${Date.now()}@example.com`);

    // Try invalid score
    await page.fill('input[name="score"]', '150');
    await page.locator('input[name="score"]').blur();

    // Should show validation error
    await expect(page.locator('text=Score must be between 0 and 100')).toBeVisible();

    // Fix score
    await page.fill('input[name="score"]', '95');
    await page.click('button:has-text("Create Lead")');

    await expect(page.locator('text=Lead created successfully')).toBeVisible();
  });

  test('should handle bulk archive operation', async ({ page }) => {
    await page.goto('/crm/leads');
    await page.waitForSelector('[data-testid="leads-table"]');

    // Select multiple leads
    const checkboxes = page.locator('input[type="checkbox"][data-testid="lead-checkbox"]');
    const count = Math.min(await checkboxes.count(), 3);

    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).check();
    }

    // Bulk action toolbar should appear
    await expect(page.locator('[data-testid="bulk-actions-toolbar"]')).toBeVisible();

    // Click archive button
    await page.click('button:has-text("Archive Selected")');

    // Confirm
    await page.click('button:has-text("Confirm")');

    // Should show success message
    await expect(page.locator(`text=${count} leads archived`)).toBeVisible();
  });
});
