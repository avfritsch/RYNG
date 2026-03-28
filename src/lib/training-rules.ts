import type { StationConfig } from '../types/timer.ts';

export interface TrainingWarning {
  type: 'info' | 'warning';
  message: string;
}

// ── Muscle → Region mapping ──

type Region = 'push' | 'pull' | 'core' | 'beine';

const MUSCLE_TO_REGION: Record<string, Region[]> = {
  brust:           ['push'],
  schultern:       ['push'],
  trizeps:         ['push'],
  latissimus:      ['pull'],
  'oberer rücken': ['pull'],
  'hint. schulter':['pull'],
  bizeps:          ['pull'],
  core:            ['core'],
  hüfte:           ['core', 'beine'],
  'unterer rücken':['core'],
  quadrizeps:      ['beine'],
  hamstrings:      ['beine'],
  gesäß:           ['beine'],
  waden:           ['beine'],
  adduktoren:      ['beine'],
  // "ganzkörper" covers all regions
  ganzkörper:      ['push', 'pull', 'core', 'beine'],
};

const REGION_LABELS: Record<Region, string> = {
  push: 'Push (Brust/Schultern/Trizeps)',
  pull: 'Pull (Rücken/Bizeps)',
  core: 'Core (Rumpf/Hüfte)',
  beine: 'Beine',
};

// ── Exercise name → specific muscles ──

const MUSCLE_PATTERNS: [RegExp, string[]][] = [
  // Push muscles
  [/bankdrück|bench|brust/i,                                     ['brust']],
  [/push.?up|liegestütz/i,                                       ['brust', 'schultern', 'trizeps']],
  [/schulterdrück|shoulder.?press|military|pike/i,               ['schultern']],
  [/seitheben|lateral/i,                                          ['schultern']],
  [/schulterkreis|arm.?circle|scap/i,                            ['schultern']],
  [/dips/i,                                                       ['brust', 'trizeps']],
  [/trizeps|pushdown|diamond|french|skull/i,                     ['trizeps']],
  [/decline/i,                                                    ['brust']],
  [/pallof/i,                                                     ['core']],
  [/thruster/i,                                                   ['schultern', 'quadrizeps']],

  // Pull muscles
  [/klimmzug|pulldown|pull.?up|lat\b/i,                         ['latissimus']],
  [/row|rudern/i,                                                 ['oberer rücken']],
  [/face.?pull|reverse.?fly/i,                                   ['hint. schulter']],
  [/curl|bizeps|bicep|hammer/i,                                  ['bizeps']],
  [/pull.?apart/i,                                                ['oberer rücken', 'hint. schulter']],
  [/body.?saw/i,                                                  ['core']],
  [/superman|snow.?angel/i,                                      ['unterer rücken']],

  // Core
  [/plank|crunch|russian|dead.?bug|hollow|mountain|woodchop|holzhacker/i, ['core']],
  [/cat.?cow|thoracic/i,                                         ['core', 'unterer rücken']],

  // Beine
  [/squat|kniebeug|goblet/i,                                     ['quadrizeps', 'gesäß']],
  [/lunge|ausfallschritt/i,                                      ['quadrizeps', 'gesäß']],
  [/deadlift|kreuzheben/i,                                       ['hamstrings', 'gesäß', 'unterer rücken']],
  [/bulgarian|split/i,                                            ['quadrizeps', 'gesäß']],
  [/leg.?curl|beinbeug/i,                                        ['hamstrings']],
  [/wadenheb|calf/i,                                              ['waden']],
  [/glute.?bridge|hip.?thrust/i,                                 ['gesäß']],
  [/wall.?sit/i,                                                  ['quadrizeps']],
  [/sumo/i,                                                       ['adduktoren', 'quadrizeps']],
  [/swing|kettlebell/i,                                           ['gesäß', 'hamstrings']],
  [/leg.?swing/i,                                                 ['hüfte']],
  [/crab.?walk/i,                                                 ['gesäß', 'hüfte']],
  [/sprunggelenk|ankle/i,                                        ['waden']],
  [/jump|box|skater/i,                                            ['quadrizeps', 'waden']],
  [/high.?knee/i,                                                 ['hüfte', 'quadrizeps']],

  // Ganzkörper
  [/burpee|inchworm/i,                                            ['ganzkörper']],
  [/renegade/i,                                                   ['brust', 'oberer rücken', 'core']],
  [/world.?s?.?greatest/i,                                       ['hüfte', 'schultern', 'core']],

  // Stretching / Mobility (map to the muscle they target)
  [/hip.?90|hip.?stretch|pigeon|hüft/i,                         ['hüfte']],
  [/foam.?roll/i,                                                 ['oberer rücken']],
  [/hamstring.?stretch/i,                                         ['hamstrings']],
  [/shoulder.?dislocate|band.?dislocate/i,                       ['schultern']],
  [/wrist|handgelenk/i,                                           []],  // no region

  // Cardio — no muscle regions (general warm-up only)
  [/laufband|rudererg|crosstrainer|fahrrad|seilspring|jumping.?jack|cardio/i, []],
];

