export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji
  condition: (stats: BadgeStats) => boolean;
}

export interface BadgeStats {
  totalWorkouts: number;
  totalMinutes: number;
  currentStreak: number;
  maxStreak: number;
  gymWorkouts: number;
  circuitWorkouts: number;
}

export const BADGES: Badge[] = [
  { id: 'first-workout', name: 'Erster Schritt', description: 'Erstes Training absolviert', icon: '\u{1F3AF}', condition: (s) => s.totalWorkouts >= 1 },
  { id: 'ten-workouts', name: 'Durchstarter', description: '10 Trainings absolviert', icon: '\u{1F4AA}', condition: (s) => s.totalWorkouts >= 10 },
  { id: 'twentyfive-workouts', name: 'Gewohnheitstier', description: '25 Trainings absolviert', icon: '\u{1F525}', condition: (s) => s.totalWorkouts >= 25 },
  { id: 'fifty-workouts', name: 'Halbzeit', description: '50 Trainings absolviert', icon: '\u{2B50}', condition: (s) => s.totalWorkouts >= 50 },
  { id: 'hundred-workouts', name: 'Centurion', description: '100 Trainings absolviert', icon: '\u{1F3C6}', condition: (s) => s.totalWorkouts >= 100 },
  { id: 'twofifty-workouts', name: 'Legende', description: '250 Trainings absolviert', icon: '\u{1F451}', condition: (s) => s.totalWorkouts >= 250 },
  { id: 'streak-7', name: 'Wochenkrieger', description: '7-Tage-Streak erreicht', icon: '\u{1F525}', condition: (s) => s.maxStreak >= 7 },
  { id: 'streak-30', name: 'Monatsmaschine', description: '30-Tage-Streak erreicht', icon: '\u{1F31F}', condition: (s) => s.maxStreak >= 30 },
  { id: 'first-gym', name: 'Gym-Deb\u00FCt', description: 'Erstes Gym-Training', icon: '\u{1F3CB}\u{FE0F}', condition: (s) => s.gymWorkouts >= 1 },
  { id: 'ten-hours', name: 'Zehn Stunden', description: '10 Stunden trainiert', icon: '\u{23F1}\u{FE0F}', condition: (s) => s.totalMinutes >= 600 },
];
