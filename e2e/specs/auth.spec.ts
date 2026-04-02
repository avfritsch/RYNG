import { test, expect } from '@playwright/test';
import { setupRoutes } from '../mocks/routes.ts';

const SUPABASE_URL = 'https://zplkfmuulfhftjmgmddi.supabase.co';

test.describe('Auth screen', () => {
  test.beforeEach(async ({ page }) => {
    // Set up general API mocking but do NOT call mockSupabase —
    // the user should remain unauthenticated so AuthScreen is rendered.
    await setupRoutes(page);
    await page.goto('/');
  });

  test('shows login form by default', async ({ page }) => {
    await expect(page.locator('input[placeholder="E-Mail-Adresse"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[placeholder="Passwort"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]', { hasText: 'Anmelden' })).toBeVisible();
  });

  test('can switch to signup mode', async ({ page }) => {
    await expect(page.locator('input[placeholder="E-Mail-Adresse"]')).toBeVisible({ timeout: 10000 });
    await page.click('text=Registrieren');
    await expect(page.locator('input[placeholder="Passwort (min. 6 Zeichen)"]')).toBeVisible();
  });

  test('can switch to password reset mode', async ({ page }) => {
    await expect(page.locator('input[placeholder="E-Mail-Adresse"]')).toBeVisible({ timeout: 10000 });
    await page.click('text=Passwort vergessen?');
    // Only email input should be visible, password should be hidden
    await expect(page.locator('input[placeholder="E-Mail-Adresse"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).not.toBeVisible();
    await expect(page.locator('button[type="submit"]', { hasText: 'Link senden' })).toBeVisible();
  });

  test('can switch back to login from reset', async ({ page }) => {
    await expect(page.locator('input[placeholder="E-Mail-Adresse"]')).toBeVisible({ timeout: 10000 });
    await page.click('text=Passwort vergessen?');
    await expect(page.locator('button[type="submit"]', { hasText: 'Link senden' })).toBeVisible();
    await page.click('text=Zurück zur Anmeldung');
    await expect(page.locator('input[placeholder="Passwort"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]', { hasText: 'Anmelden' })).toBeVisible();
  });

  test('login button is disabled without email', async ({ page }) => {
    await expect(page.locator('input[placeholder="E-Mail-Adresse"]')).toBeVisible({ timeout: 10000 });
    // Email is empty by default, button should be disabled
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();
  });

  test('shows error on invalid login', async ({ page }) => {
    // Intercept the Supabase auth token endpoint to return an error
    await page.route(`${SUPABASE_URL}/auth/v1/token**`, (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'invalid_grant',
          error_description: 'Invalid login credentials',
        }),
      });
    });

    await expect(page.locator('input[placeholder="E-Mail-Adresse"]')).toBeVisible({ timeout: 10000 });
    await page.fill('input[placeholder="E-Mail-Adresse"]', 'wrong@example.com');
    await page.fill('input[placeholder="Passwort"]', 'wrongpass');
    await page.click('button[type="submit"]');

    // Verify error message is shown
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 });
  });
});
