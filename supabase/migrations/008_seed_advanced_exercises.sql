-- ============================================
-- Seed: Advanced exercises from workout-seed-data
-- Only inserts exercises not already in library
-- ============================================

-- WARMUP: Advanced warmup exercises
INSERT INTO exercise_library (name, detail, muscle_group, category, equipment, tags, howto, is_public) VALUES
('Laufband / Ruderergometer', 'Moderates Tempo, 5 Min', 'Cardio', 'warmup', '{"Maschine"}', '{"Aufwärmen","Cardio","Studio"}', 'Lockeres Tempo, Puls auf 120–130 bpm. Laufband: Steigung 2–3 %. Rudern: Beine → Rücken → Arme.', true),
('Schulterkreisen mit Band', 'Vorwärts & rückwärts', 'Schultern', 'warmup', '{"Band"}', '{"Aufwärmen","Mobilität"}', 'Widerstandsband mit weitem Griff. Arme gestreckt über Kopf und hinter Rücken. 10× vorwärts, 10× rückwärts.', true),
('Cat-Cow + Thoracic Rotation', 'Kontrolliert', 'Rücken', 'warmup', '{"Bodyweight"}', '{"Aufwärmen","Mobilität"}', 'Cat-Cow: Vierfüßlerstand. Einatmen → Brust senken. Ausatmen → Rücken rund. 8–10 Wdh. Thoracic Rotation: Hand hinter Kopf, Ellbogen zum Boden, dann weit öffnen. 6× je Seite.', true),
('Inchworms + Push-Up', 'Dynamisch dehnen', 'Ganzkörper', 'warmup', '{"Bodyweight"}', '{"Aufwärmen","Dynamisch"}', 'Aus dem Stand Hände zum Boden, nach vorne in Liegestützposition. Push-Up, zurück zu Füßen, aufrichten. 6–8 Wdh.', true),
('Goblet Squat Hold', 'Leichte KH, Tiefposition', 'Hüfte', 'warmup', '{"Kurzhantel"}', '{"Aufwärmen","Mobilität"}', 'Leichte KH (8–12 kg) vor Brust. Tiefe Kniebeuge, Ellbogen drücken Knie nach außen. 20–30 s halten, 3–4×.', true),
('Wrist Stretches', 'Kreise und Beugung', 'Unterarme', 'warmup', '{"Bodyweight"}', '{"Aufwärmen","Mobilität"}', 'Arm strecken, Finger sanft dehnen (je 15 s pro Richtung). Handgelenke kreisen.', true),
('Band Dislocates', 'Weiter Griff', 'Schultern', 'warmup', '{"Band"}', '{"Aufwärmen","Mobilität"}', 'Band/Stab weit greifen. Arme gestreckt über Kopf und hinter Rücken. Bei Schmerz stoppen. 10–12 Wdh.', true),
('Hängen am Klimmzuggriff', 'Passiv + aktiv', 'Rücken', 'warmup', '{"Bodyweight"}', '{"Aufwärmen","Grip"}', 'Passiv (30 s): Entspannt hängen. Aktiv (30 s): Schulterblätter nach unten ziehen ohne Armbeugung.', true),
('Thoracic Foam Roll', 'Oberen Rücken', 'Rücken', 'warmup', '{"Bodyweight"}', '{"Aufwärmen","Recovery"}', 'Rolle unter Schulterblätter. Hände hinter Kopf, langsam rollen. An festen Stellen 10–15 s. Nicht über LWS.', true),
('Hip 90/90 Stretch', 'Beide Seiten', 'Hüfte', 'stretch', '{"Bodyweight"}', '{"Dehnen","Hüfte"}', 'Sitzend: Vorderes + hinteres Bein je 90° gebeugt. Oberkörper aufrecht. 30 s je Seite.', true),
('Banded Crab Walks', 'Band um Knie', 'Gesäß', 'warmup', '{"Band"}', '{"Aufwärmen","Glutes"}', 'Mini-Band über Knie. Viertelhocke, 10 Schritte rechts, 10 links. Knie aktiv nach außen.', true),
('Goblet Squat + Pause', '3 s Pause unten', 'Quadrizeps', 'warmup', '{"Kurzhantel"}', '{"Aufwärmen","Beine"}', 'Leichte KH vor Brust. Tiefe Kniebeuge, 3 s unten halten. 6–8 Wdh.', true),
('Sprunggelenk-Mobilisation', 'Knee-over-toe', 'Waden', 'mobility', '{"Bodyweight"}', '{"Mobilität","Sprunggelenk"}', 'Fuß 10 cm von Wand. Knie zur Wand, Ferse bleibt am Boden. 10× je Seite.', true),
('Dead Bug', 'Core aktivieren', 'Core', 'warmup', '{"Bodyweight"}', '{"Aufwärmen","Core"}', 'Rückenlage, Arme hoch, Knie 90°. Gegengleich Arm/Bein strecken. Unterer Rücken fest am Boden!', true)
ON CONFLICT DO NOTHING;

