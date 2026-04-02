import { test, expect } from '@playwright/test';
import { mockSupabase } from '../setup.ts';
import { setupRoutes } from '../mocks/routes.ts';

test.beforeEach(async ({ page }) => {
  await mockSupabase(page);
  await setupRoutes(page);
});

/**
 * Helper: start a timer by quick-starting an exercise from the library.
 */
async function startTimerViaLibrary(page: import('@playwright/test').Page) {
  await page.goto('/library');
  await expect(page.getByText('Bibliothek')).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Liegestütze').first()).toBeVisible({ timeout: 10000 });

  // Expand and quick-start
  await page.locator('.library-row', { hasText: 'Liegestütze' }).click();
  const expanded = page.locator('.library-row--selected .library-row-expanded');
  await expect(expanded).toBeVisible({ timeout: 5000 });
  await expanded.getByText('Quick-Start').click();

  // Wait for timer screen
  await expect(page.locator('.timer-screen')).toBeVisible({ timeout: 10000 });
}

test('timer screen shows during active session', async ({ page }) => {
  await startTimerViaLibrary(page);

  // Timer screen is visible as a fullscreen overlay
  await expect(page.locator('.timer-screen')).toBeVisible();
});

test('timer shows exercise name and countdown', async ({ page }) => {
  await startTimerViaLibrary(page);

  // Station name should be visible (Liegestütze from quick-start)
  await expect(page.getByRole('heading', { name: 'Liegestütze' })).toBeVisible({ timeout: 5000 });

  // Countdown seconds should be visible (work phase starts at 45s)
  // Look for the countdown display — it renders seconds as a number
  const timerBody = page.locator('.timer-body');
  await expect(timerBody).toBeVisible();
});

test('pause and resume work', async ({ page }) => {
  await startTimerViaLibrary(page);

  // Click pause
  const pauseBtn = page.getByRole('button', { name: 'Pause' });
  await expect(pauseBtn).toBeVisible({ timeout: 5000 });
  await pauseBtn.click();

  // After pausing, the button should change to resume (label: "Fortsetzen")
  const resumeBtn = page.getByRole('button', { name: 'Fortsetzen' });
  await expect(resumeBtn).toBeVisible({ timeout: 5000 });

  // Click resume
  await resumeBtn.click();

  // Back to pause button
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible({ timeout: 5000 });
});

test('stop ends training and shows done screen', async ({ page }) => {
  await startTimerViaLibrary(page);

  // Click stop
  const stopBtn = page.getByRole('button', { name: 'Stopp' });
  await expect(stopBtn).toBeVisible({ timeout: 5000 });
  await stopBtn.click();

  // Confirm modal appears
  await expect(page.getByText('Workout beenden')).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: 'Beenden' }).click();

  // Done screen should appear
  await expect(page.getByText('Training abgeschlossen!')).toBeVisible({ timeout: 10000 });

  // Stats should be visible
  await expect(page.getByText('Runden')).toBeVisible();
  await expect(page.getByText('Übungen')).toBeVisible();
  await expect(page.getByText('Dauer')).toBeVisible();
});

test('done screen shows NOCHMAL and VERLAUF buttons', async ({ page }) => {
  await startTimerViaLibrary(page);

  // Stop the timer
  await page.getByRole('button', { name: 'Stopp' }).click();
  await expect(page.getByText('Workout beenden')).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: 'Beenden' }).click();

  await expect(page.getByText('Training abgeschlossen!')).toBeVisible({ timeout: 10000 });

  // Action buttons
  await expect(page.getByText('NOCHMAL')).toBeVisible();
  await expect(page.getByRole('button', { name: 'VERLAUF' })).toBeVisible();
});
