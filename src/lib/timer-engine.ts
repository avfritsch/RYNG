import type { TimerConfig, TimerState, TimerPhase, StationConfig } from '../types/timer.ts';
import { RESTART_THRESHOLD_SEC } from './constants.ts';

export type TimerCallback = (state: TimerState) => void;

export interface SessionSummary {
  totalSeconds: number;
  stationsDone: number;
  roundsDone: number;
}

/** A finished (or skipped/stopped) work or warmup phase. */
export interface CompletedEntry {
  stationIndex: number; // 0-based index into config.stations
  round: number;
  plannedSeconds: number;
  actualSeconds: number;
}

export type EntryCallback = (entry: CompletedEntry) => void;

/** Serializable engine state, used to survive a reload or app kill. */
export interface EngineSnapshot {
  seqIndex: number;
  phaseEndsAt: number | null;
  remainingMs: number;
  isPaused: boolean;
  startTime: number;
  pausedMs: number;
  pausedAt: number | null;
  savedAt: number;
}

export interface TimerEngine {
  start: () => void;
  pause: () => void;
  resume: () => void;
  skipForward: () => void;
  skipBack: () => void;
  stop: () => SessionSummary;
  onTick: (fn: TimerCallback) => void;
  onEntry: (fn: EntryCallback) => void;
  getState: () => TimerState;
  getCompletionSummary: () => SessionSummary | null;
  snapshot: () => EngineSnapshot | null;
  /** Re-sync with the wall clock immediately (e.g. when the tab becomes visible). */
  sync: () => void;
  dispose: () => void;
}

// --- Audio ---

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

/** Must be called from a user gesture (e.g. button click) to unlock audio on iOS */
export function unlockAudio() {
  try {
    const ctx = getAudioCtx();
    if (ctx.state !== 'running') {
      void ctx.resume();
    }
    // Play a silent buffer to fully unlock on iOS Safari
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start();
  } catch {
    // Audio not available
  }
}

function playTone(ctx: AudioContext, freq: number, duration: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.frequency.value = freq;
  gain.gain.value = 0.3;
  osc.start();
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
  osc.stop(ctx.currentTime + duration / 1000);
}

export function beep(freq = 880, duration = 150) {
  try {
    const ctx = getAudioCtx();
    // After an app switch the context can be 'suspended' or (iOS) 'interrupted'.
    // Wait for resume, otherwise the tone is silently dropped.
    if (ctx.state !== 'running') {
      ctx.resume().then(
        () => playTone(ctx, freq, duration),
        () => {},
      );
      return;
    }
    playTone(ctx, freq, duration);
  } catch {
    // Audio not available
  }
}

export function beepCountdown() {
  beep(660, 100);
}

export function beepPhaseChange() {
  beep(880, 200);
}

export function beepDone() {
  beep(1100, 300);
}

// --- Wake Lock ---

let wakeLock: WakeLockSentinel | null = null;

export async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator && !wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener?.('release', () => {
        wakeLock = null;
      });
    }
  } catch {
    // Wake Lock not available
  }
}

export async function releaseWakeLock() {
  try {
    await wakeLock?.release();
    wakeLock = null;
  } catch {
    // Ignore
  }
}

// --- Sequence ---

type SequenceEntry = {
  stationIndex: number; // index in config.stations
  station: StationConfig;
  phase: TimerPhase;
  duration: number;
  round: number;
};

export function buildSequence(config: TimerConfig): SequenceEntry[] {
  const { stations, rounds, roundPause } = config;
  const warmupStations = stations.filter((s) => s.isWarmup);
  const kraftStations = stations.filter((s) => !s.isWarmup);
  const sequence: SequenceEntry[] = [];

  // Warmup stations (round 1 only, no roundPause after)
  for (const ws of warmupStations) {
    const idx = stations.indexOf(ws);
    sequence.push({ stationIndex: idx, station: ws, phase: 'warmup', duration: ws.workSeconds, round: 1 });
    if (ws.pauseSeconds > 0) {
      sequence.push({ stationIndex: idx, station: ws, phase: 'pause', duration: ws.pauseSeconds, round: 1 });
    }
  }

  // Kraft stations x rounds
  for (let r = 1; r <= rounds; r++) {
    for (let i = 0; i < kraftStations.length; i++) {
      const ks = kraftStations[i];
      const idx = stations.indexOf(ks);
      sequence.push({ stationIndex: idx, station: ks, phase: 'work', duration: ks.workSeconds, round: r });
      // The last station of a round has no own pause: either the workout ends
      // or the round pause replaces it.
      const isLastInRound = i === kraftStations.length - 1;
      const isLastRound = r === rounds;
      const hasRoundPause = !isLastRound && roundPause > 0;
      const skipPause = isLastInRound && (isLastRound || hasRoundPause);
      if (!skipPause && ks.pauseSeconds > 0) {
        sequence.push({ stationIndex: idx, station: ks, phase: 'pause', duration: ks.pauseSeconds, round: r });
      }
    }
    if (r < rounds && roundPause > 0 && kraftStations.length > 0) {
      const lastKraft = kraftStations[kraftStations.length - 1];
      const idx = stations.indexOf(lastKraft);
      sequence.push({ stationIndex: idx, station: lastKraft, phase: 'roundPause', duration: roundPause, round: r });
    }
  }

  // Zero-length phases would loop instantly; drop them.
  return sequence.filter((e) => e.duration > 0);
}

