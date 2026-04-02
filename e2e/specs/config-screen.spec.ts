import { test, expect } from '@playwright/test';
import { mockSupabase } from '../setup.ts';
import { setupRoutes } from '../mocks/routes.ts';

test.describe('Config screen', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
    await setupRoutes(page);
    await page.goto('/plans/quick');
    // Wait for the config screen to render
    await expect(page.locator('text=Neues Training')).toBeVisible({ timeout: 10000 });
  });

  test('config screen shows rounds and pause controls', async ({ page }) => {
    // Verify Runden stepper (exact match to avoid hitting "Rundenpause")
    await expect(page.getByText('Runden', { exact: true })).toBeVisible();
    // Verify Rundenpause stepper
    await expect(page.getByText('Rundenpause')).toBeVisible();
  });

  test('can add a blank station', async ({ page }) => {
    // Click "+ Leere Übung" button
    await page.click('text=+ Leere Übung');
    // Verify a new station row appears with default name
    await expect(page.locator('input[aria-label="Station 1 Name"]')).toBeVisible();
  });

  test('can remove a station', async ({ page }) => {
    // Add a station first
    await page.click('text=+ Leere Übung');
    await expect(page.locator('input[aria-label="Station 1 Name"]')).toBeVisible();

    // Click the remove button (x-close icon with title "Entfernen")
    await page.click('button[title="Entfernen"]');

    // Station should be removed (or undo toast appears)
    // The station input should no longer be visible
    await expect(page.locator('input[aria-label="Station 1 Name"]')).not.toBeVisible();
  });

  test('estimated duration updates', async ({ page }) => {
    // Initially with no stations, duration should be 0:00
    await expect(page.locator('text=Geschätzte Dauer:')).toBeVisible();
    const durationBefore = await page.locator('.config-duration strong').textContent();

    // Add two stations (each with 45s work + 30s pause by default)
    await page.click('text=+ Leere Übung');
    await page.click('text=+ Leere Übung');

    // Duration should have changed
    const durationAfter = await page.locator('.config-duration strong').textContent();
    expect(durationAfter).not.toBe(durationBefore);
  });

  test('SPEICHERN & STARTEN button exists', async ({ page }) => {
    await expect(page.locator('text=SPEICHERN & STARTEN')).toBeVisible();
  });
});
