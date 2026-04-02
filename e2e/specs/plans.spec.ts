import { test, expect } from '@playwright/test';
import { mockSupabase } from '../setup.ts';
import { setupRoutes } from '../mocks/routes.ts';

test.beforeEach(async ({ page }) => {
  await mockSupabase(page);
  await setupRoutes(page);
});

test('plans screen shows custom plans', async ({ page }) => {
  await page.goto('/plans');
  await expect(page.getByText('Mein Plan')).toBeVisible({ timeout: 10000 });
});

test('clicking plan navigates to detail', async ({ page }) => {
  await page.goto('/plans');
  await page.getByText('Mein Plan').click({ timeout: 10000 });
  await expect(page.getByText('Mein Plan')).toBeVisible();
  await expect(page.getByText('Zurück')).toBeVisible();
});

test('plan detail shows days and exercises', async ({ page }) => {
  await page.goto('/plans/plan-2');
  await expect(page.getByText('Tag A')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Tag B')).toBeVisible();
  await expect(page.getByText('Liegestütze')).toBeVisible();
});

test('WORKOUT LADEN button visible', async ({ page }) => {
  await page.goto('/plans/plan-2');
  await expect(page.getByRole('button', { name: 'WORKOUT LADEN' })).toBeVisible({ timeout: 10000 });
});

test('Neues Training button navigates to config', async ({ page }) => {
  await page.goto('/plans');
  await page.getByRole('button', { name: '+ Neues Training' }).click({ timeout: 10000 });
  await expect(page).toHaveURL(/\/plans\/quick/);
});

test('Neuer Plan button navigates to editor', async ({ page }) => {
  await page.goto('/plans');
  await page.getByRole('button', { name: '+ Neuer Plan' }).click({ timeout: 10000 });
  await expect(page).toHaveURL(/\/plans\/new/);
});
