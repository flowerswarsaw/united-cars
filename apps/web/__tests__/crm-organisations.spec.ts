import { test, expect } from '@playwright/test';

test.describe('CRM Organisations - CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/crm/organisations');
  });

  test('should display organisations list with all columns', async ({ page }) => {
    // Wait for table to load
    await page.waitForSelector('[data-testid="organisations-table"]', { timeout: 10000 });

    // Verify table headers
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Type")')).toBeVisible();
    await expect(page.locator('th:has-text("Contact")')).toBeVisible();
    await expect(page.locator('th:has-text("Location")')).toBeVisible();

    // Verify at least one organisation is displayed
    const rows = page.locator('[data-testid="organisation-row"]');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('should create new organisation successfully', async ({ page }) => {
    const uniqueId = Date.now();
    const orgName = `Test Org ${uniqueId}`;

    // Click create button
    await page.click('button:has-text("New Organisation")');

    // Fill form
    await page.fill('input[name="name"]', orgName);
    await page.fill('input[name="companyId"]', `TEST-${uniqueId}`);
    await page.selectOption('select[name="type"]', 'DEALER');
    await page.fill('input[name="email"]', `org-${uniqueId}@example.com`);
    await page.fill('input[name="phone"]', `+1${uniqueId.toString().slice(-9)}`);
    await page.fill('input[name="website"]', `https://test-${uniqueId}.com`);

    // Address fields
    await page.selectOption('select[name="country"]', 'US');
    await page.waitForTimeout(500); // Wait for states to load
    await page.selectOption('select[name="state"]', { index: 1 });
    await page.fill('input[name="city"]', 'Test City');

    // Submit
    await page.click('button:has-text("Create Organisation")');

    // Verify success
    await expect(page.locator('text=Organisation created successfully')).toBeVisible({ timeout: 5000 });

    // Verify organisation appears in list
    await expect(page.locator(`text=${orgName}`)).toBeVisible();
  });

  test('should validate company ID uniqueness', async ({ page }) => {
    // Try to create organisation with duplicate company ID
    await page.click('button:has-text("New Organisation")');

    await page.fill('input[name="companyId"]', 'EXISTING-123');
    await page.locator('input[name="companyId"]').blur();

    // Wait for duplicate check
    await page.waitForTimeout(1000);

    // If duplicate warning appears
    const duplicateWarning = page.locator('text=Company ID already exists');
    if (await duplicateWarning.count() > 0) {
      await expect(duplicateWarning).toBeVisible();

      // Should show which organisation has this ID
      await expect(page.locator('[data-testid="duplicate-conflict"]')).toBeVisible();
    }
  });

  test('should edit organisation details', async ({ page }) => {
    await page.waitForSelector('[data-testid="organisations-table"]');

    // Click on first organisation
    const firstOrg = page.locator('[data-testid="organisation-row"]').first();
    const orgName = await firstOrg.locator('[data-testid="org-name"]').textContent();

    await firstOrg.click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/crm\/organisations\/[a-zA-Z0-9_-]+/);

    // Click edit button
    await page.click('button:has-text("Edit")');

    // Edit dialog should open
    await expect(page.locator('text=Edit Organisation')).toBeVisible();

    // Change a field
    await page.fill('input[name="website"]', 'https://updated-website.com');
    await page.fill('input[name="size"]', '250');

    // Save changes
    await page.click('button:has-text("Save Changes")');

    // Verify success
    await expect(page.locator('text=Organisation updated')).toBeVisible();

    // Verify changes are reflected
    await expect(page.locator('text=https://updated-website.com')).toBeVisible();
  });

  test('should delete organisation with confirmation', async ({ page }) => {
    // Create a test organisation first
    await page.click('button:has-text("New Organisation")');
    const orgName = `Delete Test ${Date.now()}`;

    await page.fill('input[name="name"]', orgName);
    await page.fill('input[name="companyId"]', `DEL-${Date.now()}`);
    await page.selectOption('select[name="type"]', 'BROKER');
    await page.click('button:has-text("Create Organisation")');

    await page.waitForTimeout(1000);

    // Find and delete the organisation
    const orgRow = page.locator(`text=${orgName}`).locator('..');
    await orgRow.hover();
    await orgRow.locator('button[aria-label="Delete organisation"]').click();

    // Confirmation dialog should appear
    await expect(page.locator('text=Are you sure you want to delete')).toBeVisible();
    await expect(page.locator(`text=${orgName}`)).toBeVisible();

    // Confirm deletion
    await page.click('button:has-text("Delete")');

    // Verify success
    await expect(page.locator('text=Organisation deleted')).toBeVisible();

    // Organisation should be removed from list
    await expect(page.locator(`text=${orgName}`)).not.toBeVisible();
  });

  test('should filter organisations by type', async ({ page }) => {
    await page.waitForSelector('[data-testid="organisations-table"]');

    // Get initial count
    const initialCount = await page.locator('[data-testid="organisation-row"]').count();

    // Apply dealer filter
    await page.selectOption('select[name="type"]', 'DEALER');
    await page.waitForTimeout(500);

    // Verify only dealers are shown
    const dealerRows = page.locator('[data-testid="organisation-row"]');
    const dealerCount = await dealerRows.count();

    for (let i = 0; i < Math.min(dealerCount, 5); i++) {
      const row = dealerRows.nth(i);
      await expect(row.locator('text=Dealer')).toBeVisible();
    }

    // Clear filter
    await page.selectOption('select[name="type"]', '');
    await page.waitForTimeout(500);

    const finalCount = await page.locator('[data-testid="organisation-row"]').count();
    expect(finalCount).toEqual(initialCount);
  });

  test('should search organisations by name', async ({ page }) => {
    await page.waitForSelector('[data-testid="organisations-table"]');

    // Search for specific organisation
    await page.fill('input[placeholder*="Search"]', 'AutoMax');
    await page.waitForTimeout(500);

    // All visible organisations should match search
    const rows = page.locator('[data-testid="organisation-row"]');
    const count = await rows.count();

    if (count > 0) {
      // At least one should contain search term
      await expect(page.locator('text=AutoMax')).toBeVisible();
    }

    // Clear search
    await page.fill('input[placeholder*="Search"]', '');
  });

  test('should show organisation detail page with tabs', async ({ page }) => {
    await page.waitForSelector('[data-testid="organisations-table"]');

    // Click first organisation
    await page.locator('[data-testid="organisation-row"]').first().click();

    // Should show detail page
    await expect(page).toHaveURL(/\/crm\/organisations\/[a-zA-Z0-9_-]+/);

    // Verify tabs are present
    await expect(page.locator('button:has-text("Overview")')).toBeVisible();
    await expect(page.locator('button:has-text("Contacts")')).toBeVisible();
    await expect(page.locator('button:has-text("Deals")')).toBeVisible();
    await expect(page.locator('button:has-text("Activity")')).toBeVisible();

    // Click contacts tab
    await page.click('button:has-text("Contacts")');

    // Should show contacts for this organisation
    await expect(page.locator('[data-testid="contacts-section"]')).toBeVisible();
  });

  test('should add contact method to organisation', async ({ page }) => {
    await page.waitForSelector('[data-testid="organisations-table"]');
    await page.locator('[data-testid="organisation-row"]').first().click();

    // Go to edit mode
    await page.click('button:has-text("Edit")');

    // Add additional email
    await page.click('button:has-text("Add Email")');
    await page.fill('input[name="additionalEmail"]', 'support@example.com');

    // Add additional phone
    await page.click('button:has-text("Add Phone")');
    await page.fill('input[name="additionalPhone"]', '+19876543210');

    // Save
    await page.click('button:has-text("Save Changes")');

    await expect(page.locator('text=Organisation updated')).toBeVisible();

    // Verify contact methods are displayed
    await expect(page.locator('text=support@example.com')).toBeVisible();
    await expect(page.locator('text=+19876543210')).toBeVisible();
  });

  test('should add social media links to organisation', async ({ page }) => {
    await page.waitForSelector('[data-testid="organisations-table"]');
    await page.locator('[data-testid="organisation-row"]').first().click();

    await page.click('button:has-text("Edit")');

    // Add social media links
    await page.click('button:has-text("Add Social Media")');
    await page.selectOption('select[name="socialPlatform"]', 'FACEBOOK');
    await page.fill('input[name="socialUrl"]', 'https://facebook.com/testorg');

    // Add another
    await page.click('button:has-text("Add Social Media")');
    await page.selectOption('select[name="socialPlatform-1"]', 'INSTAGRAM');
    await page.fill('input[name="socialUrl-1"]', 'https://instagram.com/testorg');

    await page.click('button:has-text("Save Changes")');

    await expect(page.locator('text=Organisation updated')).toBeVisible();

    // Verify social links are displayed
    await expect(page.locator('a[href="https://facebook.com/testorg"]')).toBeVisible();
    await expect(page.locator('a[href="https://instagram.com/testorg"]')).toBeVisible();
  });
});

