-- ============================================
-- Seed: Advanced system plans from workout-seed-data
-- + make all system plans public (visible in library)
-- ============================================

-- Make existing system plans public
UPDATE plans SET is_public = true WHERE is_system = true;

-- ==========================================
-- Plan 5: Push (Gym)
-- ==========================================
INSERT INTO plans (id, user_id, name, description, is_system, is_public) VALUES
  ('00000000-0000-0000-0000-000000000005', NULL, 'Push (Gym)', 'Drück-Training mit Kurzhanteln, Kabelzug und ausführlichem Warmup. Tag A eines 4er-Splits.', true, true);

INSERT INTO plan_days (id, plan_id, label, focus, sort_order, rounds, round_pause, warmup_pause) VALUES
  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000005', 'Tag A', 'Push', 0, 3, 90, 10);

INSERT INTO plan_exercises (day_id, name, detail, muscle_group, howto, is_warmup, work_seconds, pause_seconds, sort_order) VALUES
  ('00000000-0000-0000-0001-000000000005', 'Laufband / Ruderergometer', 'Moderates Tempo', 'Cardio', 'Lockeres Tempo, Puls auf 120–130 bpm. Laufband: Steigung 2–3 %. Rudern: Beine → Rücken → Arme.', true, 300, 10, 0),
  ('00000000-0000-0000-0001-000000000005', 'Schulterkreisen mit Band', 'Vorwärts & rückwärts', 'Schultern', 'Widerstandsband mit weitem Griff. Arme gestreckt über Kopf und hinter Rücken. 10× vorwärts, 10× rückwärts.', true, 60, 10, 1),
  ('00000000-0000-0000-0001-000000000005', 'Cat-Cow + Thoracic Rotation', 'Kontrolliert', 'Wirbelsäule', 'Cat-Cow: Vierfüßlerstand. Einatmen → Brust senken. Ausatmen → Rücken rund. 8–10 Wdh. Thoracic Rotation: Hand hinter Kopf, Ellbogen zum Boden, dann weit öffnen. 6× je Seite.', true, 120, 10, 2),
  ('00000000-0000-0000-0001-000000000005', 'Band Pull-Aparts', 'Schulterblätter zusammen', 'Oberer Rücken', 'Band auf Schulterhöhe, Arme gestreckt. Auseinanderziehen bis Band die Brust berührt. 1 s halten. 15–20 Wdh.', true, 60, 10, 3),
  ('00000000-0000-0000-0001-000000000005', 'Inchworms + Push-Up', 'Dynamisch dehnen', 'Ganzkörper', 'Aus dem Stand Hände zum Boden, nach vorne in Liegestützposition. Push-Up, zurück zu Füßen, aufrichten. 6–8 Wdh.', true, 120, 10, 4),
  ('00000000-0000-0000-0001-000000000005', 'Goblet Squat Hold', 'Leichte KH, Tiefposition', 'Hüfte', 'Leichte KH (8–12 kg) vor Brust. Tiefe Kniebeuge, Ellbogen drücken Knie nach außen. 20–30 s halten, 3–4×.', true, 120, 10, 5),
  ('00000000-0000-0000-0001-000000000005', 'Wrist Stretches', 'Kreise und Beugung', 'Unterarme', 'Arm strecken, Finger sanft dehnen (je 15 s pro Richtung). Handgelenke kreisen.', true, 60, 10, 6),
  ('00000000-0000-0000-0001-000000000005', 'KH-Bankdrücken', 'Flach, kontrolliert', 'Brust', 'Flachbank, je eine KH. Schulterblätter zusammen, Oberarme 45° zum Körper. 2 s runter, 1 s hoch.', false, 45, 30, 7),
  ('00000000-0000-0000-0001-000000000005', 'KH-Schulterdrücken', 'Sitzend', 'Schultern', 'Sitzend, Rückenlehne ~85°. KH auf Schulterhöhe, nach oben drücken. Core anspannen.', false, 45, 30, 8),
  ('00000000-0000-0000-0001-000000000005', 'Kabelzug Seitheben', 'Einarmig', 'Seitl. Schulter', 'Seitlich zum Kabelzug, unterer Anschlag. Arm mit leichter Beugung bis Schulterhöhe. Kein Schwung. Seite wechseln.', false, 45, 30, 9),
  ('00000000-0000-0000-0001-000000000005', 'Dips', 'Gerät oder Bank', 'Trizeps / Brust', 'Gerät: Oberkörper leicht vorbeugen, bis Oberarme parallel. Bank: Hände hinter Körper, Ellbogen bis 90°. Schultern weg von Ohren.', false, 45, 30, 10),
  ('00000000-0000-0000-0001-000000000005', 'Trizeps Pushdown', 'Seil oder Stange', 'Trizeps', 'Oberer Anschlag. Oberarme fixiert am Körper. Unterarme runterdrücken, beim Seil Enden auseinanderziehen. Zurück bis 90°.', false, 45, 30, 11),
  ('00000000-0000-0000-0001-000000000005', 'Pallof Press', 'Kabelzug, Anti-Rotation', 'Core', 'Kabelzug auf Brusthöhe. Seitlich stehen, Griff beidhändig vor Brust. Arme strecken, 2 s halten — Core verhindert Rotation. 8–10 Wdh je Seite.', false, 45, 30, 12);

