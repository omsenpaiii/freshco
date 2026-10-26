import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server'
import { query } from '@/lib/neon'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const { data: session, error } = await auth.getSession()
  if (error || !session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const [addresses, orders] = await Promise.all([
      query('SELECT * FROM addresses WHERE profile_id=$1 ORDER BY created_at DESC', [session.user.id]),
      query('SELECT id,created_at,total_amount,status FROM orders WHERE profile_id=$1 ORDER BY created_at DESC LIMIT 100', [session.user.id]),
    ])
    return NextResponse.json({ addresses: addresses.rows, orders: orders.rows })
  } catch (cause) {
    console.error('Neon account read failed:', cause)
    return NextResponse.json({ error: 'Could not load account details.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { data: session, error } = await auth.getSession()
  if (error || !session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = await request.json() as Record<string, unknown>
  const address = {
    addressLine1: typeof payload.address_line_1 === 'string' ? payload.address_line_1.trim().slice(0, 240) : '',
    city: typeof payload.city === 'string' ? payload.city.trim().slice(0, 100) : '',
    state: typeof payload.state === 'string' ? payload.state.trim().slice(0, 40) : '',
    postalCode: typeof payload.postal_code === 'string' ? payload.postal_code.trim().slice(0, 12) : '',
    phone: typeof payload.phone === 'string' ? payload.phone.trim().slice(0, 32) : '',
  }
  if (!address.addressLine1 || !address.city || !address.state || !address.postalCode) {
    return NextResponse.json({ error: 'Street address, suburb, state and postcode are required.' }, { status: 400 })
  }

  try {
    await query(`INSERT INTO profiles (id,email,full_name) VALUES ($1,$2,$3)
      ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email,full_name=COALESCE(profiles.full_name,EXCLUDED.full_name)`, [
      session.user.id, session.user.email, session.user.name || null,
    ])
    const { rows } = await query(`INSERT INTO addresses (profile_id,address_line_1,city,state,postal_code,phone,country)
      VALUES ($1,$2,$3,$4,$5,$6,'Australia') RETURNING *`, [
      session.user.id, address.addressLine1, address.city, address.state, address.postalCode, address.phone || null,
    ])
    return NextResponse.json({ address: rows[0] }, { status: 201 })
  } catch (cause) {
    console.error('Neon account address create failed:', cause)
    return NextResponse.json({ error: 'Could not save address.' }, { status: 500 })
  }
}