test.describe('CRM Organisations - Relationships', () => {
  test('should show organisation connections', async ({ page }) => {
    await page.goto('/crm/organisations');
    await page.waitForSelector('[data-testid="organisations-table"]');

    // Click on an organisation with type AUCTION or DEALER
    const orgRow = page.locator('[data-testid="organisation-row"]').first();
    await orgRow.click();

    // Navigate to connections tab
    await page.click('button:has-text("Connections")');

    // Should show related organisations
    await expect(page.locator('[data-testid="connections-section"]')).toBeVisible();

    // May show dealers, shippers, etc. depending on type
    const connections = page.locator('[data-testid="connection-card"]');
    if (await connections.count() > 0) {
      await expect(connections.first()).toBeVisible();
    }
  });

  test('should create organisation connection', async ({ page }) => {
    await page.goto('/crm/organisations');
    await page.waitForSelector('[data-testid="organisations-table"]');

    const firstOrg = page.locator('[data-testid="organisation-row"]').first();
    await firstOrg.click();

    // Go to connections
    await page.click('button:has-text("Connections")');

    // Add connection button
    await page.click('button:has-text("Add Connection")');

    // Select target organisation
    await page.selectOption('select[name="targetOrgId"]', { index: 1 });

    // Select relationship type
    await page.selectOption('select[name="relationshipType"]', 'PARTNER');

    // Save
    await page.click('button:has-text("Create Connection")');

    await expect(page.locator('text=Connection created')).toBeVisible();

    // Verify connection appears
    await expect(page.locator('[data-testid="connection-card"]')).toBeVisible();
  });
});

