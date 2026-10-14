-- ============================================
-- 023: Exercise identity
--
-- Weight history and usage were keyed by the exercise *name*. Renaming an
-- exercise lost its history, and spelling variants of the same system
-- exercise ("KH Bankdrücken" / "KH-Bankdrücken") split it.
--
-- 1. normalize_exercise_name(): case/space/punctuation-insensitive key
-- 2. Merge duplicate SYSTEM exercises with the same normalized name
-- 3. session_entries.library_exercise_id + backfill
-- 4. get_last_weights() matches by id first, then by normalized name
-- ============================================

-- ── 1. Normalization ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.normalize_exercise_name(n text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT regexp_replace(lower(coalesce(n, '')), '[^a-z0-9äöüß]+', '', 'g');
$$;

-- ── 2. Merge duplicate system exercises ────────────────────────
-- Keeper = the most complete row (longest howto, then most used, then newest).

DO $$
DECLARE
  grp record;
  keeper uuid;
  dup uuid;
BEGIN
  FOR grp IN
    SELECT normalize_exercise_name(name) AS key
    FROM exercise_library
    WHERE created_by IS NULL
    GROUP BY 1
    HAVING count(*) > 1
  LOOP
    SELECT id INTO keeper
    FROM exercise_library
    WHERE created_by IS NULL AND normalize_exercise_name(name) = grp.key
    ORDER BY length(coalesce(howto, '')) DESC, usage_count DESC, updated_at DESC NULLS LAST
    LIMIT 1;

    FOR dup IN
      SELECT id FROM exercise_library
      WHERE created_by IS NULL AND normalize_exercise_name(name) = grp.key AND id <> keeper
    LOOP
      UPDATE plan_exercises SET library_exercise_id = keeper WHERE library_exercise_id = dup;

      -- favorites / votes: move unless the user already has one on the keeper
      DELETE FROM exercise_favorites f
        WHERE f.exercise_id = dup
          AND EXISTS (SELECT 1 FROM exercise_favorites k WHERE k.exercise_id = keeper AND k.user_id = f.user_id);
      UPDATE exercise_favorites SET exercise_id = keeper WHERE exercise_id = dup;

      DELETE FROM exercise_votes v
        WHERE v.exercise_id = dup
          AND EXISTS (SELECT 1 FROM exercise_votes k WHERE k.exercise_id = keeper AND k.user_id = v.user_id);
      UPDATE exercise_votes SET exercise_id = keeper WHERE exercise_id = dup;

      UPDATE exercise_library k
        SET usage_count = k.usage_count + d.usage_count
        FROM exercise_library d
        WHERE k.id = keeper AND d.id = dup;

      DELETE FROM exercise_library WHERE id = dup;
    END LOOP;
  END LOOP;
END $$;

-- Recount votes after moving them
UPDATE exercise_library e
SET vote_count = (SELECT count(*) FROM exercise_votes v WHERE v.exercise_id = e.id);

-- ── 3. session_entries.library_exercise_id ─────────────────────

ALTER TABLE session_entries
  ADD COLUMN IF NOT EXISTS library_exercise_id uuid REFERENCES exercise_library(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_session_entries_library_exercise
  ON session_entries(library_exercise_id) WHERE library_exercise_id IS NOT NULL;

-- Backfill: the session owner's own exercise wins, otherwise the system one.
UPDATE session_entries se
SET library_exercise_id = match.id
FROM sessions s,
LATERAL (
  SELECT e.id
  FROM exercise_library e
  WHERE normalize_exercise_name(e.name) = normalize_exercise_name(se.station_name)
    AND (e.created_by = s.user_id OR e.created_by IS NULL)
  ORDER BY (e.created_by = s.user_id) DESC NULLS LAST
  LIMIT 1
) match
WHERE se.session_id = s.id
  AND se.library_exercise_id IS NULL;

-- Plan exercises copied from the library without a link get one too.
UPDATE plan_exercises pe
SET library_exercise_id = match.id
FROM plan_days d
JOIN plans p ON p.id = d.plan_id,
LATERAL (
  SELECT e.id
  FROM exercise_library e
  WHERE normalize_exercise_name(e.name) = normalize_exercise_name(pe.name)
    AND (e.created_by = p.user_id OR e.created_by IS NULL OR e.is_public)
  ORDER BY (e.created_by = p.user_id) DESC NULLS LAST, (e.created_by IS NULL) DESC
  LIMIT 1
) match
WHERE pe.day_id = d.id
  AND pe.library_exercise_id IS NULL;

-- ── 4. Last weights by id, falling back to normalized name ─────

DROP FUNCTION IF EXISTS public.get_last_weights(text[]);

CREATE OR REPLACE FUNCTION public.get_last_weights(
  exercise_names text[],
  exercise_ids uuid[] DEFAULT '{}'
)
RETURNS TABLE(station_name text, library_exercise_id uuid, weight_kg numeric, reps integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (coalesce(se.library_exercise_id::text, normalize_exercise_name(se.station_name)))
    se.station_name, se.library_exercise_id, se.weight_kg, se.reps
  FROM session_entries se
  JOIN sessions s ON s.id = se.session_id
  WHERE s.user_id = auth.uid()
    AND se.weight_kg IS NOT NULL
    AND (
      se.library_exercise_id = ANY(exercise_ids)
      OR normalize_exercise_name(se.station_name) IN (
        SELECT normalize_exercise_name(n) FROM unnest(exercise_names) n
      )
    )
  ORDER BY coalesce(se.library_exercise_id::text, normalize_exercise_name(se.station_name)), s.started_at DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.get_last_weights(text[], uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_last_weights(text[], uuid[]) TO authenticated;
