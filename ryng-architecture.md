# Ryng — Architektur-Blueprint

## Projektübersicht

Ryng ist eine Zirkeltraining-Timer-App mit integriertem Trainingsplan, Session-Tracking und progressiver Overload-Logik. Migration von einer Single-HTML-Datei zu einer vollwertigen React-Anwendung.

**Stack:** Vite + React 18 + TypeScript, Supabase (Auth + Postgres + Realtime), Zustand, Vercel, Workbox (Service Worker)

**Zielplattform:** Mobile-first PWA (iOS Safari Home Screen, Android Chrome), Desktop als Bonus

---

## 1. Screen-Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        APP SHELL                            │
│  Bottom Nav: [Timer] [Pläne] [Verlauf] [Profil]             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TIMER TAB                                                  │
│  ├── ConfigScreen (Default)                                 │
│  │   ├── Preset-Chips (horizontal scroll)                   │
│  │   ├── Runden / Stationen / Rundenpause Stepper           │
│  │   ├── Station-Rows (Name + Work + Pause, per-station)    │
│  │   ├── Geschätzte Dauer                                   │
│  │   └── [STARTEN] Button                                   │
│  │                                                          │
│  ├── TimerScreen (fullscreen overlay, kein Bottom Nav)       │
│  │   ├── Header: Runde · Dauer · Station                    │
│  │   ├── Phase Badge (Aufwärmen / Kraftzirkel)              │
│  │   ├── Übungsname                                         │
│  │   ├── Adaptive Viz (Ring ≤12 / Linear >12)               │
│  │   ├── Countdown                                          │
│  │   ├── Howto-Text (scrollbar)                             │
│  │   ├── SVG-Animation der aktuellen Übung                  │
│  │   └── Controls: Zurück · Weiter · Pause · Stop           │
│  │                                                          │
│  └── DoneScreen (overlay)                                   │
│      ├── Stats: Runden · Stationen · Dauer                  │
│      ├── [NOCHMAL] → zurück zu ConfigScreen                 │
│      └── [VERLAUF] → Verlauf Tab                            │
│                                                             │
│  PLÄNE TAB                                                  │
│  ├── PlanListScreen                                         │
│  │   ├── Eingebaute Pläne (Push/Pull/Beine/Ganzkörper)      │
│  │   ├── Custom Pläne (User-erstellt)                       │
│  │   └── [+ NEUER PLAN] Button                              │
│  │                                                          │
│  ├── PlanDetailScreen                                       │
│  │   ├── Day-Tabs                                           │
│  │   ├── Warmup-Phase (aufklappbare Übungskarten)           │
│  │   ├── Kraft-Phase (aufklappbare Übungskarten)            │
│  │   ├── [WORKOUT LADEN] → Config mit vorausgefüllten Daten │
│  │   └── [BEARBEITEN] (nur bei Custom-Plänen)               │
│  │                                                          │
│  └── PlanEditorScreen                                       │
│      ├── Plan-Name + Beschreibung                           │
│      ├── Day-Tabs + [+ TAG] Button                          │
│      ├── Warmup-Sektion: Übungen hinzufügen/sortieren       │
│      ├── Kraft-Sektion: Übungen hinzufügen/sortieren        │
│      ├── Pro Übung: Name, Detail, Muskelgruppe, Howto,      │
│      │   Dauer, Pause, SVG-Animation-Key                    │
│      ├── Drag & Drop Sortierung                             │
│      └── [SPEICHERN]                                        │
│                                                             │
│  VERLAUF TAB                                                │
│  ├── HistoryListScreen                                      │
│  │   ├── Sessions als Karten (Datum, Dauer, Stationen)      │
│  │   ├── Filter: Woche / Monat / Alle                       │
│  │   ├── Streak-Counter (Tage in Folge trainiert)           │
│  │   └── Wochen-Heatmap (Mo-So Kacheln)                    │
│  │                                                          │
│  └── SessionDetailScreen                                    │
│      ├── Übersicht: Datum, Dauer, Runden                    │
│      ├── Stationsliste mit Zeiten                           │
│      └── [WIEDERHOLEN] → lädt Config mit diesen Settings    │
│                                                             │
│  PROFIL TAB                                                 │
│  ├── Mesozyklus-Status                                      │
│  │   ├── Aktuelle Woche im Zyklus (1-4)                     │
│  │   ├── Nächste Anpassung (Auto-Progression)               │
│  │   └── [ZYKLUS KONFIGURIEREN]                             │
│  ├── Presets verwalten                                      │
│  └── Export / Import (JSON Backup)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Datenmodell (Supabase Postgres)

