/**
 * E2E tests for registration flow
 * Tests user registration, form validation, and success scenarios
 */

import { test, expect } from '@playwright/test';
import {
  cleanupTestData,
  createTestTask,
  getRegistrationByEmailAndTask,
  getRegistrationCount,
  createTestRegistration
} from './helpers/db-helpers';
import {
  testTasks,
  testRegistration,
  generateUniqueTestData,
  generateUniqueTask
} from './fixtures/test-data';

test.describe('Registration Flow', () => {
  let testTaskId: string;

  test.beforeEach(async () => {
    // Clean up any existing test data
    await cleanupTestData();

    // Create a test task with unique name
    const uniqueTask = generateUniqueTask(testTasks.openTask);
    const task = await createTestTask(uniqueTask);
    testTaskId = task.id;
  });

  test.afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestData();
  });

  test('should complete full registration flow successfully', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');

    // Find and click on the test task card
    await page.click(`a[href="/aanmelden/${testTaskId}"]`);

    // Wait for registration form to load
    await expect(page).toHaveURL(`/aanmelden/${testTaskId}`);

    // Generate unique test data
    const uniqueData = generateUniqueTestData('Complete Flow User');

    // Fill in registration form
    await page.fill('input[name="naam"]', uniqueData.naam);
    await page.fill('input[name="email"]', uniqueData.email);
    await page.fill('input[name="telefoon"]', uniqueData.telefoon);
    await page.fill('textarea[name="opmerking"]', uniqueData.opmerking);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to confirmation page
    await expect(page).toHaveURL('/bevestiging', { timeout: 10000 });

    // Verify success message is displayed
    await expect(page.locator('text=bedankt')).toBeVisible();

    // Verify registration was created in database
    const registration = await getRegistrationByEmailAndTask(uniqueData.email, testTaskId);
    expect(registration).toBeTruthy();
    expect(registration?.naam).toBe(uniqueData.naam);
    expect(registration?.email).toBe(uniqueData.email);
    expect(registration?.telefoon).toBe(uniqueData.telefoon);
    expect(registration?.token).toBeTruthy();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Navigate to registration form
    await page.goto(`/aanmelden/${testTaskId}`);

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Check that browser validation prevents submission
    // The form should not redirect, we should still be on the same page
    await expect(page).toHaveURL(`/aanmelden/${testTaskId}`);

    // Verify required field validation
    const nameInput = page.locator('input[name="naam"]');
    const emailInput = page.locator('input[name="email"]');
    const phoneInput = page.locator('input[name="telefoon"]');

    // Check that fields have required attribute
    await expect(nameInput).toHaveAttribute('required', '');
    await expect(emailInput).toHaveAttribute('required', '');
    await expect(phoneInput).toHaveAttribute('required', '');
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    // Navigate to registration form
    await page.goto(`/aanmelden/${testTaskId}`);

    const uniqueData = generateUniqueTestData('Invalid Email User');

    // Fill form with invalid email
    await page.fill('input[name="naam"]', uniqueData.naam);
    await page.fill('input[name="email"]', 'invalid-email-format');
    await page.fill('input[name="telefoon"]', uniqueData.telefoon);

    // Try to submit
    await page.click('button[type="submit"]');

    // Browser should prevent submission due to email validation
    await expect(page).toHaveURL(`/aanmelden/${testTaskId}`);

    // Verify email input has type="email"
    await expect(page.locator('input[name="email"]')).toHaveAttribute('type', 'email');
  });

  test('should show validation error for invalid phone format', async ({ page }) => {
    // Navigate to registration form
    await page.goto(`/aanmelden/${testTaskId}`);

    const uniqueData = generateUniqueTestData('Invalid Phone User');

    // Fill form with invalid phone number
    await page.fill('input[name="naam"]', uniqueData.naam);
    await page.fill('input[name="email"]', uniqueData.email);
    await page.fill('input[name="telefoon"]', '123'); // Invalid phone

    // Try to submit
    await page.click('button[type="submit"]');

    // Browser should prevent submission due to pattern validation
    await expect(page).toHaveURL(`/aanmelden/${testTaskId}`);

    // Verify phone input has pattern attribute
    await expect(page.locator('input[name="telefoon"]')).toHaveAttribute('pattern');
  });

  test('should prevent duplicate registration for same email and task', async ({ page }) => {
    const uniqueData = generateUniqueTestData('Duplicate User');

    // Create first registration
    await createTestRegistration({
      taakId: testTaskId,
      naam: uniqueData.naam,
      email: uniqueData.email,
      telefoon: uniqueData.telefoon,
      opmerking: uniqueData.opmerking
    });

    // Try to register again with same email
    await page.goto(`/aanmelden/${testTaskId}`);

    await page.fill('input[name="naam"]', uniqueData.naam);
    await page.fill('input[name="email"]', uniqueData.email);
    await page.fill('input[name="telefoon"]', uniqueData.telefoon);

    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/al aangemeld|already registered/i')).toBeVisible();

    // Verify we're still on the registration page
    await expect(page).toHaveURL(`/aanmelden/${testTaskId}`);
  });

  test('should prevent registration when task is full', async ({ page }) => {
    // Clean up and create a task with capacity of 1
    await cleanupTestData();

    const uniqueTask = generateUniqueTask(testTasks.fullTask);
    const fullTask = await createTestTask(uniqueTask);

    // Fill the task to capacity
    const firstUser = generateUniqueTestData('First User');
    await createTestRegistration({
      taakId: fullTask.id,
      naam: firstUser.naam,
      email: firstUser.email,
      telefoon: firstUser.telefoon
    });

    // Verify task is full
    const count = await getRegistrationCount(fullTask.id);
    expect(count).toBe(1);

    // Try to register a second user
    await page.goto(`/aanmelden/${fullTask.id}`);

    const secondUser = generateUniqueTestData('Second User');
    await page.fill('input[name="naam"]', secondUser.naam);
    await page.fill('input[name="email"]', secondUser.email);
    await page.fill('input[name="telefoon"]', secondUser.telefoon);

    await page.click('button[type="submit"]');

    // Wait for error message about task being full
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=/vol|full/i')).toBeVisible();

    // Verify registration count didn't increase
    const finalCount = await getRegistrationCount(fullTask.id);
    expect(finalCount).toBe(1);
  });

  test('should display loading state during submission', async ({ page }) => {
    await page.goto(`/aanmelden/${testTaskId}`);

    const uniqueData = generateUniqueTestData('Loading State User');

    // Fill form
    await page.fill('input[name="naam"]', uniqueData.naam);
    await page.fill('input[name="email"]', uniqueData.email);
    await page.fill('input[name="telefoon"]', uniqueData.telefoon);

    // Click submit and immediately check for loading state
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Check that button is disabled during submission
    await expect(submitButton).toBeDisabled();

    // Check for loading text
    await expect(submitButton).toContainText(/bezig|loading/i);
  });

  test('should show success message after registration', async ({ page }) => {
    await page.goto(`/aanmelden/${testTaskId}`);

    const uniqueData = generateUniqueTestData('Success Message User');

    // Fill and submit form
    await page.fill('input[name="naam"]', uniqueData.naam);
    await page.fill('input[name="email"]', uniqueData.email);
    await page.fill('input[name="telefoon"]', uniqueData.telefoon);
    await page.click('button[type="submit"]');

    // Wait for confirmation page
    await expect(page).toHaveURL('/bevestiging', { timeout: 10000 });

    // Verify confirmation page content
    await expect(page.locator('h1, h2')).toContainText(/bevestiging|bedankt|succes/i);

    // Check that confirmation message mentions email
    await expect(page.locator('text=/email|e-mail/i')).toBeVisible();
  });
});
