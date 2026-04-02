import { test, expect } from '@playwright/test';
import { mockSupabase } from '../setup.ts';
import { setupRoutes } from '../mocks/routes.ts';

test.beforeEach(async ({ page }) => {
  await mockSupabase(page);
  await setupRoutes(page);
});

test('shows mode toggle with Zirkel and Gym buttons', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Bereit?')).toBeVisible({ timeout: 10000 });

  // Use the mode-toggle buttons with their full label text to avoid FeatureHint ambiguity
  const zirkelBtn = page.locator('.start-mode-btn', { hasText: 'Zirkel' });
  const gymBtn = page.locator('.start-mode-btn', { hasText: 'Gym' });
  await expect(zirkelBtn).toBeVisible();
  await expect(gymBtn).toBeVisible();

  // Subtitles
  await expect(page.getByText('Zeitbasiert mit Timer')).toBeVisible();
  await expect(page.getByText('Sätze & Gewichte')).toBeVisible();
});

test('circuit mode shows suggestion cards', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Bereit?')).toBeVisible({ timeout: 10000 });

  // In circuit mode (default), suggestion cards should render
  const cards = page.locator('.start-suggestions .start-card');
  await expect(cards.first()).toBeVisible({ timeout: 10000 });
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);
});

test('switching to gym mode shows plan selection', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Bereit?')).toBeVisible({ timeout: 10000 });

  await page.locator('.start-mode-btn', { hasText: 'Gym' }).click();

  // Gym mode description
  await expect(page.getByText('Wähle einen Plan')).toBeVisible({ timeout: 5000 });

  // Should show the non-system plan "Mein Plan" (wait for plans query to resolve)
  await expect(page.getByText('Mein Plan')).toBeVisible({ timeout: 10000 });
});

test('gym mode shows day selection after plan click', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Bereit?')).toBeVisible({ timeout: 10000 });

  await page.locator('.start-mode-btn', { hasText: 'Gym' }).click();
  await expect(page.getByText('Mein Plan')).toBeVisible({ timeout: 10000 });

  await page.getByText('Mein Plan').click();

  // Days should appear
  await expect(page.getByText('Tag A')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Oberkörper')).toBeVisible();

  await expect(page.getByText('Tag B')).toBeVisible();
  await expect(page.getByText('Unterkörper')).toBeVisible();
});

test('quick links to Pläne and Verlauf visible', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Bereit?')).toBeVisible({ timeout: 10000 });

  // Use the start-link class to scope within the quick links area
  await expect(page.locator('.start-link', { hasText: 'Alle Pläne' })).toBeVisible();
  await expect(page.locator('.start-link', { hasText: 'Verlauf' })).toBeVisible();
});

test('clicking Alle Pläne navigates to plans', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('text=Bereit?')).toBeVisible({ timeout: 10000 });

  await page.locator('.start-link', { hasText: 'Alle Pläne' }).click();

  await page.waitForURL('**/plans', { timeout: 5000 });
  expect(page.url()).toContain('/plans');
});
