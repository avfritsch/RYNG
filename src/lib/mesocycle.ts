import type { MesocycleConfig } from '../types/database.ts';

export interface ProgressionResult {
  work: number;
  pause: number;
  label: string;
}

/**
 * Apply mesocycle progression multipliers to base work/pause times.
 */
export function applyProgression(
  baseWork: number,
  basePause: number,
  currentWeek: number,
  config: MesocycleConfig,
): ProgressionResult {
  const weekKey = `week${currentWeek}`;
  const weekConfig = config.progression[weekKey];

  if (!weekConfig) {
    return { work: baseWork, pause: basePause, label: 'Basis' };
  }

  return {
    work: Math.round(baseWork * weekConfig.workMultiplier),
    pause: Math.round(basePause * weekConfig.pauseMultiplier),
    label: weekConfig.label,
  };
}

/**
 * Advance the mesocycle to the next week. Wraps around at cycle_length.
 */
export function advanceWeek(config: MesocycleConfig): Partial<MesocycleConfig> {
  const nextWeek = config.current_week >= config.cycle_length
    ? 1
    : config.current_week + 1;

  const updates: Partial<MesocycleConfig> = {
    current_week: nextWeek,
    updated_at: new Date().toISOString(),
  };

  // Reset cycle_start when wrapping around
  if (nextWeek === 1) {
    updates.cycle_start = new Date().toISOString().slice(0, 10);
  }

  return updates;
}

/**
 * Get a human-readable summary of the current mesocycle state.
 */
export function getMesocycleSummary(config: MesocycleConfig): {
  weekLabel: string;
  weekNumber: number;
  totalWeeks: number;
  isDeload: boolean;
} {
  const weekKey = `week${config.current_week}`;
  const weekConfig = config.progression[weekKey];
  const label = weekConfig?.label ?? 'Basis';

  return {
    weekLabel: label,
    weekNumber: config.current_week,
    totalWeeks: config.cycle_length,
    isDeload: (weekConfig?.workMultiplier ?? 1) < 1,
  };
}

/**
 * Default progression config for a new mesocycle.
 */
export const defaultProgression: MesocycleConfig['progression'] = {
  week1: { workMultiplier: 1.0, pauseMultiplier: 1.0, label: 'Basis' },
  week2: { workMultiplier: 1.0, pauseMultiplier: 1.0, label: 'Basis' },
  week3: { workMultiplier: 1.11, pauseMultiplier: 0.83, label: 'Intensiv' },
  week4: { workMultiplier: 0.78, pauseMultiplier: 1.0, label: 'Deload' },
};
