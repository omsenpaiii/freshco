import { NextResponse } from 'next/server'
import { getAdminSessionUser } from '@/lib/admin'

export async function GET() {
  const user = await getAdminSessionUser()

  return NextResponse.json({
    isAdmin: !!user,
    email: user?.email ?? null,
  })
}

