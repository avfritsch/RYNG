/**
 * Edge Function: send-notification
 *
 * Sends push notifications to users based on notification type.
 * Intended to be called by pg_cron via pg_net (see migration 021).
 *
 * Request body: { "type": "reminder" | "recap" | "comeback" }
 */

// deno-lint-ignore-file no-explicit-any

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendToUser, type PushPayload } from '../_shared/web-push.ts';

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  let body: { type: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { type } = body;

  try {
    switch (type) {
      case 'reminder':
        return jsonResponse(await handleReminder(supabase));
      case 'recap':
        return jsonResponse(await handleRecap(supabase));
      case 'comeback':
        return jsonResponse(await handleComeback(supabase));
      default:
        return jsonResponse({ error: `Unknown notification type: ${type}` }, 400);
    }
  } catch (err: any) {
    console.error('send-notification error:', err);
    return jsonResponse({ error: err?.message || 'Internal error' }, 500);
  }
});

// ---------------------------------------------------------------------------
// Notification handlers
// ---------------------------------------------------------------------------

/**
 * Daily training reminder.
 *
 * Runs every 30 min. Finds users whose `reminder_time` falls within the
 * current 30-minute window AND who haven't trained today, then sends a push.
 */
async function handleReminder(supabase: any) {
  const now = new Date();
  const hh = now.getUTCHours().toString().padStart(2, '0');
  const mm = now.getUTCMinutes();

  // Build a 30-minute window so we catch reminder_time values like 18:15
  // when the cron fires at 18:00.
  const windowStart = `${hh}:${mm < 30 ? '00' : '30'}:00`;
  const windowEnd = `${hh}:${mm < 30 ? '29' : '59'}:59`;

  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('user_id')
    .eq('reminder_enabled', true)
    .gte('reminder_time', windowStart)
    .lte('reminder_time', windowEnd);

  if (!prefs?.length) return { sent: 0 };

  // Filter out users who already trained today
  const today = now.toISOString().split('T')[0];
  const userIds: string[] = prefs.map((p: any) => p.user_id);

  const { data: sessions } = await supabase
    .from('sessions')
    .select('user_id')
    .in('user_id', userIds)
    .gte('started_at', `${today}T00:00:00Z`);

  const trainedToday = new Set((sessions || []).map((s: any) => s.user_id));
  const needReminder = userIds.filter((id) => !trainedToday.has(id));

  let sent = 0;
  for (const userId of needReminder) {
    const ok = await sendToUser(supabase, userId, {
      title: '\u{1F4AA} Zeit f\u00FCr dein Training!',
      body: 'Dein Trainingsplan wartet auf dich.',
      url: '/',
    });
    if (ok) sent++;
  }

  return { sent };
}

/**
 * Weekly recap — sent on Sundays.
 *
 * Tells each user how many sessions they completed in the past 7 days.
 */
async function handleRecap(supabase: any) {
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('user_id')
    .eq('recap_enabled', true);

  if (!prefs?.length) return { sent: 0 };

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  let sent = 0;
  for (const { user_id } of prefs) {
    const { count } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .gte('started_at', weekAgo.toISOString());

    const n = count || 0;
    const body =
      n === 0
        ? 'Diese Woche kein Training \u2014 n\u00E4chste Woche packst du es!'
        : `Diese Woche: ${n} Training${n > 1 ? 's' : ''} absolviert. Weiter so!`;

    const ok = await sendToUser(supabase, user_id, {
      title: '\u{1F4CA} Dein Wochen-Recap',
      body,
      url: '/history',
    });
    if (ok) sent++;
  }

  return { sent };
}

/**
 * Comeback nudge — sent daily.
 *
 * Targets users who opted in to comeback notifications and haven't
 * completed a session in the last 3 days.
 */
async function handleComeback(supabase: any) {
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('user_id')
    .eq('comeback_enabled', true);

  if (!prefs?.length) return { sent: 0 };

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  let sent = 0;
  for (const { user_id } of prefs) {
    const { count } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .gte('started_at', threeDaysAgo.toISOString());

    if ((count || 0) === 0) {
      const ok = await sendToUser(supabase, user_id, {
        title: '\u{1F525} Dein Streak wartet!',
        body: 'Schon 3 Tage ohne Training \u2014 komm zur\u00FCck und bleib dran!',
        url: '/',
      });
      if (ok) sent++;
    }
  }

  return { sent };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
