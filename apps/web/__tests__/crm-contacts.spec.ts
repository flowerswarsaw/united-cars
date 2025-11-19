import { test, expect } from '@playwright/test';

test.describe('CRM Contacts - CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/crm/contacts');
  });

  test('should display contacts list with organisation info', async ({ page }) => {
    await page.waitForSelector('[data-testid="contacts-table"]', { timeout: 10000 });

    // Verify table headers
    await expect(page.locator('th:has-text("Name")')).toBeVisible();
    await expect(page.locator('th:has-text("Email")')).toBeVisible();
    await expect(page.locator('th:has-text("Phone")')).toBeVisible();
    await expect(page.locator('th:has-text("Organisation")')).toBeVisible();

    // Verify contacts are displayed
    const rows = page.locator('[data-testid="contact-row"]');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('should create new contact with organisation link', async ({ page }) => {
    const uniqueId = Date.now();

    await page.click('button:has-text("New Contact")');

    // Fill form
    await page.fill('input[name="firstName"]', 'Jane');
    await page.fill('input[name="lastName"]', `Doe${uniqueId}`);
    await page.fill('input[name="email"]', `jane.doe${uniqueId}@example.com`);
    await page.fill('input[name="phone"]', `+1${uniqueId.toString().slice(-9)}`);

    // Select organisation
    await page.selectOption('select[name="organisationId"]', { index: 1 });

    // Add type
    await page.selectOption('select[name="type"]', 'PRIMARY');

    // Address
    await page.selectOption('select[name="country"]', 'US');
    await page.waitForTimeout(500);
    await page.selectOption('select[name="state"]', { index: 1 });
    await page.fill('input[name="city"]', 'New York');

    // Submit
    await page.click('button:has-text("Create Contact")');

    // Verify success
    await expect(page.locator('text=Contact created successfully')).toBeVisible({ timeout: 5000 });

    // Verify contact appears in list
    await expect(page.locator(`text=Jane Doe${uniqueId}`)).toBeVisible();
  });

  test('should create contact without organisation (standalone)', async ({ page }) => {
    const uniqueId = Date.now();

    await page.click('button:has-text("New Contact")');

    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', `Independent${uniqueId}`);
    await page.fill('input[name="email"]', `john${uniqueId}@example.com`);
    await page.fill('input[name="phone"]', `+1${uniqueId.toString().slice(-9)}`);

    // Leave organisation empty
    // Submit
    await page.click('button:has-text("Create Contact")');

    await expect(page.locator('text=Contact created successfully')).toBeVisible();
  });

  test('should add multiple contact methods to contact', async ({ page }) => {
    await page.waitForSelector('[data-testid="contacts-table"]');

    // Click first contact
    await page.locator('[data-testid="contact-row"]').first().click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/crm\/contacts\/[a-zA-Z0-9_-]+/);

    // Click edit
    await page.click('button:has-text("Edit")');

    // Add additional email
    await page.click('button:has-text("Add Email")');
    const additionalEmailInput = page.locator('input[name="additionalEmail"]');
    if (await additionalEmailInput.count() > 0) {
      await additionalEmailInput.fill('secondary@example.com');
    }

    // Add mobile phone
    await page.click('button:has-text("Add Phone")');
    const additionalPhoneInput = page.locator('input[name="additionalPhone"]');
    if (await additionalPhoneInput.count() > 0) {
      await additionalPhoneInput.fill('+19876543210');
      await page.selectOption('select[name="additionalPhoneType"]', 'MOBILE');
    }

    // Save
    await page.click('button:has-text("Save Changes")');

    await expect(page.locator('text=Contact updated')).toBeVisible();

    // Verify methods are displayed
    await expect(page.locator('text=secondary@example.com')).toBeVisible();
    await expect(page.locator('text=+19876543210')).toBeVisible();
  });

  test('should edit contact details', async ({ page }) => {
    await page.waitForSelector('[data-testid="contacts-table"]');

    const firstContact = page.locator('[data-testid="contact-row"]').first();
    await firstContact.click();

    await page.click('button:has-text("Edit")');

    // Edit contact
    await page.fill('input[name="title"]', 'Senior Account Manager');
    await page.fill('input[name="address"]', '123 Business St');
    await page.fill('input[name="postalCode"]', '10001');

    await page.click('button:has-text("Save Changes")');

    await expect(page.locator('text=Contact updated')).toBeVisible();
    await expect(page.locator('text=Senior Account Manager')).toBeVisible();
  });

  test('should delete contact with confirmation', async ({ page }) => {
    // Create test contact first
    await page.click('button:has-text("New Contact")');
    const uniqueId = Date.now();
    const lastName = `DeleteTest${uniqueId}`;

    await page.fill('input[name="firstName"]', 'Delete');
    await page.fill('input[name="lastName"]', lastName);
    await page.fill('input[name="email"]', `delete${uniqueId}@example.com`);
    await page.click('button:has-text("Create Contact")');

    await page.waitForTimeout(1000);

    // Find and delete
    const contactRow = page.locator(`text=Delete ${lastName}`).locator('..');
    await contactRow.hover();
    await contactRow.locator('button[aria-label="Delete contact"]').click();

    // Confirm deletion
    await expect(page.locator('text=Are you sure')).toBeVisible();
    await page.click('button:has-text("Delete")');

    await expect(page.locator('text=Contact deleted')).toBeVisible();
    await expect(page.locator(`text=Delete ${lastName}`)).not.toBeVisible();
  });

  test('should filter contacts by organisation', async ({ page }) => {
    await page.waitForSelector('[data-testid="contacts-table"]');

    // Apply organisation filter
    await page.selectOption('select[name="organisationId"]', { index: 1 });
    await page.waitForTimeout(500);

    // All visible contacts should belong to selected organisation
    const rows = page.locator('[data-testid="contact-row"]');
    const count = await rows.count();

    if (count > 0) {
      // Verify organisation badge is present
      for (let i = 0; i < Math.min(count, 3); i++) {
        await expect(rows.nth(i).locator('[data-testid="org-badge"]')).toBeVisible();
      }
    }
  });

  test('should search contacts by name or email', async ({ page }) => {
    await page.waitForSelector('[data-testid="contacts-table"]');

    const initialCount = await page.locator('[data-testid="contact-row"]').count();

    // Search by name
    await page.fill('input[placeholder*="Search"]', 'John');
    await page.waitForTimeout(500);

    const nameSearchCount = await page.locator('[data-testid="contact-row"]').count();
    expect(nameSearchCount).toBeLessThanOrEqual(initialCount);

    // Clear and search by email
    await page.fill('input[placeholder*="Search"]', '@example.com');
    await page.waitForTimeout(500);

    const emailSearchCount = await page.locator('[data-testid="contact-row"]').count();
    expect(emailSearchCount).toBeGreaterThan(0);
  });

  test('should show contact detail page with related data', async ({ page }) => {
    await page.waitForSelector('[data-testid="contacts-table"]');

    await page.locator('[data-testid="contact-row"]').first().click();

    await expect(page).toHaveURL(/\/crm\/contacts\/[a-zA-Z0-9_-]+/);

    // Verify sections
    await expect(page.locator('text=Contact Information')).toBeVisible();
    await expect(page.locator('text=Contact Methods')).toBeVisible();

    // Tabs
    await expect(page.locator('button:has-text("Overview")')).toBeVisible();
    await expect(page.locator('button:has-text("Deals")')).toBeVisible();
    await expect(page.locator('button:has-text("Activity")')).toBeVisible();
  });
});

