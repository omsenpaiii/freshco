import { createBrowserClient } from '@supabase/ssr'
import { getPublicSupabaseConfig } from '@/lib/supabase-config'

// Client side supabase helper
export const createClientComponentClient = () => {
  const { url, key } = getPublicSupabaseConfig()
  
  return createBrowserClient(url, key)
}
