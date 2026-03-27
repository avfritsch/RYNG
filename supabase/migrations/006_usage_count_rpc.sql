CREATE OR REPLACE FUNCTION increment_usage_count(exercise_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE exercise_library SET usage_count = usage_count + 1 WHERE id = exercise_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
