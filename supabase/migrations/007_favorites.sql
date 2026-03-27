-- ============================================
-- Exercise Favorites
-- ============================================

CREATE TABLE exercise_favorites (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  exercise_id   uuid NOT NULL REFERENCES exercise_library(id) ON DELETE CASCADE,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(user_id, exercise_id)
);

CREATE INDEX idx_favorites_user ON exercise_favorites(user_id);

ALTER TABLE exercise_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own favorites" ON exercise_favorites
  FOR ALL USING (user_id = auth.uid());

GRANT SELECT, INSERT, DELETE ON exercise_favorites TO authenticated;