-- STRENGTH: Push exercises (Studio)
INSERT INTO exercise_library (name, detail, muscle_group, category, equipment, tags, howto, is_public) VALUES
('KH-Bankdrücken', 'Flach, kontrolliert', 'Brust', 'strength', '{"Kurzhantel","Bank"}', '{"Push","Oberkörper","Studio"}', 'Flachbank, je eine KH. Schulterblätter zusammen, Oberarme 45° zum Körper. 2 s runter, 1 s hoch.', true),
('Kabelzug Seitheben', 'Einarmig', 'Schultern', 'strength', '{"Maschine"}', '{"Push","Schultern","Isolation"}', 'Seitlich zum Kabelzug, unterer Anschlag. Arm mit leichter Beugung bis Schulterhöhe. Kein Schwung.', true),
('Dips', 'Gerät oder Bank', 'Trizeps', 'strength', '{"Bodyweight","Maschine"}', '{"Push","Oberkörper"}', 'Gerät: Oberkörper leicht vorbeugen, bis Oberarme parallel. Bank: Hände hinter Körper, Ellbogen bis 90°.', true),
('Trizeps Pushdown', 'Seil oder Stange', 'Trizeps', 'strength', '{"Maschine"}', '{"Push","Isolation","Trizeps"}', 'Oberer Anschlag. Oberarme fixiert am Körper. Unterarme runterdrücken, beim Seil Enden auseinanderziehen.', true),
('Pallof Press', 'Kabelzug, Anti-Rotation', 'Core', 'core', '{"Maschine"}', '{"Core","Anti-Rotation"}', 'Kabelzug auf Brusthöhe. Seitlich stehen, Griff beidhändig vor Brust. Arme strecken, 2 s halten. 8–10 Wdh je Seite.', true)
ON CONFLICT DO NOTHING;

-- STRENGTH: Pull exercises (Studio)
INSERT INTO exercise_library (name, detail, muscle_group, category, equipment, tags, howto, is_public) VALUES
('Klimmzüge / Lat Pulldown', 'Weiter Griff, volle ROM', 'Rücken', 'strength', '{"Bodyweight","Maschine"}', '{"Pull","Oberkörper","Compound"}', 'Schulterblätter zuerst runter, dann Arme beugen. Kinn über Stange. Pulldown: Stange zur oberen Brust.', true),
('KH-Rudern einarmig', 'Bank als Stütze', 'Rücken', 'strength', '{"Kurzhantel","Bank"}', '{"Pull","Oberkörper"}', 'Knie + Hand auf Bank. KH zum Hüftknochen ziehen, Ellbogen eng. Schulterblatt zusammenziehen, 1 s halten.', true),
('Kabelzug Face Pulls', 'Seil, Daumen nach außen', 'Schultern', 'strength', '{"Maschine"}', '{"Pull","Schultern","Prävention"}', 'Seil auf Gesichtshöhe. Zum Gesicht ziehen, Enden auseinander. Hände neben Ohren, Ellbogen hoch. 2 s halten.', true),
('KH Bizeps-Curls', 'Abwechselnd, Supination', 'Bizeps', 'strength', '{"Kurzhantel"}', '{"Pull","Arme","Isolation"}', 'KH seitlich, beim Hochführen Handgelenk nach außen drehen. Oberarm fixiert. 1 s hoch, Squeeze, 2 s runter.', true),
('Reverse Fly Kabelzug', 'Vorgebeugt', 'Schultern', 'strength', '{"Maschine"}', '{"Pull","Schultern"}', 'Zwei Kabel unten, Griffe über Kreuz. Vorgebeugt, Arme seitlich nach oben/hinten. Schulterblätter zusammen.', true),
('TRX Body Saw', 'Anti-Extension, Core', 'Core', 'core', '{"Band"}', '{"Core","TRX","Instabil"}', 'Füße in TRX, Unterarm-Stütz. Körper langsam vor/zurück schieben. Kleine Bewegung, maximale Rumpfspannung.', true)
ON CONFLICT DO NOTHING;

