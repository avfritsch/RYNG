import { describe, it, expect } from 'vitest';
import { applyProgression, advanceWeek, getMesocycleSummary, defaultProgression } from './mesocycle.ts';
import type { MesocycleConfig } from '../types/database.ts';

function makeConfig(overrides?: Partial<MesocycleConfig>): MesocycleConfig {
  return {
    id: '1',
    user_id: 'u1',
    cycle_length: 4,
    current_week: 1,
    cycle_start: '2026-01-01',
    progression: defaultProgression,
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('mesocycle: applyProgression', () => {
  it('returns base values for week 1', () => {
    const result = applyProgression(45, 30, 1, makeConfig());
    expect(result.work).toBe(45);
    expect(result.pause).toBe(30);
    expect(result.label).toBe('Basis');
  });

  it('applies intensiv multipliers for week 3', () => {
    const result = applyProgression(45, 30, 3, makeConfig());
    // week3: work × 1.11, pause × 0.83
    expect(result.work).toBe(Math.round(45 * 1.11)); // 50
    expect(result.pause).toBe(Math.round(30 * 0.83)); // 25
    expect(result.label).toBe('Intensiv');
  });

  it('applies deload multipliers for week 4', () => {
    const result = applyProgression(45, 30, 4, makeConfig());
    // week4: work × 0.78, pause × 1.0
    expect(result.work).toBe(Math.round(45 * 0.78)); // 35
    expect(result.pause).toBe(30);
    expect(result.label).toBe('Deload');
  });

  it('returns base for non-existent week', () => {
    const result = applyProgression(45, 30, 99, makeConfig());
    expect(result.work).toBe(45);
    expect(result.pause).toBe(30);
    expect(result.label).toBe('Basis');
  });

  it('rounds correctly', () => {
    // 47 × 1.11 = 52.17 → 52
    const result = applyProgression(47, 33, 3, makeConfig());
    expect(result.work).toBe(52);
    expect(result.pause).toBe(Math.round(33 * 0.83)); // 27.39 → 27
  });
});

describe('mesocycle: advanceWeek', () => {
  it('advances from week 1 to 2', () => {
    const updates = advanceWeek(makeConfig({ current_week: 1 }));
    expect(updates.current_week).toBe(2);
    expect(updates.cycle_start).toBeUndefined(); // no wrap
  });

  it('wraps from last week to 1', () => {
    const updates = advanceWeek(makeConfig({ current_week: 4, cycle_length: 4 }));
    expect(updates.current_week).toBe(1);
    expect(updates.cycle_start).toBeDefined(); // reset
  });

  it('sets updated_at', () => {
    const updates = advanceWeek(makeConfig());
    expect(updates.updated_at).toBeDefined();
  });
});

describe('mesocycle: getMesocycleSummary', () => {
  it('returns correct summary for week 1', () => {
    const summary = getMesocycleSummary(makeConfig({ current_week: 1 }));
    expect(summary.weekLabel).toBe('Basis');
    expect(summary.weekNumber).toBe(1);
    expect(summary.totalWeeks).toBe(4);
    expect(summary.isDeload).toBe(false);
  });

  it('detects deload week', () => {
    const summary = getMesocycleSummary(makeConfig({ current_week: 4 }));
    expect(summary.isDeload).toBe(true);
    expect(summary.weekLabel).toBe('Deload');
  });

  it('detects intensiv week is not deload', () => {
    const summary = getMesocycleSummary(makeConfig({ current_week: 3 }));
    expect(summary.isDeload).toBe(false);
    expect(summary.weekLabel).toBe('Intensiv');
  });

  it('falls back to Basis for unknown week', () => {
    const summary = getMesocycleSummary(makeConfig({ current_week: 99 }));
    expect(summary.weekLabel).toBe('Basis');
    expect(summary.isDeload).toBe(false);
  });
});
