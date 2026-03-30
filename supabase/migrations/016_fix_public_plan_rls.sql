-- ============================================
-- Fix RLS: allow reading days/exercises of public plans
-- ============================================

-- plan_days: also allow reading for public plans
DROP POLICY IF EXISTS "Users manage plan days" ON plan_days;
CREATE POLICY "Users manage plan days" ON plan_days
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM plans
      WHERE plans.id = plan_days.plan_id
      AND (plans.user_id = auth.uid() OR plans.is_system = true OR plans.is_public = true)
    )
  );

-- plan_exercises: also allow reading for public plans
DROP POLICY IF EXISTS "Users manage plan exercises" ON plan_exercises;
CREATE POLICY "Users manage plan exercises" ON plan_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM plan_days
      JOIN plans ON plans.id = plan_days.plan_id
      WHERE plan_days.id = plan_exercises.day_id
      AND (plans.user_id = auth.uid() OR plans.is_system = true OR plans.is_public = true)
    )
  );
