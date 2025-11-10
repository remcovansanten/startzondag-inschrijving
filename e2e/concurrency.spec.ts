/**
 * E2E tests for concurrent registration scenarios
 * Tests race conditions, task capacity enforcement under load, and simultaneous registrations
 */

import { test, expect, Browser } from '@playwright/test';
import {
  cleanupTestData,
  createTestTask,
  getRegistrationCount,
  getTaskById
} from './helpers/db-helpers';
import {
  testTasks,
  generateUniqueTestData,
  generateUniqueTask
} from './fixtures/test-data';

test.describe('Concurrent Registration Tests', () => {
  test.beforeEach(async () => {
    // Clean up any existing test data
    await cleanupTestData();
  });

  test.afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestData();
  });

  test('should handle multiple simultaneous registrations correctly', async ({ browser }) => {
    // Create a task with reasonable capacity
    const uniqueTask = generateUniqueTask(testTasks.largeCapacityTask);
    const task = await createTestTask(uniqueTask);

    // Number of concurrent registrations to attempt
    const concurrentUsers = 10;

    // Create multiple browser contexts (simulating different users)
    const registrationPromises = [];

    for (let i = 0; i < concurrentUsers; i++) {
      const promise = (async () => {
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
          const userData = generateUniqueTestData(`Concurrent User ${i}`);

          // Navigate to registration form
          await page.goto(`/aanmelden/${task.id}`);

          // Fill form
          await page.fill('input[name="naam"]', userData.naam);
          await page.fill('input[name="email"]', userData.email);
          await page.fill('input[name="telefoon"]', userData.telefoon);

          // Submit form
          await page.click('button[type="submit"]');

          // Wait for response - either success or error
          await Promise.race([
            page.waitForURL('/bevestiging', { timeout: 10000 }),
            page.waitForSelector('[role="alert"]', { timeout: 10000 })
          ]);

          // Check if registration was successful
          const isSuccess = page.url().includes('/bevestiging');

          await context.close();

          return {
            success: isSuccess,
            email: userData.email,
            index: i
          };
        } catch (error) {
          await context.close();
          return {
            success: false,
            email: `error-${i}`,
            index: i,
            error: error.message
          };
        }
      })();

      registrationPromises.push(promise);
    }

    // Wait for all registrations to complete
    const results = await Promise.all(registrationPromises);

    // Count successful registrations
    const successCount = results.filter(r => r.success).length;

    console.log(`Successful registrations: ${successCount}/${concurrentUsers}`);
    console.log(`Results:`, results);

    // Verify registrations in database
    const dbCount = await getRegistrationCount(task.id);

    // All or most should succeed since we have capacity 100
    expect(dbCount).toBeGreaterThan(0);
    expect(dbCount).toBeLessThanOrEqual(concurrentUsers);

    // Database count should match successful registrations
    expect(dbCount).toBe(successCount);

    // Verify task capacity is not exceeded
    expect(dbCount).toBeLessThanOrEqual(task.maxAantal);
  });

  test('should enforce task capacity under race conditions', async ({ browser }) => {
    // Create a task with very limited capacity
    const uniqueTask = generateUniqueTask(testTasks.smallCapacityTask);
    const task = await createTestTask(uniqueTask);
    const capacity = task.maxAantal; // Should be 3

    // Attempt more registrations than capacity allows
    const attemptCount = 10;

    console.log(`Testing capacity enforcement: ${capacity} spots, ${attemptCount} attempts`);

    // Create multiple concurrent registration attempts
    const registrationPromises = [];

    for (let i = 0; i < attemptCount; i++) {
      const promise = (async () => {
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
          const userData = generateUniqueTestData(`Race User ${i}`);

          // Navigate to registration form
          await page.goto(`/aanmelden/${task.id}`, { waitUntil: 'networkidle' });

          // Add a small random delay to simulate real-world timing variations
          await page.waitForTimeout(Math.random() * 100);

          // Fill form
          await page.fill('input[name="naam"]', userData.naam);
          await page.fill('input[name="email"]', userData.email);
          await page.fill('input[name="telefoon"]', userData.telefoon);

          // Submit form
          await page.click('button[type="submit"]');

          // Wait for either success or error
          try {
            await page.waitForURL('/bevestiging', { timeout: 8000 });
            await context.close();
            return { success: true, email: userData.email, index: i };
          } catch {
            // Check for error message
            const hasError = await page.locator('[role="alert"]').isVisible();
            await context.close();
            return { success: false, email: userData.email, index: i, hasError };
          }
        } catch (error) {
          await context.close();
          return { success: false, email: `error-${i}`, index: i, error: error.message };
        }
      })();

      registrationPromises.push(promise);
    }

    // Wait for all attempts to complete
    const results = await Promise.all(registrationPromises);

    // Analyze results
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Capacity test results:`);
    console.log(`  - Successful: ${successCount}`);
    console.log(`  - Failed: ${failureCount}`);
    console.log(`  - Expected capacity: ${capacity}`);

    // Verify database state
    const dbCount = await getRegistrationCount(task.id);
    const taskAfter = await getTaskById(task.id);

    console.log(`  - Database count: ${dbCount}`);
    console.log(`  - Task max capacity: ${taskAfter?.maxAantal}`);

    // CRITICAL: Database count must not exceed capacity
    expect(dbCount).toBeLessThanOrEqual(capacity);

    // Exactly 'capacity' registrations should succeed
    expect(dbCount).toBe(capacity);

    // At least some registrations should have failed
    expect(failureCount).toBeGreaterThan(0);

    // Total successful should match database
    expect(successCount).toBe(dbCount);

    // Verify the remaining attempts were rejected
    expect(successCount + failureCount).toBe(attemptCount);
  });

  test('should handle concurrent edits to same registration gracefully', async ({ browser }) => {
    // Create a task and registration
    const uniqueTask = generateUniqueTask(testTasks.openTask);
    const task = await createTestTask(uniqueTask);

    const userData = generateUniqueTestData('Edit Race User');

    // Create a registration via API to get token
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    await page1.goto(`/aanmelden/${task.id}`);
    await page1.fill('input[name="naam"]', userData.naam);
    await page1.fill('input[name="email"]', userData.email);
    await page1.fill('input[name="telefoon"]', userData.telefoon);
    await page1.click('button[type="submit"]');

    await page1.waitForURL('/bevestiging', { timeout: 10000 });

    // Get the token from database
    const { getRegistrationByEmailAndTask } = await import('./helpers/db-helpers');
    const registration = await getRegistrationByEmailAndTask(userData.email, task.id);
    await context1.close();

    expect(registration).toBeTruthy();
    const token = registration!.token;

    // Now try to edit from two different "browsers" simultaneously
    const editPromises = [];

    for (let i = 0; i < 2; i++) {
      const promise = (async () => {
        const context = await browser.newContext();
        const page = await context.newPage();

        try {
          await page.goto(`/wijzig/${token}`);

          const newName = `Updated Name ${i} ${Date.now()}`;
          await page.fill('input[name="naam"]', newName);

          // Add small delay
          await page.waitForTimeout(Math.random() * 100);

          const saveButton = page.locator('button[type="submit"]:has-text("Opslaan"), button:has-text("Bijwerken")').first();
          await saveButton.click();

          // Wait for success
          await page.waitForSelector('text=/opgeslagen|bijgewerkt|success/i', { timeout: 5000 });

          await context.close();
          return { success: true, name: newName, index: i };
        } catch (error) {
          await context.close();
          return { success: false, index: i, error: error.message };
        }
      })();

      editPromises.push(promise);
    }

    // Wait for both edits
    const editResults = await Promise.all(editPromises);

    console.log('Edit results:', editResults);

    // At least one should succeed
    const successfulEdits = editResults.filter(r => r.success);
    expect(successfulEdits.length).toBeGreaterThan(0);

    // Verify final state in database
    const finalRegistration = await getRegistrationByEmailAndTask(userData.email, task.id);
    expect(finalRegistration).toBeTruthy();

    // The name should be one of the updated names
    const updatedNames = successfulEdits.map(r => r.name);
    expect(updatedNames).toContain(finalRegistration!.naam);
  });

  test('should handle rapid registration and cancellation', async ({ browser }) => {
    // Create a task
    const uniqueTask = generateUniqueTask(testTasks.openTask);
    const task = await createTestTask(uniqueTask);

    const userData = generateUniqueTestData('Rapid User');

    // Register
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`/aanmelden/${task.id}`);
    await page.fill('input[name="naam"]', userData.naam);
    await page.fill('input[name="email"]', userData.email);
    await page.fill('input[name="telefoon"]', userData.telefoon);
    await page.click('button[type="submit"]');

    await page.waitForURL('/bevestiging', { timeout: 10000 });

    // Get registration
    const { getRegistrationByEmailAndTask } = await import('./helpers/db-helpers');
    let registration = await getRegistrationByEmailAndTask(userData.email, task.id);
    expect(registration).toBeTruthy();

    const initialCount = await getRegistrationCount(task.id);
    expect(initialCount).toBe(1);

    // Immediately cancel
    const token = registration!.token;
    await page.goto(`/wijzig/${token}`);

    const cancelButton = page.locator('button:has-text("Annuleren"), button:has-text("Verwijderen")').first();

    // Accept confirmation dialog
    page.on('dialog', dialog => dialog.accept());

    await cancelButton.click();

    // Wait for cancellation
    await page.waitForSelector('text=/geannuleerd|verwijderd|cancelled/i', { timeout: 5000 });

    // Verify deletion
    registration = await getRegistrationByEmailAndTask(userData.email, task.id);
    expect(registration).toBeNull();

    const finalCount = await getRegistrationCount(task.id);
    expect(finalCount).toBe(0);

    await context.close();
  });
});
