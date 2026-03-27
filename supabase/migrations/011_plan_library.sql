-- ============================================
-- Plan Library — Shareable public plans
-- ============================================

-- Add library fields to existing plans table
ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS vote_count int DEFAULT 0;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS copy_count int DEFAULT 0;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Index for public plans
CREATE INDEX IF NOT EXISTS idx_plans_public ON plans(is_public) WHERE is_public = true;

-- Plan votes
CREATE TABLE plan_votes (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_id   uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, plan_id)
);

ALTER TABLE plan_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own plan votes" ON plan_votes FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Read all plan votes" ON plan_votes FOR SELECT USING (true);
GRANT SELECT, INSERT, DELETE ON plan_votes TO authenticated;

-- Trigger for plan vote count
CREATE OR REPLACE FUNCTION update_plan_vote_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE plans SET vote_count = vote_count + 1 WHERE id = NEW.plan_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE plans SET vote_count = vote_count - 1 WHERE id = OLD.plan_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_plan_vote_change
  AFTER INSERT OR DELETE ON plan_votes
  FOR EACH ROW EXECUTE FUNCTION update_plan_vote_count();

-- Update plans RLS to allow reading public plans
DROP POLICY IF EXISTS "Users see own and system plans" ON plans;
CREATE POLICY "Users see own, system, and public plans" ON plans
  FOR SELECT USING (user_id = auth.uid() OR is_system = true OR is_public = true);
