/**
 * Authentication helper functions for E2E tests
 * Provides utilities for admin login and session management
 */

import { Page } from '@playwright/test';
import { createTestAdmin, adminExists } from './db-helpers';

/**
 * Login as admin user via the UI
 */
export async function loginAsAdmin(page: Page, username: string, password: string) {
  // Navigate to admin login page
  await page.goto('/admin/login');

  // Fill in login form
  await page.fill('input[name="username"]', username);
  await page.fill('input[name="password"]', password);

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard
  await page.waitForURL('/admin/dashboard', { timeout: 10000 });
}

/**
 * Setup admin user for testing
 * Creates admin if it doesn't exist, returns credentials
 */
export async function setupAdminUser(username: string, password: string) {
  try {
    const exists = await adminExists(username);

    if (!exists) {
      await createTestAdmin(username, password);
    }

    return { username, password };
  } catch (error) {
    console.error('Error setting up admin user:', error);
    throw error;
  }
}

/**
 * Login as admin and return page with authenticated session
 */
export async function getAuthenticatedPage(page: Page, username: string, password: string) {
  await loginAsAdmin(page, username, password);
  return page;
}

/**
 * Check if user is logged in by checking for auth cookie
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies();
  return cookies.some(cookie => cookie.name === 'auth-token');
}

/**
 * Logout from admin panel
 */
export async function logout(page: Page) {
  // Navigate to dashboard
  await page.goto('/admin/dashboard');

  // Find and click logout button/link
  // Adjust selector based on actual implementation
  const logoutButton = page.locator('button:has-text("Uitloggen"), a:has-text("Uitloggen")').first();

  if (await logoutButton.count() > 0) {
    await logoutButton.click();
  } else {
    // If no logout button, clear cookies manually
    await page.context().clearCookies();
    await page.goto('/admin/login');
  }
}

/**
 * Clear all cookies to simulate logout
 */
export async function clearSession(page: Page) {
  await page.context().clearCookies();
}

/**
 * Get auth token from cookies
 */
export async function getAuthToken(page: Page): Promise<string | null> {
  const cookies = await page.context().cookies();
  const authCookie = cookies.find(cookie => cookie.name === 'auth-token');
  return authCookie?.value || null;
}

/**
 * Set auth token cookie manually (for testing expired tokens, etc.)
 */
export async function setAuthToken(page: Page, token: string) {
  await page.context().addCookies([{
    name: 'auth-token',
    value: token,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    expires: Date.now() / 1000 + 3600 // 1 hour from now
  }]);
}

/**
 * Ensure admin is logged in, login if not
 */
export async function ensureLoggedIn(page: Page, username: string, password: string) {
  if (!(await isLoggedIn(page))) {
    await loginAsAdmin(page, username, password);
  }
}