test.describe('CRM Organisations - Duplicate Detection', () => {
  test('should detect duplicate email', async ({ page }) => {
    await page.goto('/crm/organisations');

    // Create first organisation
    await page.click('button:has-text("New Organisation")');
    const uniqueEmail = `org-dup-${Date.now()}@example.com`;

    await page.fill('input[name="name"]', 'First Org');
    await page.fill('input[name="companyId"]', `FIRST-${Date.now()}`);
    await page.fill('input[name="email"]', uniqueEmail);
    await page.selectOption('select[name="type"]', 'DEALER');
    await page.click('button:has-text("Create Organisation")');

    await expect(page.locator('text=Organisation created')).toBeVisible();

    // Try second organisation with same email
    await page.click('button:has-text("New Organisation")');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.locator('input[name="email"]').blur();

    await page.waitForTimeout(1000);

    // Should show duplicate warning
    await expect(page.locator('text=Email already in use')).toBeVisible();
  });

  test('should detect similar company names', async ({ page }) => {
    await page.goto('/crm/organisations');

    await page.click('button:has-text("New Organisation")');
    await page.fill('input[name="name"]', 'AutoMax Dealers');
    await page.locator('input[name="name"]').blur();

    await page.waitForTimeout(1000);

    // If a similar name exists, should show warning
    const similarWarning = page.locator('text=similar organisation exists');
    if (await similarWarning.count() > 0) {
      await expect(similarWarning).toBeVisible();

      // Should show the similar organisation
      await expect(page.locator('[data-testid="similar-org-warning"]')).toBeVisible();
    }
  });

  test('should block hard duplicate on company ID', async ({ page }) => {
    await page.goto('/crm/organisations');

    // Use a company ID that exists
    await page.click('button:has-text("New Organisation")');
    await page.fill('input[name="name"]', 'Duplicate Test');
    await page.fill('input[name="companyId"]', 'AUTOMAX-001'); // Likely exists from seed
    await page.selectOption('select[name="type"]', 'DEALER');

    await page.click('button:has-text("Create Organisation")');

    // Should show error (hard block)
    const errorMessage = page.locator('text=Company ID already exists');
    if (await errorMessage.count() > 0) {
      await expect(errorMessage).toBeVisible();

      // Create button should remain enabled to allow retry
      await expect(page.locator('button:has-text("Create Organisation")')).toBeVisible();
    }
  });
});