### 2.1 ER-Diagramm

```
profiles 1──* plans 1──* plan_days 1──* plan_exercises
                                            │
profiles 1──* presets                       │
profiles 1──* sessions 1──* session_entries │
profiles 1──1 mesocycle_config              │
                                            │
                    exercise_animations ◄────┘ (FK exercise.animation_key)
```

### 2.2 Tabellen

#### `profiles`
Erstellt automatisch via Supabase Auth Trigger.

```sql
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at  timestamptz default now()
);
```

#### `plans`
Trainingspläne — eingebaute (system) und benutzerdefinierte.

```sql
create table plans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id) on delete cascade,
  name        text not null,
  description text,
  is_system   boolean default false,  -- true = eingebauter Plan, nicht editierbar
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
```

#### `plan_days`
Tage innerhalb eines Plans (z.B. "Tag A — Push").

```sql
create table plan_days (
  id          uuid primary key default gen_random_uuid(),
  plan_id     uuid not null references plans(id) on delete cascade,
  label       text not null,         -- "Tag A"
  focus       text,                  -- "Push"
  sort_order  int not null default 0,
  rounds      int not null default 3,
  round_pause int not null default 90,  -- Sekunden
  warmup_pause int not null default 10, -- Pause zwischen Warmup-Stationen
  created_at  timestamptz default now()
);
```

#### `plan_exercises`
Einzelne Übungen innerhalb eines Tages.

```sql
create table plan_exercises (
  id            uuid primary key default gen_random_uuid(),
  day_id        uuid not null references plan_days(id) on delete cascade,
  name          text not null,
  detail        text,               -- Kurzbeschreibung
  muscle_group  text,               -- "Brust", "Core", etc.
  howto         text,               -- HTML-formatierte Anleitung
  animation_key text,               -- Verweis auf SVG-Animation
  is_warmup     boolean default false,
  work_seconds  int not null,       -- Ausführungszeit
  pause_seconds int not null,       -- Pause danach
  sort_order    int not null default 0,
  created_at    timestamptz default now()
);
```

#### `presets`
Gespeicherte Timer-Konfigurationen (wie bisher in localStorage).

```sql
create table presets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  name        text not null,
  config      jsonb not null,       -- { rounds, stations, roundPause }
  stations    jsonb not null,       -- Array von { name, work, pause, howto, isWarmup }
  created_at  timestamptz default now()
);
```

#### `sessions`
Abgeschlossene Trainings-Sessions.

```sql
create table sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  started_at    timestamptz not null,
  finished_at   timestamptz not null,
  duration_sec  int not null,
  rounds        int not null,
  station_count int not null,
  plan_day_id   uuid references plan_days(id) on delete set null, -- NULL bei freier Config
  mesocycle_week int,               -- In welcher Woche des Mesozyklus
  created_at    timestamptz default now()
);
```

#### `session_entries`
Pro-Station Tracking innerhalb einer Session.

```sql
create table session_entries (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references sessions(id) on delete cascade,
  station_index int not null,       -- 0-basiert
  station_name  text not null,
  is_warmup     boolean default false,
  work_seconds  int not null,       -- Geplante Zeit
  actual_seconds int,               -- Tatsächliche Zeit (bei Skip kürzer)
  weight_kg     numeric(5,1),       -- Optional: verwendetes Gewicht
  reps          int,                -- Optional: geschaffte Wiederholungen
  notes         text,               -- Freitext-Notiz
  round_number  int not null default 1
);
```

