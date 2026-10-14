import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTimerEngine } from './timer-engine.ts';
import type { TimerConfig, TimerState } from '../types/timer.ts';

// Stub Web Audio API
beforeEach(() => {
  vi.stubGlobal('AudioContext', class {
    state = 'running';
    resume() {}
    createOscillator() {
      return {
        connect: vi.fn(),
        frequency: { value: 0 },
        start: vi.fn(),
        stop: vi.fn(),
      };
    }
    createGain() {
      return {
        connect: vi.fn(),
        gain: { value: 0, exponentialRampToValueAtTime: vi.fn() },
      };
    }
    createBuffer() { return {}; }
    createBufferSource() {
      return { buffer: null, connect: vi.fn(), start: vi.fn() };
    }
    get destination() { return {}; }
    get currentTime() { return 0; }
  });

  // Stub Wake Lock
  vi.stubGlobal('navigator', {
    ...globalThis.navigator,
    wakeLock: { request: vi.fn().mockResolvedValue({ release: vi.fn() }) },
  });
});

function makeConfig(overrides?: Partial<TimerConfig>): TimerConfig {
  return {
    stations: [
      { name: 'Squats', workSeconds: 5, pauseSeconds: 3, isWarmup: false, howto: '' },
      { name: 'Push-Ups', workSeconds: 5, pauseSeconds: 3, isWarmup: false, howto: '' },
    ],
    rounds: 2,
    roundPause: 4,
    ...overrides,
  };
}

function collectStates(engine: ReturnType<typeof createTimerEngine>): TimerState[] {
  const states: TimerState[] = [];
  engine.onTick((s) => states.push({ ...s }));
  return states;
}

function tickEngine(_engine: ReturnType<typeof createTimerEngine>, ticks: number) {
  // Simulate ticks by advancing the interval
  for (let i = 0; i < ticks; i++) {
    // Access the internal tick via the interval mechanism
    vi.advanceTimersByTime(1000);
  }
}

// ============================================
// Sequence Construction Tests
// ============================================

describe('timer-engine sequence construction', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('starts in idle phase', () => {
    const engine = createTimerEngine(makeConfig());
    const state = engine.getState();
    expect(state.phase).toBe('idle');
    expect(state.isRunning).toBe(false);
  });

  it('begins with first station work phase on start', () => {
    const engine = createTimerEngine(makeConfig());
    const states = collectStates(engine);
    engine.start();

    const last = states[states.length - 1];
    expect(last.phase).toBe('work');
    expect(last.station).toBe(1); // 1-based
    expect(last.round).toBe(1);
    expect(last.isRunning).toBe(true);
    expect(last.currentSec).toBe(5);
  });

  it('handles warmup stations before kraft stations', () => {
    const config = makeConfig({
      stations: [
        { name: 'Jumping Jacks', workSeconds: 3, pauseSeconds: 2, isWarmup: true, howto: '' },
        { name: 'Squats', workSeconds: 5, pauseSeconds: 3, isWarmup: false, howto: '' },
      ],
      rounds: 1,
    });
    const engine = createTimerEngine(config);
    const states = collectStates(engine);
    engine.start();

    // First phase should be warmup
    expect(states[states.length - 1].phase).toBe('warmup');
    expect(states[states.length - 1].station).toBe(1);
  });

  it('handles empty config gracefully', () => {
    const engine = createTimerEngine({ stations: [], rounds: 1, roundPause: 0 });
    engine.start();
    const state = engine.getState();
    // Should not crash; remains idle or done
    expect(['idle', 'done']).toContain(state.phase);
  });
});

// ============================================
// Phase Progression Tests
// ============================================

