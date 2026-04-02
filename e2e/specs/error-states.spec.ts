import { test, expect } from '@playwright/test';
import { mockSupabase } from '../setup.ts';
import { setupRoutes } from '../mocks/routes.ts';

// ---------------------------------------------------------------------------
// Network Error Tests
// ---------------------------------------------------------------------------

test('shows error when plans fail to load', async ({ page }) => {
  await mockSupabase(page);
  await setupRoutes(page);

  // Override plans route to return 500 after normal setup
  await page.route('**/rest/v1/plans**', (route) => {
    route.fulfill({ status: 500, body: JSON.stringify({ message: 'Server error' }) });
  });

  await page.goto('/plans');
  await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('alert')).toContainText('Fehler');
});

test('shows error when sessions fail to load', async ({ page }) => {
  await mockSupabase(page);
  await setupRoutes(page);

  // Override sessions route to return 500
  await page.route('**/rest/v1/sessions**', (route) => {
    route.fulfill({ status: 500, body: JSON.stringify({ message: 'Server error' }) });
  });

  await page.goto('/history');
  await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('alert')).toContainText('Fehler');
});

// ---------------------------------------------------------------------------
// Empty State Tests
// ---------------------------------------------------------------------------

test('plans screen shows empty state when no custom plans', async ({ page }) => {
  await mockSupabase(page);
  await setupRoutes(page);

  // Override to return no plans
  await page.route('**/rest/v1/plans**', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    } else {
      route.continue();
    }
  });

  await page.goto('/plans');
  await expect(page.getByText('Noch keine eigenen Pläne erstellt.')).toBeVisible({ timeout: 10000 });
});

test('history screen shows empty state when no sessions', async ({ page }) => {
  await mockSupabase(page);
  await setupRoutes(page);

  // Override sessions to empty
  await page.route('**/rest/v1/sessions**', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
        headers: { 'content-range': '0-0/0' },
      });
    } else {
      route.continue();
    }
  });

  await page.goto('/history');
  await expect(page.getByText('Noch keine Sessions aufgezeichnet.')).toBeVisible({ timeout: 10000 });
});

test('library shows empty state when search has no results', async ({ page }) => {
  await mockSupabase(page);
  await setupRoutes(page);
  await page.goto('/library');
  await page.waitForSelector('.library-screen', { timeout: 10000 });

  // Override exercise_library to return empty for the search query
  await page.route('**/rest/v1/exercise_library**', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    } else {
      route.continue();
    }
  });

  // Search for something that doesn't exist
  await page.getByPlaceholder('Übung suchen...').fill('xyznonexistent');
  await expect(page.getByText('Keine Übungen gefunden')).toBeVisible({ timeout: 5000 });
});

// ---------------------------------------------------------------------------
// Auth Error Tests
// ---------------------------------------------------------------------------

test('shows auth screen when not authenticated', async ({ page }) => {
  // DON'T call mockSupabase — no auth session
  await setupRoutes(page);
  await page.goto('/');
  // Should show login form with email input
  await expect(page.getByPlaceholder('E-Mail-Adresse')).toBeVisible({ timeout: 10000 });
});

// ---------------------------------------------------------------------------
// Edge Case Tests
// ---------------------------------------------------------------------------

test('start screen handles empty sessions gracefully', async ({ page }) => {
  await mockSupabase(page);
  await setupRoutes(page);

  // Override sessions to be empty (new user scenario)
  await page.route('**/rest/v1/sessions**', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '[]',
        headers: { 'content-range': '0-0/0' },
      });
    } else {
      route.continue();
    }
  });

  await page.goto('/');
  // Should show start screen title, not crash
  await expect(page.getByText('Bereit?')).toBeVisible({ timeout: 10000 });
});
