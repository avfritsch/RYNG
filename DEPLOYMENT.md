# Deployment

RYNG is deployed on Vercel with Supabase as backend.

## Vercel Setup

1. Connect GitHub repo to Vercel
2. Framework preset: **Vite**
3. Build command: `npm run build`
4. Output directory: `dist`

### Environment Variables (Vercel Dashboard)

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `VITE_SENTRY_DSN` | No | Sentry error tracking |
| `VITE_VAPID_PUBLIC_KEY` | No | Web Push VAPID public key |
| `VITE_APP_VERSION` | No | App version for Sentry releases |
| `SENTRY_AUTH_TOKEN` | No | Sentry source map upload |
| `SENTRY_ORG` | No | Sentry organization slug |
| `SENTRY_PROJECT` | No | Sentry project slug |

## Supabase

### Migrations
```bash
npx supabase db push
```

### Edge Functions
```bash
npx supabase functions deploy generate-plan
npx supabase functions deploy send-notification
```

### Secrets
```bash
npx supabase secrets set \
  ANTHROPIC_API_KEY=... \
  ALLOWED_ORIGIN=https://ryng.vercel.app \
  VAPID_PUBLIC_KEY=... \
  VAPID_PRIVATE_KEY=... \
  VAPID_EMAIL=noreply@ryng.app
```

### Push Notifications Setup
```bash
npx web-push generate-vapid-keys
# Copy public key → VITE_VAPID_PUBLIC_KEY + VAPID_PUBLIC_KEY
# Copy private key → VAPID_PRIVATE_KEY
```

### Cron Jobs (pg_cron)
Requires `pg_cron` and `pg_net` extensions enabled in Supabase dashboard.
Migration `021_notification_cron.sql` sets up:
- Training reminders (every 30 min)
- Weekly recap (Sunday 20:00 UTC)
- Comeback check (daily 10:00 UTC)

## CI/CD Pipeline

GitHub Actions (`.github/workflows/ci.yml`) runs on every push:
1. Security audit (`npm audit`)
2. Type check (`tsc --noEmit`)
3. Unit tests (Vitest, 174 tests)
4. Build (Vite)
5. E2E tests (Playwright, 90 tests)

## Release Process

Releases are automated via semantic-release based on commit messages:
- `feat:` → minor version bump
- `fix:` → patch version bump
- `feat!:` or `BREAKING CHANGE:` → major version bump
