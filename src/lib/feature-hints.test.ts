import { describe, it, expect, beforeEach } from 'vitest';
import { isHintSeen, markHintSeen } from './feature-hints.ts';
import type { HintId } from './feature-hints.ts';

const PREFIX = 'ryng_hint_seen_';

beforeEach(() => {
  localStorage.clear();
});

describe('feature-hints: isHintSeen / markHintSeen', () => {
  it('isHintSeen returns false initially for all hint IDs', () => {
    const ids: HintId[] = [
      'mode-toggle',
      'mesocycle',
      'spotify',
      'heartrate',
      'quick-start',
      'gym-preview',
      'weekly-goal',
    ];
    for (const id of ids) {
      expect(isHintSeen(id)).toBe(false);
    }
  });

  it('markHintSeen makes isHintSeen return true', () => {
    expect(isHintSeen('mode-toggle')).toBe(false);
    markHintSeen('mode-toggle');
    expect(isHintSeen('mode-toggle')).toBe(true);
  });

  it('different hint IDs are independent', () => {
    markHintSeen('spotify');

    expect(isHintSeen('spotify')).toBe(true);
    expect(isHintSeen('mode-toggle')).toBe(false);
    expect(isHintSeen('mesocycle')).toBe(false);
    expect(isHintSeen('heartrate')).toBe(false);
  });

  it('marking one hint does not affect others', () => {
    markHintSeen('quick-start');
    markHintSeen('gym-preview');

    expect(isHintSeen('quick-start')).toBe(true);
    expect(isHintSeen('gym-preview')).toBe(true);
    expect(isHintSeen('weekly-goal')).toBe(false);
    expect(isHintSeen('mode-toggle')).toBe(false);
  });

  it('uses correct localStorage key prefix', () => {
    markHintSeen('heartrate');

    expect(localStorage.getItem(PREFIX + 'heartrate')).toBe('1');
    // Other keys should not exist
    expect(localStorage.getItem(PREFIX + 'mode-toggle')).toBeNull();
  });

  it('marking the same hint twice is idempotent', () => {
    markHintSeen('mesocycle');
    markHintSeen('mesocycle');

    expect(isHintSeen('mesocycle')).toBe(true);
    expect(localStorage.getItem(PREFIX + 'mesocycle')).toBe('1');
  });

  it('only recognizes value "1" as seen', () => {
    // If someone manually sets a different value, it should not be seen
    localStorage.setItem(PREFIX + 'mode-toggle', 'true');
    expect(isHintSeen('mode-toggle')).toBe(false);

    localStorage.setItem(PREFIX + 'mode-toggle', '0');
    expect(isHintSeen('mode-toggle')).toBe(false);

    localStorage.setItem(PREFIX + 'mode-toggle', '1');
    expect(isHintSeen('mode-toggle')).toBe(true);
  });
});
