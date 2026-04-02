import type { Page } from '@playwright/test';
import {
  TEST_USER,
  testPlans,
  testPlanDays,
  testExercises,
  testLibraryExercises,
  testSessions,
} from './data.ts';

const SUPABASE_URL = 'https://zplkfmuulfhftjmgmddi.supabase.co';

/** Set up Playwright route interception for all Supabase API calls. */
export async function setupRoutes(page: Page) {
  // Auth endpoints
  await page.route(`${SUPABASE_URL}/auth/v1/**`, async (route) => {
    const url = route.request().url();

    if (url.includes('/token')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-access-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-token',
          user: TEST_USER,
        }),
      });
    }

    if (url.includes('/user')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(TEST_USER),
      });
    }

    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  // RPC calls (must be before the REST catch-all POST)
  await page.route(`${SUPABASE_URL}/rest/v1/rpc/**`, async (route) => {
    return route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
  });

  // Single catch-all for all REST API calls — dispatch by table name in URL
  await page.route(`${SUPABASE_URL}/rest/v1/**`, async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    const path = url.replace(`${SUPABASE_URL}/rest/v1/`, '').split('?')[0];

    // Plans
    if (path === 'plans' && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'content-range': `0-${testPlans.length - 1}/${testPlans.length}` },
        body: JSON.stringify(testPlans),
      });
    }

    // Plan days
    if (path === 'plan_days' && method === 'GET') {
      const parsed = new URL(url);
      const planId = parsed.searchParams.get('plan_id');
      const filtered = planId
        ? testPlanDays.filter((d) => d.plan_id === planId.replace('eq.', ''))
        : testPlanDays;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(filtered),
      });
    }

    // Plan exercises
    if (path === 'plan_exercises' && method === 'GET') {
      const parsed = new URL(url);
      const dayId = parsed.searchParams.get('day_id');
      const filtered = dayId
        ? testExercises.filter((e) => e.day_id === dayId.replace('eq.', ''))
        : testExercises;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(filtered),
      });
    }

    // Exercise library
    if (path === 'exercise_library' && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(testLibraryExercises),
      });
    }

    // Sessions
    if (path === 'sessions' && method === 'GET') {
      const prefer = route.request().headers()['prefer'] ?? '';
      if (prefer.includes('count=exact') && prefer.includes('head=true')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'content-range': `0-0/${testSessions.length}` },
          body: '[]',
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(testSessions),
      });
    }

    // Session entries
    if (path === 'session_entries' && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }

    // Favorites
    if (path === 'favorites' && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }

    // Votes
    if (path === 'votes' && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }

    // Profiles
    if (path === 'profiles' && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: TEST_USER.id, display_name: 'Test User' }]),
      });
    }

    // Presets
    if (path === 'presets' && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }

    // Notification preferences
    if (path === 'notification_preferences' && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }

    // Mesocycles
    if (path === 'mesocycles' && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }

    // Catch-all for mutations
    if (method === 'POST') {
      const prefer = route.request().headers()['prefer'] ?? '';
      // When .select().single() is used, return a single object instead of an array
      const isSingle = prefer.includes('return=representation');
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: isSingle
          ? JSON.stringify({ id: 'new-id' })
          : JSON.stringify([{ id: 'new-id' }]),
      });
    }
    if (method === 'PATCH') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    if (method === 'DELETE') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    // GET fallback for any unmocked tables
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
}
