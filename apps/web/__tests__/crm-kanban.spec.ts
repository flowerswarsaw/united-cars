import { test, expect } from '@playwright/test';

test.describe('CRM Kanban Board', () => {
  test.beforeEach(async ({ page }) => {
    // Mock the API endpoints
    await page.route('/api/crm/pipelines', async (route) => {
      await route.fulfill({
        json: [{
          id: 'pipeline_dealer',
          name: 'Dealer',
          color: '#3B82F6',
          stages: [
            { id: 'stage_1', name: 'Investigation', order: 0, color: '#94A3B8' },
            { id: 'stage_2', name: 'Qualification', order: 1, color: '#64748B' },
            { id: 'stage_won', name: 'Close Won', order: 2, color: '#059669', isClosing: true }
          ]
        }]
      });
    });

    await page.route('/api/crm/deals', async (route) => {
      await route.fulfill({
        json: [{
          id: 'deal_1',
          title: 'Test Deal',
          amount: 10000,
          currency: 'USD',
          status: 'OPEN',
          currentStages: [{
            id: 'cs_1',
            dealId: 'deal_1',
            pipelineId: 'pipeline_dealer',
            stageId: 'stage_1',
            enteredAt: new Date().toISOString()
          }]
        }]
      });
    });

    await page.route('/api/crm/deals/*/move', async (route) => {
      await route.fulfill({
        json: {
          id: 'deal_1',
          title: 'Test Deal',
          status: 'OPEN',
          currentStages: [{
            dealId: 'deal_1',
            pipelineId: 'pipeline_dealer',
            stageId: 'stage_2'
          }]
        }
      });
    });

    await page.goto('/crm/deals');
  });

  test('should display deal cards in correct stages', async ({ page }) => {
    // Wait for the kanban board to load
    await expect(page.locator('text=Investigation')).toBeVisible();
    await expect(page.locator('text=Test Deal')).toBeVisible();
    
    // Check that deal is in the Investigation column
    const investigationColumn = page.locator('[data-stage="stage_1"]');
    await expect(investigationColumn.locator('text=Test Deal')).toBeVisible();
  });

  test('should show pipeline tabs', async ({ page }) => {
    await expect(page.locator('text=Dealer')).toBeVisible();
    await expect(page.locator('text=1')).toBeVisible(); // Deal count badge
  });

  test('should display deal information', async ({ page }) => {
    const dealCard = page.locator('text=Test Deal').locator('..');
    await expect(dealCard.locator('text=$10,000')).toBeVisible();
  });

  test('should handle empty states', async ({ page }) => {
    // Mock empty pipelines
    await page.route('/api/crm/pipelines', async (route) => {
      await route.fulfill({ json: [] });
    });
    
    await page.reload();
    await expect(page.locator('text=No pipelines found')).toBeVisible();
  });
});

test.describe('CRM Lead Conversion', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('/api/crm/leads', async (route) => {
      await route.fulfill({
        json: [{
          id: 'lead_1',
          title: 'Test Lead',
          isTarget: true,
          source: 'Website',
          score: 85
        }]
      });
    });

    await page.route('/api/crm/pipelines', async (route) => {
      await route.fulfill({
        json: [{
          id: 'pipeline_dealer',
          name: 'Dealer'
        }]
      });
    });

    await page.goto('/crm/leads');
  });

  test('should show convert button for target leads', async ({ page }) => {
    await expect(page.locator('text=Test Lead')).toBeVisible();
    
    // Target toggle should be enabled (green)
    const targetToggle = page.locator('[data-testid="target-toggle"]');
    await expect(targetToggle).toHaveClass(/text-green-600/);
    
    // Convert button should be enabled
    const convertButton = page.locator('button[aria-label="Convert lead"]');
    await expect(convertButton).not.toBeDisabled();
  });

  test('should open convert dialog', async ({ page }) => {
    await page.locator('button[aria-label="Convert lead"]').click();
    await expect(page.locator('text=Convert Lead to Deal')).toBeVisible();
    
    // Form fields should be visible
    await expect(page.locator('input[name="title"]')).toBeVisible();
    await expect(page.locator('input[name="amount"]')).toBeVisible();
  });
});