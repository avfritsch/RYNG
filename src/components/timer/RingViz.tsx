import { memo, useMemo } from 'react';
import type { StationConfig } from '../../types/timer.ts';
import '../../styles/ring-viz.css';

interface RingVizProps {
  stations: StationConfig[];
  activeStation: number;
  phase: string;
  progress: number;
  countdown: number;
}

const CX = 100;
const CY = 100;
const R = 82;
const STROKE = 14;
const GAP_DEG = 3;

// Full-saturation colors for active segments
const SEGMENT_COLORS: Record<string, string> = {
  work: '#7FFF00',
  warmup: '#FFE600',
  pause: '#FF3B3B',
};

// Dimmed colors for completed segments (35% opacity equivalent)
const SEGMENT_COLORS_DONE: Record<string, string> = {
  work: '#2D5A00',
  warmup: '#5A5100',
  pause: '#5A1515',
};

// Not-yet-reached segments
const SEGMENT_COLOR_FUTURE = '#2A2A2A';

function arcPath(startDeg: number, endDeg: number): string {
  const sr = (startDeg * Math.PI) / 180;
  const er = (endDeg * Math.PI) / 180;
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${CX + R * Math.cos(sr)} ${CY + R * Math.sin(sr)} A ${R} ${R} 0 ${large} 1 ${CX + R * Math.cos(er)} ${CY + R * Math.sin(er)}`;
}

/** Get the (x,y) point at a given degree on the ring */
function pointOnRing(deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [CX + R * Math.cos(rad), CY + R * Math.sin(rad)];
}

interface Segment {
  type: 'work' | 'warmup' | 'pause';
  duration: number;
  stationIndex: number;
  startDeg: number;
  endDeg: number;
}

export const RingViz = memo(function RingViz({
  stations,
  activeStation,
  phase,
  progress,
  countdown,
}: RingVizProps) {
  const segments = useMemo(() => {
    const segs: Omit<Segment, 'startDeg' | 'endDeg'>[] = [];
    for (let i = 0; i < stations.length; i++) {
      const s = stations[i];
      segs.push({
        type: s.isWarmup ? 'warmup' : 'work',
        duration: s.workSeconds,
        stationIndex: i,
      });
      if (i < stations.length - 1 && s.pauseSeconds > 0) {
        segs.push({
          type: 'pause',
          duration: s.pauseSeconds,
          stationIndex: i,
        });
      }
    }

    const totalDur = segs.reduce((a, s) => a + s.duration, 0);
    if (totalDur === 0) return [];

    const totalDeg = 360 - segs.length * GAP_DEG;
    let angle = -90;

    return segs.map((seg) => {
      const segDeg = Math.max(1, (seg.duration / totalDur) * totalDeg);
      const start = angle;
      const end = angle + segDeg;
      angle = end + GAP_DEG;
      return { ...seg, startDeg: start, endDeg: end } as Segment;
    });
  }, [stations]);

  const activeIdx = useMemo(() => {
    const stIdx = activeStation - 1;
    if (phase === 'work' || phase === 'warmup') {
      return segments.findIndex((s) => s.stationIndex === stIdx && s.type !== 'pause');
    }
    if (phase === 'pause') {
      return segments.findIndex((s) => s.stationIndex === stIdx && s.type === 'pause');
    }
    return -1;
  }, [segments, activeStation, phase]);

  // Countdown color: no more blue
  const countdownColor = phase === 'roundPause'
    ? '#FFE600'
    : activeIdx >= 0
      ? SEGMENT_COLORS[segments[activeIdx]?.type] ?? '#7FFF00'
      : '#7FFF00';

  const blink = countdown <= 3 && countdown > 0;

  // Progress dot position
  const progressDot = useMemo(() => {
    if (activeIdx < 0 || progress <= 0) return null;
    const seg = segments[activeIdx];
    const deg = seg.startDeg + (seg.endDeg - seg.startDeg) * progress;
    const [x, y] = pointOnRing(deg);
    return { x, y };
  }, [activeIdx, segments, progress]);

  return (
    <div className="ring-viz-container">
      <svg viewBox="0 0 200 200" className="ring-viz-svg" role="img" aria-label="Timer-Fortschritt">
        {/* Background track */}
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="#1A1A1A"
          strokeWidth={STROKE}
        />

        {/* Segments */}
        {segments.map((seg, idx) => {
          const isDone = idx < activeIdx;
          const isActive = idx === activeIdx;

          // Background arc color
          let bgColor: string;
          if (isDone) {
            bgColor = SEGMENT_COLORS_DONE[seg.type] ?? SEGMENT_COLOR_FUTURE;
          } else if (isActive) {
            bgColor = SEGMENT_COLOR_FUTURE; // unfilled portion of active segment
          } else {
            bgColor = SEGMENT_COLOR_FUTURE;
          }

          return (
            <g key={idx}>
              {/* Background arc */}
              <path
                d={arcPath(seg.startDeg, seg.endDeg)}
                fill="none"
                stroke={bgColor}
                strokeWidth={STROKE}
                strokeLinecap="butt"
              />

              {/* Foreground arc (progress fill) */}
              {isActive && (
                <path
                  d={arcPath(seg.startDeg, seg.endDeg)}
                  fill="none"
                  stroke={SEGMENT_COLORS[seg.type]}
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

        {/* Progress dot (white indicator at end of filled arc) */}
        {progressDot && (
          <circle
            cx={progressDot.x}
            cy={progressDot.y}
            r={4.5}
            fill="#FFFFFF"
            className="ring-viz-dot"
          />
        )}
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
