-- Add speech_name field for TTS-friendly pronunciation
-- e.g. "KH-Schulterdrücken" displays in UI but speech_name "Kurzhantel-Schulterdrücken" is spoken

ALTER TABLE exercise_library ADD COLUMN IF NOT EXISTS speech_name text;
ALTER TABLE plan_exercises ADD COLUMN IF NOT EXISTS speech_name text;

-- Seed common abbreviation expansions
UPDATE exercise_library SET speech_name = 'Kurzhantel-Bankdrücken' WHERE name = 'KH Bankdrücken';
UPDATE exercise_library SET speech_name = 'Kurzhantel-Bankdrücken' WHERE name = 'KH-Bankdrücken';
UPDATE exercise_library SET speech_name = 'Kurzhantel-Schulterdrücken' WHERE name = 'KH Schulterdrücken';
UPDATE exercise_library SET speech_name = 'Kurzhantel-Rudern einarmig' WHERE name = 'KH Rudern einarmig';
UPDATE exercise_library SET speech_name = 'Kurzhantel-Rudern einarmig' WHERE name = 'KH-Rudern einarmig';
UPDATE exercise_library SET speech_name = 'Kurzhantel Bizeps-Curls' WHERE name = 'KH Bizeps-Curls';
UPDATE exercise_library SET speech_name = 'Kurzhantel Thruster' WHERE name = 'KH Thruster';
UPDATE exercise_library SET speech_name = 'Langhantel Back Squat' WHERE name = 'LH Back Squat';
UPDATE exercise_library SET speech_name = 'Langhantel Bent-Over Row' WHERE name = 'LH Bent-Over Row';
UPDATE exercise_library SET speech_name = 'Tee-Är-Ecks Body Saw' WHERE name = 'TRX Body Saw';
UPDATE exercise_library SET speech_name = 'Tee-Är-Ecks Plank Body Saw' WHERE name = 'TRX Plank / Body Saw';
