import { test, expect } from '@playwright/test';
import { mockSupabase } from '../setup.ts';
import { setupRoutes } from '../mocks/routes.ts';

test.beforeEach(async ({ page }) => {
  await mockSupabase(page);
  await setupRoutes(page);
});

test('history screen shows session list', async ({ page }) => {
  await page.goto('/history');
  // Verify the history title
  await expect(page.getByText('Verlauf')).toBeVisible({ timeout: 10000 });
  // Verify session card is visible (shows duration "Dauer")
  await expect(page.getByText('Dauer').first()).toBeVisible();
});

test('history shows stats panel', async ({ page }) => {
  await page.goto('/history');
  await expect(page.getByText('Verlauf')).toBeVisible({ timeout: 10000 });
  // StatsPanel and TrainingCalendar are rendered
  await expect(page.locator('.stats-panel')).toBeVisible();
});

test('clicking session navigates to detail', async ({ page }) => {
  await page.goto('/history');
  await expect(page.locator('.session-card').first()).toBeVisible({ timeout: 10000 });
  await page.locator('.session-card').first().click();
  // Verify detail screen with back button
  await expect(page.getByText('Zurück')).toBeVisible({ timeout: 10000 });
});

test('session detail shows exercise entries', async ({ page }) => {
  await page.goto('/history/session-1');
  // Verify stats section with Runden and Übungen
  await expect(page.getByText('Runden')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Übungen')).toBeVisible();
});

test('WIEDERHOLEN button exists', async ({ page }) => {
  await page.goto('/history/session-1');
  await expect(page.getByRole('button', { name: 'WIEDERHOLEN' })).toBeVisible({ timeout: 10000 });
});