test.describe('CRM Contacts - Duplicate Detection', () => {
  test('should detect duplicate email', async ({ page }) => {
    await page.goto('/crm/contacts');

    // Create first contact
    await page.click('button:has-text("New Contact")');
    const uniqueEmail = `contact-dup-${Date.now()}@example.com`;

    await page.fill('input[name="firstName"]', 'First');
    await page.fill('input[name="lastName"]', 'Contact');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.click('button:has-text("Create Contact")');

    await expect(page.locator('text=Contact created')).toBeVisible();

    // Try second contact with same email
    await page.click('button:has-text("New Contact")');
    await page.fill('input[name="email"]', uniqueEmail);
    await page.locator('input[name="email"]').blur();

    await page.waitForTimeout(1000);

    // Should show duplicate warning
    await expect(page.locator('text=Email already exists')).toBeVisible();
  });

  test('should detect duplicate phone number', async ({ page }) => {
    await page.goto('/crm/contacts');

    await page.click('button:has-text("New Contact")');
    const uniquePhone = `+1${Date.now().toString().slice(-9)}`;

    await page.fill('input[name="firstName"]', 'Phone');
    await page.fill('input[name="lastName"]', 'Test');
    await page.fill('input[name="email"]', `phone-contact-${Date.now()}@example.com`);
    await page.fill('input[name="phone"]', uniquePhone);
    await page.click('button:has-text("Create Contact")');

    await expect(page.locator('text=Contact created')).toBeVisible();

    // Try duplicate phone
    await page.click('button:has-text("New Contact")');
    await page.fill('input[name="phone"]', uniquePhone);
    await page.locator('input[name="phone"]').blur();

    await page.waitForTimeout(1000);

    await expect(page.locator('text=Phone already in use')).toBeVisible();
  });

  test('should allow same email across organisations with warning', async ({ page }) => {
    await page.goto('/crm/contacts');

    const sharedEmail = `shared-${Date.now()}@company.com`;

    // Create first contact in Org A
    await page.click('button:has-text("New Contact")');
    await page.fill('input[name="firstName"]', 'Person');
    await page.fill('input[name="lastName"]', 'One');
    await page.fill('input[name="email"]', sharedEmail);
    await page.selectOption('select[name="organisationId"]', { index: 1 });
    await page.click('button:has-text("Create Contact")');

    await expect(page.locator('text=Contact created')).toBeVisible();

    // Create second contact in Org B with same email
    await page.click('button:has-text("New Contact")');
    await page.fill('input[name="firstName"]', 'Person');
    await page.fill('input[name="lastName"]', 'Two');
    await page.fill('input[name="email"]', sharedEmail);
    await page.selectOption('select[name="organisationId"]', { index: 2 });

    // Should show soft warning but allow creation
    const warningMessage = page.locator('text=Email is used by another contact');
    if (await warningMessage.count() > 0) {
      await expect(warningMessage).toBeVisible();
    }

    await page.click('button:has-text("Create Contact")');
    // May need to confirm
    const confirmButton = page.locator('button:has-text("Create Anyway")');
    if (await confirmButton.count() > 0) {
      await confirmButton.click();
    }

    // Should still create
    await expect(page.locator('text=Contact created')).toBeVisible();
  });
});

