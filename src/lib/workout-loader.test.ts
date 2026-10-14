import { describe, it, expect, vi } from 'vitest';

vi.mock('./supabase.ts', () => ({ supabase: {} }));

const { planExerciseToStation, planDayToConfig, sessionEntriesToConfig } = await import('./workout-loader.ts');
import type { PlanExercise } from '../types/plan.ts';

function ex(overrides: Partial<PlanExercise> = {}): PlanExercise {
  return {
    id: 'e1',
    day_id: 'd1',
    name: 'KH-Bankdrücken',
    speech_name: 'Kurzhantel-Bankdrücken',
    muscle_groups: ['Brust'],
    howto: 'Flach liegen',
    illustration_key: 'db-bench',
    animation_key: null,
    is_warmup: false,
    work_seconds: 45,
    pause_seconds: 30,
    track_weight: true,
    sort_order: 0,
    created_at: '',
    ...overrides,
  };
}

describe('workout-loader', () => {
  it('maps every plan exercise field the timer needs', () => {
    expect(planExerciseToStation(ex())).toEqual({
      name: 'KH-Bankdrücken',
      speechName: 'Kurzhantel-Bankdrücken',
      muscleGroups: ['Brust'],
      workSeconds: 45,
      pauseSeconds: 30,
      isWarmup: false,
      howto: 'Flach liegen',
      illustrationKey: 'db-bench',
      trackWeight: true,
    });
  });

  it('carries the plan day id into the config', () => {
    const config = planDayToConfig({ id: 'd1', rounds: 4, round_pause: 60 }, [ex()]);
    expect(config).toMatchObject({ rounds: 4, roundPause: 60, planDayId: 'd1' });
    expect(config.stations).toHaveLength(1);
  });

  it('rebuilds a circuit from entries, one station per index, in order', () => {
    const config = sessionEntriesToConfig({ rounds: 2 }, [
      { station_index: 1, station_name: 'B', is_warmup: false, work_seconds: 40 },
      { station_index: 0, station_name: 'A', is_warmup: true, work_seconds: 30 },
      { station_index: 1, station_name: 'B', is_warmup: false, work_seconds: 40 },
    ]);
    expect(config?.stations.map((s) => s.name)).toEqual(['A', 'B']);
    expect(config?.rounds).toBe(2);
  });

  it('refuses to turn a gym session into a circuit', () => {
    expect(sessionEntriesToConfig({ rounds: 1 }, [
      { station_index: 0, station_name: 'Bench', is_warmup: false, work_seconds: 0 },
    ])).toBeNull();
  });
});
