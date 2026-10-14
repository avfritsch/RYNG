-- ============================================
-- 022: Security hardening
--
-- 1. plan_days / plan_exercises: public plans are readable, never writable
--    by non-owners (016 accidentally granted FOR ALL on public/system plans)
-- 2. plans: users cannot create "system" plans; counters and is_system
--    cannot be changed by clients
-- 3. exercise_library: usage_count / vote_count cannot be changed by clients;
--    a deleted user's exercises are deleted with them instead of becoming public
-- 4. votes: only public content can be voted on; votes are private
-- 5. profiles: display names are readable (needed for plan author)
-- 6. SECURITY DEFINER functions: fixed search_path, no anon access
-- 7. New RPCs: increment_plan_copy_count, increment_exercise_usage_for_session
-- 8. ai_usage table for per-user rate limiting of the AI planner
-- ============================================

-- ── 1. plan_days / plan_exercises ──────────────────────────────

DROP POLICY IF EXISTS "Users manage plan days" ON plan_days;
DROP POLICY IF EXISTS "Users manage plan exercises" ON plan_exercises;

DROP POLICY IF EXISTS "Read plan days" ON plan_days;
CREATE POLICY "Read plan days" ON plan_days
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM plans
      WHERE plans.id = plan_days.plan_id
      AND (plans.user_id = auth.uid() OR plans.is_system = true OR plans.is_public = true)
    )
  );

DROP POLICY IF EXISTS "Read plan exercises" ON plan_exercises;
CREATE POLICY "Read plan exercises" ON plan_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM plan_days
      JOIN plans ON plans.id = plan_days.plan_id
      WHERE plan_days.id = plan_exercises.day_id
      AND (plans.user_id = auth.uid() OR plans.is_system = true OR plans.is_public = true)
    )
  );

-- Insert/Update/Delete policies from 004 stay in place (owner + non-system only).

-- ── 2. plans ───────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users insert own plans" ON plans;
CREATE POLICY "Users insert own plans" ON plans
  FOR INSERT WITH CHECK (user_id = auth.uid() AND is_system = false);

DROP POLICY IF EXISTS "Users update own plans" ON plans;
CREATE POLICY "Users update own plans" ON plans
  FOR UPDATE
  USING (user_id = auth.uid() AND is_system = false)
  WITH CHECK (user_id = auth.uid() AND is_system = false);

-- Client roles may never set counters. Privileged roles (migrations,
-- SECURITY DEFINER functions owned by postgres, service_role) may.
CREATE OR REPLACE FUNCTION protect_plan_counters()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.vote_count := 0;
      NEW.copy_count := 0;
    ELSE
      NEW.vote_count := OLD.vote_count;
      NEW.copy_count := OLD.copy_count;
      NEW.is_system := OLD.is_system;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_plan_counters ON plans;
CREATE TRIGGER protect_plan_counters
  BEFORE INSERT OR UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION protect_plan_counters();

-- ── 3. exercise_library ────────────────────────────────────────

CREATE OR REPLACE FUNCTION protect_exercise_counters()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.usage_count := 0;
      NEW.vote_count := 0;
    ELSE
      NEW.usage_count := OLD.usage_count;
      NEW.vote_count := OLD.vote_count;
      NEW.created_by := OLD.created_by;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_exercise_counters ON exercise_library;
CREATE TRIGGER protect_exercise_counters
  BEFORE INSERT OR UPDATE ON exercise_library
  FOR EACH ROW EXECUTE FUNCTION protect_exercise_counters();

-- Deleting a user deletes their exercises (previously SET NULL turned
-- private exercises into world-readable "system" exercises).
ALTER TABLE exercise_library DROP CONSTRAINT IF EXISTS exercise_library_created_by_fkey;
ALTER TABLE exercise_library
  ADD CONSTRAINT exercise_library_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;

-- ── 4. votes ───────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users manage own votes" ON exercise_votes;
DROP POLICY IF EXISTS "Read all votes" ON exercise_votes;
CREATE POLICY "Read own exercise votes" ON exercise_votes
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Delete own exercise votes" ON exercise_votes
  FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Vote on visible exercises" ON exercise_votes
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM exercise_library e
      WHERE e.id = exercise_votes.exercise_id
      AND (e.is_public = true OR e.created_by IS NULL)
    )
  );

DROP POLICY IF EXISTS "Users manage own plan votes" ON plan_votes;
DROP POLICY IF EXISTS "Read all plan votes" ON plan_votes;
CREATE POLICY "Read own plan votes" ON plan_votes
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Delete own plan votes" ON plan_votes
  FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Vote on public plans" ON plan_votes
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM plans p
      WHERE p.id = plan_votes.plan_id
      AND (p.is_public = true OR p.is_system = true)
    )
  );

-- ── 5. profiles ────────────────────────────────────────────────

DROP POLICY IF EXISTS "Read profiles" ON profiles;
CREATE POLICY "Read profiles" ON profiles
  FOR SELECT TO authenticated USING (true);

-- ── 6. SECURITY DEFINER hardening ──────────────────────────────

ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.update_vote_count() SET search_path = public;
ALTER FUNCTION public.update_plan_vote_count() SET search_path = public;
ALTER FUNCTION public.get_last_weights(text[]) SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.get_last_weights(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_last_weights(text[]) TO authenticated;

-- Callable by anyone with any name list → removed. Replaced below.
DROP FUNCTION IF EXISTS public.increment_usage_count(uuid);
DROP FUNCTION IF EXISTS public.increment_exercise_usage_by_names(text[]);

-- ── 7. New RPCs ────────────────────────────────────────────────

-- Count usage once per saved session, only for the caller's own session.
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS usage_counted boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.increment_exercise_usage_for_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE sessions
  SET usage_counted = true
  WHERE id = p_session_id
    AND user_id = auth.uid()
    AND usage_counted = false;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE exercise_library e
  SET usage_count = usage_count + 1
  WHERE e.name IN (
      SELECT DISTINCT se.station_name
      FROM session_entries se
      WHERE se.session_id = p_session_id
    )
    AND (e.is_public = true OR e.created_by IS NULL OR e.created_by = auth.uid());
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_exercise_usage_for_session(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_exercise_usage_for_session(uuid) TO authenticated;

-- Copying someone else's public plan increments its counter atomically.
CREATE OR REPLACE FUNCTION public.increment_plan_copy_count(p_plan_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE plans
  SET copy_count = copy_count + 1
  WHERE id = p_plan_id
    AND (is_public = true OR is_system = true)
    AND auth.uid() IS NOT NULL;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_plan_copy_count(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_plan_copy_count(uuid) TO authenticated;

-- ── 8. AI planner rate limit bookkeeping (written by edge function only) ──

CREATE TABLE IF NOT EXISTS ai_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT current_date,
  count int NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
-- No policies: only the service role (edge function) can access it.
REVOKE ALL ON ai_usage FROM anon, authenticated;
