import { test, expect } from '@playwright/test';
import { mockSupabase } from '../setup.ts';
import { setupRoutes } from '../mocks/routes.ts';

test.beforeEach(async ({ page }) => {
  await mockSupabase(page);
  await setupRoutes(page);
});

test('bottom nav has 5 tabs', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation');
  await expect(nav.getByRole('link')).toHaveCount(5);
});

test('clicking Pläne tab navigates to /plans', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Pläne' }).click();
  await expect(page).toHaveURL(/\/plans/);
});

test('clicking Bibliothek tab navigates to /library', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Bibliothek' }).click();
  await expect(page).toHaveURL(/\/library/);
});

test('clicking Verlauf tab navigates to /history', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Verlauf' }).click();
  await expect(page).toHaveURL(/\/history/);
});

test('clicking Profil tab navigates to /profile', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Profil' }).click();
  await expect(page).toHaveURL(/\/profile/);
});

test('clicking Start tab returns home', async ({ page }) => {
  await page.goto('/plans');
  await page.getByRole('link', { name: 'Start' }).click();
  await expect(page).toHaveURL('/');
});

test('direct URL /history loads history screen', async ({ page }) => {
  await page.goto('/history');
  await expect(page.getByRole('heading', { name: 'Verlauf' })).toBeVisible({ timeout: 10000 });
});

test('invalid route still shows bottom nav', async ({ page }) => {
  await page.goto('/nonexistent');
  const nav = page.getByRole('navigation');
  await expect(nav).toBeVisible({ timeout: 10000 });
  // Clicking Start from an unknown route brings the user home
  await page.getByRole('link', { name: 'Start' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByText('Bereit?')).toBeVisible({ timeout: 10000 });
});
