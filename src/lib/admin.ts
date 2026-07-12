import 'server-only'

import { createServerComponentClient } from '@/lib/supabase-server'
import { isAdminEmail } from '@/lib/admin-access'

export async function getAdminSessionUser() {
  const supabase = await createServerComponentClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user || !isAdminEmail(user.email)) {
    return null
  }

  return user
}
