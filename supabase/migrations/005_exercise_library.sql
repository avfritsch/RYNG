-- ============================================
-- Exercise Library — Schema + Seed
-- ============================================

-- Categories enum
CREATE TYPE exercise_category AS ENUM ('warmup', 'stretch', 'strength', 'cardio', 'mobility', 'core');

-- Exercise Library table
CREATE TABLE exercise_library (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  name          text NOT NULL,
  detail        text,
  muscle_group  text,
  category      exercise_category NOT NULL DEFAULT 'strength',
  howto         text,
  equipment     text[] DEFAULT '{}',
  tags          text[] DEFAULT '{}',
  is_public     boolean DEFAULT false,
  usage_count   int DEFAULT 0,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

-- Full-text search index
ALTER TABLE exercise_library ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('german', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('german', coalesce(detail, '')), 'B') ||
    setweight(to_tsvector('german', coalesce(muscle_group, '')), 'B') ||
    setweight(to_tsvector('german', coalesce(howto, '')), 'C')
  ) STORED;

CREATE INDEX idx_exercise_library_fts ON exercise_library USING gin(fts);
CREATE INDEX idx_exercise_library_category ON exercise_library(category);
CREATE INDEX idx_exercise_library_public ON exercise_library(is_public) WHERE is_public = true;
CREATE INDEX idx_exercise_library_creator ON exercise_library(created_by);

-- RLS
ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;

-- Everyone can read public + system exercises
CREATE POLICY "Read public exercises" ON exercise_library
  FOR SELECT USING (is_public = true OR created_by IS NULL OR created_by = auth.uid());

-- Users can insert their own
CREATE POLICY "Insert own exercises" ON exercise_library
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Users can update their own (not system)
CREATE POLICY "Update own exercises" ON exercise_library
  FOR UPDATE USING (created_by = auth.uid());

-- Users can delete their own (not system)
CREATE POLICY "Delete own exercises" ON exercise_library
  FOR DELETE USING (created_by = auth.uid());

-- Extend plan_exercises with library reference
ALTER TABLE plan_exercises ADD COLUMN library_exercise_id uuid REFERENCES exercise_library(id) ON DELETE SET NULL;

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON exercise_library TO authenticated;
GRANT SELECT ON exercise_library TO anon;

-- ============================================
-- Seed: ~50 Standard-Übungen
-- ============================================

-- WARMUP (8)
INSERT INTO exercise_library (name, detail, muscle_group, category, equipment, tags, is_public) VALUES
('Jumping Jacks', 'Hampelmänner zum Aufwärmen', 'Ganzkörper', 'warmup', '{"Bodyweight"}', '{"Aufwärmen","Cardio"}', true),
('Arm Circles', 'Armkreisen vorwärts und rückwärts', 'Schultern', 'warmup', '{"Bodyweight"}', '{"Aufwärmen","Mobilität"}', true),
('High Knees', 'Knie abwechselnd hoch ziehen', 'Beine', 'warmup', '{"Bodyweight"}', '{"Aufwärmen","Cardio"}', true),
('Leg Swings', 'Bein vor und zurück schwingen', 'Hüfte', 'warmup', '{"Bodyweight"}', '{"Aufwärmen","Mobilität"}', true),
('Schulterkreisen', 'Langsame Kreise, beide Richtungen', 'Schultern', 'warmup', '{"Bodyweight"}', '{"Aufwärmen","Mobilität"}', true),
('Arm Swings', 'Dynamisches Armschwingen', 'Schultern', 'warmup', '{"Bodyweight"}', '{"Aufwärmen","Dynamisch"}', true),
('Cat-Cow Stretch', 'Vierfüßlerstand, Rücken runden und strecken', 'Rücken', 'warmup', '{"Bodyweight"}', '{"Aufwärmen","Mobilität"}', true),
('Seilspringen', 'Klassisches Seilspringen zum Aufwärmen', 'Ganzkörper', 'warmup', '{"Springseil"}', '{"Aufwärmen","Cardio"}', true);

