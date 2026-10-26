import 'server-only'

import { auth } from '@/lib/auth/server'
import { isAdminEmail } from '@/lib/admin-access'

export async function getAdminSessionUser() {
  const { data: session, error } = await auth.getSession()
  const user = session?.user
  if (error || !user || !isAdminEmail(user.email)) {
    return null
  }

  return user
}
