-- ============================================
-- Weight tracking: track_weight flag + last weights RPC
-- ============================================

-- Add track_weight to exercise_library and plan_exercises
ALTER TABLE exercise_library ADD COLUMN IF NOT EXISTS track_weight boolean DEFAULT false;
ALTER TABLE plan_exercises ADD COLUMN IF NOT EXISTS track_weight boolean DEFAULT false;

-- Smart defaults: true when equipment implies weight
UPDATE exercise_library SET track_weight = true
WHERE equipment && ARRAY['Kurzhantel','Langhantel','Kettlebell','Maschine']
  AND category NOT IN ('warmup', 'stretch', 'cardio');

-- RPC to fetch last-used weight per exercise for current user
CREATE OR REPLACE FUNCTION get_last_weights(exercise_names text[])
RETURNS TABLE(station_name text, weight_kg numeric, reps integer) AS $$
  SELECT DISTINCT ON (se.station_name)
    se.station_name, se.weight_kg, se.reps
  FROM session_entries se
  JOIN sessions s ON s.id = se.session_id
  WHERE se.station_name = ANY(exercise_names)
    AND se.weight_kg IS NOT NULL
    AND s.user_id = auth.uid()
  ORDER BY se.station_name, s.started_at DESC;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_last_weights(text[]) TO authenticated;
