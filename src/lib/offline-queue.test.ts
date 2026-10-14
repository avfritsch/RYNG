import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── In-memory stand-in for idb ──
const store = new Map<string, unknown>();
vi.mock('idb', () => ({
  openDB: async () => ({
    put: async (_s: string, v: { id: string }) => { store.set(v.id, structuredClone(v)); },
    delete: async (_s: string, id: string) => { store.delete(id); },
    getAll: async () => [...store.values()].map((v) => structuredClone(v)),
    count: async () => store.size,
  }),
}));

// ── Supabase mock: each table call pops a scripted result ──
const calls: { table: string; rows: unknown }[] = [];
let failWith: unknown = null;
vi.mock('./supabase.ts', () => ({
  supabase: {
    from: (table: string) => ({
      upsert: async (rows: unknown) => {
        calls.push({ table, rows });
        if (failWith) return { error: failWith };
        return { error: null };
      },
    }),
    rpc: () => Promise.resolve({ error: null }),
    auth: { getSession: async () => ({ data: { session: { user: { id: 'u1' } } } }) },
  },
}));

vi.mock('./logger.ts', () => ({ logger: { warn: vi.fn(), error: vi.fn() } }));

const { queueSession, flush, pendingCount, isNetworkError } = await import('./offline-queue.ts');

function makeSession(id: string) {
  return {
    session: {
      id,
      user_id: 'u1',
      started_at: '2026-01-01T10:00:00Z',
      finished_at: '2026-01-01T10:30:00Z',
      duration_sec: 1800,
      rounds: 3,
      station_count: 2,
      plan_day_id: null,
      mesocycle_week: null,
    },
    entries: [{
      id: `${id}-e1`,
      session_id: id,
      station_index: 0,
      station_name: 'Squats',
      is_warmup: false,
      work_seconds: 45,
      actual_seconds: 45,
      weight_kg: 20,
      reps: 10,
      notes: null,
      round_number: 1,
    }],
  };
}

beforeEach(() => {
  store.clear();
  calls.length = 0;
  failWith = null;
});

describe('offline-queue', () => {
  it('syncs queued sessions, session before entries, and empties the queue', async () => {
    const a = makeSession('s1');
    await queueSession(a.session, a.entries);
    expect(await pendingCount()).toBe(1);

    expect(await flush()).toBe(1);
    expect(calls.map((c) => c.table)).toEqual(['sessions', 'session_entries']);
    expect(await pendingCount()).toBe(0);
  });

  it('keeps sessions in the queue when sync fails, and never discards them', async () => {
    const a = makeSession('s1');
    await queueSession(a.session, a.entries);
    failWith = { message: 'permission denied' };

    for (let i = 0; i < 5; i++) expect(await flush()).toBe(0);
    expect(await pendingCount()).toBe(1);

    failWith = null;
    expect(await flush()).toBe(1);
    expect(await pendingCount()).toBe(0);
  });

  it('stops after the first network error (still offline)', async () => {
    for (const id of ['s1', 's2', 's3']) {
      const x = makeSession(id);
      await queueSession(x.session, x.entries);
    }
    failWith = new TypeError('Failed to fetch');
    expect(await flush()).toBe(0);
    expect(calls).toHaveLength(1);
    expect(await pendingCount()).toBe(3);
  });

  it('only syncs workouts of the signed-in user', async () => {
    const other = makeSession('s9');
    await queueSession({ ...other.session, user_id: 'someone-else' }, other.entries);
    expect(await flush()).toBe(0);
    expect(await pendingCount()).toBe(1);
  });

  it('detects network errors', () => {
    expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true);
    expect(isNetworkError({ message: 'TypeError: Load failed' })).toBe(true);
    expect(isNetworkError({ message: 'new row violates row-level security policy' })).toBe(false);
  });
});
