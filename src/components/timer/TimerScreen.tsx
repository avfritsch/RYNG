import { useEffect, useRef, useMemo, useState } from 'react';
import { useTimerStore } from '../../stores/timer-store.ts';
import { useSessionStore } from '../../stores/session-store.ts';
import { speakStation, speakPause, speakRoundPause, speakDone } from '../../lib/speech.ts';
import { onHeartRate, getLastBpm } from '../../lib/heartrate.ts';
import { RING_VIZ_MAX_STATIONS } from '../../lib/constants.ts';
import { RingViz } from './RingViz.tsx';
import { HeartRateDisplay } from './HeartRateDisplay.tsx';
import { LinearViz } from './LinearViz.tsx';
import { Countdown } from './Countdown.tsx';
import { PhaseLabel } from './PhaseLabel.tsx';
import { HowtoPanel } from './HowtoPanel.tsx';
import { TimerControls } from './TimerControls.tsx';
import { SpotifyBar } from './SpotifyBar.tsx';
import '../../styles/timer-screen.css';

const phaseBg: Record<string, string> = {
  work: 'var(--bg-phase-work)',
  warmup: 'var(--bg-phase-warmup)',
  pause: 'var(--bg-phase-pause)',
  roundPause: 'var(--bg-phase-round)',
};

export function TimerScreen() {
  const [hrBpm, setHrBpm] = useState(getLastBpm);
  useEffect(() => onHeartRate(setHrBpm), []);

  const state = useTimerStore((s) => s.state);
  const config = useTimerStore((s) => s.config);
  const pause = useTimerStore((s) => s.pause);
  const resume = useTimerStore((s) => s.resume);
  const skipForward = useTimerStore((s) => s.skipForward);
  const skipBack = useTimerStore((s) => s.skipBack);
  const stop = useTimerStore((s) => s.stop);
  const addEntry = useSessionStore((s) => s.addEntry);

  const prevRef = useRef<{ station: number; phase: string; round: number } | null>(null);

  useEffect(() => {
    if (!config || !state.isRunning) return;

    const prev = prevRef.current;
    prevRef.current = { station: state.station, phase: state.phase, round: state.round };

    if (
      prev &&
      (prev.phase === 'work' || prev.phase === 'warmup') &&
      (prev.station !== state.station || prev.round !== state.round || state.phase === 'done')
    ) {
      const stationIndex = prev.station - 1;
      const stationConfig = config.stations[stationIndex];
      if (stationConfig) {
        addEntry({
          station_index: stationIndex,
          station_name: stationConfig.name,
          is_warmup: stationConfig.isWarmup,
          work_seconds: stationConfig.workSeconds,
          actual_seconds: stationConfig.workSeconds,
          weight_kg: null,
          reps: null,
          notes: null,
          round_number: prev.round,
        });
      }
    }
  }, [state.station, state.phase, state.round, state.isRunning, config, addEntry]);

  // Speech announcements on phase changes
  const speechRef = useRef<string>('');
  useEffect(() => {
    if (!config || !state.isRunning) return;
    const key = `${state.phase}-${state.station}-${state.round}`;
    if (key === speechRef.current) return;
    speechRef.current = key;

    const station = config.stations[state.station - 1];
    if (state.phase === 'work' || state.phase === 'warmup') {
      if (station) speakStation(station.name, state.phaseDuration);
    } else if (state.phase === 'pause') {
      speakPause(state.phaseDuration);
    } else if (state.phase === 'roundPause') {
      speakRoundPause(state.round, config.rounds, state.phaseDuration);
    } else if (state.phase === 'done') {
      speakDone();
    }
  }, [state.phase, state.station, state.round, state.isRunning, config, state.phaseDuration]);

  // Compute current set stations (warmup set OR kraft set for current round)
  const { setStations, activeStationInSet, setLabel } = useMemo(() => {
    if (!config) return { setStations: [], activeStationInSet: 0, setLabel: '' };

    const warmupStations = config.stations.filter((s) => s.isWarmup);
    const kraftStations = config.stations.filter((s) => !s.isWarmup);
    const currentStation = config.stations[state.station - 1];
    const isInWarmup = currentStation?.isWarmup ?? false;

    if (isInWarmup || (state.phase === 'pause' && config.stations[state.station - 1]?.isWarmup)) {
      // Warmup set
      const warmupIdx = warmupStations.indexOf(currentStation!);
      return {
        setStations: warmupStations,
        activeStationInSet: warmupIdx + 1,
        setLabel: 'Aufwärmen',
      };
    }

    // Kraft set for current round
    const kraftIdx = kraftStations.indexOf(currentStation!);
    return {
      setStations: kraftStations,
      activeStationInSet: Math.max(1, kraftIdx + 1),
      setLabel: `Runde ${state.round}/${config.rounds}`,
    };
  }, [config, state.station, state.phase, state.round]);

  if (!config || !state.isRunning) return null;

  const currentStation = config.stations[state.station - 1];
  const stationName = state.phase === 'roundPause'
    ? 'Rundenpause'
    : state.phase === 'pause'
      ? `Pause — ${currentStation?.name ?? ''}`
      : currentStation?.name ?? '';

  const isWarmup = currentStation?.isWarmup ?? false;
  const howto = (state.phase === 'work' || state.phase === 'warmup') ? (currentStation?.howto ?? '') : '';
  const bg = phaseBg[state.phase] ?? 'var(--bg-base)';

  const progress = state.phaseDuration > 0
    ? (state.phaseDuration - state.currentSec) / state.phaseDuration
    : 0;

  // Use ring for sets ≤ 12 stations, linear for more
  const useRing = setStations.length <= RING_VIZ_MAX_STATIONS && setStations.length > 0;

  return (
    <div className="timer-screen" style={{ background: bg }}>
      <div className="timer-header">
        <span className="timer-header-item">{setLabel}</span>
        <HeartRateDisplay bpm={hrBpm} />
        <span className="timer-header-item">Station {activeStationInSet}/{setStations.length}</span>
      </div>

      <div className="timer-body">
        <PhaseLabel stationName={stationName} phase={state.phase} isWarmup={isWarmup} />

        {useRing ? (
          <RingViz
            stations={setStations}
            activeStation={activeStationInSet}
            phase={state.phase}
            progress={progress}
            countdown={state.currentSec}
          />
        ) : (
          <>
            <LinearViz total={setStations.length} current={activeStationInSet} phase={state.phase} />
            <Countdown seconds={state.currentSec} phase={state.phase} />
          </>
        )}

        <div className="timer-howto-area">
          <HowtoPanel text={howto} />
        </div>
      </div>

      <SpotifyBar phase={state.phase} />

      <TimerControls
        isPaused={state.isPaused}
        onPause={pause}
        onResume={resume}
        onSkipBack={skipBack}
        onSkipForward={skipForward}
        onStop={stop}
      />
    </div>
  );
}
