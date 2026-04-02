import { test, expect } from '@playwright/test';
import { mockSupabase } from '../setup.ts';
import { setupRoutes } from '../mocks/routes.ts';

test.beforeEach(async ({ page }) => {
  await mockSupabase(page);
  await setupRoutes(page);
});

test('default theme is dark', async ({ page }) => {
  await page.goto('/profile');
  await page.waitForLoadState('networkidle');
  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(theme).toBe('dark');
});

test('toggling Light Mode changes data-theme to light', async ({ page }) => {
  await page.goto('/profile');
  await expect(page.getByText('Light Mode')).toBeVisible({ timeout: 10000 });

  // The checkbox is inside the label that contains "Light Mode"
  const checkbox = page.locator('label').filter({ hasText: 'Light Mode' }).locator('input[type="checkbox"]');
  await expect(checkbox).not.toBeChecked();

  await checkbox.check();

  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  expect(theme).toBe('light');
});

test('toggling Light Mode back restores dark theme', async ({ page }) => {
  await page.goto('/profile');
  await expect(page.getByText('Light Mode')).toBeVisible({ timeout: 10000 });

  const checkbox = page.locator('label').filter({ hasText: 'Light Mode' }).locator('input[type="checkbox"]');

  // Enable light mode
  await checkbox.check();
  expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe('light');

  // Disable light mode
  await checkbox.uncheck();
  expect(await page.evaluate(() => document.documentElement.getAttribute('data-theme'))).toBe('dark');
});

test('theme-color meta tag updates with theme change', async ({ page }) => {
  await page.goto('/profile');
  await expect(page.getByText('Light Mode')).toBeVisible({ timeout: 10000 });

  const checkbox = page.locator('label').filter({ hasText: 'Light Mode' }).locator('input[type="checkbox"]');
  await checkbox.check();

  const themeColor = await page.evaluate(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    return meta?.getAttribute('content') ?? null;
  });
  expect(themeColor).toBe('#F5F5F5');
});