-- STRENGTH: Push (8)
INSERT INTO exercise_library (name, detail, muscle_group, category, equipment, tags, is_public) VALUES
('Liegestütze klassisch', 'Schulterbreiter Griff, Brust bis zum Boden', 'Brust', 'strength', '{"Bodyweight"}', '{"Push","Oberkörper"}', true),
('Liegestütze eng', 'Hände nah zusammen, Trizeps-Fokus', 'Trizeps', 'strength', '{"Bodyweight"}', '{"Push","Oberkörper"}', true),
('Pike Push-Ups', 'Hüfte hoch, Schulter-Fokus', 'Schultern', 'strength', '{"Bodyweight"}', '{"Push","Oberkörper"}', true),
('Dips (Stuhl)', 'Hände auf Stuhlkante, Körper senken', 'Trizeps', 'strength', '{"Bodyweight","Stuhl"}', '{"Push","Oberkörper"}', true),
('Decline Push-Ups', 'Füße erhöht, obere Brust', 'Brust', 'strength', '{"Bodyweight"}', '{"Push","Oberkörper"}', true),
('Diamond Push-Ups', 'Daumen und Zeigefinger bilden Raute', 'Trizeps', 'strength', '{"Bodyweight"}', '{"Push","Oberkörper"}', true),
('KH Bankdrücken', 'Kurzhantel-Bankdrücken auf Flachbank', 'Brust', 'strength', '{"Kurzhantel","Bank"}', '{"Push","Oberkörper"}', true),
('KH Schulterdrücken', 'Kurzhantel über Kopf drücken, sitzend oder stehend', 'Schultern', 'strength', '{"Kurzhantel"}', '{"Push","Oberkörper"}', true);

-- STRENGTH: Pull (8)
INSERT INTO exercise_library (name, detail, muscle_group, category, equipment, tags, is_public) VALUES
('Bodyweight Rows', 'An Tischkante oder Stange rudern', 'Rücken', 'strength', '{"Bodyweight"}', '{"Pull","Oberkörper"}', true),
('Reverse Snow Angels', 'Bauchlage, Arme in Schneeengel-Bewegung', 'Rücken', 'strength', '{"Bodyweight"}', '{"Pull","Oberkörper"}', true),
('Superman Hold', 'Statisch halten in Superman-Position', 'Rücken', 'strength', '{"Bodyweight"}', '{"Pull","Rücken"}', true),
('Türziehen', 'An Türrahmen festhalten und zurücklehnen', 'Rücken', 'strength', '{"Bodyweight"}', '{"Pull","Oberkörper"}', true),
('Bicep Curls', 'Kurzhantel-Curls, voller ROM', 'Bizeps', 'strength', '{"Kurzhantel"}', '{"Pull","Arme"}', true),
('Hammer Curls', 'Neutrale Griffhaltung, Kurzhantel', 'Bizeps', 'strength', '{"Kurzhantel"}', '{"Pull","Arme"}', true),
('KH Rudern einarmig', 'Einarmiges Kurzhantel-Rudern, Knie auf Bank', 'Rücken', 'strength', '{"Kurzhantel","Bank"}', '{"Pull","Oberkörper"}', true),
('Band Pull-Aparts', 'Band auf Schulterhöhe auseinanderziehen', 'Rücken', 'strength', '{"Band"}', '{"Pull","Schultern"}', true);

-- STRENGTH: Legs (10)
INSERT INTO exercise_library (name, detail, muscle_group, category, equipment, tags, is_public) VALUES
('Kniebeugen', 'Tiefe Kniebeugen mit geradem Rücken', 'Quadrizeps', 'strength', '{"Bodyweight"}', '{"Beine","Unterkörper"}', true),
('Ausfallschritte', 'Wechselseitig, Knie bis 90°', 'Quadrizeps', 'strength', '{"Bodyweight"}', '{"Beine","Unterkörper"}', true),
('Glute Bridge', 'Rückenlage, Hüfte heben und halten', 'Gesäß', 'strength', '{"Bodyweight"}', '{"Beine","Gesäß"}', true),
('Wall Sit', 'Rücken an Wand, 90° Kniewinkel halten', 'Quadrizeps', 'strength', '{"Bodyweight"}', '{"Beine","Isometrisch"}', true),
('Sumo Squats', 'Breite Fußstellung, tief gehen', 'Adduktoren', 'strength', '{"Bodyweight"}', '{"Beine","Unterkörper"}', true),
('Calf Raises', 'Auf Zehenspitzen stellen und senken', 'Waden', 'strength', '{"Bodyweight"}', '{"Beine","Waden"}', true),
('Single Leg Deadlift', 'Einbeinig, Oberkörper nach vorn kippen', 'Hamstrings', 'strength', '{"Bodyweight","Kurzhantel"}', '{"Beine","Balance"}', true),
('Jump Squats', 'Kniebeuge + explosiver Sprung', 'Beine', 'strength', '{"Bodyweight"}', '{"Beine","Explosiv"}', true),
('Rumänisches Kreuzheben', 'KH, Hip Hinge, Hamstring-Stretch', 'Hamstrings', 'strength', '{"Kurzhantel"}', '{"Beine","Unterkörper"}', true),
('Bulgarian Split Squats', 'Hinterer Fuß erhöht, einbeinige Kniebeuge', 'Quadrizeps', 'strength', '{"Bodyweight","Bank"}', '{"Beine","Unterkörper"}', true);

