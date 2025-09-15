import { test, expect, Page } from '@playwright/test';
import { UserRole } from '@united-cars/crm-core';

// Test data setup
const TEST_USERS = {
  admin: {
    email: 'admin@demo.com',
    password: 'password123',
    role: UserRole.ADMIN,
    name: 'Admin User'
  },
  seniorManager: {
    email: 'senior@demo.com', 
    password: 'password123',
    role: UserRole.SENIOR_SALES_MANAGER,
    name: 'Senior Manager'
  },
  juniorManager: {
    email: 'junior@demo.com',
    password: 'password123', 
    role: UserRole.JUNIOR_SALES_MANAGER,
    name: 'Junior Manager'
  }
};

// Helper functions
async function loginUser(page: Page, userType: keyof typeof TEST_USERS) {
  const user = TEST_USERS[userType];
  
  await page.goto('/auth/signin');
  await page.fill('[data-testid=email]', user.email);
  await page.fill('[data-testid=password]', user.password);
  await page.click('[data-testid=signin-button]');
  
  // Wait for redirect to dashboard
  await page.waitForURL('/crm', { timeout: 10000 });
  
  // Verify login successful
  await expect(page.locator('[data-testid=user-menu]')).toBeVisible();
}

async function navigateToCRMSection(page: Page, section: string) {
  await page.click(`[data-testid=nav-crm-${section}]`);
  await page.waitForURL(`/crm/${section}`);
}