#### `mesocycle_config`
Progressive Overload Konfiguration pro User.

```sql
create table mesocycle_config (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid unique not null references profiles(id) on delete cascade,
  cycle_length    int not null default 4,     -- Wochen pro Zyklus
  current_week    int not null default 1,     -- 1-basiert
  cycle_start     date not null default current_date,
  progression     jsonb not null default '{
    "week1": { "workMultiplier": 1.0, "pauseMultiplier": 1.0, "label": "Basis" },
    "week2": { "workMultiplier": 1.0, "pauseMultiplier": 1.0, "label": "Basis" },
    "week3": { "workMultiplier": 1.11, "pauseMultiplier": 0.83, "label": "Intensiv" },
    "week4": { "workMultiplier": 0.78, "pauseMultiplier": 1.0, "label": "Deload" }
  }',
  updated_at      timestamptz default now()
);

-- Beispiel-Progression:
-- Woche 1-2: 45s/30s (Basis)
-- Woche 3:   50s/25s (workMultiplier 1.11 → 45*1.11≈50, pauseMultiplier 0.83 → 30*0.83≈25)
-- Woche 4:   35s/30s (workMultiplier 0.78 → 45*0.78≈35, Deload)
```

#### `exercise_animations`
SVG-Animationsdaten, getrennt von Übungsdaten, per Key referenziert.

```sql
create table exercise_animations (
  key         text primary key,       -- z.B. "kb_bankdruecken", "squat"
  name        text not null,          -- Anzeigename
  svg_frames  jsonb not null,         -- Array von SVG path data für Keyframes
  category    text,                   -- "push", "pull", "legs", "core", "warmup"
  created_at  timestamptz default now()
);
```

### 2.3 Row-Level Security

```sql
-- Alle User-Tabellen: nur eigene Daten sichtbar
alter table plans enable row level security;
create policy "Users see own plans" on plans
  for all using (user_id = auth.uid() or is_system = true);

-- Gleiche Policies für: presets, sessions, session_entries, mesocycle_config
-- plan_days und plan_exercises: über JOIN auf plans.user_id

-- exercise_animations: public read
create policy "Animations are public" on exercise_animations
  for select using (true);
```

### 2.4 Indizes

```sql
create index idx_sessions_user_date on sessions(user_id, started_at desc);
create index idx_session_entries_session on session_entries(session_id);
create index idx_plan_exercises_day on plan_exercises(day_id, sort_order);
create index idx_plan_days_plan on plan_days(plan_id, sort_order);
```

---

## 3. Komponentenstruktur

