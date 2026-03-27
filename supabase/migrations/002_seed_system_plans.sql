-- ============================================
-- Ryng — Seed: Eingebaute System-Pläne
-- ============================================
-- System-Pläne haben user_id = NULL und is_system = true.
-- Jeder User sieht sie via RLS Policy.

-- ==========================================
-- Plan 1: Ganzkörper
-- ==========================================
INSERT INTO plans (id, user_id, name, description, is_system) VALUES
  ('00000000-0000-0000-0000-000000000001', NULL, 'Ganzkörper', 'Komplettes Ganzkörper-Training mit Aufwärmen und 8 Kraft-Stationen.', true);

INSERT INTO plan_days (id, plan_id, label, focus, sort_order, rounds, round_pause, warmup_pause) VALUES
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'Tag A', 'Ganzkörper', 0, 3, 90, 10);

INSERT INTO plan_exercises (day_id, name, detail, muscle_group, is_warmup, work_seconds, pause_seconds, sort_order) VALUES
  ('00000000-0000-0000-0001-000000000001', 'Jumping Jacks', 'Hampelmänner zum Aufwärmen', 'Cardio', true, 30, 10, 0),
  ('00000000-0000-0000-0001-000000000001', 'Arm Circles', 'Armkreisen vorwärts & rückwärts', 'Schultern', true, 30, 10, 1),
  ('00000000-0000-0000-0001-000000000001', 'Liegestütze', 'Klassische Liegestütze, Brust bis zum Boden', 'Brust', false, 45, 30, 2),
  ('00000000-0000-0000-0001-000000000001', 'Kniebeugen', 'Tiefe Kniebeugen, Oberschenkel parallel zum Boden', 'Beine', false, 45, 30, 3),
  ('00000000-0000-0000-0001-000000000001', 'Plank', 'Unterarmstütz, Körper gerade halten', 'Core', false, 45, 30, 4),
  ('00000000-0000-0000-0001-000000000001', 'Ausfallschritte', 'Abwechselnd links/rechts', 'Beine', false, 45, 30, 5),
  ('00000000-0000-0000-0001-000000000001', 'Superman', 'Bauchlage, Arme und Beine anheben', 'Rücken', false, 45, 30, 6),
  ('00000000-0000-0000-0001-000000000001', 'Burpees', 'Liegestütz + Strecksprung', 'Ganzkörper', false, 45, 30, 7),
  ('00000000-0000-0000-0001-000000000001', 'Mountain Climbers', 'Im Liegestütz Knie zum Ellbogen', 'Core', false, 45, 30, 8),
  ('00000000-0000-0000-0001-000000000001', 'Bicycle Crunches', 'Radfahren in Rückenlage', 'Core', false, 45, 30, 9);

-- ==========================================
-- Plan 2: Push
-- ==========================================
INSERT INTO plans (id, user_id, name, description, is_system) VALUES
  ('00000000-0000-0000-0000-000000000002', NULL, 'Push', 'Drück-Übungen für Brust, Schultern und Trizeps.', true);

INSERT INTO plan_days (id, plan_id, label, focus, sort_order, rounds, round_pause, warmup_pause) VALUES
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000002', 'Push Day', 'Push', 0, 3, 90, 10);

INSERT INTO plan_exercises (day_id, name, detail, muscle_group, is_warmup, work_seconds, pause_seconds, sort_order) VALUES
  ('00000000-0000-0000-0001-000000000002', 'Schulterkreisen', 'Langsame Kreise, beide Richtungen', 'Schultern', true, 30, 10, 0),
  ('00000000-0000-0000-0001-000000000002', 'Arm Swings', 'Dynamisches Armschwingen', 'Schultern', true, 30, 10, 1),
  ('00000000-0000-0000-0001-000000000002', 'Liegestütze klassisch', 'Schulterbreiter Griff', 'Brust', false, 45, 30, 2),
  ('00000000-0000-0000-0001-000000000002', 'Liegestütze eng', 'Hände nah zusammen, Trizeps-Fokus', 'Trizeps', false, 45, 30, 3),
  ('00000000-0000-0000-0001-000000000002', 'Pike Push-Ups', 'Hüfte hoch, Schulter-Fokus', 'Schultern', false, 45, 30, 4),
  ('00000000-0000-0000-0001-000000000002', 'Dips (Stuhl)', 'Hände auf Stuhlkante, Körper senken', 'Trizeps', false, 45, 30, 5),
  ('00000000-0000-0000-0001-000000000002', 'Decline Push-Ups', 'Füße erhöht, obere Brust', 'Brust', false, 45, 30, 6),
  ('00000000-0000-0000-0001-000000000002', 'Diamond Push-Ups', 'Daumen und Zeigefinger bilden Raute', 'Trizeps', false, 40, 30, 7);

