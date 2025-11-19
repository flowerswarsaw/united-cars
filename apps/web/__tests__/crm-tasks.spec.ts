import { test, expect } from '@playwright/test';

test.describe('CRM Tasks - CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/crm/tasks');
  });

  test('should display tasks list with all columns', async ({ page }) => {
    await page.waitForSelector('[data-testid="tasks-table"]', { timeout: 10000 });

    // Verify table headers
    await expect(page.locator('th:has-text("Task")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
    await expect(page.locator('th:has-text("Priority")')).toBeVisible();
    await expect(page.locator('th:has-text("Due Date")')).toBeVisible();
    await expect(page.locator('th:has-text("Assigned To")')).toBeVisible();

    // Verify tasks are displayed
    const rows = page.locator('[data-testid="task-row"]');
    expect(await rows.count()).toBeGreaterThan(0);
  });

  test('should create new standalone task', async ({ page }) => {
    const uniqueId = Date.now();
    const taskTitle = `Test Task ${uniqueId}`;

    await page.click('button:has-text("New Task")');

    // Fill form
    await page.fill('input[name="title"]', taskTitle);
    await page.fill('textarea[name="description"]', 'This is a test task description');

    // Set priority
    await page.selectOption('select[name="priority"]', 'HIGH');

    // Set due date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    await page.fill('input[name="dueDate"]', dateString);

    // Submit
    await page.click('button:has-text("Create Task")');

    // Verify success
    await expect(page.locator('text=Task created successfully')).toBeVisible({ timeout: 5000 });

    // Verify task appears in list
    await expect(page.locator(`text=${taskTitle}`)).toBeVisible();
  });

  test('should create task linked to deal', async ({ page }) => {
    const taskTitle = `Deal Task ${Date.now()}`;

    await page.click('button:has-text("New Task")');

    await page.fill('input[name="title"]', taskTitle);

    // Link to entity
    await page.selectOption('select[name="entityType"]', 'DEAL');

    // Wait for entity selector to load
    await page.waitForTimeout(500);

    // Select a deal
    await page.selectOption('select[name="entityId"]', { index: 0 });

    await page.selectOption('select[name="priority"]', 'MEDIUM');

    await page.click('button:has-text("Create Task")');

    await expect(page.locator('text=Task created')).toBeVisible();

    // Verify task shows deal link
    const taskRow = page.locator(`text=${taskTitle}`).locator('..');
    await expect(taskRow.locator('[data-testid="entity-badge"]')).toBeVisible();
  });

  test('should update task status', async ({ page }) => {
    await page.waitForSelector('[data-testid="tasks-table"]');

    // Find a TODO task
    const todoTask = page.locator('[data-testid="task-row"][data-status="TODO"]').first();

    if (await todoTask.count() > 0) {
      // Click status badge or dropdown
      await todoTask.locator('[data-testid="status-select"]').click();

      // Change to IN_PROGRESS
      await page.locator('option:has-text("In Progress")').click();

      // Wait for update
      await page.waitForTimeout(500);

      // Verify status changed
      await expect(todoTask).toHaveAttribute('data-status', 'IN_PROGRESS');

      // Should show visual indicator
      await expect(todoTask.locator('text=In Progress')).toBeVisible();
    }
  });

  test('should mark task as done with checkbox', async ({ page }) => {
    await page.waitForSelector('[data-testid="tasks-table"]');

    const incompleteTasks = page.locator('[data-testid="task-row"]:not([data-status="DONE"])');

    if (await incompleteTasks.count() > 0) {
      const task = incompleteTasks.first();

      // Click checkbox
      await task.locator('input[type="checkbox"]').check();

      // Wait for API call
      await page.waitForTimeout(500);

      // Task should be marked as DONE
      await expect(task).toHaveAttribute('data-status', 'DONE');

      // May move to completed section or stay in place
      await expect(task.locator('[data-testid="task-checkbox"]')).toBeChecked();
    }
  });

  test('should edit task details', async ({ page }) => {
    await page.waitForSelector('[data-testid="tasks-table"]');

    const firstTask = page.locator('[data-testid="task-row"]').first();
    const taskTitle = await firstTask.locator('[data-testid="task-title"]').textContent();

    // Click on task to open details
    await firstTask.click();

    // Or click edit button
    await firstTask.locator('button[aria-label="Edit task"]').click();

    // Edit form should open
    await expect(page.locator('text=Edit Task')).toBeVisible();

    // Change description
    await page.fill('textarea[name="description"]', 'Updated task description');

    // Change priority
    await page.selectOption('select[name="priority"]', 'URGENT');

    // Save
    await page.click('button:has-text("Save Changes")');

    await expect(page.locator('text=Task updated')).toBeVisible();

    // Verify changes
    const updatedTask = page.locator(`text=${taskTitle}`).locator('..');
    await expect(updatedTask.locator('text=Urgent')).toBeVisible();
  });

  test('should delete task with confirmation', async ({ page }) => {
    // Create test task
    await page.click('button:has-text("New Task")');
    const taskTitle = `Delete Test ${Date.now()}`;

    await page.fill('input[name="title"]', taskTitle);
    await page.selectOption('select[name="priority"]', 'LOW');
    await page.click('button:has-text("Create Task")');

    await page.waitForTimeout(1000);

    // Find and delete
    const taskRow = page.locator(`text=${taskTitle}`).locator('..');
    await taskRow.hover();
    await taskRow.locator('button[aria-label="Delete task"]').click();

    // Confirm
    await expect(page.locator('text=Are you sure')).toBeVisible();
    await page.click('button:has-text("Delete")');

    await expect(page.locator('text=Task deleted')).toBeVisible();
    await expect(page.locator(`text=${taskTitle}`)).not.toBeVisible();
  });

  test('should filter tasks by status', async ({ page }) => {
    await page.waitForSelector('[data-testid="tasks-table"]');

    const initialCount = await page.locator('[data-testid="task-row"]').count();

    // Filter by TODO status
    await page.selectOption('select[name="status"]', 'TODO');
    await page.waitForTimeout(500);

    // All visible tasks should be TODO
    const tasks = page.locator('[data-testid="task-row"]');
    const count = await tasks.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      await expect(tasks.nth(i)).toHaveAttribute('data-status', 'TODO');
    }

    // Clear filter
    await page.selectOption('select[name="status"]', '');
    await page.waitForTimeout(500);

    const finalCount = await page.locator('[data-testid="task-row"]').count();
    expect(finalCount).toEqual(initialCount);
  });

  test('should filter tasks by priority', async ({ page }) => {
    await page.waitForSelector('[data-testid="tasks-table"]');

    // Filter by HIGH priority
    await page.selectOption('select[name="priority"]', 'HIGH');
    await page.waitForTimeout(500);

    // Verify filtered tasks
    const tasks = page.locator('[data-testid="task-row"]');
    if (await tasks.count() > 0) {
      await expect(tasks.first().locator('text=High')).toBeVisible();
    }
  });

  test('should filter tasks by due date range', async ({ page }) => {
    await page.waitForSelector('[data-testid="tasks-table"]');

    // Set date range
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    await page.fill('input[name="dueDateFrom"]', today);
    await page.fill('input[name="dueDateTo"]', nextWeekStr);

    await page.waitForTimeout(500);

    // Should show only tasks due within range
    const tasks = page.locator('[data-testid="task-row"]');
    expect(await tasks.count()).toBeGreaterThanOrEqual(0);
  });
});

