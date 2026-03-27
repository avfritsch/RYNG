import { memo, useMemo } from 'react';
import type { StationConfig } from '../../types/timer.ts';
import '../../styles/ring-viz.css';

interface RingVizProps {
  /** Stations in the current set (warmup OR kraft stations) */
  stations: StationConfig[];
  /** 1-based index within the set */
  activeStation: number;
  /** Current phase */
  phase: string;
  /** 0–1 progress through the current phase */
  progress: number;
  /** Countdown seconds to display in center */
  countdown: number;
}

const CX = 100;
const CY = 100;
const R = 82;
const STROKE = 14;
const GAP_DEG = 3;

const PHASE_COLORS: Record<string, string> = {
  work: 'var(--color-work)',
  warmup: 'var(--color-prepare)',
  pause: 'var(--color-rest)',
  roundPause: 'var(--color-info)',
};

function arcPath(startDeg: number, endDeg: number): string {
  const sr = (startDeg * Math.PI) / 180;
  const er = (endDeg * Math.PI) / 180;
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${CX + R * Math.cos(sr)} ${CY + R * Math.sin(sr)} A ${R} ${R} 0 ${large} 1 ${CX + R * Math.cos(er)} ${CY + R * Math.sin(er)}`;
}

interface Segment {
  type: 'work' | 'warmup' | 'pause';
  duration: number;
  stationIndex: number; // 0-based within set
  startDeg: number;
  endDeg: number;
  color: string;
}

export const RingViz = memo(function RingViz({
  stations,
  activeStation,
  phase,
  progress,
  countdown,
}: RingVizProps) {
  // Build segments for this set
  const segments = useMemo(() => {
    const segs: Omit<Segment, 'startDeg' | 'endDeg'>[] = [];
    for (let i = 0; i < stations.length; i++) {
      const s = stations[i];
      segs.push({
        type: s.isWarmup ? 'warmup' : 'work',
        duration: s.workSeconds,
        stationIndex: i,
        color: s.isWarmup ? PHASE_COLORS.warmup : PHASE_COLORS.work,
      });
      // Pause after each station except the last
      if (i < stations.length - 1 && s.pauseSeconds > 0) {
        segs.push({
          type: 'pause',
          duration: s.pauseSeconds,
          stationIndex: i,
          color: PHASE_COLORS.pause,
        });
      }
    }

    const totalDur = segs.reduce((a, s) => a + s.duration, 0);
    if (totalDur === 0) return [];

    const totalDeg = 360 - segs.length * GAP_DEG;
    let angle = -90; // start at top

    return segs.map((seg) => {
      const segDeg = Math.max(1, (seg.duration / totalDur) * totalDeg);
      const start = angle;
      const end = angle + segDeg;
      angle = end + GAP_DEG;
      return { ...seg, startDeg: start, endDeg: end } as Segment;
    });
  }, [stations]);

  // Determine active segment index
  const activeIdx = useMemo(() => {
    const stIdx = activeStation - 1; // 0-based
    if (phase === 'work' || phase === 'warmup') {
      return segments.findIndex((s) => s.stationIndex === stIdx && s.type !== 'pause');
    }
    if (phase === 'pause') {
      return segments.findIndex((s) => s.stationIndex === stIdx && s.type === 'pause');
    }
    return -1; // roundPause — no active segment
  }, [segments, activeStation, phase]);

  const countdownColor = phase === 'roundPause'
    ? PHASE_COLORS.roundPause
    : activeIdx >= 0
      ? segments[activeIdx]?.color ?? PHASE_COLORS.work
      : PHASE_COLORS.work;

  const blink = countdown <= 3 && countdown > 0;

  return (
    <div className="ring-viz-container">
      <svg viewBox="0 0 200 200" className="ring-viz-svg" role="img" aria-label="Timer-Fortschritt">
        {/* Background track */}
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="var(--bg-elevated)"
          strokeWidth={STROKE}
        />

        {/* Segments */}
        {segments.map((seg, idx) => {
          const isDone = idx < activeIdx;
          const isActive = idx === activeIdx;

          return (
            <g key={idx}>
              {/* Background arc */}
              <path
                d={arcPath(seg.startDeg, seg.endDeg)}
                fill="none"
                stroke={seg.color}
                strokeWidth={STROKE}
                strokeLinecap="butt"
                opacity={isDone ? 0.6 : 0.2}
              />

              {/* Foreground arc (progress fill, clockwise) */}
              {isActive && (
                <path
                  d={arcPath(seg.startDeg, seg.endDeg)}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth={STROKE}
                  strokeLinecap="butt"
                  pathLength={1}
                  strokeDasharray="1 1"
                  strokeDashoffset={1 - progress}
                  className="ring-viz-progress"
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* Countdown in center */}
      <div className="ring-viz-center">
        <span
          className={`ring-viz-countdown ${blink ? 'ring-viz-countdown--blink' : ''}`}
          style={{ color: countdownColor }}
        >
          {countdown}
        </span>
      </div>
    </div>
  );
});