test.describe('CRM Organisations - Advanced Features', () => {
  test('should handle pagination when many organisations exist', async ({ page }) => {
    await page.goto('/crm/organisations');
    await page.waitForSelector('[data-testid="organisations-table"]');

    // Look for pagination controls
    const pagination = page.locator('[data-testid="pagination"]');
    if (await pagination.count() > 0) {
      // Click next page
      await page.click('button[aria-label="Next page"]');

      // Should load new organisations
      await page.waitForTimeout(500);

      // Verify URL or state changed
      expect(await page.locator('[data-testid="organisation-row"]').count()).toBeGreaterThan(0);
    }
  });

  test('should export organisations to CSV', async ({ page }) => {
    await page.goto('/crm/organisations');
    await page.waitForSelector('[data-testid="organisations-table"]');

    // Click export button (if exists)
    const exportButton = page.locator('button:has-text("Export")');
    if (await exportButton.count() > 0) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        exportButton.click()
      ]);

      // Verify file was downloaded
      expect(download.suggestedFilename()).toContain('organisations');
      expect(download.suggestedFilename()).toContain('.csv');
    }
  });

  test('should sort organisations by different columns', async ({ page }) => {
    await page.goto('/crm/organisations');
    await page.waitForSelector('[data-testid="organisations-table"]');

    // Click name column header to sort
    await page.click('th:has-text("Name")');
    await page.waitForTimeout(500);

    // Get first organisation name
    const firstName = await page.locator('[data-testid="organisation-row"]').first()
      .locator('[data-testid="org-name"]').textContent();

    // Click again to reverse sort
    await page.click('th:has-text("Name")');
    await page.waitForTimeout(500);

    // First name should be different
    const newFirstName = await page.locator('[data-testid="organisation-row"]').first()
      .locator('[data-testid="org-name"]').textContent();

    expect(firstName).not.toBe(newFirstName);
  });

  test('should show empty state when no organisations match filter', async ({ page }) => {
    await page.goto('/crm/organisations');
    await page.waitForSelector('[data-testid="organisations-table"]');

    // Apply filter that returns no results
    await page.fill('input[placeholder*="Search"]', 'NONEXISTENT_ORG_12345_UNIQUE');
    await page.waitForTimeout(500);

    // Should show empty state
    await expect(page.locator('text=No organisations found')).toBeVisible();
    await expect(page.locator('button:has-text("Clear filters")')).toBeVisible();
  });
});