```
src/
├── main.tsx
├── App.tsx                          # Router + Auth-Gate + Bottom Nav
├── sw.ts                           # Service Worker (Workbox)
│
├── lib/
│   ├── supabase.ts                 # Supabase Client Singleton
│   ├── timer-engine.ts             # Reine Timer-Logik (kein React)
│   │   ├── Types: TimerState, TimerPhase, TimerConfig
│   │   ├── createTimerEngine(config) → { start, pause, resume, skip, back, stop, onTick }
│   │   └── Audio: beep(), requestWakeLock()
│   ├── mesocycle.ts                # Progression-Berechnungen
│   │   ├── applyProgression(baseWork, basePause, week, config) → { work, pause }
│   │   └── advanceWeek(config) → MesocycleConfig
│   └── offline-queue.ts            # Offline-Mutation Queue
│       ├── enqueue(mutation)        # Speichert in IndexedDB
│       └── flush()                  # Sendet an Supabase wenn online
│
├── stores/
│   ├── timer-store.ts              # Zustand: Timer-State + Actions
│   │   ├── State: phase, station, round, currentSec, isRunning, isPaused
│   │   ├── Config: stations[], rounds, roundPause (per-station work/pause)
│   │   └── Actions: start, pause, resume, skipFwd, skipBack, stop
│   ├── plan-store.ts               # Zustand: aktuell geladener Plan + Editor-State
│   └── session-store.ts            # Zustand: laufende Session-Einträge
│
├── hooks/
│   ├── useTimer.ts                 # Bindet timer-engine an timer-store
│   ├── usePlans.ts                 # CRUD für Plans via Supabase + TanStack Query
│   ├── useSessions.ts              # Session-History via TanStack Query
│   ├── usePresets.ts               # Preset CRUD
│   ├── useMesocycle.ts             # Mesozyklus-State + Progression
│   └── useOffline.ts               # Online/Offline Detection + Queue Flush
│
├── components/
│   ├── ui/                          # Basis-Komponenten
│   │   ├── Stepper.tsx
│   │   ├── Chip.tsx
│   │   ├── Modal.tsx
│   │   ├── Card.tsx
│   │   └── BottomNav.tsx
│   │
│   ├── timer/
│   │   ├── TimerScreen.tsx          # Fullscreen Timer (kein Bottom Nav)
│   │   ├── RingViz.tsx              # SVG-Ring Visualisierung (≤12 Stationen)
│   │   ├── LinearViz.tsx            # Lineare Progress Bar (>12 Stationen)
│   │   ├── Countdown.tsx            # Große Countdown-Zahl mit Blink
│   │   ├── PhaseLabel.tsx           # Übungsname + Warmup/Kraft Badge
│   │   ├── HowtoPanel.tsx          # Scrollbare Übungsbeschreibung
│   │   ├── ExerciseAnimation.tsx   # SVG-Strichanimation der Übung
│   │   └── TimerControls.tsx        # Zurück / Weiter / Pause / Stop
│   │
│   ├── config/
│   │   ├── ConfigScreen.tsx
│   │   ├── StationRow.tsx           # Einzelne Station-Zeile (Name + Work + Pause)
│   │   ├── PresetBar.tsx
│   │   └── DoneScreen.tsx
│   │
│   ├── plans/
│   │   ├── PlanListScreen.tsx
│   │   ├── PlanDetailScreen.tsx
│   │   ├── PlanEditorScreen.tsx
│   │   ├── ExerciseCard.tsx         # Aufklappbare Übungskarte
│   │   └── ExerciseSortable.tsx     # Drag & Drop Wrapper
│   │
│   ├── history/
│   │   ├── HistoryListScreen.tsx
│   │   ├── SessionCard.tsx
│   │   ├── WeekHeatmap.tsx          # Mo-So Kacheln
│   │   ├── StreakCounter.tsx
│   │   └── SessionDetailScreen.tsx
│   │
│   ├── profile/
│   │   ├── ProfileScreen.tsx
│   │   ├── MesocycleWidget.tsx      # Aktuelle Woche + Visualisierung
│   │   └── MesocycleEditor.tsx      # Zyklus konfigurieren
│   │
│   └── animations/
│       ├── AnimationRenderer.tsx    # Generischer SVG-Frame-Player
│       └── animation-data.ts       # Statische SVG-Frame-Daten (Fallback offline)
│
├── types/
│   ├── database.ts                  # Supabase Generated Types
│   ├── timer.ts                     # TimerConfig, TimerState, TimerPhase
│   ├── plan.ts                      # Plan, PlanDay, PlanExercise
│   └── session.ts                   # Session, SessionEntry
│
└── styles/
    ├── globals.css                  # CSS Variables, Reset
    └── theme.ts                     # Design Tokens als JS (für dynamische Styles)
```

---

## 4. Timer-Engine (Kern-Architektur)

Die Timer-Engine ist **framework-agnostisch** — reine TypeScript-Logik ohne React-Dependency. Das ermöglicht einfaches Testen und eine saubere Trennung.

