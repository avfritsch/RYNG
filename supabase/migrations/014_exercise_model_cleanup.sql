-- ============================================
-- Exercise library data model cleanup
-- ============================================

-- 0. Drop fts column first (depends on detail + name + howto + muscle_group)
DROP INDEX IF EXISTS idx_exercise_library_fts;
ALTER TABLE exercise_library DROP COLUMN IF EXISTS fts;

-- 1. Merge detail into howto (keep howto, drop detail)
UPDATE exercise_library
SET howto = COALESCE(
  NULLIF(howto, '') || E'\n' || NULLIF(detail, ''),
  NULLIF(howto, ''),
  NULLIF(detail, '')
)
WHERE detail IS NOT NULL AND detail != '';

ALTER TABLE exercise_library DROP COLUMN IF EXISTS detail;

-- 2. Convert muscle_group from single text to text array (muscle_groups)
ALTER TABLE exercise_library ADD COLUMN IF NOT EXISTS muscle_groups text[] DEFAULT '{}';

UPDATE exercise_library
SET muscle_groups = ARRAY[muscle_group]
WHERE muscle_group IS NOT NULL AND muscle_group != '';

ALTER TABLE exercise_library DROP COLUMN IF EXISTS muscle_group;

-- 3. Drop unused columns
ALTER TABLE exercise_library DROP COLUMN IF EXISTS tags;

-- 4. Merge mobility into stretch
UPDATE exercise_library SET category = 'stretch' WHERE category = 'mobility';

-- Remove mobility from enum (recreate type)
-- PostgreSQL doesn't support DROP VALUE from enum, so we work around it
-- by updating all data first (done above) and leaving the enum value dormant.
-- New code will only use the 5 remaining values.

-- 5. Update plan_exercises: merge detail into howto, drop detail
UPDATE plan_exercises
SET howto = COALESCE(
  NULLIF(howto, '') || E'\n' || NULLIF(detail, ''),
  NULLIF(howto, ''),
  NULLIF(detail, '')
)
WHERE detail IS NOT NULL AND detail != '';

ALTER TABLE plan_exercises DROP COLUMN IF EXISTS detail;

-- 6. Convert plan_exercises muscle_group to muscle_groups array
ALTER TABLE plan_exercises ADD COLUMN IF NOT EXISTS muscle_groups text[] DEFAULT '{}';

UPDATE plan_exercises
SET muscle_groups = ARRAY[muscle_group]
WHERE muscle_group IS NOT NULL AND muscle_group != '';

ALTER TABLE plan_exercises DROP COLUMN IF EXISTS muscle_group;

-- 7. New function: increment usage count per exercise name after session save
-- This replaces the old per-plan-add increment
CREATE OR REPLACE FUNCTION increment_exercise_usage_by_names(exercise_names text[])
RETURNS void AS $$
BEGIN
  UPDATE exercise_library
  SET usage_count = usage_count + 1
  WHERE name = ANY(exercise_names);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
