-- ============================================
-- Fix: Explicit grants for authenticated and anon roles
-- ============================================

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant table permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant select on system tables to anon (for system plans)
GRANT SELECT ON plans TO anon;
GRANT SELECT ON plan_days TO anon;
GRANT SELECT ON plan_exercises TO anon;
GRANT SELECT ON exercise_animations TO anon;

-- Ensure future tables also get grants
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