describe('timer-engine phase progression', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('transitions from work to pause after countdown', () => {
    const config = makeConfig({
      stations: [
        { name: 'Squats', workSeconds: 3, pauseSeconds: 2, isWarmup: false, howto: '' },
      ],
      rounds: 1,
      roundPause: 0,
    });
    const engine = createTimerEngine(config);
    const states = collectStates(engine);
    engine.start();

    // Tick 3 seconds (work phase)
    tickEngine(engine, 3);

    // After work ends: should NOT have pause since it's last station of last round
    // (pause is skipped for last station)
    const last = states[states.length - 1];
    expect(last.phase).toBe('done');
  });

  it('inserts round pause between rounds', () => {
    const config = makeConfig({
      stations: [
        { name: 'Squats', workSeconds: 2, pauseSeconds: 0, isWarmup: false, howto: '' },
      ],
      rounds: 2,
      roundPause: 3,
    });
    const engine = createTimerEngine(config);
    const states = collectStates(engine);
    engine.start();

    // Tick through first work phase (2s)
    tickEngine(engine, 2);

    // Should now be in roundPause
    const afterWork = states[states.length - 1];
    expect(afterWork.phase).toBe('roundPause');
    expect(afterWork.currentSec).toBe(3);

    // Tick through roundPause (3s)
    tickEngine(engine, 3);

    // Should now be in work phase, round 2
    const afterRoundPause = states[states.length - 1];
    expect(afterRoundPause.phase).toBe('work');
    expect(afterRoundPause.round).toBe(2);
  });

  it('reaches done after all rounds complete', () => {
    const config = makeConfig({
      stations: [
        { name: 'Squats', workSeconds: 2, pauseSeconds: 0, isWarmup: false, howto: '' },
      ],
      rounds: 2,
      roundPause: 1,
    });
    const engine = createTimerEngine(config);
    const states = collectStates(engine);
    engine.start();

    // Round 1: work(2s) + roundPause(1s) + Round 2: work(2s) = 5s total
    tickEngine(engine, 5);

    const last = states[states.length - 1];
    expect(last.phase).toBe('done');
    expect(last.isRunning).toBe(false);
  });

  it('skips station pause for last station of round with roundPause', () => {
    const config = makeConfig({
      stations: [
        { name: 'A', workSeconds: 2, pauseSeconds: 5, isWarmup: false, howto: '' },
        { name: 'B', workSeconds: 2, pauseSeconds: 5, isWarmup: false, howto: '' },
      ],
      rounds: 2,
      roundPause: 3,
    });
    const engine = createTimerEngine(config);
    const states = collectStates(engine);
    engine.start();

    // A work(2) → A pause(5) → B work(2) → roundPause(3) (B's pause skipped)
    tickEngine(engine, 2); // A work done
    const afterAWork = states[states.length - 1];
    expect(afterAWork.phase).toBe('pause'); // A's pause

    tickEngine(engine, 5); // A pause done
    const afterAPause = states[states.length - 1];
    expect(afterAPause.phase).toBe('work'); // B work
    expect(afterAPause.station).toBe(2);

    tickEngine(engine, 2); // B work done
    const afterBWork = states[states.length - 1];
    expect(afterBWork.phase).toBe('roundPause'); // round pause, NOT B's station pause
  });
});

// ============================================
// Completion Summary Tests
// ============================================

describe('timer-engine completion summary', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('produces summary on normal completion', () => {
    const config = makeConfig({
      stations: [
        { name: 'Squats', workSeconds: 2, pauseSeconds: 0, isWarmup: false, howto: '' },
      ],
      rounds: 1,
      roundPause: 0,
    });
    const engine = createTimerEngine(config);
    engine.start();
    tickEngine(engine, 2);

    const summary = engine.getCompletionSummary();
    expect(summary).not.toBeNull();
    expect(summary!.stationsDone).toBe(1);
    expect(summary!.roundsDone).toBe(1);
    expect(summary!.totalSeconds).toBeGreaterThanOrEqual(0);
  });

  it('produces summary on manual stop', () => {
    const config = makeConfig({
      stations: [
        { name: 'Squats', workSeconds: 10, pauseSeconds: 0, isWarmup: false, howto: '' },
      ],
      rounds: 2,
      roundPause: 0,
    });
    const engine = createTimerEngine(config);
    engine.start();
    tickEngine(engine, 3); // Stop mid-exercise

    const summary = engine.stop();
    expect(summary.totalSeconds).toBeGreaterThanOrEqual(0);
    expect(summary.roundsDone).toBe(1);
  });

  it('counts warmup + kraft stations correctly', () => {
    const config = makeConfig({
      stations: [
        { name: 'Warmup', workSeconds: 2, pauseSeconds: 0, isWarmup: true, howto: '' },
        { name: 'Squats', workSeconds: 2, pauseSeconds: 0, isWarmup: false, howto: '' },
      ],
      rounds: 2,
      roundPause: 0,
    });
    const engine = createTimerEngine(config);
    engine.start();

    // Warmup(2) + Squats R1(2) + Squats R2(2) = 6
    tickEngine(engine, 6);

    const summary = engine.getCompletionSummary();
    expect(summary).not.toBeNull();
    expect(summary!.stationsDone).toBe(2); // warmup + squats
  });

  it('returns null before completion', () => {
    const engine = createTimerEngine(makeConfig());
    expect(engine.getCompletionSummary()).toBeNull();
    engine.start();
    expect(engine.getCompletionSummary()).toBeNull();
  });
});

