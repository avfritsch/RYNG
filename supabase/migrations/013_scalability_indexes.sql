-- ============================================
-- Scalability: Missing indexes for 1000+ users
-- ============================================

-- Plans: user lookup for RLS and plan list queries
CREATE INDEX IF NOT EXISTS idx_plans_user ON plans(user_id);

-- Presets: user lookup (no index existed)
CREATE INDEX IF NOT EXISTS idx_presets_user ON presets(user_id);

-- Exercise favorites: user lookup and exercise lookup
CREATE INDEX IF NOT EXISTS idx_exercise_favorites_user ON exercise_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_favorites_exercise ON exercise_favorites(exercise_id);

-- Exercise votes: user lookup and exercise lookup
CREATE INDEX IF NOT EXISTS idx_exercise_votes_user ON exercise_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_exercise_votes_exercise ON exercise_votes(exercise_id);

-- Plan votes: user lookup and plan lookup
CREATE INDEX IF NOT EXISTS idx_plan_votes_user ON plan_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_votes_plan ON plan_votes(plan_id);

-- Sessions: standalone user_id index for simple lookups (composite exists but only for sorted queries)
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- Mesocycle: user_id already has UNIQUE constraint which creates an index, but explicit for clarity
-- (skipped, UNIQUE constraint on user_id already serves as index)
