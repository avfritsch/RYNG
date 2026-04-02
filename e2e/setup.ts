import type { Page } from '@playwright/test';

const SUPABASE_URL = 'https://zplkfmuulfhftjmgmddi.supabase.co';

/**
 * Inject a fake Supabase auth session into localStorage so the app
 * treats the browser as authenticated. Must be called BEFORE page.goto().
 */
export async function mockSupabase(page: Page) {
  await page.addInitScript((supabaseUrl: string) => {
    const projectRef = supabaseUrl.split('//')[1].split('.')[0];
    const storageKey = `sb-${projectRef}-auth-token`;

    const session = {
      access_token: 'mock-access-token',
      refresh_token: 'mock-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      expires_in: 3600,
      token_type: 'bearer',
      user: {
        id: 'test-user-id-123',
        email: 'test@ryng.app',
        aud: 'authenticated',
        role: 'authenticated',
        email_confirmed_at: '2026-01-01T00:00:00Z',
        app_metadata: { provider: 'email' },
        user_metadata: {},
        created_at: '2026-01-01T00:00:00Z',
      },
    };

    localStorage.setItem(storageKey, JSON.stringify(session));

    // Dismiss all feature hints so they don't overlay buttons
    const hints = ['mode-toggle', 'mesocycle', 'spotify', 'heartrate', 'quick-start', 'gym-preview', 'weekly-goal'];
    for (const id of hints) {
      localStorage.setItem('ryng_hint_seen_' + id, '1');
    }

    // Set visit count high enough to skip install banner
    localStorage.setItem('ryng_visits', '10');
  }, SUPABASE_URL);
}
