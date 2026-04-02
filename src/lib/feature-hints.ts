const PREFIX = 'ryng_hint_seen_';

export type HintId =
  | 'mode-toggle'
  | 'mesocycle'
  | 'spotify'
  | 'heartrate'
  | 'quick-start'
  | 'gym-preview'
  | 'weekly-goal';

export function isHintSeen(id: HintId): boolean {
  return localStorage.getItem(PREFIX + id) === '1';
}

export function markHintSeen(id: HintId): void {
  localStorage.setItem(PREFIX + id, '1');
}
