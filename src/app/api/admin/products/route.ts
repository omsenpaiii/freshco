import { NextRequest, NextResponse } from 'next/server'
import { getAdminSessionUser } from '@/lib/admin'
import { AdminCatalogError, getAdminCatalog, saveAdminProduct } from '@/lib/admin-catalog'

export async function GET() {
  const user = await getAdminSessionUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { products } = await getAdminCatalog()
    return NextResponse.json({ products })
  } catch (error) {
    console.error('Neon admin product list failed:', error)
    return NextResponse.json({ error: 'Could not load products.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getAdminSessionUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await request.json() as Record<string, unknown>
  try {
    const product = await saveAdminProduct(payload)
    return NextResponse.json({ product })
  } catch (error) {
    if (error instanceof AdminCatalogError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('Neon admin product create failed:', error)
    return NextResponse.json({ error: 'Could not save product.' }, { status: 500 })
  }
}
