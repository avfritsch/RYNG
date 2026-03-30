import { describe, it, expect } from 'vitest';
import { encodeWorkout, decodeWorkout } from './share.ts';
import type { TimerConfig } from '../types/timer.ts';

function makeConfig(overrides?: Partial<TimerConfig>): TimerConfig {
  return {
    stations: [
      { name: 'Squats', workSeconds: 45, pauseSeconds: 30, isWarmup: false, howto: 'Go deep' },
      { name: 'Jumping Jacks', workSeconds: 30, pauseSeconds: 10, isWarmup: true, howto: '' },
    ],
    rounds: 3,
    roundPause: 90,
    ...overrides,
  };
}

describe('share: encodeWorkout / decodeWorkout', () => {
  it('round-trips a workout config', () => {
    const config = makeConfig();
    const encoded = encodeWorkout('Mein Training', config);
    const decoded = decodeWorkout(encoded);

    expect(decoded.name).toBe('Mein Training');
    expect(decoded.config.rounds).toBe(3);
    expect(decoded.config.roundPause).toBe(90);
    expect(decoded.config.stations).toHaveLength(2);
    expect(decoded.config.stations[0].name).toBe('Squats');
    expect(decoded.config.stations[0].workSeconds).toBe(45);
    expect(decoded.config.stations[0].pauseSeconds).toBe(30);
    expect(decoded.config.stations[0].isWarmup).toBe(false);
    expect(decoded.config.stations[1].isWarmup).toBe(true);
  });

  it('howto is always empty string after decode', () => {
    const config = makeConfig();
    const encoded = encodeWorkout('Test', config);
    const decoded = decodeWorkout(encoded);
    // howto is stripped during encode (not in share format)
    expect(decoded.config.stations[0].howto).toBe('');
  });

  it('handles German characters (Umlaute)', () => {
    const config = makeConfig({
      stations: [{ name: 'Übung mit Ärger', workSeconds: 30, pauseSeconds: 10, isWarmup: false, howto: '' }],
    });
    const encoded = encodeWorkout('Körpertraining', config);
    const decoded = decodeWorkout(encoded);

    expect(decoded.name).toBe('Körpertraining');
    expect(decoded.config.stations[0].name).toBe('Übung mit Ärger');
  });

  it('handles empty stations array', () => {
    const config = makeConfig({ stations: [] });
    const encoded = encodeWorkout('Leer', config);
    const decoded = decodeWorkout(encoded);

    expect(decoded.config.stations).toEqual([]);
    expect(decoded.config.rounds).toBe(3);
  });

  it('produces a valid base64 string', () => {
    const encoded = encodeWorkout('Test', makeConfig());
    // Should not throw when atob is called
    expect(() => atob(encoded)).not.toThrow();
  });

  it('throws on invalid version', () => {
    const data = { v: 99, n: 'X', r: 1, rp: 0, s: [] };
    const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
    expect(() => decodeWorkout(encoded)).toThrow('Unbekanntes Share-Format');
  });

  it('throws on malformed base64', () => {
    expect(() => decodeWorkout('not-valid-base64!!!')).toThrow();
  });

  it('throws on invalid JSON after decode', () => {
    const encoded = btoa('not json');
    expect(() => decodeWorkout(encoded)).toThrow();
  });
});