-- ==========================================
-- Plan 6: Pull (Gym)
-- ==========================================
INSERT INTO plans (id, user_id, name, description, is_system, is_public) VALUES
  ('00000000-0000-0000-0000-000000000006', NULL, 'Pull (Gym)', 'Zug-Training mit Klimmzügen, Kabelzug und Kurzhanteln. Tag B eines 4er-Splits.', true, true);

INSERT INTO plan_days (id, plan_id, label, focus, sort_order, rounds, round_pause, warmup_pause) VALUES
  ('00000000-0000-0000-0001-000000000006', '00000000-0000-0000-0000-000000000006', 'Tag B', 'Pull', 0, 3, 90, 10);

INSERT INTO plan_exercises (day_id, name, detail, muscle_group, howto, is_warmup, work_seconds, pause_seconds, sort_order) VALUES
  ('00000000-0000-0000-0001-000000000006', 'Ruderergometer / Crosstrainer', 'Moderates Tempo', 'Cardio', 'Puls 120–130 bpm. Rudern: Beine → Rücken → Arme. Crosstrainer: aktiv ziehen.', true, 300, 10, 0),
  ('00000000-0000-0000-0001-000000000006', 'Band Dislocates', 'Weiter Griff', 'Schultern', 'Band/Stab weit greifen. Arme gestreckt über Kopf und hinter Rücken. Bei Schmerz stoppen. 10–12 Wdh.', true, 60, 10, 1),
  ('00000000-0000-0000-0001-000000000006', 'Hängen am Klimmzuggriff', 'Passiv + aktiv', 'Lat / Grip', 'Passiv (30 s): Entspannt hängen. Aktiv (30 s): Schulterblätter nach unten ziehen ohne Armbeugung.', true, 60, 10, 2),
  ('00000000-0000-0000-0001-000000000006', 'Thoracic Foam Roll', 'Oberen Rücken', 'BWS', 'Rolle unter Schulterblätter. Hände hinter Kopf, langsam rollen. An festen Stellen 10–15 s. Nicht über LWS.', true, 120, 10, 3),
  ('00000000-0000-0000-0001-000000000006', 'Hip 90/90 Stretch', 'Beide Seiten', 'Hüfte', 'Sitzend: Vorderes + hinteres Bein je 90° gebeugt. Oberkörper aufrecht. 30 s je Seite.', true, 120, 10, 4),
  ('00000000-0000-0000-0001-000000000006', 'Leichte KH Rows', 'Aufwärmsatz', 'Oberer Rücken', 'Leichte KH (5–8 kg), 45° vorgebeugt. Beide zum Bauchnabel ziehen, Schulterblätter zusammen. 15–20 Wdh.', true, 120, 10, 5),
  ('00000000-0000-0000-0001-000000000006', 'Wrist Circles', 'Handgelenke', 'Unterarme', 'Handgelenke kreisen (10× je Richtung). Faust ballen + öffnen (20×).', true, 60, 10, 6),
  ('00000000-0000-0000-0001-000000000006', 'Klimmzüge / Lat Pulldown', 'Weiter Griff, volle ROM', 'Latissimus', 'Schulterblätter zuerst runter, dann Arme beugen. Kinn über Stange. Pulldown: Stange zur oberen Brust.', false, 45, 30, 7),
  ('00000000-0000-0000-0001-000000000006', 'KH-Rudern einarmig', 'Bank als Stütze', 'Oberer Rücken', 'Knie + Hand auf Bank. KH zum Hüftknochen ziehen, Ellbogen eng. Schulterblatt zusammenziehen, 1 s halten.', false, 45, 30, 8),
  ('00000000-0000-0000-0001-000000000006', 'Kabelzug Face Pulls', 'Seil, Daumen nach außen', 'Hint. Schulter', 'Seil auf Gesichtshöhe. Zum Gesicht ziehen, Enden auseinander. Hände neben Ohren, Ellbogen hoch. 2 s halten.', false, 45, 30, 9),
  ('00000000-0000-0000-0001-000000000006', 'KH Bizeps-Curls', 'Abwechselnd, Supination', 'Bizeps', 'KH seitlich, beim Hochführen Handgelenk nach außen drehen. Oberarm fixiert. 1 s hoch, Squeeze, 2 s runter.', false, 45, 30, 10),
  ('00000000-0000-0000-0001-000000000006', 'Reverse Fly Kabelzug', 'Vorgebeugt', 'Hint. Schulter', 'Zwei Kabel unten, Griffe über Kreuz. Vorgebeugt, Arme seitlich nach oben/hinten. Schulterblätter zusammen.', false, 45, 30, 11),
  ('00000000-0000-0000-0001-000000000006', 'TRX Body Saw', 'Anti-Extension, Core', 'Core', 'Füße in TRX, Unterarm-Stütz. Körper langsam vor/zurück schieben. Kleine Bewegung, maximale Rumpfspannung. Kein Durchhängen.', false, 45, 30, 12);

