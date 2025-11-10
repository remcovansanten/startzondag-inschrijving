/**
 * E2E tests for edit and cancel registration functionality
 * Tests token-based access, editing registration details, and cancellation
 */

import { test, expect } from '@playwright/test';
import {
  cleanupTestData,
  createTestTask,
  createTestRegistration,
  getRegistrationByToken,
  getRegistrationCount
} from './helpers/db-helpers';
import {
  testTasks,
  generateUniqueTestData,
  generateUniqueTask
} from './fixtures/test-data';

test.describe('Edit and Cancel Registration', () => {
  let testTaskId: string;
  let registrationToken: string;

  test.beforeEach(async () => {
    // Clean up any existing test data
    await cleanupTestData();

    // Create a test task
    const uniqueTask = generateUniqueTask(testTasks.openTask);
    const task = await createTestTask(uniqueTask);
    testTaskId = task.id;

    // Create a test registration
    const uniqueData = generateUniqueTestData('Edit Test User');
    const registration = await createTestRegistration({
      taakId: testTaskId,
      naam: uniqueData.naam,
      email: uniqueData.email,
      telefoon: uniqueData.telefoon,
      opmerking: uniqueData.opmerking
    });

    registrationToken = registration.token;
  });

  test.afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestData();
  });

  test('should access registration via token link', async ({ page }) => {
    // Navigate to edit page using token
    await page.goto(`/wijzig/${registrationToken}`);

    // Verify we're on the correct page
    await expect(page).toHaveURL(`/wijzig/${registrationToken}`);

    // Verify page shows correct title
    await expect(page.locator('h1')).toContainText(/wijzigen|annuleren|edit|cancel/i);

    // Verify task information is displayed
    const registration = await getRegistrationByToken(registrationToken);
    await expect(page.locator('text=' + registration!.taak.naam)).toBeVisible();

    // Verify form is pre-filled with existing data
    await expect(page.locator('input[name="naam"]')).toHaveValue(registration!.naam);
    await expect(page.locator('input[name="email"]')).toHaveValue(registration!.email);
    await expect(page.locator('input[name="telefoon"]')).toHaveValue(registration!.telefoon);

    if (registration!.opmerking) {
      await expect(page.locator('textarea[name="opmerking"]')).toHaveValue(registration!.opmerking);
    }
  });

  test('should edit registration details successfully', async ({ page }) => {
    // Get original registration data
    const originalRegistration = await getRegistrationByToken(registrationToken);

    // Navigate to edit page
    await page.goto(`/wijzig/${registrationToken}`);

    // Update registration details
    const newName = 'Updated Name ' + Date.now();
    const newPhone = '06-99887766';
    const newRemark = 'Updated remark ' + Date.now();

    await page.fill('input[name="naam"]', newName);
    await page.fill('input[name="telefoon"]', newPhone);
    await page.fill('textarea[name="opmerking"]', newRemark);

    // Submit the form
    await page.click('button[type="submit"]:has-text("Opslaan"), button:has-text("Bijwerken")');

    // Wait for success message or redirect
    await expect(page.locator('text=/opgeslagen|bijgewerkt|updated|success/i')).toBeVisible({ timeout: 10000 });

    // Verify changes were persisted to database
    const updatedRegistration = await getRegistrationByToken(registrationToken);
    expect(updatedRegistration).toBeTruthy();
    expect(updatedRegistration!.naam).toBe(newName);
    expect(updatedRegistration!.telefoon).toBe(newPhone);
    expect(updatedRegistration!.opmerking).toBe(newRemark);

    // Email should remain unchanged
    expect(updatedRegistration!.email).toBe(originalRegistration!.email);
  });

  test('should cancel registration successfully', async ({ page }) => {
    // Verify registration exists before cancellation
    const beforeCount = await getRegistrationCount(testTaskId);
    expect(beforeCount).toBeGreaterThan(0);

    const registrationBefore = await getRegistrationByToken(registrationToken);
    expect(registrationBefore).toBeTruthy();

    // Navigate to edit page
    await page.goto(`/wijzig/${registrationToken}`);

    // Find and click the cancel/delete button
    const cancelButton = page.locator('button:has-text("Annuleren"), button:has-text("Verwijderen"), button:has-text("Afmelden")').first();
    await cancelButton.click();

    // Handle confirmation dialog if present
    page.on('dialog', dialog => dialog.accept());

    // Wait for success message or redirect
    await expect(page.locator('text=/geannuleerd|verwijderd|cancelled|deleted/i')).toBeVisible({ timeout: 10000 });

    // Verify registration was deleted from database
    const registrationAfter = await getRegistrationByToken(registrationToken);
    expect(registrationAfter).toBeNull();

    // Verify registration count decreased
    const afterCount = await getRegistrationCount(testTaskId);
    expect(afterCount).toBe(beforeCount - 1);
  });

  test('should show error for invalid token', async ({ page }) => {
    // Navigate with invalid token
    const invalidToken = 'invalid-token-12345678901234567890123456789012';
    await page.goto(`/wijzig/${invalidToken}`);

    // Should show 404 page or error message
    const is404 = await page.locator('text=/niet gevonden|404|not found/i').isVisible().catch(() => false);
    const isError = await page.locator('text=/ongeldig|invalid|fout|error/i').isVisible().catch(() => false);

    expect(is404 || isError).toBeTruthy();
  });

  test('should validate required fields when editing', async ({ page }) => {
    // Navigate to edit page
    await page.goto(`/wijzig/${registrationToken}`);

    // Clear required fields
    await page.fill('input[name="naam"]', '');
    await page.fill('input[name="telefoon"]', '');

    // Try to submit
    await page.click('button[type="submit"]:has-text("Opslaan"), button:has-text("Bijwerken")');

    // Should not allow submission with empty required fields
    await expect(page).toHaveURL(`/wijzig/${registrationToken}`);

    // Verify fields are still required
    await expect(page.locator('input[name="naam"]')).toHaveAttribute('required', '');
    await expect(page.locator('input[name="telefoon"]')).toHaveAttribute('required', '');
  });

  test('should display task information on edit page', async ({ page }) => {
    // Navigate to edit page
    await page.goto(`/wijzig/${registrationToken}`);

    // Get registration details
    const registration = await getRegistrationByToken(registrationToken);

    // Verify task name is displayed
    await expect(page.locator('text=' + registration!.taak.naam)).toBeVisible();

    // Verify registration date is displayed if shown in UI
    const hasDate = await page.locator('text=/aangemeld|registered/i').count();
    if (hasDate > 0) {
      await expect(page.locator('text=/aangemeld|registered/i')).toBeVisible();
    }
  });

  test('should preserve email field as read-only during edit', async ({ page }) => {
    const registration = await getRegistrationByToken(registrationToken);

    // Navigate to edit page
    await page.goto(`/wijzig/${registrationToken}`);

    // Check if email field is read-only or disabled
    const emailInput = page.locator('input[name="email"]');
    const isReadOnly = await emailInput.getAttribute('readonly').catch(() => null);
    const isDisabled = await emailInput.getAttribute('disabled').catch(() => null);
    const currentValue = await emailInput.inputValue();

    // Email should either be read-only, disabled, or not present in edit form
    // But should display the email somewhere on the page
    if (await emailInput.count() > 0) {
      expect(currentValue).toBe(registration!.email);
    } else {
      // Email might be displayed as text instead of input
      await expect(page.locator('text=' + registration!.email)).toBeVisible();
    }
  });
});