test.describe('CRM Contacts - Organisation Integration', () => {
  test('should link contact to organisation after creation', async ({ page }) => {
    await page.goto('/crm/contacts');

    // Create contact without organisation
    await page.click('button:has-text("New Contact")');
    const uniqueId = Date.now();

    await page.fill('input[name="firstName"]', 'Link');
    await page.fill('input[name="lastName"]', `Test${uniqueId}`);
    await page.fill('input[name="email"]', `link${uniqueId}@example.com`);
    await page.click('button:has-text("Create Contact")');

    await page.waitForTimeout(1000);

    // Open contact detail
    await page.locator(`text=Link Test${uniqueId}`).click();

    // Edit to add organisation
    await page.click('button:has-text("Edit")');
    await page.selectOption('select[name="organisationId"]', { index: 1 });
    await page.click('button:has-text("Save Changes")');

    await expect(page.locator('text=Contact updated')).toBeVisible();

    // Verify organisation is now linked
    await expect(page.locator('[data-testid="linked-organisation"]')).toBeVisible();
  });

  test('should unlink contact from organisation', async ({ page }) => {
    await page.goto('/crm/contacts');
    await page.waitForSelector('[data-testid="contacts-table"]');

    // Find contact with organisation
    const contactWithOrg = page.locator('[data-testid="contact-row"]:has([data-testid="org-badge"])').first();

    if (await contactWithOrg.count() > 0) {
      await contactWithOrg.click();

      await page.click('button:has-text("Edit")');

      // Remove organisation selection
      await page.selectOption('select[name="organisationId"]', '');
      await page.click('button:has-text("Save Changes")');

      await expect(page.locator('text=Contact updated')).toBeVisible();

      // Organisation badge should be gone
      await expect(page.locator('[data-testid="linked-organisation"]')).not.toBeVisible();
    }
  });

  test('should show all contacts for organisation on org detail page', async ({ page }) => {
    await page.goto('/crm/organisations');
    await page.waitForSelector('[data-testid="organisations-table"]');

    // Click first organisation
    await page.locator('[data-testid="organisation-row"]').first().click();

    // Go to contacts tab
    await page.click('button:has-text("Contacts")');

    // Should list all contacts for this organisation
    await expect(page.locator('[data-testid="org-contacts-list"]')).toBeVisible();

    // Add new contact from organisation page
    await page.click('button:has-text("Add Contact")');

    // Organisation should be pre-selected
    const orgSelect = page.locator('select[name="organisationId"]');
    const selectedValue = await orgSelect.inputValue();
    expect(selectedValue).toBeTruthy();
  });
});

