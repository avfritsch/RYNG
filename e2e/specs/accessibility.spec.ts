import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockSupabase } from '../setup.ts';
import { setupRoutes } from '../mocks/routes.ts';

test.beforeEach(async ({ page }) => {
  await mockSupabase(page);
  await setupRoutes(page);
});

// Helper to run axe and assert no violations
async function checkA11y(page, name: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']) // WCAG 2.1 AA
    .disableRules(['color-contrast']) // Disable initially — dark theme causes false positives
    .analyze();

  // Log violations for debugging
  if (results.violations.length > 0) {
    console.log(`\nA11y violations on ${name}:`);
    for (const v of results.violations) {
      console.log(`  [${v.impact}] ${v.id}: ${v.description}`);
      for (const node of v.nodes.slice(0, 3)) {
        console.log(`    -> ${node.html.slice(0, 100)}`);
      }
    }
  }

  expect(results.violations, `A11y violations on ${name}`).toEqual([]);
}

test('start screen is accessible', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.start-suggestions', { timeout: 10000 });
  await checkA11y(page, 'Start Screen');
});

test('library screen is accessible', async ({ page }) => {
  await page.goto('/library');
  await page.waitForSelector('.library-screen', { timeout: 10000 });
  await checkA11y(page, 'Library Screen');
});

test('plans screen is accessible', async ({ page }) => {
  await page.goto('/plans');
  await page.waitForLoadState('networkidle');
  await checkA11y(page, 'Plans Screen');
});

test('history screen is accessible', async ({ page }) => {
  await page.goto('/history');
  await page.getByRole('heading', { name: 'Verlauf' }).waitFor({ timeout: 10000 });
  await checkA11y(page, 'History Screen');
});

test('profile screen is accessible', async ({ page }) => {
  await page.goto('/profile');
  await page.waitForLoadState('networkidle');
  await checkA11y(page, 'Profile Screen');
});