-- STRENGTH: Leg exercises (Studio)
INSERT INTO exercise_library (name, detail, muscle_group, category, equipment, tags, howto, is_public) VALUES
('LH Back Squat', 'Mittelweite Stellung', 'Quadrizeps', 'strength', '{"Langhantel"}', '{"Beine","Compound","Studio"}', 'Stange auf Trapezius. Schulterbreit, Core anspannen, mindestens parallel. Brust hoch, explosiv aufstehen.', true),
('Beinbeuger Maschine', 'Liegend oder sitzend', 'Hamstrings', 'strength', '{"Maschine"}', '{"Beine","Isolation"}', 'Volle ROM: ganz strecken, ganz beugen. 1 s Squeeze oben, 3 s exzentrisch.', true),
('Wadenheben stehend', 'Maschine oder Stufe', 'Waden', 'strength', '{"Maschine","Bodyweight"}', '{"Beine","Waden","Isolation"}', 'Fußballen auf Kante. 2 s hoch, 1 s halten, 3 s runter. Fersen unter Niveau für Stretch.', true),
('Kettlebell Swing', 'Hip Hinge, explosiv', 'Hamstrings', 'strength', '{"Kettlebell"}', '{"Beine","Explosiv","Posterior Chain"}', 'KB zwischen Beinen, explosiver Hip Snap. Arme passiv, Kraft aus Hüfte. KB bis Brusthöhe.', true)
ON CONFLICT DO NOTHING;

-- STRENGTH: Ganzkörper exercises (Studio)
INSERT INTO exercise_library (name, detail, muscle_group, category, equipment, tags, howto, is_public) VALUES
('KH Thruster', 'Front Squat → Press', 'Ganzkörper', 'strength', '{"Kurzhantel"}', '{"Ganzkörper","Compound","HIIT"}', 'KH auf Schulterhöhe. Tiefe Kniebeuge, explosiv → KH über Kopf. Fließend, kein Stopp.', true),
('LH Bent-Over Row', 'Proniert, Brust raus', 'Rücken', 'strength', '{"Langhantel"}', '{"Pull","Compound","Studio"}', 'Schulterbreiter Obergriff, 45° vorgebeugt. Stange zum unteren Brustbein. Kein Schwung.', true),
('Ausfallschritte mit KH', 'Walking / alternierend', 'Quadrizeps', 'strength', '{"Kurzhantel"}', '{"Beine","Unterkörper"}', 'KH seitlich, großer Schritt. Hinteres Knie fast zum Boden. Oberkörper aufrecht.', true),
('Push-Up → Renegade Row', 'Liegestütz + Row', 'Ganzkörper', 'strength', '{"Kurzhantel"}', '{"Ganzkörper","Compound","Core"}', 'Auf zwei KH: Push-Up → Row links → Row rechts. Füße breit. Core verhindert Rotation.', true),
('Kabelzug Holzhacker', 'Diagonal', 'Core', 'core', '{"Maschine"}', '{"Core","Rotation","Funktional"}', 'Seitlich zum Kabelzug. Griff beidhändig, diagonale Bewegung. Kraft aus Rumpfrotation. 8–10× je Seite.', true),
('TRX Plank / Body Saw', 'Instabil', 'Core', 'core', '{"Band"}', '{"Core","TRX","Instabil"}', 'Füße in TRX, Unterarm-Stütz. Body Saw: Körper langsam vor/zurück. Kleine Bewegung, max. Spannung.', true)
ON CONFLICT DO NOTHING;
