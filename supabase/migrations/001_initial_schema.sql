-- ============================================
-- Ryng — Initial Database Schema
-- ============================================

-- 1. Profiles (auto-created via Auth trigger)
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at  timestamptz default now()
);

-- 2. Plans
create table plans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  name        text not null,
  description text,
  is_system   boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- 3. Plan Days
create table plan_days (
  id          uuid primary key default gen_random_uuid(),
  plan_id     uuid not null references plans(id) on delete cascade,
  label       text not null,
  focus       text,
  sort_order  int not null default 0,
  rounds      int not null default 3,
  round_pause int not null default 90,
  warmup_pause int not null default 10,
  created_at  timestamptz default now()
);

-- 4. Plan Exercises
create table plan_exercises (
  id            uuid primary key default gen_random_uuid(),
  day_id        uuid not null references plan_days(id) on delete cascade,
  name          text not null,
  detail        text,
  muscle_group  text,
  howto         text,
  animation_key text,
  is_warmup     boolean default false,
  work_seconds  int not null,
  pause_seconds int not null,
  sort_order    int not null default 0,
  created_at    timestamptz default now()
);

-- 5. Presets
create table presets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  name        text not null,
  config      jsonb not null,
  stations    jsonb not null,
  created_at  timestamptz default now()
);

-- 6. Sessions
create table sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  started_at    timestamptz not null,
  finished_at   timestamptz not null,
  duration_sec  int not null,
  rounds        int not null,
  station_count int not null,
  plan_day_id   uuid references plan_days(id) on delete set null,
  mesocycle_week int,
  created_at    timestamptz default now()
);

-- 7. Session Entries
create table session_entries (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references sessions(id) on delete cascade,
  station_index int not null,
  station_name  text not null,
  is_warmup     boolean default false,
  work_seconds  int not null,
  actual_seconds int,
  weight_kg     numeric(5,1),
  reps          int,
  notes         text,
  round_number  int not null default 1
);

-- 8. Mesocycle Config
create table mesocycle_config (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid unique not null references profiles(id) on delete cascade,
  cycle_length    int not null default 4,
  current_week    int not null default 1,
  cycle_start     date not null default current_date,
  progression     jsonb not null default '{
    "week1": { "workMultiplier": 1.0, "pauseMultiplier": 1.0, "label": "Basis" },
    "week2": { "workMultiplier": 1.0, "pauseMultiplier": 1.0, "label": "Basis" },
    "week3": { "workMultiplier": 1.11, "pauseMultiplier": 0.83, "label": "Intensiv" },
    "week4": { "workMultiplier": 0.78, "pauseMultiplier": 1.0, "label": "Deload" }
  }',
  updated_at      timestamptz default now()
);

-- 9. Exercise Animations
create table exercise_animations (
  key         text primary key,
  name        text not null,
  svg_frames  jsonb not null,
  category    text,
  created_at  timestamptz default now()
);

-- ============================================
-- Row-Level Security
-- ============================================

alter table profiles enable row level security;
create policy "Users manage own profile" on profiles
  for all using (id = auth.uid());

alter table plans enable row level security;
create policy "Users see own and system plans" on plans
  for select using (user_id = auth.uid() or is_system = true);
create policy "Users insert own plans" on plans
  for insert with check (user_id = auth.uid());
create policy "Users update own plans" on plans
  for update using (user_id = auth.uid() and is_system = false);
create policy "Users delete own plans" on plans
  for delete using (user_id = auth.uid() and is_system = false);

alter table plan_days enable row level security;
create policy "Users manage plan days" on plan_days
  for all using (
    exists (
      select 1 from plans
      where plans.id = plan_days.plan_id
      and (plans.user_id = auth.uid() or plans.is_system = true)
    )
  );

alter table plan_exercises enable row level security;
create policy "Users manage plan exercises" on plan_exercises
  for all using (
    exists (
      select 1 from plan_days
      join plans on plans.id = plan_days.plan_id
      where plan_days.id = plan_exercises.day_id
      and (plans.user_id = auth.uid() or plans.is_system = true)
    )
  );

alter table presets enable row level security;
create policy "Users manage own presets" on presets
  for all using (user_id = auth.uid());

alter table sessions enable row level security;
create policy "Users manage own sessions" on sessions
  for all using (user_id = auth.uid());

alter table session_entries enable row level security;
create policy "Users manage session entries" on session_entries
  for all using (
    exists (
      select 1 from sessions
      where sessions.id = session_entries.session_id
      and sessions.user_id = auth.uid()
    )
  );

alter table mesocycle_config enable row level security;
create policy "Users manage own mesocycle" on mesocycle_config
  for all using (user_id = auth.uid());

alter table exercise_animations enable row level security;
create policy "Animations are public" on exercise_animations
  for select using (true);

-- ============================================
-- Indexes
-- ============================================

create index idx_sessions_user_date on sessions(user_id, started_at desc);
create index idx_session_entries_session on session_entries(session_id);
create index idx_plan_exercises_day on plan_exercises(day_id, sort_order);
create index idx_plan_days_plan on plan_days(plan_id, sort_order);

-- ============================================
-- Auth Trigger: auto-create profile on signup
-- ============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