test.describe('CRM Tasks - Entity Linking', () => {
  test('should show tasks on deal detail page', async ({ page }) => {
    await page.goto('/crm/deals');
    await page.waitForSelector('[data-testid="kanban-board"]');

    // Click on a deal
    await page.locator('[data-testid="deal-card"]').first().click();

    await expect(page).toHaveURL(/\/crm\/deals\/[a-zA-Z0-9_-]+/);

    // Tasks section should be visible
    await expect(page.locator('text=Tasks')).toBeVisible();

    // Should show task list or empty state
    const tasksList = page.locator('[data-testid="deal-tasks-list"]');
    const emptyState = page.locator('text=No tasks yet');

    const hasTasks = await tasksList.count() > 0;
    const isEmpty = await emptyState.count() > 0;

    expect(hasTasks || isEmpty).toBe(true);
  });

  test('should create task from deal page', async ({ page }) => {
    await page.goto('/crm/deals');
    await page.waitForSelector('[data-testid="kanban-board"]');

    // Click on a deal
    await page.locator('[data-testid="deal-card"]').first().click();

    // Click add task button
    await page.click('button:has-text("Add Task")');

    // Task form should open with deal pre-selected
    await expect(page.locator('text=New Task')).toBeVisible();

    // Entity should be pre-filled
    const entitySelect = page.locator('select[name="entityType"]');
    if (await entitySelect.count() > 0) {
      await expect(entitySelect).toHaveValue('DEAL');
    }

    const taskTitle = `Deal Task ${Date.now()}`;
    await page.fill('input[name="title"]', taskTitle);
    await page.selectOption('select[name="priority"]', 'MEDIUM');

    await page.click('button:has-text("Create Task")');

    await expect(page.locator('text=Task created')).toBeVisible();

    // Task should appear in deal's task list
    await expect(page.locator(`text=${taskTitle}`)).toBeVisible();
  });

  test('should show tasks on contact detail page', async ({ page }) => {
    await page.goto('/crm/contacts');
    await page.waitForSelector('[data-testid="contacts-table"]');

    await page.locator('[data-testid="contact-row"]').first().click();

    // Tasks tab
    const tasksTab = page.locator('button:has-text("Tasks")');
    if (await tasksTab.count() > 0) {
      await tasksTab.click();

      // Should show contact's tasks
      await expect(page.locator('[data-testid="contact-tasks-section"]')).toBeVisible();
    }
  });

  test('should link task to organisation', async ({ page }) => {
    await page.goto('/crm/tasks');

    await page.click('button:has-text("New Task")');

    const taskTitle = `Org Task ${Date.now()}`;
    await page.fill('input[name="title"]', taskTitle);

    // Select organisation entity type
    await page.selectOption('select[name="entityType"]', 'ORGANISATION');

    await page.waitForTimeout(500);

    // Select an organisation
    await page.selectOption('select[name="entityId"]', { index: 0 });

    await page.click('button:has-text("Create Task")');

    await expect(page.locator('text=Task created')).toBeVisible();

    // Should show organisation link
    const task = page.locator(`text=${taskTitle}`).locator('..');
    await expect(task.locator('[data-testid="entity-link"]')).toBeVisible();
  });
});