-- ==========================================
-- Plan 7: Beine (Gym)
-- ==========================================
INSERT INTO plans (id, user_id, name, description, is_system, is_public) VALUES
  ('00000000-0000-0000-0000-000000000007', NULL, 'Beine (Gym)', 'Bein-Training mit Langhantel, Kurzhanteln und Maschinen. Tag C eines 4er-Splits.', true, true);

INSERT INTO plan_days (id, plan_id, label, focus, sort_order, rounds, round_pause, warmup_pause) VALUES
  ('00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0000-000000000007', 'Tag C', 'Beine', 0, 3, 90, 10);

INSERT INTO plan_exercises (day_id, name, detail, muscle_group, howto, is_warmup, work_seconds, pause_seconds, sort_order) VALUES
  ('00000000-0000-0000-0001-000000000007', 'Fahrrad / Laufband Incline', 'Steigung', 'Cardio', 'Fahrrad: Widerstand mittel, 70–80 RPM. Laufband: 8–12 % Steigung, 4–5 km/h.', true, 300, 10, 0),
  ('00000000-0000-0000-0001-000000000007', 'Banded Crab Walks', 'Band um Knie', 'Glutes', 'Mini-Band über Knie. Viertelhocke, 10 Schritte rechts, 10 links. Knie aktiv nach außen.', true, 60, 10, 1),
  ('00000000-0000-0000-0001-000000000007', 'Ausfallschritte', 'Ohne Gewicht', 'Beine / Hüfte', 'Großer Schritt, hinteres Knie fast zum Boden, zurück. 8–10 je Seite.', true, 120, 10, 2),
  ('00000000-0000-0000-0001-000000000007', 'Leg Swings', 'Frontal & lateral', 'Hüftflexoren', 'An Wand festhalten. Frontal: vor/zurück (10×). Lateral: seitlich (10×). Amplitude steigern.', true, 60, 10, 3),
  ('00000000-0000-0000-0001-000000000007', 'Goblet Squat + Pause', '3 s Pause unten', 'Quads / Glutes', 'Leichte KH vor Brust. Tiefe Kniebeuge, 3 s unten halten. 6–8 Wdh.', true, 120, 10, 4),
  ('00000000-0000-0000-0001-000000000007', 'Sprunggelenk-Mobilisation', 'Knee-over-toe', 'Sprunggelenk', 'Fuß 10 cm von Wand. Knie zur Wand, Ferse bleibt am Boden. 10× je Seite.', true, 60, 10, 5),
  ('00000000-0000-0000-0001-000000000007', 'Glute Bridges', 'Squeeze oben', 'Glutes', 'Rückenlage, Hüfte heben. Oben Glutes 2 s maximal anspannen. 15–20 Wdh.', true, 120, 10, 6),
  ('00000000-0000-0000-0001-000000000007', 'LH Back Squat', 'Mittelweite Stellung', 'Quads / Glutes', 'Stange auf Trapezius. Schulterbreit, Core anspannen, mindestens parallel. Brust hoch, explosiv aufstehen.', false, 45, 30, 7),
  ('00000000-0000-0000-0001-000000000007', 'Rumänisches Kreuzheben', 'KH, Stretch betonen', 'Hamstrings / Glutes', 'KH vor Körper. Hip Hinge: Hüfte zurück, Knie minimal gebeugt. KH eng entlang bis Hamstring-Stretch. Rücken gerade!', false, 45, 30, 8),
  ('00000000-0000-0000-0001-000000000007', 'Bulgarian Split Squats', 'Fuß erhöht', 'Quads / Balance', 'Hinterer Fuß auf Bank. KH seitlich. Senkrecht runter. Näher = Quad; weiter = Glute.', false, 45, 30, 9),
  ('00000000-0000-0000-0001-000000000007', 'Beinbeuger Maschine', 'Liegend oder sitzend', 'Hamstrings', 'Volle ROM: ganz strecken, ganz beugen. 1 s Squeeze oben, 3 s exzentrisch.', false, 45, 30, 10),
  ('00000000-0000-0000-0001-000000000007', 'Wadenheben stehend', 'Maschine oder Stufe', 'Waden', 'Fußballen auf Kante. Hoch (1 s), Fersen unter Niveau (Stretch). 2 s hoch, 1 s halten, 3 s runter.', false, 45, 30, 11),
  ('00000000-0000-0000-0001-000000000007', 'Kettlebell Swing', 'Hip Hinge, explosiv', 'Post. Chain', 'KB zwischen Beinen, explosiver Hip Snap. Arme passiv, Kraft aus Hüfte. KB bis Brusthöhe.', false, 45, 30, 12);

