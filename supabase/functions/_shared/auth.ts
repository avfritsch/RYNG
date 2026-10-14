import { createClient, type SupabaseClient, type User } from 'https://esm.sh/@supabase/supabase-js@2';

/** Service-role client. Bypasses RLS — only use after authorizing the caller. */
export function adminClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );
}

/** Returns the signed-in user for the request's bearer token, or null. */
export async function getCaller(req: Request): Promise<User | null> {
  const token = bearer(req);
  if (!token) return null;
  const { data, error } = await adminClient().auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

/** True if the request carries the service-role key (used by pg_cron). */
export function isServiceCall(req: Request): boolean {
  const token = bearer(req);
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  return !!token && !!key && timingSafeEqual(token, key);
}

function bearer(req: Request): string | null {
  const header = req.headers.get('Authorization') ?? '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
