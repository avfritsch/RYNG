import { test, expect, type Page } from '@playwright/test';
import { mockSupabase } from '../setup.ts';
import { setupRoutes } from '../mocks/routes.ts';

test.beforeEach(async ({ page }) => {
  await mockSupabase(page);
  await setupRoutes(page);
});

/** Wait for fonts, images, and CSS transitions to settle. */
async function waitForStable(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(300);
}

test('start screen - circuit mode', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.start-suggestions', { timeout: 10000 });
  await waitForStable(page);
  await expect(page).toHaveScreenshot('start-circuit.png');
});

test('start screen - gym mode', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Gym/ }).click();
  await page.waitForSelector('.start-gym', { timeout: 10000 });
  await waitForStable(page);
  await expect(page).toHaveScreenshot('start-gym.png');
});

test('library - exercises tab', async ({ page }) => {
  await page.goto('/library');
  await page.waitForSelector('.library-screen', { timeout: 10000 });
  await waitForStable(page);
  await expect(page).toHaveScreenshot('library-exercises.png');
});

test('plans list', async ({ page }) => {
  await page.goto('/plans');
  await page.waitForSelector('.plan-list', { timeout: 10000 });
  await waitForStable(page);
  await expect(page).toHaveScreenshot('plans-list.png');
});

test('history screen', async ({ page }) => {
  await page.goto('/history');
  await page.getByRole('heading', { name: 'Verlauf' }).waitFor({ timeout: 10000 });
  await waitForStable(page);
  await expect(page).toHaveScreenshot('history.png', {
    mask: [page.locator('.training-calendar')],
  });
});

test('profile screen', async ({ page }) => {
  await page.goto('/profile');
  await page.getByText('Profil').first().waitFor({ timeout: 10000 });
  await waitForStable(page);
  await expect(page).toHaveScreenshot('profile.png');
});