-- ==========================================
-- Plan 8: Ganzkörper (Gym)
-- ==========================================
INSERT INTO plans (id, user_id, name, description, is_system, is_public) VALUES
  ('00000000-0000-0000-0000-000000000008', NULL, 'Ganzkörper (Gym)', 'Ganzkörper-Training mit Compound-Übungen und Geräten. Tag D eines 4er-Splits.', true, true);

INSERT INTO plan_days (id, plan_id, label, focus, sort_order, rounds, round_pause, warmup_pause) VALUES
  ('00000000-0000-0000-0001-000000000008', '00000000-0000-0000-0000-000000000008', 'Tag D', 'Ganzkörper', 0, 3, 90, 10);

INSERT INTO plan_exercises (day_id, name, detail, muscle_group, howto, is_warmup, work_seconds, pause_seconds, sort_order) VALUES
  ('00000000-0000-0000-0001-000000000008', 'Ruderergometer', '20 SPM', 'Cardio', '20 Schläge/Min, gleichmäßig. Beine → Oberkörper → Arme.', true, 300, 10, 0),
  ('00000000-0000-0000-0001-000000000008', 'World''s Greatest Stretch', 'Beide Seiten', 'Ganzkörper', 'Ausfallschritt, Ellbogen zum vorderen Fuß, Arm zur Decke drehen. 5 s halten, 4× je Seite.', true, 120, 10, 1),
  ('00000000-0000-0000-0001-000000000008', 'Banded Pull-Aparts', 'Schulterblätter', 'Oberer Rücken', 'Band auf Schulterhöhe auseinanderziehen. 15–20 Wdh.', true, 60, 10, 2),
  ('00000000-0000-0000-0001-000000000008', 'Bodyweight Squats', 'Tempo 3-1-1', 'Beine', '3 s runter, 1 s Pause unten, 1 s hoch. 8–10 Wdh.', true, 120, 10, 3),
  ('00000000-0000-0000-0001-000000000008', 'Arm Circles + Scap Push-Ups', 'Schultern', 'Schultern', 'Arm Circles: Klein → groß (20 s je Richtung). Scap Push-Ups: Arme gestreckt, nur Schulterblätter. 10–12 Wdh.', true, 120, 10, 4),
  ('00000000-0000-0000-0001-000000000008', 'Dead Bug', 'Core aktivieren', 'Core', 'Rückenlage, Arme hoch, Knie 90°. Gegengleich Arm/Bein strecken. Unterer Rücken fest am Boden!', true, 60, 10, 5),
  ('00000000-0000-0000-0001-000000000008', 'Ankle & Wrist Mobility', 'Kreise', 'Gelenke', 'Fußgelenke + Handgelenke kreisen (10× je Richtung).', true, 60, 10, 6),
  ('00000000-0000-0000-0001-000000000008', 'KH Thruster', 'Front Squat → Press', 'Ganzkörper', 'KH auf Schulterhöhe. Tiefe Kniebeuge, explosiv → KH über Kopf. Fließend, kein Stopp.', false, 45, 30, 7),
  ('00000000-0000-0000-0001-000000000008', 'LH Bent-Over Row', 'Proniert, Brust raus', 'Rücken', 'Schulterbreiter Obergriff, 45° vorgebeugt. Stange zum unteren Brustbein. Kein Schwung.', false, 45, 30, 8),
  ('00000000-0000-0000-0001-000000000008', 'Ausfallschritte mit KH', 'Walking / alternierend', 'Beine', 'KH seitlich, großer Schritt. Hinteres Knie fast zum Boden. Oberkörper aufrecht.', false, 45, 30, 9),
  ('00000000-0000-0000-0001-000000000008', 'Push-Up → Renegade Row', 'Liegestütz + Row', 'Brust/Rücken/Core', 'Auf zwei KH: Push-Up → Row links → Row rechts. Füße breit. Core verhindert Rotation.', false, 45, 30, 10),
  ('00000000-0000-0000-0001-000000000008', 'Kabelzug Holzhacker', 'Diagonal', 'Core / Rotation', 'Seitlich zum Kabelzug. Griff beidhändig, diagonale Bewegung. Kraft aus Rumpfrotation. 8–10× je Seite.', false, 45, 30, 11),
  ('00000000-0000-0000-0001-000000000008', 'TRX Plank / Body Saw', 'Instabil', 'Core', 'Füße in TRX, Unterarm-Stütz. Body Saw: Körper langsam vor/zurück. Kleine Bewegung, max. Spannung.', false, 45, 30, 12);
