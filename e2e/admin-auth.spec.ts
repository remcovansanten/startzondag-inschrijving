/**
 * E2E tests for admin authentication
 * Tests login, logout, protected routes, and session management
 */

import { test, expect } from '@playwright/test';
import {
  cleanupTestData,
  createTestAdmin,
  adminExists
} from './helpers/db-helpers';
import {
  loginAsAdmin,
  isLoggedIn,
  clearSession,
  getAuthToken,
  setAuthToken
} from './helpers/auth-helpers';
import { testAdmin, invalidAdmin } from './fixtures/test-data';

test.describe('Admin Authentication', () => {
  test.beforeAll(async () => {
    // Ensure test admin user exists
    const exists = await adminExists(testAdmin.username);
    if (!exists) {
      await createTestAdmin(testAdmin.username, testAdmin.password);
    }
  });

  test.beforeEach(async ({ page }) => {
    // Clear any existing session before each test
    await clearSession(page);
  });

  test.afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/admin/login');

    // Verify we're on the login page
    await expect(page).toHaveURL('/admin/login');
    await expect(page.locator('h1')).toContainText(/login|inloggen/i);

    // Fill in login form
    await page.fill('input[name="username"]', testAdmin.username);
    await page.fill('input[name="password"]', testAdmin.password);

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/admin/dashboard', { timeout: 10000 });

    // Verify auth cookie was set
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);

    // Verify dashboard content is visible
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should show error with invalid username', async ({ page }) => {
    // Navigate to login page
    await page.goto('/admin/login');

    // Try to login with invalid username
    await page.fill('input[name="username"]', invalidAdmin.username);
    await page.fill('input[name="password"]', testAdmin.password);

    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('[role="alert"], .error, text=/ongeldig|invalid|fout/i')).toBeVisible({ timeout: 5000 });

    // Should remain on login page
    await expect(page).toHaveURL('/admin/login');

    // Auth cookie should not be set
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(false);
  });

  test('should show error with invalid password', async ({ page }) => {
    // Navigate to login page
    await page.goto('/admin/login');

    // Try to login with invalid password
    await page.fill('input[name="username"]', testAdmin.username);
    await page.fill('input[name="password"]', invalidAdmin.password);

    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('[role="alert"], .error, text=/ongeldig|invalid|fout/i')).toBeVisible({ timeout: 5000 });

    // Should remain on login page
    await expect(page).toHaveURL('/admin/login');

    // Auth cookie should not be set
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(false);
  });

  test('should redirect to login when accessing protected route without authentication', async ({ page }) => {
    // Try to access dashboard without being logged in
    await page.goto('/admin/dashboard');

    // Should redirect to login page
    await expect(page).toHaveURL('/admin/login', { timeout: 5000 });

    // Verify login form is visible
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('should maintain session across page navigation', async ({ page }) => {
    // Login first
    await loginAsAdmin(page, testAdmin.username, testAdmin.password);

    // Verify we're on dashboard
    await expect(page).toHaveURL('/admin/dashboard');

    // Navigate to home page
    await page.goto('/');
    await expect(page).toHaveURL('/');

    // Navigate back to dashboard - should still be authenticated
    await page.goto('/admin/dashboard');
    await expect(page).toHaveURL('/admin/dashboard');

    // Should not redirect to login
    const loggedIn = await isLoggedIn(page);
    expect(loggedIn).toBe(true);
  });

  test('should logout and clear session', async ({ page }) => {
    // Login first
    await loginAsAdmin(page, testAdmin.username, testAdmin.password);

    // Verify we're logged in
    await expect(page).toHaveURL('/admin/dashboard');
    const beforeLogout = await isLoggedIn(page);
    expect(beforeLogout).toBe(true);

    // Clear session (simulate logout)
    await clearSession(page);

    // Try to access dashboard
    await page.goto('/admin/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL('/admin/login', { timeout: 5000 });

    // Verify no auth cookie
    const afterLogout = await isLoggedIn(page);
    expect(afterLogout).toBe(false);
  });

  test('should show loading state during login', async ({ page }) => {
    await page.goto('/admin/login');

    // Fill in form
    await page.fill('input[name="username"]', testAdmin.username);
    await page.fill('input[name="password"]', testAdmin.password);

    // Click submit and check for loading state
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Button should be disabled during submission
    await expect(submitButton).toBeDisabled();

    // Should show loading text
    await expect(submitButton).toContainText(/bezig|loading|inloggen/i);
  });

  test('should validate required fields on login form', async ({ page }) => {
    await page.goto('/admin/login');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should not redirect due to browser validation
    await expect(page).toHaveURL('/admin/login');

    // Verify fields have required attribute
    await expect(page.locator('input[name="username"]')).toHaveAttribute('required', '');
    await expect(page.locator('input[name="password"]')).toHaveAttribute('required', '');
  });

  test('should protect task management routes', async ({ page }) => {
    // Try to access task creation page without auth
    await page.goto('/admin/dashboard/taken/nieuw');

    // Should redirect to login
    await expect(page).toHaveURL('/admin/login', { timeout: 5000 });
  });

  test('should protect export route', async ({ page }) => {
    // Try to access export page without auth
    await page.goto('/admin/dashboard/export');

    // Should redirect to login
    await expect(page).toHaveURL('/admin/login', { timeout: 5000 });
  });

  test('should allow access to public routes without authentication', async ({ page }) => {
    // Home page should be accessible
    await page.goto('/');
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1, h2').first()).toBeVisible();

    // Login page should be accessible
    await page.goto('/admin/login');
    await expect(page).toHaveURL('/admin/login');
    await expect(page.locator('input[name="username"]')).toBeVisible();
  });
});