-- ==========================================
-- Plan 3: Pull
-- ==========================================
INSERT INTO plans (id, user_id, name, description, is_system) VALUES
  ('00000000-0000-0000-0000-000000000003', NULL, 'Pull', 'Zug-Übungen für Rücken und Bizeps.', true);

INSERT INTO plan_days (id, plan_id, label, focus, sort_order, rounds, round_pause, warmup_pause) VALUES
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000003', 'Pull Day', 'Pull', 0, 3, 90, 10);

INSERT INTO plan_exercises (day_id, name, detail, muscle_group, is_warmup, work_seconds, pause_seconds, sort_order) VALUES
  ('00000000-0000-0000-0001-000000000003', 'Cat-Cow Stretch', 'Vierfüßlerstand, Rücken runden und strecken', 'Rücken', true, 30, 10, 0),
  ('00000000-0000-0000-0001-000000000003', 'Band Pull-Aparts', 'Arme nach außen ziehen (oder pantomimisch)', 'Rücken', true, 30, 10, 1),
  ('00000000-0000-0000-0001-000000000003', 'Bodyweight Rows', 'An Tischkante oder Stange rudern', 'Rücken', false, 45, 30, 2),
  ('00000000-0000-0000-0001-000000000003', 'Reverse Snow Angels', 'Bauchlage, Arme in Schneeengel-Bewegung', 'Rücken', false, 45, 30, 3),
  ('00000000-0000-0000-0001-000000000003', 'Bicep Curls', 'Mit Kurzhantel oder Widerstandsband', 'Bizeps', false, 45, 30, 4),
  ('00000000-0000-0000-0001-000000000003', 'Superman Hold', 'Statisch halten in Superman-Position', 'Rücken', false, 45, 30, 5),
  ('00000000-0000-0000-0001-000000000003', 'Türziehen', 'An Türrahmen festhalten und zurücklehnen', 'Rücken', false, 45, 30, 6),
  ('00000000-0000-0000-0001-000000000003', 'Hammer Curls', 'Neutrale Griffhaltung', 'Bizeps', false, 45, 30, 7);

-- ==========================================
-- Plan 4: Beine
-- ==========================================
INSERT INTO plans (id, user_id, name, description, is_system) VALUES
  ('00000000-0000-0000-0000-000000000004', NULL, 'Beine', 'Bein-Training mit Fokus auf Oberschenkel, Gesäß und Waden.', true);

INSERT INTO plan_days (id, plan_id, label, focus, sort_order, rounds, round_pause, warmup_pause) VALUES
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000004', 'Leg Day', 'Beine', 0, 3, 90, 10);

INSERT INTO plan_exercises (day_id, name, detail, muscle_group, is_warmup, work_seconds, pause_seconds, sort_order) VALUES
  ('00000000-0000-0000-0001-000000000004', 'High Knees', 'Knie abwechselnd hoch ziehen', 'Cardio', true, 30, 10, 0),
  ('00000000-0000-0000-0001-000000000004', 'Leg Swings', 'Bein vor und zurück schwingen', 'Beine', true, 30, 10, 1),
  ('00000000-0000-0000-0001-000000000004', 'Kniebeugen', 'Tiefe Kniebeugen mit geradem Rücken', 'Quadrizeps', false, 45, 30, 2),
  ('00000000-0000-0000-0001-000000000004', 'Ausfallschritte', 'Wechselseitig, Knie bis 90°', 'Quadrizeps', false, 45, 30, 3),
  ('00000000-0000-0000-0001-000000000004', 'Glute Bridge', 'Rückenlage, Hüfte heben und halten', 'Gesäß', false, 45, 30, 4),
  ('00000000-0000-0000-0001-000000000004', 'Wall Sit', 'Rücken an Wand, 90° Kniewinkel halten', 'Quadrizeps', false, 45, 30, 5),
  ('00000000-0000-0000-0001-000000000004', 'Sumo Squats', 'Breite Fußstellung, tief gehen', 'Adduktoren', false, 45, 30, 6),
  ('00000000-0000-0000-0001-000000000004', 'Calf Raises', 'Auf Zehenspitzen stellen und senken', 'Waden', false, 45, 30, 7),
  ('00000000-0000-0000-0001-000000000004', 'Single Leg Deadlift', 'Einbeinig, Oberkörper nach vorn kippen', 'Hamstrings', false, 45, 30, 8),
  ('00000000-0000-0000-0001-000000000004', 'Jump Squats', 'Kniebeuge + explosiver Sprung', 'Beine', false, 40, 30, 9);