// ============================================
// Pause / Resume Tests
// ============================================

describe('timer-engine pause/resume', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('pauses the countdown', () => {
    const engine = createTimerEngine(makeConfig());
    const states = collectStates(engine);
    engine.start();

    tickEngine(engine, 2);
    engine.pause();
    const pausedSec = states[states.length - 1].currentSec;

    tickEngine(engine, 5); // Time passes but should not count
    expect(states[states.length - 1].currentSec).toBe(pausedSec);
    expect(states[states.length - 1].isPaused).toBe(true);
  });

  it('resumes after pause', () => {
    const engine = createTimerEngine(makeConfig());
    const states = collectStates(engine);
    engine.start();

    tickEngine(engine, 1);
    engine.pause();
    const secBefore = states[states.length - 1].currentSec;

    engine.resume();
    tickEngine(engine, 1);
    const secAfter = states[states.length - 1].currentSec;

    expect(secAfter).toBe(secBefore - 1);
    expect(states[states.length - 1].isPaused).toBe(false);
  });
});

// ============================================
// Skip Forward / Back Tests
// ============================================

describe('timer-engine skip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('skip forward advances to next phase', () => {
    const config = makeConfig({
      stations: [
        { name: 'A', workSeconds: 10, pauseSeconds: 5, isWarmup: false, howto: '' },
        { name: 'B', workSeconds: 10, pauseSeconds: 5, isWarmup: false, howto: '' },
      ],
      rounds: 1,
      roundPause: 0,
    });
    const engine = createTimerEngine(config);
    const states = collectStates(engine);
    engine.start();

    // Currently in A work phase
    engine.skipForward();

    // Should be in A pause now
    const last = states[states.length - 1];
    expect(last.phase).toBe('pause');
  });

  it('skip back restarts current phase if > 2s in', () => {
    const config = makeConfig({
      stations: [
        { name: 'A', workSeconds: 10, pauseSeconds: 0, isWarmup: false, howto: '' },
      ],
      rounds: 1,
      roundPause: 0,
    });
    const engine = createTimerEngine(config);
    const states = collectStates(engine);
    engine.start();

    tickEngine(engine, 5); // 5s into 10s work phase
    engine.skipBack();

    // Should restart same phase from beginning
    const last = states[states.length - 1];
    expect(last.phase).toBe('work');
    expect(last.currentSec).toBe(10);
  });
});

// ============================================
// Countdown Beep Timing Tests
// ============================================

describe('timer-engine countdown beeps', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('ticks down correctly each second', () => {
    const config = makeConfig({
      stations: [
        { name: 'A', workSeconds: 5, pauseSeconds: 0, isWarmup: false, howto: '' },
      ],
      rounds: 1,
      roundPause: 0,
    });
    const engine = createTimerEngine(config);
    const states = collectStates(engine);
    engine.start();

    // Initial state: currentSec = 5
    expect(states[states.length - 1].currentSec).toBe(5);

    tickEngine(engine, 1);
    expect(states[states.length - 1].currentSec).toBe(4);

    tickEngine(engine, 1);
    expect(states[states.length - 1].currentSec).toBe(3);

    tickEngine(engine, 1);
    expect(states[states.length - 1].currentSec).toBe(2);

    tickEngine(engine, 1);
    expect(states[states.length - 1].currentSec).toBe(1);

    tickEngine(engine, 1);
    // Should have transitioned to done
    expect(states[states.length - 1].phase).toBe('done');
  });
});

// ============================================
// Wall-clock, entries, pause accounting, restore
// ============================================

