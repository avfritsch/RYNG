-- ============================================
-- Exercise Voting (Upvote only, like a "thumbs up")
-- ============================================

CREATE TABLE exercise_votes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id   uuid NOT NULL REFERENCES exercise_library(id) ON DELETE CASCADE,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(user_id, exercise_id)
);

CREATE INDEX idx_votes_exercise ON exercise_votes(exercise_id);

ALTER TABLE exercise_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own votes" ON exercise_votes
  FOR ALL USING (user_id = auth.uid());

-- Allow reading vote counts (aggregate)
CREATE POLICY "Read all votes" ON exercise_votes
  FOR SELECT USING (true);

GRANT SELECT, INSERT, DELETE ON exercise_votes TO authenticated;

-- Add vote_count to exercise_library for quick access
ALTER TABLE exercise_library ADD COLUMN IF NOT EXISTS vote_count int DEFAULT 0;

-- Function to sync vote count
CREATE OR REPLACE FUNCTION update_vote_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE exercise_library SET vote_count = vote_count + 1 WHERE id = NEW.exercise_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE exercise_library SET vote_count = vote_count - 1 WHERE id = OLD.exercise_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_vote_change
  AFTER INSERT OR DELETE ON exercise_votes
  FOR EACH ROW EXECUTE FUNCTION update_vote_count();