```typescript
// lib/timer-engine.ts — Pseudocode

interface StationConfig {
  name: string;
  workSeconds: number;
  pauseSeconds: number;
  isWarmup: boolean;
  howto: string;
  animationKey?: string;
}

interface TimerConfig {
  stations: StationConfig[];
  rounds: number;
  roundPause: number;
}

interface TimerState {
  phase: 'work' | 'warmup' | 'pause' | 'roundPause' | 'idle' | 'done';
  station: number;       // 1-basiert
  round: number;         // 1-basiert
  currentSec: number;
  phaseDuration: number;
  isRunning: boolean;
  isPaused: boolean;
  exerciseStartTime: number | null;
}

type TimerCallback = (state: TimerState) => void;

function createTimerEngine(config: TimerConfig) {
  let state: TimerState = { /* initial */ };
  let intervalId: number | null = null;
  let listeners: TimerCallback[] = [];

  function emit() { listeners.forEach(fn => fn({...state})); }

  function start() { /* ... */ }
  function pause() { /* ... */ }
  function resume() { /* ... */ }
  function skipForward() { /* ... */ }
  function skipBack() { /* ... */ }
  function stop(): SessionSummary { /* returns elapsed, stations done */ }

  function onTick(fn: TimerCallback) { listeners.push(fn); }

  return { start, pause, resume, skipForward, skipBack, stop, onTick, getState: () => ({...state}) };
}
```

### Zustand Store Anbindung

```typescript
// stores/timer-store.ts

interface TimerStore {
  state: TimerState;
  config: TimerConfig | null;
  engine: ReturnType<typeof createTimerEngine> | null;

  loadConfig: (config: TimerConfig) => void;
  start: () => void;
  pause: () => void;
  // ... weitere Actions
}

const useTimerStore = create<TimerStore>((set, get) => ({
  state: initialState,
  config: null,
  engine: null,

  loadConfig: (config) => {
    const engine = createTimerEngine(config);
    engine.onTick((timerState) => set({ state: timerState }));
    set({ config, engine });
  },

  start: () => get().engine?.start(),
  // ...
}));
```

---

## 5. Offline-Strategie

### 5.1 Service Worker (Workbox)

```typescript
// sw.ts — Workbox config
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';

// Vite-generierte Assets precachen
precacheAndRoute(self.__WB_MANIFEST);

// Google Fonts cachen
registerRoute(
  /fonts\.googleapis\.com/,
  new StaleWhileRevalidate({ cacheName: 'google-fonts' })
);

// Supabase API: Network-first mit Fallback
registerRoute(
  /supabase\.co/,
  new NetworkFirst({ cacheName: 'api-cache', networkTimeoutSeconds: 3 })
);
```

### 5.2 Offline-Mutation Queue

Wenn offline, werden Writes in IndexedDB gepuffert und beim nächsten Online-Event gesendet.

```typescript
// lib/offline-queue.ts

interface QueuedMutation {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

// IndexedDB Store: 'ryng_offline_queue'
// Beim App-Start: check navigator.onLine → flush queue
// Event: window.addEventListener('online', flush)
```

### 5.3 Daten-Schichtung

| Daten | Primär | Offline-Fallback |
|---|---|---|
| Timer-State | Zustand (RAM) | — (flüchtig) |
| Eingebaute Pläne | Hardcoded in Code | ✅ immer verfügbar |
| Custom Pläne | Supabase | IndexedDB Cache |
| Presets | Supabase | IndexedDB Cache |
| Session-History | Supabase | IndexedDB Queue |
| Mesozyklus-Config | Supabase | IndexedDB Cache |
| SVG-Animationen | Statisch im Bundle | ✅ immer verfügbar |

---

## 6. Progressive Overload / Mesozyklus

### 6.1 Konzept

Ein Mesozyklus besteht aus N Wochen (Default: 4). Jede Woche hat einen Multiplikator für Work und Pause:

```
Woche 1-2: Basis       → 45s Work / 30s Pause (1.0x / 1.0x)
Woche 3:   Intensiv     → 50s Work / 25s Pause (1.11x / 0.83x)
Woche 4:   Deload       → 35s Work / 30s Pause (0.78x / 1.0x)
→ Dann Zyklus-Reset mit optional höherem Basis-Gewicht
```

