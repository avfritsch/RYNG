import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rateLimit, checkRateLimit } from './rate-limit.ts';

beforeEach(() => {
  vi.useFakeTimers();
});

describe('rate-limit: rateLimit', () => {
  it('allows first request', () => {
    expect(rateLimit('test-allow', 5, 60_000)).toBe(true);
  });

  it('allows up to maxPerWindow requests', () => {
    for (let i = 0; i < 3; i++) {
      expect(rateLimit('test-max', 3, 60_000)).toBe(true);
    }
  });

  it('blocks after exceeding maxPerWindow', () => {
    for (let i = 0; i < 3; i++) {
      rateLimit('test-block', 3, 60_000);
    }
    expect(rateLimit('test-block', 3, 60_000)).toBe(false);
  });

  it('allows again after window expires', () => {
    for (let i = 0; i < 3; i++) {
      rateLimit('test-expire', 3, 1_000);
    }
    expect(rateLimit('test-expire', 3, 1_000)).toBe(false);

    vi.advanceTimersByTime(1_001);
    expect(rateLimit('test-expire', 3, 1_000)).toBe(true);
  });

  it('uses separate windows per key', () => {
    for (let i = 0; i < 3; i++) {
      rateLimit('key-a', 3, 60_000);
    }
    // key-a is exhausted, but key-b should still work
    expect(rateLimit('key-a', 3, 60_000)).toBe(false);
    expect(rateLimit('key-b', 3, 60_000)).toBe(true);
  });
});

describe('rate-limit: checkRateLimit', () => {
  it('does not throw within limits', () => {
    expect(() => checkRateLimit('check-ok', 5, 60_000)).not.toThrow();
  });

  it('throws when rate limited', () => {
    for (let i = 0; i < 10; i++) {
      checkRateLimit('check-throw', 10, 60_000);
    }
    expect(() => checkRateLimit('check-throw', 10, 60_000)).toThrow('Zu viele Anfragen');
  });
});
