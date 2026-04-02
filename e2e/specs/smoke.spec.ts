import { test, expect } from '@playwright/test';
import { mockSupabase } from '../setup.ts';
import { setupRoutes } from '../mocks/routes.ts';

test('app loads and shows start screen', async ({ page }) => {
  await mockSupabase(page);
  await setupRoutes(page);
  await page.goto('/');
  await expect(page.locator('text=Bereit?')).toBeVisible({ timeout: 10000 });
});