### 6.2 Anwendung

Wenn der User ein Workout aus dem Trainingsplan lädt und ein Mesozyklus aktiv ist:

1. Die Basis-Zeiten kommen aus dem Plan (45s/30s)
2. `applyProgression()` multipliziert mit der aktuellen Woche
3. Die modifizierten Zeiten werden in den Config-Screen geladen
4. Der User sieht die angepassten Werte und kann sie noch manuell ändern
5. Nach dem Training wird `mesocycle_config.current_week` automatisch weitergezählt (nach 7 Tagen oder nach N Sessions)

### 6.3 UI

Im Profil-Tab: ein Mesozyklus-Widget zeigt 4 Blöcke (Wochen), der aktuelle ist hervorgehoben. Klick öffnet den Editor wo man die Multiplikatoren anpassen oder den Zyklus resetten kann.

Im Config-Screen: wenn ein Mesozyklus aktiv ist, steht oben ein kleiner Badge: "Woche 3 · Intensiv" mit den angepassten Zeiten.

---

## 7. SVG-Übungsanimationen

### 7.1 Format

Jede Animation besteht aus 2-4 SVG-Keyframes (Start, Mitte, Ende) als Path-Daten. Die App interpoliert zwischen den Frames per CSS-Animation oder requestAnimationFrame.

```typescript
// components/animations/animation-data.ts

interface AnimationFrame {
  paths: { d: string; stroke: string; strokeWidth: number }[];
}

interface ExerciseAnimation {
  key: string;
  frames: AnimationFrame[];
  duration: number;  // ms für einen kompletten Zyklus
}

// Beispiel: Kurzhantel-Bankdrücken
const kbBankdruecken: ExerciseAnimation = {
  key: 'kb_bankdruecken',
  frames: [
    { paths: [/* Strichfigur: Arme oben, KH über Brust */] },
    { paths: [/* Strichfigur: Arme unten, KH auf Brust */] },
  ],
  duration: 2000,
};
```

### 7.2 Renderer

```tsx
// components/animations/AnimationRenderer.tsx

function AnimationRenderer({ animationKey }: { animationKey?: string }) {
  // 1. Suche Animation in statischen Daten (offline-verfügbar)
  // 2. Fallback: Suche in Supabase exercise_animations (für custom)
  // 3. Wenn nichts gefunden: zeige nichts (kein Platzhalter)

  // Render: SVG viewBox="0 0 100 120", Strichfigur-Stil
  // CSS animation: morpht zwischen Frames
  // Farbe: currentColor (passt sich Phase an — grün/gelb)
}
```

### 7.3 Erstellungsprozess

Initiale Animationen werden als statische Daten im Bundle ausgeliefert. Für Custom-Übungen im Plan-Editor kann man optional einen `animation_key` aus einer Bibliothek zuweisen. Die Bibliothek enthält generische Bewegungsmuster: "push", "pull_horizontal", "pull_vertical", "squat", "hinge", "lunge", "plank", "rotation", "carry", "curl", "press_overhead", "cardio_row", "cardio_run", "stretch_standing", "stretch_floor".

---

## 8. Migrations-Strategie (HTML → React)

### Phase 1: Scaffold + Auth (Tag 1)

```bash
npm create vite@latest ryng -- --template react-ts
cd ryng
npm install @supabase/supabase-js zustand @tanstack/react-query
npm install -D @types/react vite-plugin-pwa workbox-precaching workbox-routing workbox-strategies
```

- Supabase Projekt anlegen, Schema migrieren (SQL oben)
- Auth: Magic Link oder einfaches Passwort (kein Social Login nötig)
- RLS Policies
- Vercel Projekt verbinden

### Phase 2: Timer-Kern (Tag 2-3)

