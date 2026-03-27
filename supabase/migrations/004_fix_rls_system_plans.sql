-- ============================================
-- Fix: Split RLS policies for plan_days and plan_exercises
-- Prevent writes to system plan children
-- ============================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users manage plan days" ON plan_days;
DROP POLICY IF EXISTS "Users manage plan exercises" ON plan_exercises;

-- plan_days: SELECT allows system + own plans
CREATE POLICY "Read plan days" ON plan_days
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM plans
      WHERE plans.id = plan_days.plan_id
      AND (plans.user_id = auth.uid() OR plans.is_system = true)
    )
  );

-- plan_days: INSERT only into own non-system plans
CREATE POLICY "Insert own plan days" ON plan_days
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM plans
      WHERE plans.id = plan_days.plan_id
      AND plans.user_id = auth.uid()
      AND plans.is_system = false
    )
  );

-- plan_days: UPDATE only own non-system plans
CREATE POLICY "Update own plan days" ON plan_days
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM plans
      WHERE plans.id = plan_days.plan_id
      AND plans.user_id = auth.uid()
      AND plans.is_system = false
    )
  );

-- plan_days: DELETE only own non-system plans
CREATE POLICY "Delete own plan days" ON plan_days
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM plans
      WHERE plans.id = plan_days.plan_id
      AND plans.user_id = auth.uid()
      AND plans.is_system = false
    )
  );

-- plan_exercises: SELECT allows system + own
CREATE POLICY "Read plan exercises" ON plan_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM plan_days
      JOIN plans ON plans.id = plan_days.plan_id
      WHERE plan_days.id = plan_exercises.day_id
      AND (plans.user_id = auth.uid() OR plans.is_system = true)
    )
  );

-- plan_exercises: INSERT only into own non-system
CREATE POLICY "Insert own plan exercises" ON plan_exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM plan_days
      JOIN plans ON plans.id = plan_days.plan_id
      WHERE plan_days.id = plan_exercises.day_id
      AND plans.user_id = auth.uid()
      AND plans.is_system = false
    )
  );

-- plan_exercises: UPDATE only own non-system
CREATE POLICY "Update own plan exercises" ON plan_exercises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM plan_days
      JOIN plans ON plans.id = plan_days.plan_id
      WHERE plan_days.id = plan_exercises.day_id
      AND plans.user_id = auth.uid()
      AND plans.is_system = false
    )
  );

-- plan_exercises: DELETE only own non-system
CREATE POLICY "Delete own plan exercises" ON plan_exercises
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM plan_days
      JOIN plans ON plans.id = plan_days.plan_id
      WHERE plan_days.id = plan_exercises.day_id
      AND plans.user_id = auth.uid()
      AND plans.is_system = false
    )
  );
