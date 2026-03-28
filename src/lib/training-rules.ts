import type { StationConfig } from '../types/timer.ts';

export interface TrainingWarning {
  type: 'info' | 'warning';
  message: string;
}

// Muscle group detection from station names
const MUSCLE_PATTERNS: Record<string, RegExp> = {
  brust: /brust|bench|push.?up|liegestütz|bankdrück|dips|decline|diamond/i,
  rücken: /rücken|row|rudern|klimmzug|pulldown|pull.?up|lat|reverse fly|face pull|body saw/i,
  schultern: /schulter|shoulder|press|seitheben|pike|military|deltoid/i,
  bizeps: /bizeps|curl|bicep/i,
  trizeps: /trizeps|tricep|pushdown|skull|french/i,
  core: /core|plank|crunch|russian|dead.?bug|pallof|hollow|woodchop|holzhacker|mountain/i,
  beine: /bein|squat|kniebeug|lunge|ausfallschritt|deadlift|kreuzheben|split|bulgarian|wadenheb|calf|swing|leg|glute|bridge|wall.?sit|sumo|jump/i,
  cardio: /cardio|laufband|rudererg|fahrrad|seilspring|jumping|burpee|high.?knee|box.?jump|skater/i,
};

function detectMuscleGroups(name: string): string[] {
  const groups: string[] = [];
  for (const [group, pattern] of Object.entries(MUSCLE_PATTERNS)) {
    if (pattern.test(name)) groups.push(group);
  }
  return groups;
}

// Push/Pull classification
const PUSH_PATTERN = /push.?up|liegestütz|bankdrück|bench|dips|press|schulterdrück|pike|decline|diamond|trizeps|pushdown|thruster/i;
const PULL_PATTERN = /row|rudern|klimmzug|pulldown|pull.?up|curl|bizeps|face.?pull|reverse.?fly|body.?saw/i;

function getMovementType(name: string): 'push' | 'pull' | 'legs' | 'other' {
  if (PUSH_PATTERN.test(name)) return 'push';
  if (PULL_PATTERN.test(name)) return 'pull';
  if (MUSCLE_PATTERNS.beine.test(name)) return 'legs';
  return 'other';
}

export function analyzeTraining(stations: StationConfig[]): TrainingWarning[] {
  const warnings: TrainingWarning[] = [];
  const warmupStations = stations.filter((s) => s.isWarmup);
  const kraftStations = stations.filter((s) => !s.isWarmup);

  if (kraftStations.length === 0) return warnings;

  // Rule 1: Check for consecutive same muscle group
  for (let i = 1; i < kraftStations.length; i++) {
    const prevGroups = detectMuscleGroups(kraftStations[i - 1].name);
    const currGroups = detectMuscleGroups(kraftStations[i].name);
    const overlap = prevGroups.filter((g) => currGroups.includes(g) && g !== 'cardio');
    if (overlap.length > 0 && overlap[0] !== 'core') {
      warnings.push({
        type: 'warning',
        message: `"${kraftStations[i - 1].name}" und "${kraftStations[i].name}" trainieren beide ${overlap[0]} — besser abwechseln für mehr Erholung.`,
      });
    }
  }

  // Rule 2: Check for consecutive push or pull
  for (let i = 1; i < kraftStations.length; i++) {
    const prevType = getMovementType(kraftStations[i - 1].name);
    const currType = getMovementType(kraftStations[i].name);
    if (prevType === currType && (prevType === 'push' || prevType === 'pull')) {
      warnings.push({
        type: 'info',
        message: `"${kraftStations[i - 1].name}" und "${kraftStations[i].name}" sind beide ${prevType === 'push' ? 'Drück' : 'Zug'}-Übungen — Push/Pull abwechseln verbessert die Leistung.`,
      });
    }
  }

  // Rule 3: Check warmup matches strength muscle groups
  if (warmupStations.length > 0 && kraftStations.length > 0) {
    const kraftMuscles = new Set(kraftStations.flatMap((s) => detectMuscleGroups(s.name)));
    const warmupMuscles = new Set(warmupStations.flatMap((s) => detectMuscleGroups(s.name)));

    // Remove generic groups
    kraftMuscles.delete('cardio');
    warmupMuscles.delete('cardio');

    const uncovered = [...kraftMuscles].filter((m) => !warmupMuscles.has(m));
    if (uncovered.length > 0 && kraftMuscles.size > 0) {
      const missing = uncovered.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(', ');
      warnings.push({
        type: 'info',
        message: `Warmup deckt nicht alle Kraftübungs-Muskelgruppen ab. Nicht aufgewärmt: ${missing}.`,
      });
    }
  }

  // Rule 4: No warmup at all
  if (warmupStations.length === 0 && kraftStations.length > 0) {
    warnings.push({
      type: 'warning',
      message: 'Kein Aufwärmen geplant — ein Warmup reduziert das Verletzungsrisiko erheblich.',
    });
  }

  // Rule 5: Very short work time
  for (const s of kraftStations) {
    if (s.workSeconds < 15) {
      warnings.push({
        type: 'info',
        message: `"${s.name}" hat nur ${s.workSeconds}s — unter 15s ist sehr kurz für eine effektive Belastung.`,
      });
    }
  }

  return warnings;
}
