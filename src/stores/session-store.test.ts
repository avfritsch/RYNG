import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from './session-store.ts';

beforeEach(() => {
  useSessionStore.getState().reset();
});

describe('session-store', () => {
  it('starts with empty entries', () => {
    const state = useSessionStore.getState();
    expect(state.entries).toEqual([]);
    expect(state.startedAt).toBeNull();
  });

  it('start() clears entries and sets startedAt', () => {
    useSessionStore.getState().start();
    const state = useSessionStore.getState();
    expect(state.entries).toEqual([]);
    expect(state.startedAt).toBeGreaterThan(0);
  });

  it('addEntry() appends an entry', () => {
    const entry = {
      station_index: 0,
      station_name: 'Squats',
      is_warmup: false,
      work_seconds: 45,
      actual_seconds: 45,
      weight_kg: null,
      reps: null,
      notes: null,
      round_number: 1,
    };
    useSessionStore.getState().addEntry(entry);
    expect(useSessionStore.getState().entries).toHaveLength(1);
    expect(useSessionStore.getState().entries[0].station_name).toBe('Squats');
  });

  it('addEntry() preserves existing entries', () => {
    const entry1 = {
      station_index: 0,
      station_name: 'Squats',
      is_warmup: false,
      work_seconds: 45,
      actual_seconds: 45,
      weight_kg: null,
      reps: null,
      notes: null,
      round_number: 1,
    };
    const entry2 = {
      station_index: 1,
      station_name: 'Push-Ups',
      is_warmup: false,
      work_seconds: 30,
      actual_seconds: 30,
      weight_kg: null,
      reps: null,
      notes: null,
      round_number: 1,
    };
    useSessionStore.getState().addEntry(entry1);
    useSessionStore.getState().addEntry(entry2);
    expect(useSessionStore.getState().entries).toHaveLength(2);
  });

  it('updateLastEntry() patches weight and reps on matching entry', () => {
    const entry = {
      station_index: 0,
      station_name: 'Squats',
      is_warmup: false,
      work_seconds: 45,
      actual_seconds: 45,
      weight_kg: null,
      reps: null,
      notes: null,
      round_number: 1,
    };
    useSessionStore.getState().addEntry(entry);
    useSessionStore.getState().updateLastEntry(0, 1, { weight_kg: 20, reps: 12 });

    const updated = useSessionStore.getState().entries[0];
    expect(updated.weight_kg).toBe(20);
    expect(updated.reps).toBe(12);
    expect(updated.station_name).toBe('Squats'); // unchanged
  });

  it('updateLastEntry() updates the last matching entry when duplicates exist', () => {
    const base = {
      station_index: 0,
      station_name: 'Squats',
      is_warmup: false,
      work_seconds: 45,
      actual_seconds: 45,
      weight_kg: null,
      reps: null,
      notes: null,
    };
    useSessionStore.getState().addEntry({ ...base, round_number: 1 });
    useSessionStore.getState().addEntry({ ...base, round_number: 2 });

    // Update round 2 only
    useSessionStore.getState().updateLastEntry(0, 2, { weight_kg: 25 });

    const entries = useSessionStore.getState().entries;
    expect(entries[0].weight_kg).toBeNull(); // round 1 unchanged
    expect(entries[1].weight_kg).toBe(25); // round 2 updated
  });

  it('updateLastEntry() does nothing for non-existent entry', () => {
    const entry = {
      station_index: 0,
      station_name: 'Squats',
      is_warmup: false,
      work_seconds: 45,
      actual_seconds: 45,
      weight_kg: null,
      reps: null,
      notes: null,
      round_number: 1,
    };
    useSessionStore.getState().addEntry(entry);
    useSessionStore.getState().updateLastEntry(5, 99, { weight_kg: 100 });

    // Should not crash, entries unchanged
    expect(useSessionStore.getState().entries[0].weight_kg).toBeNull();
  });

  it('reset() clears everything', () => {
    useSessionStore.getState().start();
    useSessionStore.getState().addEntry({
      station_index: 0,
      station_name: 'Squats',
      is_warmup: false,
      work_seconds: 45,
      actual_seconds: 45,
      weight_kg: null,
      reps: null,
      notes: null,
      round_number: 1,
    });
    useSessionStore.getState().reset();

    const state = useSessionStore.getState();
    expect(state.entries).toEqual([]);
    expect(state.startedAt).toBeNull();
  });
});