- `timer-engine.ts` portieren (Engine-Logik 1:1 aus HTML-App)
- `timer-store.ts` mit Zustand
- `ConfigScreen`, `TimerScreen`, `DoneScreen` als React-Komponenten
- `RingViz` + `LinearViz` (adaptive Visualisierung)
- Audio (Beeps) + Wake Lock
- Per-Station Zeiten im Config

### Phase 3: Pläne + Presets (Tag 4-5)

- Eingebaute Pläne als Seed-Data in Supabase
- `PlanListScreen`, `PlanDetailScreen` mit TanStack Query
- Workout laden → Config-Screen
- Presets: CRUD über Supabase statt localStorage
- Plan-Editor: Grundstruktur (CRUD für Days + Exercises)

### Phase 4: Session-Tracking + History (Tag 6-7)

- `session_entries` in `finishExercise()` speichern
- History-Screen mit TanStack Query
- SessionDetail-Screen
- Wochen-Heatmap + Streak-Counter

### Phase 5: Mesozyklus (Tag 8)

- `mesocycle_config` CRUD
- `applyProgression()` in Config-Screen
- Mesozyklus-Widget im Profil
- Auto-Advance Logik

### Phase 6: Offline + PWA (Tag 9)

- Workbox Service Worker mit Vite-Plugin
- IndexedDB Cache für Plans + Presets
- Offline-Mutation Queue
- Manifest + Icons

### Phase 7: SVG-Animationen (Tag 10+)

- `animation-data.ts` mit initialen 15-20 Übungsanimationen
- `AnimationRenderer.tsx`
- Integration in TimerScreen
- Animation-Key Picker im Plan-Editor

### Phase 8: Polish (Tag 11-12)

- Transitions zwischen Screens (Framer Motion)
- Drag & Drop im Plan-Editor (dnd-kit)
- Export/Import (JSON Download/Upload)
- Error Boundaries
- Performance-Optimierung (React.memo, useMemo für SVG Paths)

---

## 9. Design Tokens

Aus der HTML-App übernehmen und als CSS-Variablen + Tailwind-Config bereitstellen:

```typescript
// styles/theme.ts
export const theme = {
  colors: {
    bg: '#0a0a0f',
    surface: '#13131a',
    surface2: '#1c1c27',
    border: '#2a2a3a',
    text: '#f0f0f8',
    textDim: '#6b6b80',
    accentWork: '#00e5a0',
    accentWorkDark: '#00b87a',
    accentPause: '#ff6b35',
    accentRound: '#6c8bff',
    accentWarmup: '#f5c542',
    danger: '#ff5555',
  },
  bgPhase: {
    work: '#071f17',
    pause: '#1f1008',
    round: '#0c1028',
    warmup: '#1a1708',
  },
  fonts: {
    display: "'Bebas Neue', sans-serif",
    body: "'DM Sans', sans-serif",
  },
} as const;
```

---

## 10. Offene Entscheidungen

| # | Frage | Empfehlung |
|---|---|---|
| 1 | Auth-Methode | Magic Link (kein Passwort-Management, Mobile-friendly) |
| 2 | Routing | React Router v6 (wouter wäre leichter, aber Router v6 hat bessere Nested-Routes für Tab-Navigation) |
| 3 | Drag & Drop Library | `@dnd-kit/core` (leichtgewichtig, touch-optimiert) |
| 4 | SVG Animation Approach | CSS `@keyframes` mit `d` path morphing (Chrome/Safari), Fallback: Frame-Swap per requestAnimationFrame |
| 5 | Supabase Realtime | Nicht nötig (Single-User App), nur REST |
| 6 | Seed System Plans | SQL Seed Script beim ersten Deployment, User bekommt Kopie in `plans` mit `is_system=true` |
| 7 | IndexedDB Library | `idb` (Jake Archibald, <1kb, Promise-based) |
| 8 | Gewichts-Tracking UX | Nach "Fertig!" optionaler Quick-Entry pro Station (Gewicht + Reps), skipbar |
