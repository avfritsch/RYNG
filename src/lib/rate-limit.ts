/** Simple client-side rate limiter. Returns true if the action is allowed. */
const timestamps = new Map<string, number[]>();

export function rateLimit(key: string, maxPerWindow: number, windowMs: number): boolean {
  const now = Date.now();
  const times = timestamps.get(key) ?? [];

  // Remove expired entries
  const valid = times.filter((t) => now - t < windowMs);

  if (valid.length >= maxPerWindow) {
    return false; // Rate limited
  }

  valid.push(now);
  timestamps.set(key, valid);
  return true;
}

/** Throws if rate limited. Use in mutation handlers. */
export function checkRateLimit(key: string, maxPerWindow: number = 10, windowMs: number = 60_000) {
  if (!rateLimit(key, maxPerWindow, windowMs)) {
    throw new Error('Zu viele Anfragen. Bitte warte einen Moment.');
  }
}