-- CORE (8)
INSERT INTO exercise_library (name, detail, muscle_group, category, equipment, tags, is_public) VALUES
('Plank', 'Unterarmstütz, Körper gerade halten', 'Core', 'core', '{"Bodyweight"}', '{"Core","Isometrisch"}', true),
('Mountain Climbers', 'Im Liegestütz Knie zum Ellbogen', 'Core', 'core', '{"Bodyweight"}', '{"Core","Cardio"}', true),
('Bicycle Crunches', 'Radfahren in Rückenlage', 'Core', 'core', '{"Bodyweight"}', '{"Core","Bauch"}', true),
('Russian Twists', 'Sitzend, Oberkörper rotieren', 'Core', 'core', '{"Bodyweight","Kurzhantel"}', '{"Core","Rotation"}', true),
('Leg Raises', 'Rückenlage, gestreckte Beine heben', 'Core', 'core', '{"Bodyweight"}', '{"Core","Unterer Bauch"}', true),
('Dead Bug', 'Rückenlage, diagonal Arm+Bein strecken', 'Core', 'core', '{"Bodyweight"}', '{"Core","Stabilität"}', true),
('Side Plank', 'Seitstütz, 30s pro Seite', 'Core', 'core', '{"Bodyweight"}', '{"Core","Seitlich"}', true),
('Hollow Body Hold', 'Rückenlage, Arme+Beine gestreckt schweben', 'Core', 'core', '{"Bodyweight"}', '{"Core","Isometrisch"}', true);

-- CARDIO (4)
INSERT INTO exercise_library (name, detail, muscle_group, category, equipment, tags, is_public) VALUES
('Burpees', 'Liegestütz + Strecksprung', 'Ganzkörper', 'cardio', '{"Bodyweight"}', '{"Cardio","HIIT"}', true),
('Box Jumps', 'Beidbeiniger Sprung auf erhöhte Box', 'Beine', 'cardio', '{"Box"}', '{"Cardio","Explosiv"}', true),
('Skater Jumps', 'Seitliche Sprünge, einbeinige Landung', 'Beine', 'cardio', '{"Bodyweight"}', '{"Cardio","Balance"}', true),
('Bear Crawl', 'Vierfüßlergang vorwärts/rückwärts', 'Ganzkörper', 'cardio', '{"Bodyweight"}', '{"Cardio","Ganzkörper"}', true);

-- STRETCH/MOBILITY (4)
INSERT INTO exercise_library (name, detail, muscle_group, category, equipment, tags, is_public) VALUES
('Pigeon Pose', 'Taubenstellung, Hüftöffner', 'Hüfte', 'stretch', '{"Bodyweight"}', '{"Dehnen","Hüfte"}', true),
('Hamstring Stretch', 'Vorbeuge, Beine gestreckt', 'Hamstrings', 'stretch', '{"Bodyweight"}', '{"Dehnen","Beine"}', true),
('Shoulder Dislocates', 'Band über Kopf rotieren, Schulter-Mobilität', 'Schultern', 'mobility', '{"Band"}', '{"Mobilität","Schultern"}', true),
('World''s Greatest Stretch', 'Ausfallschritt + Rotation + Armheben', 'Ganzkörper', 'mobility', '{"Bodyweight"}', '{"Mobilität","Ganzkörper"}', true);
