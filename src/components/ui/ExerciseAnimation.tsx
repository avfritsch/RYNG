import { useState, useEffect } from 'react';
import '../../styles/exercise-animation.css';

interface ExerciseAnimationProps {
  frames: string[];
  /** Milliseconds per frame */
  speed?: number;
}

export function ExerciseAnimation({ frames, speed = 600 }: ExerciseAnimationProps) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (frames.length <= 1) return;
    const interval = setInterval(() => {
      setFrameIndex((i) => (i + 1) % frames.length);
    }, speed);
    return () => clearInterval(interval);
  }, [frames.length, speed]);

  return (
    <div
      className="exercise-animation"
      dangerouslySetInnerHTML={{ __html: frames[frameIndex] }}
      aria-hidden="true"
    />
  );
}

// ── Demo data: Liegestütz (Push-Up) ──

const STICK_STYLE = 'stroke="#7FFF00" stroke-width="3" stroke-linecap="round" fill="none"';
const HEAD_STYLE = 'fill="none" stroke="#7FFF00" stroke-width="3"';

export const DEMO_PUSHUP_FRAMES = [
  // Frame 1: Up position
  `<svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="22" r="7" ${HEAD_STYLE}/>
    <line x1="30" y1="28" x2="55" y2="35" ${STICK_STYLE}/>
    <line x1="55" y1="35" x2="95" y2="38" ${STICK_STYLE}/>
    <line x1="30" y1="28" x2="25" y2="50" ${STICK_STYLE}/>
    <line x1="25" y1="50" x2="25" y2="55" ${STICK_STYLE}/>
    <line x1="55" y1="35" x2="58" y2="55" ${STICK_STYLE}/>
    <line x1="58" y1="55" x2="60" y2="58" ${STICK_STYLE}/>
    <line x1="95" y1="38" x2="98" y2="55" ${STICK_STYLE}/>
    <line x1="98" y1="55" x2="100" y2="58" ${STICK_STYLE}/>
  </svg>`,
  // Frame 2: Mid position
  `<svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="32" r="7" ${HEAD_STYLE}/>
    <line x1="30" y1="37" x2="55" y2="40" ${STICK_STYLE}/>
    <line x1="55" y1="40" x2="95" y2="42" ${STICK_STYLE}/>
    <line x1="30" y1="37" x2="22" y2="52" ${STICK_STYLE}/>
    <line x1="22" y1="52" x2="20" y2="55" ${STICK_STYLE}/>
    <line x1="55" y1="40" x2="58" y2="55" ${STICK_STYLE}/>
    <line x1="58" y1="55" x2="60" y2="58" ${STICK_STYLE}/>
    <line x1="95" y1="42" x2="98" y2="55" ${STICK_STYLE}/>
    <line x1="98" y1="55" x2="100" y2="58" ${STICK_STYLE}/>
  </svg>`,
  // Frame 3: Down position
  `<svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="42" r="7" ${HEAD_STYLE}/>
    <line x1="30" y1="46" x2="55" y2="47" ${STICK_STYLE}/>
    <line x1="55" y1="47" x2="95" y2="48" ${STICK_STYLE}/>
    <line x1="30" y1="46" x2="18" y2="38" ${STICK_STYLE}/>
    <line x1="18" y1="38" x2="15" y2="55" ${STICK_STYLE}/>
    <line x1="55" y1="47" x2="58" y2="55" ${STICK_STYLE}/>
    <line x1="58" y1="55" x2="60" y2="58" ${STICK_STYLE}/>
    <line x1="95" y1="48" x2="98" y2="55" ${STICK_STYLE}/>
    <line x1="98" y1="55" x2="100" y2="58" ${STICK_STYLE}/>
  </svg>`,
  // Frame 4: Mid position (going back up)
  `<svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
    <circle cx="25" cy="32" r="7" ${HEAD_STYLE}/>
    <line x1="30" y1="37" x2="55" y2="40" ${STICK_STYLE}/>
    <line x1="55" y1="40" x2="95" y2="42" ${STICK_STYLE}/>
    <line x1="30" y1="37" x2="22" y2="52" ${STICK_STYLE}/>
    <line x1="22" y1="52" x2="20" y2="55" ${STICK_STYLE}/>
    <line x1="55" y1="40" x2="58" y2="55" ${STICK_STYLE}/>
    <line x1="58" y1="55" x2="60" y2="58" ${STICK_STYLE}/>
    <line x1="95" y1="42" x2="98" y2="55" ${STICK_STYLE}/>
    <line x1="98" y1="55" x2="100" y2="58" ${STICK_STYLE}/>
  </svg>`,
];

