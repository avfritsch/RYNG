import { test, expect } from '@playwright/test';
import { mockSupabase } from '../setup.ts';
import { setupRoutes } from '../mocks/routes.ts';

test.beforeEach(async ({ page }) => {
  await mockSupabase(page);
  await setupRoutes(page);
});

test('starting gym session shows gym overlay', async ({ page }) => {
  await page.goto('/');
  // Switch to Gym mode
  await page.getByRole('button', { name: 'Gym Sätze & Gewichte' }).click({ timeout: 10000 });
  // Select plan "Mein Plan"
  await page.getByText('Mein Plan').click();
  // Select day "Tag A"
  await page.getByText('Tag A').click();
  // Verify gym screen appears
  await expect(page.getByText('Gym Training')).toBeVisible({ timeout: 10000 });
});

test('gym screen shows exercise tabs', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Gym Sätze & Gewichte' }).click({ timeout: 10000 });
  await page.getByText('Mein Plan').click();
  await page.getByText('Tag A').click();
  await expect(page.getByText('Gym Training')).toBeVisible({ timeout: 10000 });
  // Verify exercise name tabs
  await expect(page.locator('.gym-tab').first()).toBeVisible();
  await expect(page.locator('.gym-tab', { hasText: 'Liegestütze' })).toBeVisible();
  await expect(page.locator('.gym-tab', { hasText: 'Kniebeugen' })).toBeVisible();
});

test('gym screen shows set rows with inputs', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Gym Sätze & Gewichte' }).click({ timeout: 10000 });
  await page.getByText('Mein Plan').click();
  await page.getByText('Tag A').click();
  await expect(page.getByText('Gym Training')).toBeVisible({ timeout: 10000 });
  // Verify set rows exist (Wdh. header = reps column)
  await expect(page.getByText('Wdh.')).toBeVisible();
  await expect(page.getByText('Satz', { exact: true })).toBeVisible();
  // Verify done buttons exist
  await expect(page.locator('.gym-set-done-btn').first()).toBeVisible();
});

test('marking set as done shows checkmark', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Gym Sätze & Gewichte' }).click({ timeout: 10000 });
  await page.getByText('Mein Plan').click();
  await page.getByText('Tag A').click();
  await expect(page.getByText('Gym Training')).toBeVisible({ timeout: 10000 });
  // Click first done button
  await page.locator('.gym-set-done-btn').first().click();
  // Verify it becomes checked
  await expect(page.locator('.gym-set-done-btn--checked').first()).toBeVisible();
});

test('close button shows confirm dialog', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Gym Sätze & Gewichte' }).click({ timeout: 10000 });
  await page.getByText('Mein Plan').click();
  await page.getByText('Tag A').click();
  await expect(page.getByText('Gym Training')).toBeVisible({ timeout: 10000 });
  // Click X / close button
  await page.locator('.gym-header-btn').click();
  // Verify confirm dialog
  await expect(page.getByText('Training abbrechen?')).toBeVisible();
});
