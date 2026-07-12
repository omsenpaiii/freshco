import { createBrowserClient } from '@supabase/ssr'

// Client side supabase helper
export const createClientComponentClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  
  return createBrowserClient(url, key)
}

