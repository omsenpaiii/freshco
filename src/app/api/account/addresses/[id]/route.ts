import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'
import { query } from '@/lib/neon'

export const runtime = 'nodejs'

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { data: session, error } = await auth.getSession()
  if (error || !session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = (await params).id
  try {
    const { rows } = await query('DELETE FROM addresses WHERE id=$1 AND profile_id=$2 RETURNING id', [id, session.user.id])
    return rows[0] ? NextResponse.json({ success: true }) : NextResponse.json({ error: 'Address not found.' }, { status: 404 })
  } catch (cause) {
    console.error('Neon account address delete failed:', cause)
    return NextResponse.json({ error: 'Could not delete address.' }, { status: 500 })
  }
}
