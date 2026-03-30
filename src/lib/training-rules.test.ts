import { describe, it, expect } from 'vitest';
import { analyzeTraining } from './training-rules.ts';
import type { StationConfig } from '../types/timer.ts';

function station(name: string, isWarmup = false, workSeconds = 45): StationConfig {
  return { name, workSeconds, pauseSeconds: 30, isWarmup, howto: '' };
}

describe('training-rules: analyzeTraining', () => {
  it('returns empty warnings for a well-structured plan', () => {
    const stations = [
      station('Jumping Jacks', true),    // warmup: covers beine (jump)
      station('Arm Circles', true),       // warmup: covers push (schultern)
      station('Bodyweight Rows', true),   // warmup: covers pull
      station('Dead Bug', true),          // warmup: covers core
      station('Kniebeugen'),              // beine
      station('Liegestütze'),             // push
      station('Klimmzüge'),              // pull
      station('Plank'),                   // core
    ];
    const warnings = analyzeTraining(stations);
    expect(warnings).toEqual([]);
  });

  it('warns about missing warmup', () => {
    const stations = [
      station('Kniebeugen'),
      station('Liegestütze'),
    ];
    const warnings = analyzeTraining(stations);
    expect(warnings.some((w) => w.type === 'warning' && w.message.includes('Aufwärmen'))).toBe(true);
  });

  it('warns about consecutive same-region exercises', () => {
    const stations = [
      station('Jumping Jacks', true),
      station('Liegestütze'),      // push: brust, schultern, trizeps
      station('KH-Schulterdrücken'), // push: schultern
    ];
    const warnings = analyzeTraining(stations);
    expect(warnings.some((w) => w.message.includes('Push'))).toBe(true);
  });

  it('does NOT warn about consecutive in a deliberate push split', () => {
    const stations = [
      station('Jumping Jacks', true),
      station('Liegestütze'),        // push
      station('KH-Schulterdrücken'), // push
      station('Dips'),               // push
      station('Trizeps Pushdown'),   // push
    ];
    const warnings = analyzeTraining(stations);
    // All exercises are push → deliberate split, no consecutive region warning
    const regionWarnings = warnings.filter((w) => w.message.includes('belasten beide'));
    expect(regionWarnings.length).toBe(0);
  });

  it('warns about uncovered warmup regions', () => {
    const stations = [
      station('Arm Circles', true),   // warms up schultern (push)
      station('Kniebeugen'),           // needs beine warmup
    ];
    const warnings = analyzeTraining(stations);
    expect(warnings.some((w) => w.message.includes('Nicht aufgewärmt') && w.message.includes('Beine'))).toBe(true);
  });

  it('warns about very short work time (<15s)', () => {
    const stations = [
      station('Squats', false, 10),
    ];
    const warnings = analyzeTraining(stations);
    expect(warnings.some((w) => w.message.includes('10s') && w.message.includes('sehr kurz'))).toBe(true);
  });

  it('limits warnings to max 3', () => {
    const stations = [
      // No warmup (1 warning) + 5 short exercises (5 warnings) → should cap at 3
      station('A', false, 5),
      station('B', false, 5),
      station('C', false, 5),
      station('D', false, 5),
      station('E', false, 5),
    ];
    const warnings = analyzeTraining(stations);
    expect(warnings.length).toBeLessThanOrEqual(3);
  });

  it('returns empty for no kraft stations', () => {
    const stations = [
      station('Jumping Jacks', true),
      station('Arm Circles', true),
    ];
    expect(analyzeTraining(stations)).toEqual([]);
  });

  it('detects muscles correctly for common exercises', () => {
    // Bankdrücken → push region
    const bankdruecken = [
      station('Jumping Jacks', true),
      station('KH Bankdrücken'),
      station('KH-Schulterdrücken'), // also push
    ];
    // Should be deliberate split (all push) OR warn about consecutive
    const warnings = analyzeTraining(bankdruecken);
    // Both are push → deliberate split → no consecutive warning
    const regionWarnings = warnings.filter((w) => w.message.includes('belasten beide'));
    expect(regionWarnings.length).toBe(0);
  });

  it('handles core exercises without consecutive warning', () => {
    // Core is excluded from consecutive region checks
    const stations = [
      station('Jumping Jacks', true),
      station('Plank'),
      station('Russian Twists'),
      station('Dead Bug'),
    ];
    const warnings = analyzeTraining(stations);
    const regionWarnings = warnings.filter((w) => w.message.includes('belasten beide'));
    expect(regionWarnings.length).toBe(0);
  });
});