function detectMuscles(name: string): string[] {
  const muscles = new Set<string>();
  for (const [pattern, groups] of MUSCLE_PATTERNS) {
    if (pattern.test(name)) {
      groups.forEach((g) => muscles.add(g));
    }
  }
  return [...muscles];
}

function musclesToRegions(muscles: string[]): Set<Region> {
  const regions = new Set<Region>();
  for (const muscle of muscles) {
    const mapped = MUSCLE_TO_REGION[muscle];
    if (mapped) mapped.forEach((r) => regions.add(r));
  }
  return regions;
}

// ── Push/Pull for consecutive exercise check ──

function getMovementType(name: string): 'push' | 'pull' | 'legs' | 'core' | 'other' {
  const regions = musclesToRegions(detectMuscles(name));
  if (regions.has('push') && !regions.has('pull') && !regions.has('beine')) return 'push';
  if (regions.has('pull') && !regions.has('push') && !regions.has('beine')) return 'pull';
  if (regions.has('beine') && !regions.has('push') && !regions.has('pull')) return 'legs';
  if (regions.has('core') && regions.size === 1) return 'core';
  return 'other';
}

// ── Analysis ──

export function analyzeTraining(stations: StationConfig[]): TrainingWarning[] {
  const warnings: TrainingWarning[] = [];
  const warmupStations = stations.filter((s) => s.isWarmup);
  const kraftStations = stations.filter((s) => !s.isWarmup);

  if (kraftStations.length === 0) return warnings;

  // Rule 1: Consecutive same region (except core which is OK to repeat)
  for (let i = 1; i < kraftStations.length; i++) {
    const prevRegions = musclesToRegions(detectMuscles(kraftStations[i - 1].name));
    const currRegions = musclesToRegions(detectMuscles(kraftStations[i].name));
    for (const region of prevRegions) {
      if (region !== 'core' && currRegions.has(region)) {
        warnings.push({
          type: 'warning',
          message: `"${kraftStations[i - 1].name}" und "${kraftStations[i].name}" belasten beide ${REGION_LABELS[region]} — besser abwechseln.`,
        });
        break; // one warning per pair
      }
    }
  }

  // Rule 2: Consecutive push or pull
  for (let i = 1; i < kraftStations.length; i++) {
    const prevType = getMovementType(kraftStations[i - 1].name);
    const currType = getMovementType(kraftStations[i].name);
    if (prevType === currType && (prevType === 'push' || prevType === 'pull')) {
      warnings.push({
        type: 'info',
        message: `"${kraftStations[i - 1].name}" und "${kraftStations[i].name}" sind beide ${prevType === 'push' ? 'Drück' : 'Zug'}-Übungen — abwechseln verbessert die Leistung.`,
      });
    }
  }

  // Rule 3: Warmup coverage at region level
  if (warmupStations.length > 0 && kraftStations.length > 0) {
    const kraftRegions = new Set<Region>();
    for (const s of kraftStations) {
      musclesToRegions(detectMuscles(s.name)).forEach((r) => kraftRegions.add(r));
    }

    const warmupRegions = new Set<Region>();
    for (const s of warmupStations) {
      musclesToRegions(detectMuscles(s.name)).forEach((r) => warmupRegions.add(r));
    }

    const uncovered = [...kraftRegions].filter((r) => !warmupRegions.has(r));
    if (uncovered.length > 0) {
      const labels = uncovered.map((r) => REGION_LABELS[r]).join(', ');
      warnings.push({
        type: 'info',
        message: `Warmup deckt nicht alle Bereiche ab. Nicht aufgewärmt: ${labels}.`,
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
