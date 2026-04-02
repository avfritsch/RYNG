import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_VAPID_PUBLIC_KEY: z.string().optional(),
  VITE_APP_VERSION: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse({
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN || undefined,
    VITE_VAPID_PUBLIC_KEY: import.meta.env.VITE_VAPID_PUBLIC_KEY || undefined,
    VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION || undefined,
  });

  if (!result.success) {
    const missing = result.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Invalid environment variables: ${missing}. Check .env.local.example`);
  }

  return result.data;
}

export const env = validateEnv();
