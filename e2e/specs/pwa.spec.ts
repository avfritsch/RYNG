import { test, expect } from '@playwright/test';
import { mockSupabase } from '../setup.ts';
import { setupRoutes } from '../mocks/routes.ts';

test.beforeEach(async ({ page }) => {
  await mockSupabase(page);
  await setupRoutes(page);
});

test('app works after initial load', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.start-suggestions', { timeout: 10000 });
  await expect(page.getByText('Bereit?')).toBeVisible();
});

test('meta tags for PWA are present', async ({ page }) => {
  await page.goto('/');
  const hasMobileWebApp = await page.evaluate(() => {
    return !!document.querySelector('meta[name="apple-mobile-web-app-capable"]');
  });
  expect(hasMobileWebApp).toBe(true);
});

test('theme-color meta tag is present', async ({ page }) => {
  await page.goto('/');
  const themeColor = await page.evaluate(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    return meta?.getAttribute('content') ?? null;
  });
  expect(themeColor).toBe('#0A0A0A');
});

test('viewport meta tag has viewport-fit=cover', async ({ page }) => {
  await page.goto('/');
  const viewportContent = await page.evaluate(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    return meta?.getAttribute('content') ?? '';
  });
  expect(viewportContent).toContain('viewport-fit=cover');
});

test('apple-mobile-web-app-status-bar-style is set', async ({ page }) => {
  await page.goto('/');
  const barStyle = await page.evaluate(() => {
    const meta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    return meta?.getAttribute('content') ?? null;
  });
  expect(barStyle).toBe('black-translucent');
});

test('install banner is hidden when visits are high', async ({ page }) => {
  // mockSupabase sets ryng_visits to 10 but canInstall is false (no beforeinstallprompt),
  // so the install banner should not be visible
  await page.goto('/');
  await page.waitForSelector('.start-suggestions', { timeout: 10000 });
  await expect(page.locator('.install-banner')).not.toBeVisible();
});