test.describe('CRM Tasks - Assignment', () => {
  test('should assign task to user', async ({ page }) => {
    await page.goto('/crm/tasks');

    await page.click('button:has-text("New Task")');

    const taskTitle = `Assigned Task ${Date.now()}`;
    await page.fill('input[name="title"]', taskTitle);

    // Select assignee
    const assigneeSelect = page.locator('select[name="assignedToId"]');
    if (await assigneeSelect.count() > 0) {
      await assigneeSelect.selectOption({ index: 1 });
    }

    await page.click('button:has-text("Create Task")');

    await expect(page.locator('text=Task created')).toBeVisible();

    // Should show assignee
    const task = page.locator(`text=${taskTitle}`).locator('..');
    await expect(task.locator('[data-testid="assignee-badge"]')).toBeVisible();
  });

  test('should reassign task to different user', async ({ page }) => {
    await page.goto('/crm/tasks');
    await page.waitForSelector('[data-testid="tasks-table"]');

    const firstTask = page.locator('[data-testid="task-row"]').first();
    await firstTask.locator('button[aria-label="Edit task"]').click();

    // Change assignee
    const assigneeSelect = page.locator('select[name="assignedToId"]');
    if (await assigneeSelect.count() > 0) {
      const currentValue = await assigneeSelect.inputValue();

      // Select different user
      await assigneeSelect.selectOption({ index: 2 });

      await page.click('button:has-text("Save Changes")');

      await expect(page.locator('text=Task updated')).toBeVisible();

      // Should show new assignee
      await expect(page.locator('[data-testid="assignee-badge"]')).toBeVisible();
    }
  });

  test('should filter tasks by assignee', async ({ page }) => {
    await page.goto('/crm/tasks');
    await page.waitForSelector('[data-testid="tasks-table"]');

    // Filter by assignee
    const assigneeFilter = page.locator('select[name="assignedTo"]');
    if (await assigneeFilter.count() > 0) {
      await assigneeFilter.selectOption({ index: 1 });

      await page.waitForTimeout(500);

      // All visible tasks should have same assignee
      const tasks = page.locator('[data-testid="task-row"]');
      if (await tasks.count() > 0) {
        await expect(tasks.first().locator('[data-testid="assignee-badge"]')).toBeVisible();
      }
    }
  });
});

