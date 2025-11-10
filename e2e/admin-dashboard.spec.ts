/**
 * E2E tests for admin dashboard functionality
 * Tests task management, registration management, statistics, and export
 */

import { test, expect, Page } from '@playwright/test';
import {
  cleanupTestData,
  createTestTask,
  createTestRegistration,
  createTestAdmin,
  getTaskById,
  getAllTasks,
  adminExists
} from './helpers/db-helpers';
import {
  loginAsAdmin,
  setupAdminUser
} from './helpers/auth-helpers';
import {
  testTasks,
  testAdmin,
  generateUniqueTestData,
  generateUniqueTask
} from './fixtures/test-data';

test.describe('Admin Dashboard', () => {
  test.beforeAll(async () => {
    // Ensure test admin exists
    await setupAdminUser(testAdmin.username, testAdmin.password);
  });

  test.beforeEach(async ({ page }) => {
    // Clean up test data
    await cleanupTestData();

    // Login as admin before each test
    await loginAsAdmin(page, testAdmin.username, testAdmin.password);
  });

  test.afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestData();
  });

  test('should display dashboard with task statistics', async ({ page }) => {
    // Create some test tasks and registrations
    const task1 = await createTestTask(generateUniqueTask(testTasks.openTask));
    const task2 = await createTestTask(generateUniqueTask(testTasks.fullTask));

    // Add registrations to task1
    await createTestRegistration({
      taakId: task1.id,
      ...generateUniqueTestData('User 1')
    });
    await createTestRegistration({
      taakId: task1.id,
      ...generateUniqueTestData('User 2')
    });

    // Refresh the page to see updated stats
    await page.reload();

    // Verify dashboard is displayed
    await expect(page).toHaveURL('/admin/dashboard');

    // Check for statistics/summary cards
    const hasStats = await page.locator('text=/totaal|total|taken|tasks|aanmeldingen|registrations/i').count();
    expect(hasStats).toBeGreaterThan(0);

    // Verify tasks are listed
    await expect(page.locator(`text=${task1.naam}`)).toBeVisible();
    await expect(page.locator(`text=${task2.naam}`)).toBeVisible();
  });

  test('should create new task successfully', async ({ page }) => {
    // Navigate to create task page
    await page.click('a[href="/admin/dashboard/taken/nieuw"], button:has-text("Nieuwe taak"), a:has-text("Nieuwe taak")');

    // Wait for form to load
    await expect(page).toHaveURL(/\/admin\/dashboard\/taken\/nieuw/);

    // Fill in task form
    const uniqueTask = generateUniqueTask(testTasks.openTask);
    await page.fill('input[name="naam"]', uniqueTask.naam);
    await page.fill('textarea[name="beschrijving"], input[name="beschrijving"]', uniqueTask.beschrijving || '');
    await page.fill('input[name="maxAantal"]', uniqueTask.maxAantal.toString());
    await page.fill('input[name="categorie"]', uniqueTask.categorie || '');

    // Submit form
    await page.click('button[type="submit"]:has-text("Opslaan"), button[type="submit"]:has-text("Aanmaken"), button:has-text("Aanmaken")');

    // Should redirect to dashboard or show success message
    await expect(page.locator('text=/aangemaakt|created|success|opgeslagen/i')).toBeVisible({ timeout: 10000 });

    // Verify task appears in database
    const tasks = await getAllTasks();
    const createdTask = tasks.find(t => t.naam === uniqueTask.naam);
    expect(createdTask).toBeTruthy();
    expect(createdTask?.maxAantal).toBe(uniqueTask.maxAantal);
  });

  test('should edit existing task', async ({ page }) => {
    // Create a test task
    const task = await createTestTask(generateUniqueTask(testTasks.openTask));

    // Refresh to see the new task
    await page.reload();

    // Find and click edit button for the task
    // This might be an edit icon, link, or button near the task
    const editLocator = page.locator(`[href="/admin/dashboard/taken/${task.id}/edit"], button:has-text("Bewerken")`).first();

    if (await editLocator.count() > 0) {
      await editLocator.click();
    } else {
      // Alternative: click on task name first, then edit
      await page.click(`text=${task.naam}`);
      await page.click('a[href$="/edit"], button:has-text("Bewerken")');
    }

    // Wait for edit form
    await expect(page).toHaveURL(new RegExp(`/admin/dashboard/taken/${task.id}/edit`));

    // Update task details
    const newName = 'Updated Task Name ' + Date.now();
    const newMaxAantal = 10;

    await page.fill('input[name="naam"]', newName);
    await page.fill('input[name="maxAantal"]', newMaxAantal.toString());

    // Submit form
    await page.click('button[type="submit"]:has-text("Opslaan"), button[type="submit"]:has-text("Bijwerken")');

    // Wait for success
    await expect(page.locator('text=/bijgewerkt|updated|opgeslagen|success/i')).toBeVisible({ timeout: 10000 });

    // Verify changes in database
    const updatedTask = await getTaskById(task.id);
    expect(updatedTask?.naam).toBe(newName);
    expect(updatedTask?.maxAantal).toBe(newMaxAantal);
  });

  test('should delete task with confirmation', async ({ page }) => {
    // Create a test task
    const task = await createTestTask(generateUniqueTask(testTasks.openTask));

    // Refresh to see the new task
    await page.reload();

    // Verify task exists
    await expect(page.locator(`text=${task.naam}`)).toBeVisible();

    // Find and click delete button
    const deleteButton = page.locator(`button:has-text("Verwijderen")`).first();

    // Setup dialog handler for confirmation
    page.on('dialog', dialog => {
      expect(dialog.type()).toBe('confirm');
      dialog.accept();
    });

    if (await deleteButton.count() > 0) {
      await deleteButton.click();
    } else {
      // Alternative: might need to click on task first
      await page.click(`text=${task.naam}`);
      await page.click('button:has-text("Verwijderen")');
    }

    // Wait for deletion to complete
    await page.waitForTimeout(2000);

    // Verify task is no longer in database
    const deletedTask = await getTaskById(task.id);
    expect(deletedTask).toBeNull();
  });

  test('should view registrations for a task', async ({ page }) => {
    // Create a task with registrations
    const task = await createTestTask(generateUniqueTask(testTasks.openTask));

    const user1 = generateUniqueTestData('User 1');
    const user2 = generateUniqueTestData('User 2');

    await createTestRegistration({
      taakId: task.id,
      ...user1
    });
    await createTestRegistration({
      taakId: task.id,
      ...user2
    });

    // Refresh to see updated data
    await page.reload();

    // Click on task to view registrations
    await page.click(`text=${task.naam}`);

    // Should navigate to task detail page
    await expect(page).toHaveURL(new RegExp(`/admin/dashboard/taken/${task.id}`));

    // Verify registrations are displayed
    await expect(page.locator(`text=${user1.naam}`)).toBeVisible();
    await expect(page.locator(`text=${user1.email}`)).toBeVisible();
    await expect(page.locator(`text=${user2.naam}`)).toBeVisible();
    await expect(page.locator(`text=${user2.email}`)).toBeVisible();

    // Verify registration count
    await expect(page.locator('text=/2.*aanmeldingen|2.*registrations/i')).toBeVisible();
  });

  test('should delete registration from task detail page', async ({ page }) => {
    // Create a task with a registration
    const task = await createTestTask(generateUniqueTask(testTasks.openTask));
    const user = generateUniqueTestData('User to Delete');
    const registration = await createTestRegistration({
      taakId: task.id,
      ...user
    });

    // Refresh and navigate to task detail
    await page.reload();
    await page.click(`text=${task.naam}`);

    // Wait for task detail page
    await expect(page).toHaveURL(new RegExp(`/admin/dashboard/taken/${task.id}`));

    // Verify registration is visible
    await expect(page.locator(`text=${user.naam}`)).toBeVisible();

    // Setup dialog handler for confirmation
    page.on('dialog', dialog => {
      expect(dialog.type()).toBe('confirm');
      dialog.accept();
    });

    // Find and click delete button for this registration
    const deleteButton = page.locator(`button:has-text("Verwijderen")`).first();
    await deleteButton.click();

    // Wait for deletion
    await page.waitForTimeout(2000);

    // Verify registration count decreased
    const updatedTask = await getTaskById(task.id);
    expect(updatedTask?._count.aanmeldingen).toBe(0);
  });

  test('should navigate to export page', async ({ page }) => {
    // Create some test data
    const task = await createTestTask(generateUniqueTask(testTasks.openTask));
    await createTestRegistration({
      taakId: task.id,
      ...generateUniqueTestData('Export User')
    });

    // Refresh dashboard
    await page.reload();

    // Find and click export link
    const exportLink = page.locator('a[href="/admin/dashboard/export"], button:has-text("Exporteren"), a:has-text("Excel")').first();

    if (await exportLink.count() > 0) {
      await exportLink.click();

      // Should navigate to export page
      await expect(page).toHaveURL('/admin/dashboard/export');

      // Verify export page content
      await expect(page.locator('h1, h2')).toContainText(/export|excel/i);
    }
  });

  test('should display correct task capacity indicators', async ({ page }) => {
    // Create tasks with different fill levels
    const openTask = await createTestTask(generateUniqueTask({
      ...testTasks.openTask,
      maxAantal: 5
    }));

    const almostFullTask = await createTestTask(generateUniqueTask({
      ...testTasks.openTask,
      maxAantal: 3
    }));

    // Fill almostFullTask to 2/3
    await createTestRegistration({
      taakId: almostFullTask.id,
      ...generateUniqueTestData('User 1')
    });
    await createTestRegistration({
      taakId: almostFullTask.id,
      ...generateUniqueTestData('User 2')
    });

    // Refresh dashboard
    await page.reload();

    // Check that capacity is displayed for tasks
    // Look for patterns like "0/5" or "2/3"
    const hasCapacity = await page.locator('text=/\\d+\\/\\d+/').count();
    expect(hasCapacity).toBeGreaterThan(0);

    // Verify specific capacity numbers
    await expect(page.locator(`text=/0.*${openTask.maxAantal}|${openTask.maxAantal}.*beschikbaar/`)).toBeVisible();
    await expect(page.locator(`text=/2.*${almostFullTask.maxAantal}/`)).toBeVisible();
  });

  test('should search/filter tasks if feature exists', async ({ page }) => {
    // Create tasks with different names and categories
    const task1 = await createTestTask(generateUniqueTask({
      naam: 'Test Alpha Task ' + Date.now(),
      beschrijving: 'Alpha task',
      maxAantal: 5,
      categorie: 'Category A'
    }));

    const task2 = await createTestTask(generateUniqueTask({
      naam: 'Test Beta Task ' + Date.now(),
      beschrijving: 'Beta task',
      maxAantal: 5,
      categorie: 'Category B'
    }));

    // Refresh dashboard
    await page.reload();

    // Check if search/filter exists
    const searchInput = page.locator('input[type="search"], input[placeholder*="Zoek"], input[placeholder*="Search"]').first();

    if (await searchInput.count() > 0) {
      // Test search functionality
      await searchInput.fill('Alpha');

      // Wait for filter to apply
      await page.waitForTimeout(500);

      // Task1 should be visible, task2 should not
      await expect(page.locator(`text=${task1.naam}`)).toBeVisible();

      // Clear search
      await searchInput.fill('');

      // Both tasks should be visible again
      await expect(page.locator(`text=${task1.naam}`)).toBeVisible();
      await expect(page.locator(`text=${task2.naam}`)).toBeVisible();
    }
  });

  test('should show validation errors when creating invalid task', async ({ page }) => {
    // Navigate to create task page
    const newTaskLink = page.locator('a[href="/admin/dashboard/taken/nieuw"], button:has-text("Nieuwe taak")').first();

    if (await newTaskLink.count() > 0) {
      await newTaskLink.click();
      await expect(page).toHaveURL(/\/admin\/dashboard\/taken\/nieuw/);

      // Try to submit empty form
      await page.click('button[type="submit"]');

      // Should show validation errors or prevent submission
      await expect(page).toHaveURL(/\/admin\/dashboard\/taken\/nieuw/);

      // Verify required fields
      await expect(page.locator('input[name="naam"]')).toHaveAttribute('required', '');
      await expect(page.locator('input[name="maxAantal"]')).toHaveAttribute('required', '');
    }
  });
});
