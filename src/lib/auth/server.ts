import { createNeonAuth } from '@neondatabase/auth/next/server'

export const auth = createNeonAuth({
  // FreshCo's Vercel endpoint is explicitly scoped to the verified Neon
  // branch URL; retain the standard Neon env name as a local fallback.
  baseUrl: process.env.FRESHCO_NEON_AUTH_BASE_URL || process.env.NEON_AUTH_BASE_URL!,
  cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
})
