import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { isCatalogBackendEnabled } from '@/lib/supabase-config'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!isCatalogBackendEnabled() || !url || !serviceRoleKey) {
    throw new Error('Supabase admin credentials are not configured.')
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
