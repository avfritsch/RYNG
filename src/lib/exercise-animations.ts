import {
  DEMO_PUSHUP_FRAMES,
  DEMO_SQUAT_FRAMES,
  DEMO_PLANK_FRAMES,
} from '../components/ui/ExerciseAnimation.tsx';

/**
 * Maps exercise name patterns to animation frames.
 * Returns null if no animation exists for the exercise.
 */

const ANIMATION_MAP: [RegExp, string[]][] = [
  [/push.?up|liegestütz|bankdrück|bench/i, DEMO_PUSHUP_FRAMES],
  [/squat|kniebeug|goblet|sumo/i, DEMO_SQUAT_FRAMES],
  [/plank|unterarmstütz/i, DEMO_PLANK_FRAMES],
  [/ausfallschritt|lunge|split/i, DEMO_SQUAT_FRAMES], // similar motion
];

export function getAnimationFrames(name: string): string[] | null {
  for (const [pattern, frames] of ANIMATION_MAP) {
    if (pattern.test(name)) return frames;
  }
  return null;
}