test.describe('CRM End-to-End Workflows', () => {
  test.describe('Organisation Management', () => {
    test('Admin can create, view, edit, and delete organisations', async ({ page }) => {
      await loginUser(page, 'admin');
      await navigateToCRMSection(page, 'organisations');

      // Create new organisation
      await page.click('[data-testid=new-organisation-button]');
      await expect(page.locator('[data-testid=organisation-form]')).toBeVisible();

      // Fill organisation form
      const orgName = `Test Corp ${Date.now()}`;
      await page.fill('[data-testid=org-name]', orgName);
      await page.selectOption('[data-testid=org-type]', 'DEALER');
      await page.fill('[data-testid=org-description]', 'Test organisation for E2E');
      await page.fill('[data-testid=org-website]', 'https://testcorp.com');
      
      // Add contact method
      await page.click('[data-testid=add-contact-method]');
      await page.selectOption('[data-testid=contact-method-type]', 'EMAIL');
      await page.fill('[data-testid=contact-method-value]', 'contact@testcorp.com');
      
      // Submit form
      await page.click('[data-testid=save-organisation]');
      
      // Wait for success message
      await expect(page.locator('[data-testid=success-message]')).toBeVisible();
      await expect(page.locator('[data-testid=success-message]')).toContainText('successfully created');

      // Verify organisation appears in list
      await page.waitForSelector('[data-testid=organisations-list]');
      await expect(page.locator('[data-testid=organisation-card]', { hasText: orgName })).toBeVisible();

      // Edit organisation
      await page.click('[data-testid=organisation-card] >> text=' + orgName);
      await page.click('[data-testid=edit-organisation]');
      
      const updatedName = `${orgName} Updated`;
      await page.fill('[data-testid=org-name]', updatedName);
      await page.click('[data-testid=save-organisation]');
      
      await expect(page.locator('[data-testid=success-message]')).toContainText('successfully updated');

      // Delete organisation
      await page.click('[data-testid=delete-organisation]');
      await page.click('[data-testid=confirm-delete]');
      
      await expect(page.locator('[data-testid=success-message]')).toContainText('successfully deleted');
      
      // Verify organisation removed from list
      await expect(page.locator('[data-testid=organisation-card]', { hasText: updatedName })).not.toBeVisible();
    });

    test('Junior manager can only see assigned organisations', async ({ page }) => {
      await loginUser(page, 'juniorManager');
      await navigateToCRMSection(page, 'organisations');

      // Wait for organisations to load
      await page.waitForSelector('[data-testid=organisations-list]');
      
      // Get all visible organisation cards
      const orgCards = await page.locator('[data-testid=organisation-card]').all();
      
      // Verify each organisation is assigned to current user or they created it
      for (const card of orgCards) {
        const assignedUser = await card.getAttribute('data-assigned-user');
        const createdBy = await card.getAttribute('data-created-by');
        const currentUserId = await page.getAttribute('[data-testid=user-menu]', 'data-user-id');
        
        expect(assignedUser === currentUserId || createdBy === currentUserId).toBeTruthy();
      }
    });

    test('Uniqueness conflict resolution workflow', async ({ page }) => {
      await loginUser(page, 'admin');
      await navigateToCRMSection(page, 'organisations');

      // Create first organisation with unique email
      await page.click('[data-testid=new-organisation-button]');
      
      const orgName1 = `Unique Corp 1 ${Date.now()}`;
      const sharedEmail = `shared${Date.now()}@example.com`;
      
      await page.fill('[data-testid=org-name]', orgName1);
      await page.selectOption('[data-testid=org-type]', 'DEALER');
      await page.click('[data-testid=add-contact-method]');
      await page.selectOption('[data-testid=contact-method-type]', 'EMAIL');
      await page.fill('[data-testid=contact-method-value]', sharedEmail);
      
      await page.click('[data-testid=save-organisation]');
      await expect(page.locator('[data-testid=success-message]')).toBeVisible();

      // Try to create second organisation with same email
      await page.click('[data-testid=new-organisation-button]');
      
      const orgName2 = `Unique Corp 2 ${Date.now()}`;
      await page.fill('[data-testid=org-name]', orgName2);
      await page.selectOption('[data-testid=org-type]', 'SHIPPER');
      await page.click('[data-testid=add-contact-method]');
      await page.selectOption('[data-testid=contact-method-type]', 'EMAIL');
      await page.fill('[data-testid=contact-method-value]', sharedEmail);
      
      await page.click('[data-testid=save-organisation]');
      
      // Conflict modal should appear
      await expect(page.locator('[data-testid=conflict-resolution-modal]')).toBeVisible();
      await expect(page.locator('[data-testid=conflict-description]')).toContainText('email');
      await expect(page.locator('[data-testid=conflict-description]')).toContainText(sharedEmail);
      
      // Select merge resolution
      await page.click('[data-testid=resolution-merge]');
      await page.click('[data-testid=confirm-resolution]');
      
      // Should succeed with merge
      await expect(page.locator('[data-testid=success-message]')).toContainText('successfully resolved');
    });
  });

  test.describe('Deal Pipeline Workflow', () => {
    test('Complete deal lifecycle from creation to closure', async ({ page }) => {
      await loginUser(page, 'admin');
      
      // First create an organisation to associate with deal
      await navigateToCRMSection(page, 'organisations');
      await page.click('[data-testid=new-organisation-button]');
      
      const orgName = `Deal Org ${Date.now()}`;
      await page.fill('[data-testid=org-name]', orgName);
      await page.selectOption('[data-testid=org-type]', 'DEALER');
      await page.click('[data-testid=save-organisation]');
      await expect(page.locator('[data-testid=success-message]')).toBeVisible();

      // Navigate to deals
      await navigateToCRMSection(page, 'deals');
      
      // Create new deal
      await page.click('[data-testid=new-deal-button]');
      
      const dealTitle = `Test Deal ${Date.now()}`;
      await page.fill('[data-testid=deal-title]', dealTitle);
      await page.fill('[data-testid=deal-description]', 'E2E test deal');
      await page.fill('[data-testid=deal-value]', '50000');
      
      // Select organisation
      await page.click('[data-testid=deal-organisation-select]');
      await page.click(`[data-testid=organisation-option] >> text=${orgName}`);
      
      // Set expected close date
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      await page.fill('[data-testid=deal-close-date]', futureDate.toISOString().split('T')[0]);
      
      await page.click('[data-testid=save-deal]');
      await expect(page.locator('[data-testid=success-message]')).toBeVisible();

      // Verify deal appears in Kanban board
      await expect(page.locator('[data-testid=kanban-board]')).toBeVisible();
      await expect(page.locator('[data-testid=deal-card]', { hasText: dealTitle })).toBeVisible();
      
      // Get deal card
      const dealCard = page.locator('[data-testid=deal-card]', { hasText: dealTitle });
      
      // Verify initial stage (should be first stage)
      const initialStage = page.locator('[data-testid=kanban-stage]').first();
      await expect(initialStage.locator('[data-testid=deal-card]', { hasText: dealTitle })).toBeVisible();

      // Drag deal to next stage
      const nextStage = page.locator('[data-testid=kanban-stage]').nth(1);
      
      await dealCard.dragTo(nextStage);
      
      // Verify deal moved
      await expect(nextStage.locator('[data-testid=deal-card]', { hasText: dealTitle })).toBeVisible();
      
      // Update deal probability (should auto-calculate based on stage)
      await dealCard.click();
      await expect(page.locator('[data-testid=deal-details-modal]')).toBeVisible();
      
      // Verify probability updated based on stage
      const probabilityValue = await page.inputValue('[data-testid=deal-probability]');
      expect(parseInt(probabilityValue)).toBeGreaterThan(0);
      
      await page.click('[data-testid=close-modal]');

      // Move deal through final stages to completion
      const finalStage = page.locator('[data-testid=kanban-stage]').last();
      await dealCard.dragTo(finalStage);
      
      await expect(finalStage.locator('[data-testid=deal-card]', { hasText: dealTitle })).toBeVisible();
    });

    test('Deal loss tracking with required reason', async ({ page }) => {
      await loginUser(page, 'seniorManager');
      await navigateToCRMSection(page, 'deals');

      // Find an existing deal to mark as lost
      await page.waitForSelector('[data-testid=deal-card]');
      const dealCard = page.locator('[data-testid=deal-card]').first();
      
      await dealCard.click();
      await expect(page.locator('[data-testid=deal-details-modal]')).toBeVisible();
      
      // Mark as lost
      await page.click('[data-testid=mark-deal-lost]');
      
      // Loss reason modal should appear
      await expect(page.locator('[data-testid=loss-reason-modal]')).toBeVisible();
      
      // Try to submit without reason (should fail)
      await page.click('[data-testid=confirm-loss]');
      await expect(page.locator('[data-testid=validation-error]')).toContainText('reason is required');
      
      // Add reason and submit
      await page.fill('[data-testid=loss-reason]', 'Competitor had better pricing');
      await page.click('[data-testid=confirm-loss]');
      
      // Should succeed
      await expect(page.locator('[data-testid=success-message]')).toContainText('marked as lost');
      
      // Deal should move to lost status
      await expect(dealCard.locator('[data-testid=deal-status]')).toContainText('LOST');
    });
  });

  test.describe('Lead Conversion Workflow', () => {
    test('Convert target lead to deal', async ({ page }) => {
      await loginUser(page, 'admin');
      await navigateToCRMSection(page, 'leads');

      // Create target lead
      await page.click('[data-testid=new-lead-button]');
      
      const leadName = `Target Lead ${Date.now()}`;
      await page.fill('[data-testid=lead-first-name]', 'John');
      await page.fill('[data-testid=lead-last-name]', leadName);
      await page.fill('[data-testid=lead-company]', 'Target Company');
      
      await page.click('[data-testid=add-contact-method]');
      await page.selectOption('[data-testid=contact-method-type]', 'EMAIL');
      await page.fill('[data-testid=contact-method-value]', `john${Date.now()}@target.com`);
      
      // Mark as target lead
      await page.check('[data-testid=is-target-lead]');
      await page.fill('[data-testid=target-reason]', 'High potential customer based on profile');
      
      await page.click('[data-testid=save-lead]');
      await expect(page.locator('[data-testid=success-message]')).toBeVisible();

      // Find the created lead
      const leadCard = page.locator('[data-testid=lead-card]', { hasText: leadName });
      await expect(leadCard).toBeVisible();
      
      // Convert to deal
      await leadCard.click();
      await expect(page.locator('[data-testid=lead-details-modal]')).toBeVisible();
      
      await page.click('[data-testid=convert-lead]');
      
      // Conversion modal should appear
      await expect(page.locator('[data-testid=lead-conversion-modal]')).toBeVisible();
      
      // Fill deal details
      await page.fill('[data-testid=deal-title]', `Converted Deal from ${leadName}`);
      await page.fill('[data-testid=deal-value]', '75000');
      
      // Select pipeline
      await page.selectOption('[data-testid=deal-pipeline]', 'Dealer Pipeline');
      
      await page.click('[data-testid=confirm-conversion]');
      
      // Should succeed
      await expect(page.locator('[data-testid=success-message]')).toContainText('successfully converted');
      
      // Lead should be marked as converted
      await expect(leadCard.locator('[data-testid=lead-status]')).toContainText('CONVERTED');
      
      // Navigate to deals to verify creation
      await navigateToCRMSection(page, 'deals');
      await expect(page.locator('[data-testid=deal-card]', { hasText: 'Converted Deal' })).toBeVisible();
    });

    test('Prevent conversion of non-target leads', async ({ page }) => {
      await loginUser(page, 'seniorManager');
      await navigateToCRMSection(page, 'leads');

      // Create non-target lead
      await page.click('[data-testid=new-lead-button]');
      
      const leadName = `Regular Lead ${Date.now()}`;
      await page.fill('[data-testid=lead-first-name]', 'Jane');
      await page.fill('[data-testid=lead-last-name]', leadName);
      await page.fill('[data-testid=lead-company]', 'Regular Company');
      
      await page.click('[data-testid=add-contact-method]');
      await page.selectOption('[data-testid=contact-method-type]', 'EMAIL');
      await page.fill('[data-testid=contact-method-value]', `jane${Date.now()}@regular.com`);
      
      // Do NOT mark as target lead
      await page.click('[data-testid=save-lead]');
      await expect(page.locator('[data-testid=success-message]')).toBeVisible();

      // Find the created lead
      const leadCard = page.locator('[data-testid=lead-card]', { hasText: leadName });
      await leadCard.click();
      
      // Convert button should be disabled or not present
      const convertButton = page.locator('[data-testid=convert-lead]');
      
      if (await convertButton.isVisible()) {
        expect(await convertButton.isDisabled()).toBeTruthy();
      }
      
      // Should show message about target requirement
      await expect(page.locator('[data-testid=conversion-disabled-message]')).toContainText('Only target leads can be converted');
    });
  });

  test.describe('Search and Filtering', () => {
    test('Advanced search across multiple entities', async ({ page }) => {
      await loginUser(page, 'admin');
      await navigateToCRMSection(page, 'organisations');

      // Test basic search
      await page.fill('[data-testid=search-input]', 'Corp');
      await page.click('[data-testid=search-button]');
      
      // Wait for results
      await page.waitForTimeout(1000);
      
      const searchResults = await page.locator('[data-testid=organisation-card]').all();
      
      // Verify all results contain search term
      for (const result of searchResults) {
        const text = await result.textContent();
        expect(text?.toLowerCase()).toContain('corp');
      }

      // Test advanced filters
      await page.click('[data-testid=advanced-filters-toggle]');
      await expect(page.locator('[data-testid=advanced-filters]')).toBeVisible();
      
      // Filter by verified status
      await page.check('[data-testid=filter-verified]');
      await page.click('[data-testid=apply-filters]');
      
      await page.waitForTimeout(1000);
      
      const filteredResults = await page.locator('[data-testid=organisation-card]').all();
      
      // Verify all results are verified
      for (const result of filteredResults) {
        await expect(result.locator('[data-testid=verified-badge]')).toBeVisible();
      }

      // Clear filters
      await page.click('[data-testid=clear-filters]');
      await page.waitForTimeout(1000);
      
      // Should show more results
      const clearedResults = await page.locator('[data-testid=organisation-card]').all();
      expect(clearedResults.length).toBeGreaterThanOrEqual(filteredResults.length);
    });
  });

  test.describe('Activity and History Tracking', () => {
    test('View comprehensive activity log', async ({ page }) => {
      await loginUser(page, 'admin');
      await navigateToCRMSection(page, 'organisations');

      // Find an organisation and view its details
      await page.click('[data-testid=organisation-card]', { hasText: 'Admin Corp' });
      await expect(page.locator('[data-testid=organisation-details]')).toBeVisible();

      // Navigate to history tab
      await page.click('[data-testid=history-tab]');
      await expect(page.locator('[data-testid=history-timeline]')).toBeVisible();
      
      // Verify history entries
      const historyEntries = await page.locator('[data-testid=history-entry]').all();
      expect(historyEntries.length).toBeGreaterThan(0);
      
      // Verify entry structure
      const firstEntry = historyEntries[0];
      await expect(firstEntry.locator('[data-testid=entry-operation]')).toBeVisible();
      await expect(firstEntry.locator('[data-testid=entry-timestamp]')).toBeVisible();
      await expect(firstEntry.locator('[data-testid=entry-user]')).toBeVisible();
      await expect(firstEntry.locator('[data-testid=entry-changes]')).toBeVisible();

      // Test history integrity verification
      await page.click('[data-testid=verify-history-integrity]');
      await expect(page.locator('[data-testid=integrity-status]')).toContainText('verified');
    });

    test('Activity timeline shows related entity changes', async ({ page }) => {
      await loginUser(page, 'admin');
      
      // Navigate to activity log
      await page.goto('/crm/activity');
      await expect(page.locator('[data-testid=activity-log]')).toBeVisible();
      
      // Filter by entity type
      await page.selectOption('[data-testid=entity-type-filter]', 'organisation');
      await page.click('[data-testid=apply-filter]');
      
      // Verify filtered activities
      const activities = await page.locator('[data-testid=activity-item]').all();
      
      for (const activity of activities) {
        await expect(activity.locator('[data-testid=entity-type]')).toContainText('organisation');
      }

      // Test date range filtering
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      await page.fill('[data-testid=date-from]', yesterday.toISOString().split('T')[0]);
      await page.click('[data-testid=apply-filter]');
      
      // Should show recent activities
      const recentActivities = await page.locator('[data-testid=activity-item]').all();
      expect(recentActivities.length).toBeGreaterThan(0);
    });
  });

  test.describe('System Health and Monitoring', () => {
    test('System health dashboard shows all metrics', async ({ page }) => {
      await loginUser(page, 'admin');
      
      // Navigate to system health (admin only)
      await page.goto('/crm/system-health');
      await expect(page.locator('[data-testid=system-health-dashboard]')).toBeVisible();
      
      // Check main metrics
      await expect(page.locator('[data-testid=total-entities-count]')).toBeVisible();
      await expect(page.locator('[data-testid=active-users-count]')).toBeVisible();
      await expect(page.locator('[data-testid=storage-usage]')).toBeVisible();
      
      // Check integrity status
      await expect(page.locator('[data-testid=data-integrity-status]')).toContainText('healthy');
      
      // Test manual integrity check
      await page.click('[data-testid=run-integrity-check]');
      await expect(page.locator('[data-testid=integrity-check-progress]')).toBeVisible();
      
      // Wait for completion
      await page.waitForSelector('[data-testid=integrity-check-complete]', { timeout: 30000 });
      await expect(page.locator('[data-testid=integrity-results]')).toContainText('passed');
    });

    test('Non-admin users cannot access system health', async ({ page }) => {
      await loginUser(page, 'juniorManager');
      
      // Try to navigate to system health
      await page.goto('/crm/system-health');
      
      // Should be redirected or show access denied
      await expect(page.locator('[data-testid=access-denied]')).toBeVisible();
      // OR
      await expect(page).toHaveURL('/crm'); // Redirected to main CRM page
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('CRM interface works on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await loginUser(page, 'seniorManager');
      await navigateToCRMSection(page, 'organisations');

      // Mobile navigation should be hamburger menu
      await expect(page.locator('[data-testid=mobile-menu-toggle]')).toBeVisible();
      
      // Test mobile card layout
      await expect(page.locator('[data-testid=organisations-grid]')).toHaveClass(/mobile-grid/);
      
      // Test mobile forms
      await page.click('[data-testid=new-organisation-button]');
      await expect(page.locator('[data-testid=organisation-form]')).toHaveClass(/mobile-form/);
      
      // Form fields should stack vertically
      const formFields = await page.locator('[data-testid=form-field]').all();
      
      for (let i = 1; i < formFields.length; i++) {
        const prevField = formFields[i - 1];
        const currField = formFields[i];
        
        const prevBox = await prevField.boundingBox();
        const currBox = await currField.boundingBox();
        
        if (prevBox && currBox) {
          expect(currBox.y).toBeGreaterThan(prevBox.y + prevBox.height);
        }
      }
    });
  });

  test.describe('Error Handling and Recovery', () => {
    test('Graceful handling of network errors', async ({ page }) => {
      await loginUser(page, 'admin');
      await navigateToCRMSection(page, 'organisations');

      // Intercept API calls and simulate network error
      await page.route('**/api/crm/organisations', route => {
        route.abort('failed');
      });

      // Try to create organisation
      await page.click('[data-testid=new-organisation-button]');
      await page.fill('[data-testid=org-name]', 'Network Test Corp');
      await page.selectOption('[data-testid=org-type]', 'DEALER');
      await page.click('[data-testid=save-organisation]');

      // Should show error message
      await expect(page.locator('[data-testid=error-message]')).toBeVisible();
      await expect(page.locator('[data-testid=error-message]')).toContainText('network error');

      // Should offer retry option
      await expect(page.locator('[data-testid=retry-button]')).toBeVisible();
      
      // Remove network interception
      await page.unroute('**/api/crm/organisations');
      
      // Retry should work
      await page.click('[data-testid=retry-button]');
      await expect(page.locator('[data-testid=success-message]')).toBeVisible();
    });

    test('Data persistence across page refreshes', async ({ page }) => {
      await loginUser(page, 'admin');
      await navigateToCRMSection(page, 'organisations');

      // Start creating organisation
      await page.click('[data-testid=new-organisation-button]');
      await page.fill('[data-testid=org-name]', 'Persistence Test Corp');
      await page.fill('[data-testid=org-description]', 'Testing form persistence');

      // Refresh page
      await page.reload();
      
      // Should be back at organisations list (unsaved form data lost)
      await expect(page.locator('[data-testid=organisations-list]')).toBeVisible();
      
      // But saved data should persist
      const orgCount = await page.locator('[data-testid=organisation-card]').count();
      expect(orgCount).toBeGreaterThan(0);
    });
  });
});