export const DEMO_SQUAT_FRAMES = [
  // Frame 1: Standing
  `<svg viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="15" r="7" ${HEAD_STYLE}/>
    <line x1="40" y1="22" x2="40" y2="50" ${STICK_STYLE}/>
    <line x1="40" y1="30" x2="25" y2="42" ${STICK_STYLE}/>
    <line x1="40" y1="30" x2="55" y2="42" ${STICK_STYLE}/>
    <line x1="40" y1="50" x2="35" y2="72" ${STICK_STYLE}/>
    <line x1="35" y1="72" x2="32" y2="85" ${STICK_STYLE}/>
    <line x1="40" y1="50" x2="45" y2="72" ${STICK_STYLE}/>
    <line x1="45" y1="72" x2="48" y2="85" ${STICK_STYLE}/>
  </svg>`,
  // Frame 2: Quarter squat
  `<svg viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="22" r="7" ${HEAD_STYLE}/>
    <line x1="40" y1="29" x2="40" y2="52" ${STICK_STYLE}/>
    <line x1="40" y1="35" x2="25" y2="47" ${STICK_STYLE}/>
    <line x1="40" y1="35" x2="55" y2="47" ${STICK_STYLE}/>
    <line x1="40" y1="52" x2="30" y2="70" ${STICK_STYLE}/>
    <line x1="30" y1="70" x2="28" y2="85" ${STICK_STYLE}/>
    <line x1="40" y1="52" x2="50" y2="70" ${STICK_STYLE}/>
    <line x1="50" y1="70" x2="52" y2="85" ${STICK_STYLE}/>
  </svg>`,
  // Frame 3: Deep squat
  `<svg viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="35" r="7" ${HEAD_STYLE}/>
    <line x1="40" y1="42" x2="40" y2="60" ${STICK_STYLE}/>
    <line x1="40" y1="48" x2="25" y2="55" ${STICK_STYLE}/>
    <line x1="40" y1="48" x2="55" y2="55" ${STICK_STYLE}/>
    <line x1="40" y1="60" x2="25" y2="65" ${STICK_STYLE}/>
    <line x1="25" y1="65" x2="22" y2="85" ${STICK_STYLE}/>
    <line x1="40" y1="60" x2="55" y2="65" ${STICK_STYLE}/>
    <line x1="55" y1="65" x2="58" y2="85" ${STICK_STYLE}/>
  </svg>`,
  // Frame 4: Quarter squat (going back up)
  `<svg viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="22" r="7" ${HEAD_STYLE}/>
    <line x1="40" y1="29" x2="40" y2="52" ${STICK_STYLE}/>
    <line x1="40" y1="35" x2="25" y2="47" ${STICK_STYLE}/>
    <line x1="40" y1="35" x2="55" y2="47" ${STICK_STYLE}/>
    <line x1="40" y1="52" x2="30" y2="70" ${STICK_STYLE}/>
    <line x1="30" y1="70" x2="28" y2="85" ${STICK_STYLE}/>
    <line x1="40" y1="52" x2="50" y2="70" ${STICK_STYLE}/>
    <line x1="50" y1="70" x2="52" y2="85" ${STICK_STYLE}/>
  </svg>`,
];

export const DEMO_PLANK_FRAMES = [
  // Frame 1: Normal plank
  `<svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="22" r="7" ${HEAD_STYLE}/>
    <line x1="26" y1="26" x2="55" y2="28" ${STICK_STYLE}/>
    <line x1="55" y1="28" x2="95" y2="30" ${STICK_STYLE}/>
    <line x1="26" y1="26" x2="20" y2="45" ${STICK_STYLE}/>
    <line x1="55" y1="28" x2="55" y2="45" ${STICK_STYLE}/>
    <line x1="95" y1="30" x2="98" y2="45" ${STICK_STYLE}/>
    <line x1="98" y1="45" x2="100" y2="48" ${STICK_STYLE}/>
  </svg>`,
  // Frame 2: Slight breathing motion
  `<svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="21" r="7" ${HEAD_STYLE}/>
    <line x1="26" y1="25" x2="55" y2="27" ${STICK_STYLE}/>
    <line x1="55" y1="27" x2="95" y2="29" ${STICK_STYLE}/>
    <line x1="26" y1="25" x2="20" y2="45" ${STICK_STYLE}/>
    <line x1="55" y1="27" x2="55" y2="45" ${STICK_STYLE}/>
    <line x1="95" y1="29" x2="98" y2="45" ${STICK_STYLE}/>
    <line x1="98" y1="45" x2="100" y2="48" ${STICK_STYLE}/>
  </svg>`,
];