describe('timer-engine wall clock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('records an entry for every completed work phase, including the last one', () => {
    const engine = createTimerEngine(makeConfig({
      stations: [
        { name: 'A', workSeconds: 2, pauseSeconds: 1, isWarmup: false, howto: '' },
        { name: 'B', workSeconds: 2, pauseSeconds: 1, isWarmup: false, howto: '' },
      ],
      rounds: 2,
      roundPause: 1,
    }));
    const entries: { stationIndex: number; round: number; actualSeconds: number }[] = [];
    engine.onEntry((e) => entries.push(e));
    engine.start();
    // A2 P1 B2 RP1 A2 P1 B2 = 11s
    vi.advanceTimersByTime(11_000);

    expect(engine.getState().phase).toBe('done');
    expect(entries.map((e) => `${e.stationIndex}-${e.round}`)).toEqual(['0-1', '1-1', '0-2', '1-2']);
    expect(entries.every((e) => e.actualSeconds === 2)).toBe(true);
    expect(engine.getCompletionSummary()).toMatchObject({ stationsDone: 2, roundsDone: 2 });
  });

  it('catches up correctly when ticks were suspended (backgrounded tab)', () => {
    const engine = createTimerEngine(makeConfig({
      stations: [
        { name: 'A', workSeconds: 10, pauseSeconds: 5, isWarmup: false, howto: '' },
        { name: 'B', workSeconds: 10, pauseSeconds: 5, isWarmup: false, howto: '' },
      ],
      rounds: 1,
      roundPause: 0,
    }));
    engine.start();
    // Simulate the browser not firing intervals for 17s: move the clock only.
    vi.setSystemTime(Date.now() + 17_000);
    engine.sync();

    const s = engine.getState();
    expect(s.phase).toBe('work');
    expect(s.station).toBe(2);
    expect(s.currentSec).toBe(8);
  });

  it('excludes paused time from the session duration', () => {
    const engine = createTimerEngine(makeConfig({
      stations: [{ name: 'A', workSeconds: 60, pauseSeconds: 0, isWarmup: false, howto: '' }],
      rounds: 1,
      roundPause: 0,
    }));
    engine.start();
    vi.advanceTimersByTime(10_000);
    engine.pause();
    vi.advanceTimersByTime(300_000);
    engine.resume();
    vi.advanceTimersByTime(5_000);
    const summary = engine.stop();
    expect(summary.totalSeconds).toBe(15);
    expect(summary.stationsDone).toBe(1);
  });

  it('records a partial entry on skip forward but not on skip back', () => {
    const engine = createTimerEngine(makeConfig({
      stations: [
        { name: 'A', workSeconds: 30, pauseSeconds: 0, isWarmup: false, howto: '' },
        { name: 'B', workSeconds: 30, pauseSeconds: 0, isWarmup: false, howto: '' },
      ],
      rounds: 1,
      roundPause: 0,
    }));
    const entries: { stationIndex: number; actualSeconds: number }[] = [];
    engine.onEntry((e) => entries.push(e));
    engine.start();
    vi.advanceTimersByTime(12_000);
    engine.skipForward();
    expect(entries).toEqual([expect.objectContaining({ stationIndex: 0, actualSeconds: 12 })]);
    engine.skipBack();
    expect(entries).toHaveLength(1);
  });

  it('exposes the next station, including across rounds', () => {
    const engine = createTimerEngine(makeConfig({
      stations: [
        { name: 'A', workSeconds: 2, pauseSeconds: 0, isWarmup: false, howto: '' },
        { name: 'B', workSeconds: 2, pauseSeconds: 0, isWarmup: false, howto: '' },
      ],
      rounds: 2,
      roundPause: 3,
    }));
    engine.start();
    expect(engine.getState()).toMatchObject({ station: 1, nextStation: 2, nextIsNewRound: false });
    vi.advanceTimersByTime(2_000);
    expect(engine.getState()).toMatchObject({ station: 2, nextStation: 1, nextIsNewRound: true });
  });

  it('restores from a snapshot paused, counting downtime as pause', () => {
    const config = makeConfig({
      stations: [{ name: 'A', workSeconds: 60, pauseSeconds: 0, isWarmup: false, howto: '' }],
      rounds: 1,
      roundPause: 0,
    });
    const first = createTimerEngine(config);
    first.start();
    vi.advanceTimersByTime(20_000);
    const snap = first.snapshot()!;
    first.dispose();

    vi.advanceTimersByTime(600_000); // app was closed for 10 min
    const restored = createTimerEngine(config, snap);
    expect(restored.getState()).toMatchObject({ isRunning: true, isPaused: true, currentSec: 40 });

    restored.resume();
    vi.advanceTimersByTime(5_000);
    expect(restored.getState().currentSec).toBe(35);
    expect(restored.stop().totalSeconds).toBe(25);
  });
});
