# Contributing to RYNG

## Development Setup

1. **Clone & install:**
   ```bash
   git clone https://github.com/avfritsch/RYNG.git
   cd RYNG
   npm install
   ```
   This automatically installs git hooks via `npm prepare`.

2. **Environment:**
   Copy `.env.local.example` to `.env.local` and fill in:
   - `VITE_SUPABASE_URL` — Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — Supabase anon key
   - `VITE_SENTRY_DSN` — (optional) Sentry DSN
   - `VITE_VAPID_PUBLIC_KEY` — (optional) for push notifications

3. **Start dev server:**
   ```bash
   npm run dev
   ```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Type check + production build |
| `npm test` | Run unit tests (Vitest) |
| `npm run test:e2e` | Run E2E tests (Playwright) |
| `npm run test:e2e:ui` | E2E tests with interactive UI |
| `npm run test:all` | Unit + E2E tests |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting |
| `npm run lint` | ESLint |

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | When |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `perf:` | Performance improvement |
| `refactor:` | Code change (no feature/fix) |
| `test:` | Adding/updating tests |
| `docs:` | Documentation only |
| `chore:` | Build, CI, deps, config |
| `ci:` | CI/CD changes |

Example: `feat: add weekly training goal with progress ring`

## Testing

### Unit Tests (Vitest)
- Located in `src/**/*.test.ts`
- Run: `npm test`
- Test pure functions, stores, and lib modules

### E2E Tests (Playwright)
- Located in `e2e/specs/*.spec.ts`
- Run: `npm run test:e2e`
- Mock data in `e2e/mocks/`
- Tests: happy paths, error states, accessibility, visual regression

### Pre-push Hook
Every `git push` automatically runs type check + unit tests + E2E tests.
Skip with `git push --no-verify` (use sparingly).

## Code Style

- TypeScript strict mode
- Prettier for formatting (`.prettierrc`)
- ESLint for linting (`eslint.config.js`)
- German UI text, English code/comments

## Architecture

See `ryng-architecture.md` for the full architecture blueprint.

### Key directories:
```
src/
  components/   — React components by feature
  hooks/        — React Query hooks + custom hooks
  stores/       — Zustand stores
  lib/          — Pure utilities, helpers
  styles/       — CSS per component
  types/        — TypeScript interfaces
supabase/
  migrations/   — Database migrations
  functions/    — Supabase Edge Functions
e2e/
  specs/        — Playwright test specs
  mocks/        — API mock data + route handlers
```
