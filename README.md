# RYNG — Fitness Timer PWA

![CI](https://github.com/avfritsch/RYNG/actions/workflows/ci.yml/badge.svg)

Zirkeltraining-Timer und Gym-Logbuch als installierbare Web-App: Trainingspläne,
Übungsbibliothek mit Illustrationen, Sprachansagen, Gewichts-Tracking, Verlauf
und Offline-Betrieb.

**Stack:** React 19 · TypeScript · Vite · Zustand · TanStack Query · Supabase
(Postgres, Auth, Edge Functions) · Workbox (Service Worker) · Vercel

## Entwicklung

```bash
cp .env.local.example .env.local   # Supabase-URL und Anon-Key eintragen
npm install                        # installiert auch Git-Hooks (pre-push, commit-msg)
npm run dev
```

| Befehl | Zweck |
|---|---|
| `npm test` | Unit-Tests (Vitest) |
| `npm run test:e2e` | E2E-Tests (Playwright, Supabase komplett gemockt) |
| `npx tsc -b` | Type-Check aller Projekt-Referenzen |
| `npm run lint` | ESLint |
| `npm run build` | Produktions-Build |

## Aufbau

| Pfad | Inhalt |
|---|---|
| `src/lib/timer-engine.ts` | Zirkel-Timer: Ablaufplan, Uhrzeit-basierte Phasen, Einträge, Snapshot/Restore |
| `src/lib/workout-loader.ts` | Einziger Weg von Plan/Session zu einem startbaren Training |
| `src/lib/offline-queue.ts` | Outbox für Trainings, die offline beendet wurden |
| `src/stores/` | Zustand-Stores (Timer, laufende Session, Gym) — persistiert in `localStorage` |
| `src/hooks/` | Datenzugriff über TanStack Query |
| `src/sw.ts` | Service Worker (App-Shell, Precache, Push) |
| `supabase/migrations/` | Datenbankschema und RLS-Policies |
| `supabase/functions/` | Edge Functions: KI-Planer, Push-Versand, Kontolöschung |
| `e2e/` | Playwright-Specs, Mocks, Referenz-Screenshots |

Deployment, Secrets und Cron-Jobs: siehe [DEPLOYMENT.md](DEPLOYMENT.md).
Beitragsregeln: siehe [CONTRIBUTING.md](CONTRIBUTING.md).

> `ryng-architecture.md` ist der ursprüngliche Entwurf aus der Migration und
> beschreibt nicht mehr in allen Punkten den aktuellen Stand.