const isActivePhase = (p: TimerPhase) => p === 'work' || p === 'warmup';

// --- Timer Engine ---

const TICK_MS = 250;

/**
 * Wall-clock based interval timer.
 *
 * Each phase has an absolute end time; ticks only *read* the clock, so the
 * countdown stays correct even if timers are throttled or suspended while the
 * page is in the background. Pause time is tracked separately and excluded
 * from the session duration.
 */
export function createTimerEngine(config: TimerConfig, restore?: EngineSnapshot): TimerEngine {
  const sequence = buildSequence(config);

  let seqIndex = 0;
  let phaseEndsAt: number | null = null; // absolute ms, when running
  let remainingMs = 0; // when paused
  let startTime = 0;
  let pausedMs = 0;
  let pausedAt: number | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let completionSummary: SessionSummary | null = null;
  const tickListeners: TimerCallback[] = [];
  const entryListeners: EntryCallback[] = [];
  const completed = new Map<string, CompletedEntry>();

  const state: TimerState = {
    phase: 'idle',
    station: 0,
    round: 0,
    currentSec: 0,
    phaseDuration: 0,
    isRunning: false,
    isPaused: false,
    nextStation: 0,
    nextIsNewRound: false,
  };

  function emit() {
    const snapshot = { ...state };
    tickListeners.forEach((fn) => fn(snapshot));
  }

  function clearTimer() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function startTimer() {
    clearTimer();
    intervalId = setInterval(sync, TICK_MS);
  }

  /** Remaining ms of the current phase at time `now`. */
  function remainingAt(now: number): number {
    if (state.isPaused || phaseEndsAt === null) return remainingMs;
    return Math.max(0, phaseEndsAt - now);
  }

  function recordCurrent(now: number) {
    const entry = sequence[seqIndex];
    if (!entry || !isActivePhase(entry.phase)) return;
    const elapsedSec = Math.round((entry.duration * 1000 - remainingAt(now)) / 1000);
    if (elapsedSec <= 0) return;
    const record: CompletedEntry = {
      stationIndex: entry.stationIndex,
      round: entry.round,
      plannedSeconds: entry.duration,
      actualSeconds: Math.min(entry.duration, elapsedSec),
    };
    completed.set(`${record.stationIndex}-${record.round}`, record);
    entryListeners.forEach((fn) => fn(record));
  }

  function updateNext() {
    state.nextStation = 0;
    state.nextIsNewRound = false;
    const current = sequence[seqIndex];
    for (let i = seqIndex + 1; i < sequence.length; i++) {
      if (isActivePhase(sequence[i].phase)) {
        state.nextStation = sequence[i].stationIndex + 1;
        state.nextIsNewRound = !!current && sequence[i].round !== current.round && sequence[i].phase === 'work';
        return;
      }
    }
  }

  function summary(now: number): SessionSummary {
    const activeMs = now - startTime - pausedMs - (pausedAt !== null ? now - pausedAt : 0);
    const entries = [...completed.values()];
    return {
      totalSeconds: Math.max(0, Math.round(activeMs / 1000)),
      stationsDone: new Set(entries.map((e) => e.stationIndex)).size,
      roundsDone: entries.reduce((max, e) => Math.max(max, e.round), 0),
    };
  }

  function finish(now: number) {
    state.phase = 'done';
    state.isRunning = false;
    state.isPaused = false;
    state.nextStation = 0;
    clearTimer();
    releaseWakeLock();
    completionSummary = summary(now);
    beepDone();
    emit();
  }

  /** Enter sequence[seqIndex], starting at `startedAt` (may be in the past when catching up). */
  function enterPhase(startedAt: number, withBeep: boolean) {
    const entry = sequence[seqIndex];
    state.phase = entry.phase;
    state.station = entry.stationIndex + 1; // 1-based
    state.round = entry.round;
    state.phaseDuration = entry.duration;
    phaseEndsAt = startedAt + entry.duration * 1000;
    remainingMs = entry.duration * 1000;
    state.currentSec = Math.ceil(remainingAt(Date.now()) / 1000);
    updateNext();
    if (withBeep) beepPhaseChange();
  }

  /** Advance past the current phase. Returns false if the workout finished. */
  function advance(now: number, boundary: number, withBeep: boolean): boolean {
    seqIndex++;
    if (seqIndex >= sequence.length) {
      finish(now);
      return false;
    }
    enterPhase(boundary, withBeep);
    return true;
  }

  function sync() {
    if (!state.isRunning || state.isPaused || phaseEndsAt === null) return;
    const now = Date.now();

    // Catch up on every phase that ended while we weren't ticking.
    let caughtUp = 0;
    while (phaseEndsAt !== null && phaseEndsAt <= now) {
      recordCurrent(phaseEndsAt);
      const boundary: number = phaseEndsAt;
      // Only the phase we land in gets a beep — no burst after backgrounding.
      const nextEnds = seqIndex + 1 < sequence.length ? boundary + sequence[seqIndex + 1].duration * 1000 : Infinity;
      if (!advance(now, boundary, nextEnds > now)) return;
      caughtUp++;
    }

    const sec = Math.ceil(remainingAt(now) / 1000);
    if (sec !== state.currentSec || caughtUp > 0) {
      // Countdown beeps only on a live 1-second step, not after a catch-up.
      if (caughtUp === 0 && sec <= 3 && sec > 0 && sec === state.currentSec - 1) {
        beepCountdown();
      }
      state.currentSec = sec;
      emit();
    }
  }

  function start() {
    if (state.isRunning) return;
    if (sequence.length === 0) return;
    const now = Date.now();
    seqIndex = 0;
    startTime = now;
    pausedMs = 0;
    pausedAt = null;
    completed.clear();
    completionSummary = null;
    state.isRunning = true;
    state.isPaused = false;
    requestWakeLock();
    enterPhase(now, true);
    emit();
    startTimer();
  }

  function pause() {
    if (!state.isRunning || state.isPaused) return;
    const now = Date.now();
    remainingMs = remainingAt(now);
    state.isPaused = true;
    pausedAt = now;
    clearTimer();
    releaseWakeLock();
    emit();
  }

  function resume() {
    if (!state.isRunning || !state.isPaused) return;
    const now = Date.now();
    if (pausedAt !== null) pausedMs += now - pausedAt;
    pausedAt = null;
    phaseEndsAt = now + remainingMs;
    state.isPaused = false;
    requestWakeLock();
    emit();
    startTimer();
  }

  function skipForward() {
    if (!state.isRunning) return;
    const now = Date.now();
    recordCurrent(now);
    const wasPaused = state.isPaused;
    // When paused, the next phase starts frozen at full length.
    state.isPaused = false;
    if (!advance(now, now, true)) return;
    if (wasPaused) {
      remainingMs = state.phaseDuration * 1000;
      state.isPaused = true;
    }
    emit();
  }

  function skipBack() {
    if (!state.isRunning) return;
    const now = Date.now();
    const elapsedSec = state.phaseDuration - Math.ceil(remainingAt(now) / 1000);
    const wasPaused = state.isPaused;
    state.isPaused = false;

    if (elapsedSec > RESTART_THRESHOLD_SEC) {
      // More than a couple of seconds in: restart the current phase.
      enterPhase(now, true);
    } else {
      let target = seqIndex - 1;
      while (target >= 0 && !isActivePhase(sequence[target].phase)) target--;
      if (target < 0) {
        state.isPaused = wasPaused;
        return;
      }
      seqIndex = target;
      enterPhase(now, true);
    }
    if (wasPaused) {
      remainingMs = state.phaseDuration * 1000;
      state.isPaused = true;
    }
    emit();
  }

  function stop(): SessionSummary {
    const now = Date.now();
    clearTimer();
    releaseWakeLock();
    if (state.isRunning) recordCurrent(now);
    const result = state.isRunning ? summary(now) : (completionSummary ?? summary(now));

    state.phase = 'idle';
    state.isRunning = false;
    state.isPaused = false;
    state.station = 0;
    state.round = 0;
    state.currentSec = 0;
    state.phaseDuration = 0;
    state.nextStation = 0;
    state.nextIsNewRound = false;
    phaseEndsAt = null;
    emit();
    return result;
  }

  function snapshot(): EngineSnapshot | null {
    if (!state.isRunning) return null;
    const now = Date.now();
    return {
      seqIndex,
      phaseEndsAt,
      remainingMs: remainingAt(now),
      isPaused: state.isPaused,
      startTime,
      pausedMs,
      pausedAt,
      savedAt: now,
    };
  }

  function dispose() {
    clearTimer();
    tickListeners.length = 0;
    entryListeners.length = 0;
  }

  // Restore a persisted workout. It comes back paused at the moment it was
  // last saved; the time the app was closed counts as pause.
  if (restore && restore.seqIndex < sequence.length) {
    seqIndex = restore.seqIndex;
    startTime = restore.startTime;
    pausedMs = restore.pausedMs;
    pausedAt = restore.isPaused && restore.pausedAt !== null ? restore.pausedAt : restore.savedAt;
    const entry = sequence[seqIndex];
    state.phase = entry.phase;
    state.station = entry.stationIndex + 1;
    state.round = entry.round;
    state.phaseDuration = entry.duration;
    remainingMs = Math.min(entry.duration * 1000, Math.max(0, restore.remainingMs));
    phaseEndsAt = null;
    state.currentSec = Math.ceil(remainingMs / 1000);
    state.isRunning = true;
    state.isPaused = true;
    updateNext();
  }

  return {
    start,
    pause,
    resume,
    skipForward,
    skipBack,
    stop,
    onTick: (fn) => {
      tickListeners.push(fn);
    },
    onEntry: (fn) => {
      entryListeners.push(fn);
    },
    getState: () => ({ ...state }),
    getCompletionSummary: () => completionSummary,
    snapshot,
    sync,
    dispose,
  };
}
