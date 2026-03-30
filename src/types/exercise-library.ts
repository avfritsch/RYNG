export type ExerciseCategory = 'warmup' | 'stretch' | 'strength' | 'cardio' | 'core';

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  warmup: 'Aufwärmen',
  stretch: 'Dehnen',
  strength: 'Kraft',
  cardio: 'Ausdauer',
  core: 'Core',
};

export const MUSCLE_GROUP_OPTIONS = [
  'Brust',
  'Rücken',
  'Schultern',
  'Bizeps',
  'Trizeps',
  'Core',
  'Quadrizeps',
  'Hamstrings',
  'Gesäß',
  'Waden',
  'Adduktoren',
  'Hüfte',
  'Ganzkörper',
  'Unterarme',
] as const;

export const EQUIPMENT_OPTIONS = [
  'Bodyweight',
  'Kurzhantel',
  'Langhantel',
  'Kettlebell',
  'Band',
  'Maschine',
  'Bank',
  'Box',
  'Springseil',
  'Stuhl',
] as const;

export interface LibraryExercise {
  id: string;
  created_by: string | null;
  name: string;
  speech_name: string | null;
  muscle_groups: string[];
  category: ExerciseCategory;
  howto: string | null;
  equipment: string[];
  is_public: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}
