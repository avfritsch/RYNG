/**
 * Edge Function: delete-account
 *
 * Permanently deletes the calling user. Deleting the auth user cascades to
 * profiles → plans, sessions, exercises, votes, favorites, and directly to
 * push_subscriptions, notification_preferences and ai_usage.
 */
import { corsHeaders } from "../_shared/cors.ts";
import { adminClient, getCaller } from "../_shared/auth.ts";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const user = await getCaller(req);
  if (!user) return json({ error: "Nicht angemeldet" }, 401);

  const { error } = await adminClient().auth.admin.deleteUser(user.id);
  if (error) {
    console.error("deleteUser failed", error);
    return json({ error: "Konto konnte nicht gelöscht werden" }, 500);
  }
  return json({ deleted: true });
});
