-- Notification cron jobs
--
-- Prerequisites (enable in the Supabase dashboard → Database → Extensions):
--   1. pg_cron   — scheduled job execution
--   2. pg_net    — async HTTP requests from SQL
--
-- The jobs below call the send-notification Edge Function via pg_net.
-- They rely on app.settings for the project URL and service-role key.
-- Set them once in the Supabase SQL editor:
--
--   ALTER DATABASE postgres SET app.settings.supabase_url = 'https://<ref>.supabase.co';
--   ALTER DATABASE postgres SET app.settings.service_role_key = '<service-role-key>';
--

-- 1. Training reminders — every 30 minutes
--    The Edge Function checks each user's reminder_time against the current
--    30-minute window and skips users who already trained today.
SELECT cron.schedule(
  'training-reminders',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url    := current_setting('app.settings.supabase_url') || '/functions/v1/send-notification',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type',  'application/json'
    ),
    body   := '{"type":"reminder"}'::jsonb
  );
  $$
);

-- 2. Weekly recap — Sunday at 20:00 UTC
SELECT cron.schedule(
  'weekly-recap',
  '0 20 * * 0',
  $$
  SELECT net.http_post(
    url    := current_setting('app.settings.supabase_url') || '/functions/v1/send-notification',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type',  'application/json'
    ),
    body   := '{"type":"recap"}'::jsonb
  );
  $$
);

-- 3. Comeback check — daily at 10:00 UTC
SELECT cron.schedule(
  'comeback-check',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url    := current_setting('app.settings.supabase_url') || '/functions/v1/send-notification',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type',  'application/json'
    ),
    body   := '{"type":"comeback"}'::jsonb
  );
  $$
);
