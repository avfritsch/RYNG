/**
 * Shared web-push helper for Supabase Edge Functions (Deno).
 *
 * Uses the `web-push` npm package via Deno's `npm:` specifier.
 *
 * Prerequisites — set these as Supabase secrets:
 *   supabase secrets set VAPID_PUBLIC_KEY=<base64url>
 *   supabase secrets set VAPID_PRIVATE_KEY=<base64url>
 *   supabase secrets set VAPID_EMAIL=you@example.com
 *
 * Generate VAPID keys with:  npx web-push generate-vapid-keys
 */

// deno-lint-ignore-file no-explicit-any

import webpush from 'npm:web-push@3.6.7';

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
}

let vapidConfigured = false;

function ensureVapid(): boolean {
  if (vapidConfigured) return true;

  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  const email = Deno.env.get('VAPID_EMAIL') || 'noreply@ryng.app';

  if (!publicKey || !privateKey) {
    console.error('VAPID keys not configured — set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY secrets');
    return false;
  }

  webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

/**
 * Send a push notification to a single subscription.
 *
 * Returns `true` on success.
 * Returns `false` on failure (caller should delete the subscription when
 * the status code is 410 Gone — see `sendToUser` for that logic).
 */
export async function sendPushNotification(
  subscription: PushSubscriptionRecord,
  payload: PushPayload,
): Promise<boolean> {
  if (!ensureVapid()) return false;

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload),
    );
    return true;
  } catch (err: any) {
    console.error('Push failed:', err?.statusCode, err?.message);
    return false;
  }
}

/**
 * Send a notification to every push subscription belonging to `userId`.
 *
 * Automatically cleans up expired subscriptions (HTTP 410).
 * Returns `true` if at least one subscription received the message.
 */
export async function sendToUser(
  supabase: any,
  userId: string,
  payload: PushPayload,
): Promise<boolean> {
  if (!ensureVapid()) return false;

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (!subs?.length) return false;

  let anySent = false;

  for (const sub of subs as PushSubscriptionRecord[]) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
      );
      anySent = true;
    } catch (err: any) {
      if (err?.statusCode === 410) {
        // Subscription expired — remove it
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', sub.endpoint);
      }
      console.warn('Push to', sub.endpoint.slice(0, 60), 'failed:', err?.message);
    }
  }

  return anySent;
}
