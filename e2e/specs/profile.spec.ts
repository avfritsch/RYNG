import { test, expect } from '@playwright/test';
import { mockSupabase } from '../setup.ts';
import { setupRoutes } from '../mocks/routes.ts';

test.beforeEach(async ({ page }) => {
  await mockSupabase(page);
  await setupRoutes(page);
});

test('profile screen shows user email', async ({ page }) => {
  await page.goto('/profile');
  await expect(page.getByText('test@ryng.app')).toBeVisible({ timeout: 10000 });
});

test('theme toggle exists', async ({ page }) => {
  await page.goto('/profile');
  await expect(page.getByText('Light Mode')).toBeVisible({ timeout: 10000 });
});

test('weekly goal stepper exists', async ({ page }) => {
  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Wochenziel' })).toBeVisible({ timeout: 10000 });
  // Verify stepper controls (Trainings pro Woche label and +/- buttons)
  await expect(page.getByText('Trainings pro Woche')).toBeVisible();
  await expect(page.locator('.weekly-goal-stepper__btn').first()).toBeVisible();
  await expect(page.locator('.weekly-goal-stepper__btn').last()).toBeVisible();
});

test('badges section shows achievements', async ({ page }) => {
  await page.goto('/profile');
  await expect(page.getByText('Erfolge')).toBeVisible({ timeout: 10000 });
});

test('export button exists', async ({ page }) => {
  await page.goto('/profile');
  await expect(page.getByRole('button', { name: 'JSON Export' })).toBeVisible({ timeout: 10000 });
});

test('sign out button exists', async ({ page }) => {
  await page.goto('/profile');
  await expect(page.getByRole('button', { name: 'Abmelden' })).toBeVisible({ timeout: 10000 });
});
