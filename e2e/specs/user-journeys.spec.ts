import { test, expect } from '@playwright/test';
import { mockSupabase } from '../setup.ts';
import { setupRoutes } from '../mocks/routes.ts';

test.describe('User journeys', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page);
    await setupRoutes(page);
  });

  test('complete circuit training flow: suggestion -> timer -> done -> history', async ({ page }) => {
    // Start from home, navigate via plan detail to start a circuit timer
    await page.goto('/');
    await expect(page.locator('text=Bereit?')).toBeVisible({ timeout: 10000 });

    // Navigate to plans, select "Mein Plan", load workout
    await page.click('text=Alle Pläne');
    await expect(page.locator('text=Meine Pläne')).toBeVisible({ timeout: 10000 });
    await page.click('text=Mein Plan');
    await expect(page.locator('text=WORKOUT LADEN')).toBeVisible({ timeout: 10000 });
    await page.click('text=WORKOUT LADEN');

    // Verify timer screen appears
    await expect(page.locator('.timer-screen')).toBeVisible({ timeout: 10000 });

    // Click stop to end training
    await page.click('button[aria-label="Stopp"]');
    // Confirm the stop in the confirm modal
    await page.locator('.confirm-btn--danger').click();

    // Verify done screen with stats
    await expect(page.locator('text=Training abgeschlossen!')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.done-stat-label', { hasText: 'Runden' })).toBeVisible();
    await expect(page.locator('.done-stat-label', { hasText: 'Dauer' })).toBeVisible();

    // Click VERLAUF button on the done screen (not the bottom nav link)
    await page.locator('.done-btn', { hasText: 'VERLAUF' }).click();

    // Verify history screen loads
    await expect(page.url()).toContain('/history');
  });

  test('library quick-start flow: browse -> expand -> quick-start -> timer', async ({ page }) => {
    // 1. Navigate to library
    await page.goto('/library');
    await expect(page.locator('text=Bibliothek')).toBeVisible({ timeout: 10000 });

    // 2. Click an exercise to expand it
    const firstExercise = page.locator('.library-row').first();
    await expect(firstExercise).toBeVisible({ timeout: 10000 });
    await firstExercise.click();

    // 3. Click Quick-Start
    await page.click('text=Quick-Start');

    // 4. Verify timer starts
    await expect(page.locator('.timer-screen')).toBeVisible({ timeout: 10000 });
  });

  test('gym flow: select plan -> select day -> log sets -> finish', async ({ page }) => {
    // 1. Toggle to gym mode
    await page.goto('/');
    await expect(page.locator('text=Bereit?')).toBeVisible({ timeout: 10000 });
    await page.click('text=Gym');

    // 2. Select plan (non-system plan: "Mein Plan")
    await expect(page.locator('text=Mein Plan')).toBeVisible({ timeout: 10000 });
    await page.click('text=Mein Plan');

    // 3. Select day (Tag A)
    await expect(page.locator('text=Tag A')).toBeVisible({ timeout: 10000 });
    await page.click('text=Tag A');

    // 4. Verify gym screen
    await expect(page.locator('.gym-session')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Gym Training')).toBeVisible();

    // 5. Enter reps in first set input
    const repsInput = page.locator('.gym-set-input[type="number"]').first();
    await expect(repsInput).toBeVisible();
    await repsInput.fill('10');

    // 6. Mark set as done
    const doneBtn = page.locator('button[aria-label="Satz abschließen"]').first();
    await doneBtn.click();

    // Skip the rest timer overlay that appears after marking a set done
    const skipBtn = page.locator('text=Überspringen');
    await skipBtn.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    if (await skipBtn.isVisible()) {
      await skipBtn.click();
    }
    // Wait for rest overlay to disappear
    await page.locator('.gym-rest').waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});

    // Verify the set is marked as done (checked icon)
    await expect(page.locator('.gym-set-row--done').first()).toBeVisible();

    // 7. Click Beenden — in the E2E environment, the session is very short (< 60s),
    // so the app considers it too short and resets to the start screen.
    // We verify the full flow: gym screen -> interaction -> Beenden -> back to start.
    await page.locator('.gym-header-finish').click();

    // 8. Verify we're back on the start screen (short session auto-resets)
    await expect(page.locator('text=Bereit?')).toBeVisible({ timeout: 10000 });
  });

  test('plan detail -> start workout -> complete -> back to start', async ({ page }) => {
    // 1. Navigate to /plans
    await page.goto('/plans');
    await expect(page.locator('text=Meine Pläne')).toBeVisible({ timeout: 10000 });

    // 2. Click "Mein Plan"
    await page.click('text=Mein Plan');

    // 3. Click "WORKOUT LADEN"
    await expect(page.locator('text=WORKOUT LADEN')).toBeVisible({ timeout: 10000 });
    await page.click('text=WORKOUT LADEN');

    // 4. Verify timer
    await expect(page.locator('.timer-screen')).toBeVisible({ timeout: 10000 });

    // 5. Stop timer -- click STOP button, then confirm in the modal
    await page.click('button[aria-label="Stopp"]');
    await page.locator('.confirm-btn--danger').click();

    // 6. Click NOCHMAL on done screen
    await expect(page.locator('text=Training abgeschlossen!')).toBeVisible({ timeout: 10000 });
    await page.click('text=NOCHMAL');

    // 7. After NOCHMAL the timer/done state resets; navigate to home via bottom nav
    await page.click('nav a[href="/"]');
    await expect(page.locator('text=Bereit?')).toBeVisible({ timeout: 10000 });
  });
});
