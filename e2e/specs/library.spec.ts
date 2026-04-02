import { test, expect } from '@playwright/test';
import { mockSupabase } from '../setup.ts';
import { setupRoutes } from '../mocks/routes.ts';

test.beforeEach(async ({ page }) => {
  await mockSupabase(page);
  await setupRoutes(page);
});

test('library shows exercises tab by default', async ({ page }) => {
  await page.goto('/library');

  // Title visible
  await expect(page.getByText('Bibliothek')).toBeVisible({ timeout: 10000 });

  // Exercises tab should be active
  const exercisesTab = page.locator('.library-tab--active');
  await expect(exercisesTab).toHaveText('Übungen');

  // Exercise names from test data should be visible
  await expect(page.getByText('Liegestütze').first()).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Kniebeugen').first()).toBeVisible();
  await expect(page.getByText('Jumping Jacks').first()).toBeVisible();
});

test('search filters exercises', async ({ page }) => {
  await page.goto('/library');
  await expect(page.getByText('Bibliothek')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Liegestütze').first()).toBeVisible({ timeout: 10000 });

  // Type in search
  const searchInput = page.getByLabel('Suchen');
  await searchInput.fill('Kniebeugen');

  // Search result count should reflect the query
  await expect(page.getByText(/Übungen für «Kniebeugen»/)).toBeVisible({ timeout: 5000 });

  // Kniebeugen should still be visible
  await expect(page.getByText('Kniebeugen').first()).toBeVisible();
});

test('switching to Trainings tab shows plans', async ({ page }) => {
  await page.goto('/library');
  await expect(page.getByText('Bibliothek')).toBeVisible({ timeout: 10000 });

  // Click Trainings tab
  await page.locator('.library-tab', { hasText: 'Trainings' }).click();

  // The active tab should now be Trainings
  const activeTab = page.locator('.library-tab--active');
  await expect(activeTab).toHaveText('Trainings');

  // Public plans should appear (testPlans has is_public: true for Ganzkörper)
  await expect(page.getByText('Ganzkörper').first()).toBeVisible({ timeout: 10000 });
});

test('clicking exercise expands details', async ({ page }) => {
  await page.goto('/library');
  await expect(page.getByText('Bibliothek')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Liegestütze').first()).toBeVisible({ timeout: 10000 });

  // Click on the exercise row
  await page.locator('.library-row', { hasText: 'Liegestütze' }).click();

  // Expanded area should show howto text and action buttons
  const expanded = page.locator('.library-row--selected .library-row-expanded');
  await expect(expanded).toBeVisible({ timeout: 5000 });

  // Howto text
  await expect(expanded.getByText('Push up')).toBeVisible();

  // Action buttons
  await expect(expanded.getByText('Quick-Start')).toBeVisible();
  await expect(expanded.getByText('Bearbeiten')).toBeVisible();
});

test('quick-start button starts timer', async ({ page }) => {
  await page.goto('/library');
  await expect(page.getByText('Bibliothek')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Liegestütze').first()).toBeVisible({ timeout: 10000 });

  // Expand exercise
  await page.locator('.library-row', { hasText: 'Liegestütze' }).click();
  const expanded = page.locator('.library-row--selected .library-row-expanded');
  await expect(expanded).toBeVisible({ timeout: 5000 });

  // Click Quick-Start
  await expanded.getByText('Quick-Start').click();

  // Timer overlay should appear
  await expect(page.locator('.timer-screen')).toBeVisible({ timeout: 10000 });
});
