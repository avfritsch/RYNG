import type { TimerConfig, TimerState, TimerPhase, StationConfig } from '../types/timer.ts';
import { RESTART_THRESHOLD_SEC } from './constants.ts';

export type TimerCallback = (state: TimerState) => void;

export interface SessionSummary {
  totalSeconds: number;
  stationsDone: number;
  roundsDone: number;
}

export interface TimerEngine {
  start: () => void;
  pause: () => void;
  resume: () => void;
  skipForward: () => void;
  skipBack: () => void;
  stop: () => SessionSummary;
  onTick: (fn: TimerCallback) => void;
  getState: () => TimerState;
  getCompletionSummary: () => SessionSummary | null;
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
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
  // Play a silent buffer to fully unlock on iOS Safari
  const buf = ctx.createBuffer(1, 1, 22050);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start();
}

export function beep(freq = 880, duration = 150) {
  try {
    const ctx = getAudioCtx();
    // Resume context if suspended (e.g. after app switch / pause)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.value = 0.3;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.stop(ctx.currentTime + duration / 1000);
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
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
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

// --- Timer Engine ---

export function createTimerEngine(config: TimerConfig): TimerEngine {
  const { stations, rounds, roundPause } = config;

  // Split into warmup + kraft stations
  const warmupStations = stations.filter((s) => s.isWarmup);
  const kraftStations = stations.filter((s) => !s.isWarmup);

  // Build the full sequence: warmup once, then kraft x rounds
  // Each entry: { station, phaseType, duration }
  type SequenceEntry = {
    stationIndex: number; // index in config.stations
    station: StationConfig;
    phase: TimerPhase;
    duration: number;
    round: number;
  };

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
      // Skip station pause if: last station of last round, or last station of a round
      // followed by a round pause (round pause replaces the station pause)
      const isLastInRound = i === kraftStations.length - 1;
      const isLastRound = r === rounds;
      const hasRoundPause = !isLastRound && roundPause > 0;
      const skipPause = isLastInRound && (isLastRound || hasRoundPause);
      if (!skipPause && ks.pauseSeconds > 0) {
        sequence.push({ stationIndex: idx, station: ks, phase: 'pause', duration: ks.pauseSeconds, round: r });
      }
    }
    // Round pause between rounds
    if (r < rounds && roundPause > 0) {
      const lastKraft = kraftStations[kraftStations.length - 1];
      const idx = stations.indexOf(lastKraft);
      sequence.push({ stationIndex: idx, station: lastKraft, phase: 'roundPause', duration: roundPause, round: r });
    }
  }

  let seqIndex = 0;
  let currentSec = 0;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  const listeners: TimerCallback[] = [];
  let startTime = 0;

  const state: TimerState = {
    phase: 'idle',
    station: 0,
    round: 0,
    currentSec: 0,
    phaseDuration: 0,
    isRunning: false,
    isPaused: false,
    exerciseStartTime: null,
  };

  function emit() {
    const snapshot = { ...state };
    listeners.forEach((fn) => fn(snapshot));
  }

  let completionSummary: SessionSummary | null = null;

  function getCompletionSummary(): SessionSummary | null {
    return completionSummary;
  }

  function applySequenceEntry() {
    if (seqIndex >= sequence.length) {
      state.phase = 'done';
      state.isRunning = false;
      state.isPaused = false;
      clearTimer();
      releaseWakeLock();
      // Build summary for normal completion
      const totalSeconds = Math.round((Date.now() - startTime) / 1000);
      const stationsDone = new Set(
        sequence.filter((e) => e.phase === 'work' || e.phase === 'warmup').map((e) => e.stationIndex),
      ).size;
      const roundsDone = sequence.length > 0 ? sequence[sequence.length - 1].round : 0;
      completionSummary = { totalSeconds, stationsDone, roundsDone };
      beepDone();
      emit();
      return;
    }
    const entry = sequence[seqIndex];
    state.phase = entry.phase;
    state.station = entry.stationIndex + 1; // 1-based
    state.round = entry.round;
    state.phaseDuration = entry.duration;
    state.currentSec = entry.duration;
    state.exerciseStartTime = entry.phase === 'work' || entry.phase === 'warmup' ? Date.now() : null;
    currentSec = entry.duration;
    beepPhaseChange();
    emit();
  }

  function tick() {
    currentSec--;
    state.currentSec = currentSec;

    // Countdown beeps at 3, 2, 1
    if (currentSec <= 3 && currentSec > 0) {
      beepCountdown();
    }

    if (currentSec <= 0) {
      seqIndex++;
      applySequenceEntry();
      return;
    }

    emit();
  }

  function clearTimer() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function start() {
    if (state.isRunning) return;
    if (sequence.length === 0) return;
    seqIndex = 0;
    startTime = Date.now();
    state.isRunning = true;
    state.isPaused = false;
    requestWakeLock();
    applySequenceEntry();
    clearTimer();
    intervalId = setInterval(tick, 1000);
  }

  function pause() {
    if (!state.isRunning || state.isPaused) return;
    state.isPaused = true;
    clearTimer();
    releaseWakeLock();
    emit();
  }

  function resume() {
    if (!state.isRunning || !state.isPaused) return;
    state.isPaused = false;
    requestWakeLock();
    intervalId = setInterval(tick, 1000);
    emit();
  }

  function skipForward() {
    if (!state.isRunning) return;
    // Skip to next sequence entry
    seqIndex++;
    applySequenceEntry();
    if (state.isPaused) {
      clearTimer();
    }
  }

  function skipBack() {
    if (!state.isRunning) return;
    // Go back to previous entry (or restart current if >2s in)
    if (currentSec < state.phaseDuration - RESTART_THRESHOLD_SEC) {
      // More than 2s into current phase: restart it
      applySequenceEntry();
      if (state.isPaused) clearTimer();
      return;
    }
    let target = seqIndex - 1;
    while (target >= 0) {
      const entry = sequence[target];
      if (entry.phase === 'work' || entry.phase === 'warmup') break;
      target--;
    }
    if (target >= 0) {
      seqIndex = target;
      applySequenceEntry();
      if (state.isPaused) {
        clearTimer();
      }
    }
  }

  function stop(): SessionSummary {
    clearTimer();
    releaseWakeLock();
    const totalSeconds = Math.round((Date.now() - startTime) / 1000);
    // Include current station (seqIndex) in count — slice(0, seqIndex+1)
    const stationsDone = new Set(
      sequence.slice(0, seqIndex + 1).filter((e) => e.phase === 'work' || e.phase === 'warmup').map((e) => e.stationIndex),
    ).size;
    const roundsDone = state.round;

    state.phase = 'idle';
    state.isRunning = false;
    state.isPaused = false;
    state.station = 0;
    state.round = 0;
    state.currentSec = 0;
    state.phaseDuration = 0;
    state.exerciseStartTime = null;
    emit();

    return { totalSeconds, stationsDone, roundsDone };
  }

  function onTick(fn: TimerCallback) {
    listeners.push(fn);
  }

  function getState(): TimerState {
    return { ...state };
  }

  return { start, pause, resume, skipForward, skipBack, stop, onTick, getState, getCompletionSummary };
}