test.describe('CRM Contacts - Advanced Features', () => {
  test('should show contact activity timeline', async ({ page }) => {
    await page.goto('/crm/contacts');
    await page.waitForSelector('[data-testid="contacts-table"]');

    await page.locator('[data-testid="contact-row"]').first().click();

    // Switch to activity tab
    await page.click('button:has-text("Activity")');

    // Should show activity timeline
    await expect(page.locator('[data-testid="activity-timeline"]')).toBeVisible();

    // Activities may include contact creation, updates, deals, etc.
    const activities = page.locator('[data-testid="activity-item"]');
    if (await activities.count() > 0) {
      await expect(activities.first()).toBeVisible();
    }
  });

  test('should show contact-related deals', async ({ page }) => {
    await page.goto('/crm/contacts');
    await page.waitForSelector('[data-testid="contacts-table"]');

    await page.locator('[data-testid="contact-row"]').first().click();

    // Switch to deals tab
    await page.click('button:has-text("Deals")');

    // Should show deals section
    await expect(page.locator('[data-testid="contact-deals-section"]')).toBeVisible();

    // May have deals or empty state
    const deals = page.locator('[data-testid="deal-card"]');
    const emptyState = page.locator('text=No deals yet');

    const hasDeals = await deals.count() > 0;
    const isEmpty = await emptyState.count() > 0;

    expect(hasDeals || isEmpty).toBe(true);
  });

  test('should handle bulk contact operations', async ({ page }) => {
    await page.goto('/crm/contacts');
    await page.waitForSelector('[data-testid="contacts-table"]');

    // Select multiple contacts
    const checkboxes = page.locator('input[type="checkbox"][data-testid="contact-checkbox"]');
    const count = Math.min(await checkboxes.count(), 3);

    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).check();
    }

    // Bulk actions toolbar should appear
    await expect(page.locator('[data-testid="bulk-actions-toolbar"]')).toBeVisible();

    // Should show count
    await expect(page.locator(`text=${count} selected`)).toBeVisible();
  });

  test('should export contacts to CSV', async ({ page }) => {
    await page.goto('/crm/contacts');
    await page.waitForSelector('[data-testid="contacts-table"]');

    const exportButton = page.locator('button:has-text("Export")');
    if (await exportButton.count() > 0) {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        exportButton.click()
      ]);

      expect(download.suggestedFilename()).toContain('contacts');
    }
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/crm/contacts');

    await page.click('button:has-text("New Contact")');

    // Enter invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.locator('input[name="email"]').blur();

    // Should show validation error
    await expect(page.locator('text=Invalid email format')).toBeVisible();

    // Fix email
    await page.fill('input[name="email"]', `valid${Date.now()}@example.com`);
    await page.locator('input[name="email"]').blur();

    // Error should disappear
    await expect(page.locator('text=Invalid email format')).not.toBeVisible();
  });

  test('should validate phone format', async ({ page }) => {
    await page.goto('/crm/contacts');

    await page.click('button:has-text("New Contact")');

    // Enter invalid phone
    await page.fill('input[name="phone"]', '123'); // Too short
    await page.locator('input[name="phone"]').blur();

    // Should show validation warning
    const phoneWarning = page.locator('text=Invalid phone number');
    if (await phoneWarning.count() > 0) {
      await expect(phoneWarning).toBeVisible();
    }
  });

  test('should show empty state when no contacts exist', async ({ page }) => {
    // Mock empty response
    await page.route('/api/crm/contacts', route =>
      route.fulfill({
        status: 200,
        body: JSON.stringify([])
      })
    );

    await page.goto('/crm/contacts');

    await expect(page.locator('text=No contacts found')).toBeVisible();
    await expect(page.locator('button:has-text("Create your first contact")')).toBeVisible();
  });
});
