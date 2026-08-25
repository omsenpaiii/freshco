import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getPublicSupabaseConfig } from '@/lib/supabase-config'

// Server side supabase helper (Server Components, Actions, Routes)
export const createServerComponentClient = async () => {
  const cookieStore = await cookies()

  const { url, key } = getPublicSupabaseConfig()

  return createServerClient(
    url,
    key,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // Handled when called from Server Component
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // Handled when called from Server Component
          }
        },
      },
    }
  )
}
