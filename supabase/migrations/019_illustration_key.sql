-- Add illustration_key to exercise_library and plan_exercises
ALTER TABLE exercise_library ADD COLUMN IF NOT EXISTS illustration_key text;
ALTER TABLE plan_exercises ADD COLUMN IF NOT EXISTS illustration_key text;

-- Create storage bucket for exercise images (run manually in Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('exercise-images', 'exercise-images', true);