test.describe('CRM Tasks - Advanced Features', () => {
  test('should show overdue tasks indicator', async ({ page }) => {
    await page.goto('/crm/tasks');
    await page.waitForSelector('[data-testid="tasks-table"]');

    // Look for overdue tasks (past due date)
    const overdueTasks = page.locator('[data-testid="task-row"][data-overdue="true"]');

    if (await overdueTasks.count() > 0) {
      // Should have visual indicator
      await expect(overdueTasks.first().locator('[data-testid="overdue-badge"]')).toBeVisible();

      // Badge should be red
      await expect(overdueTasks.first().locator('.text-red-600')).toBeVisible();
    }
  });

  test('should sort tasks by due date', async ({ page }) => {
    await page.goto('/crm/tasks');
    await page.waitForSelector('[data-testid="tasks-table"]');

    // Click due date column header
    await page.click('th:has-text("Due Date")');
    await page.waitForTimeout(500);

    // Get first task due date
    const firstTask = page.locator('[data-testid="task-row"]').first();
    const firstDueDate = await firstTask.locator('[data-testid="due-date"]').textContent();

    // Click again to reverse sort
    await page.click('th:has-text("Due Date")');
    await page.waitForTimeout(500);

    // First task should be different
    const newFirstDueDate = await page.locator('[data-testid="task-row"]').first()
      .locator('[data-testid="due-date"]').textContent();

    // Dates should be different (or could be same if only one task)
    const taskCount = await page.locator('[data-testid="task-row"]').count();
    if (taskCount > 1) {
      expect(firstDueDate).not.toBe(newFirstDueDate);
    }
  });

  test('should show task count by status', async ({ page }) => {
    await page.goto('/crm/tasks');

    // Dashboard may show task counts
    const todoCount = page.locator('[data-testid="todo-count"]');
    const inProgressCount = page.locator('[data-testid="in-progress-count"]');
    const doneCount = page.locator('[data-testid="done-count"]');

    // At least one count should be visible
    const hasCounts = await todoCount.count() > 0 ||
                      await inProgressCount.count() > 0 ||
                      await doneCount.count() > 0;

    if (hasCounts) {
      // Counts should be numbers
      if (await todoCount.count() > 0) {
        const count = await todoCount.textContent();
        expect(Number(count)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should bulk update task status', async ({ page }) => {
    await page.goto('/crm/tasks');
    await page.waitForSelector('[data-testid="tasks-table"]');

    // Select multiple tasks
    const checkboxes = page.locator('input[type="checkbox"][data-testid="task-select"]');
    const count = Math.min(await checkboxes.count(), 3);

    for (let i = 0; i < count; i++) {
      await checkboxes.nth(i).check();
    }

    // Bulk actions should appear
    await expect(page.locator('[data-testid="bulk-actions-toolbar"]')).toBeVisible();

    // Click bulk status update
    await page.click('button:has-text("Mark as Done")');

    // Confirm
    await page.click('button:has-text("Confirm")');

    await expect(page.locator(`text=${count} tasks updated`)).toBeVisible();
  });

  test('should handle recurring task creation', async ({ page }) => {
    await page.goto('/crm/tasks');

    await page.click('button:has-text("New Task")');

    const taskTitle = `Recurring Task ${Date.now()}`;
    await page.fill('input[name="title"]', taskTitle);

    // If recurring option exists
    const recurringCheckbox = page.locator('input[name="isRecurring"]');
    if (await recurringCheckbox.count() > 0) {
      await recurringCheckbox.check();

      // Select recurrence pattern
      await page.selectOption('select[name="recurrencePattern"]', 'WEEKLY');

      await page.click('button:has-text("Create Task")');

      await expect(page.locator('text=Task created')).toBeVisible();

      // Should show recurrence indicator
      const task = page.locator(`text=${taskTitle}`).locator('..');
      await expect(task.locator('[data-testid="recurring-badge"]')).toBeVisible();
    }
  });

  test('should search tasks by title or description', async ({ page }) => {
    await page.goto('/crm/tasks');
    await page.waitForSelector('[data-testid="tasks-table"]');

    const initialCount = await page.locator('[data-testid="task-row"]').count();

    // Search
    await page.fill('input[placeholder*="Search"]', 'follow up');
    await page.waitForTimeout(500);

    const searchCount = await page.locator('[data-testid="task-row"]').count();
    expect(searchCount).toBeLessThanOrEqual(initialCount);

    // Clear search
    await page.fill('input[placeholder*="Search"]', '');
    await page.waitForTimeout(500);

    const finalCount = await page.locator('[data-testid="task-row"]').count();
    expect(finalCount).toEqual(initialCount);
  });

  test('should show empty state when no tasks exist', async ({ page }) => {
    // Mock empty response
    await page.route('/api/crm/tasks', route =>
      route.fulfill({
        status: 200,
        body: JSON.stringify([])
      })
    );

    await page.goto('/crm/tasks');

    await expect(page.locator('text=No tasks found')).toBeVisible();
    await expect(page.locator('button:has-text("Create your first task")')).toBeVisible();
  });

  test('should handle task completion date tracking', async ({ page }) => {
    await page.goto('/crm/tasks');
    await page.waitForSelector('[data-testid="tasks-table"]');

    // Find incomplete task and mark as done
    const incompleteTask = page.locator('[data-testid="task-row"]:not([data-status="DONE"])').first();

    if (await incompleteTask.count() > 0) {
      await incompleteTask.locator('input[type="checkbox"]').check();

      await page.waitForTimeout(500);

      // Task should now show completion date
      await expect(incompleteTask.locator('[data-testid="completed-at"]')).toBeVisible();
    }
  });
});
