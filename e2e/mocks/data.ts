// Test user
export const TEST_USER = {
  id: 'test-user-id-123',
  email: 'test@ryng.app',
  aud: 'authenticated',
  role: 'authenticated',
  email_confirmed_at: '2026-01-01T00:00:00Z',
  app_metadata: { provider: 'email' },
  user_metadata: {},
  created_at: '2026-01-01T00:00:00Z',
};

// Plans
export const testPlans = [
  {
    id: 'plan-1',
    user_id: TEST_USER.id,
    name: 'Ganzkörper',
    description: 'Full body workout',
    is_system: true,
    is_public: true,
    vote_count: 0,
    copy_count: 0,
    tags: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'plan-2',
    user_id: TEST_USER.id,
    name: 'Mein Plan',
    description: 'Custom plan',
    is_system: false,
    is_public: false,
    vote_count: 0,
    copy_count: 0,
    tags: [],
    created_at: '2026-03-01T00:00:00Z',
    updated_at: '2026-03-01T00:00:00Z',
  },
];

// Plan days
export const testPlanDays = [
  { id: 'day-1', plan_id: 'plan-2', label: 'Tag A', focus: 'Oberkörper', sort_order: 0, rounds: 3, round_pause: 90, warmup_pause: 10, created_at: '2026-03-01T00:00:00Z' },
  { id: 'day-2', plan_id: 'plan-2', label: 'Tag B', focus: 'Unterkörper', sort_order: 1, rounds: 3, round_pause: 90, warmup_pause: 10, created_at: '2026-03-01T00:00:00Z' },
];

// Plan exercises
export const testExercises = [
  { id: 'ex-1', day_id: 'day-1', name: 'Liegestütze', speech_name: null, muscle_groups: ['Brust'], howto: 'Push up from the ground', illustration_key: null, animation_key: null, is_warmup: false, work_seconds: 45, pause_seconds: 30, track_weight: false, sort_order: 0, created_at: '2026-03-01T00:00:00Z' },
  { id: 'ex-2', day_id: 'day-1', name: 'Kniebeugen', speech_name: null, muscle_groups: ['Beine'], howto: 'Squat down', illustration_key: null, animation_key: null, is_warmup: false, work_seconds: 45, pause_seconds: 30, track_weight: false, sort_order: 1, created_at: '2026-03-01T00:00:00Z' },
  { id: 'ex-3', day_id: 'day-1', name: 'Plank', speech_name: null, muscle_groups: ['Core'], howto: 'Hold plank position', illustration_key: null, animation_key: null, is_warmup: false, work_seconds: 45, pause_seconds: 30, track_weight: false, sort_order: 2, created_at: '2026-03-01T00:00:00Z' },
];

// Exercise library
export const testLibraryExercises = [
  { id: 'lib-1', name: 'Liegestütze', category: 'strength', muscle_groups: ['Brust', 'Trizeps'], equipment: ['Bodyweight'], howto: 'Push up', speech_name: null, illustration_key: null, usage_count: 50, created_by: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'lib-2', name: 'Kniebeugen', category: 'strength', muscle_groups: ['Beine', 'Gluteus'], equipment: ['Bodyweight'], howto: 'Squat', speech_name: null, illustration_key: null, usage_count: 45, created_by: null, created_at: '2026-01-01T00:00:00Z' },
  { id: 'lib-3', name: 'Jumping Jacks', category: 'warmup', muscle_groups: ['Ganzkörper'], equipment: ['Bodyweight'], howto: 'Jump and spread', speech_name: null, illustration_key: null, usage_count: 30, created_by: null, created_at: '2026-01-01T00:00:00Z' },
];

// Sessions
export const testSessions = [
  {
    id: 'session-1',
    user_id: TEST_USER.id,
    started_at: new Date(Date.now() - 86400000).toISOString(),
    finished_at: new Date(Date.now() - 86400000 + 1800000).toISOString(),
    duration_sec: 1800,
    rounds: 3,
    station_count: 3,
    plan_day_id: 'day-1',
    mesocycle_week: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];
