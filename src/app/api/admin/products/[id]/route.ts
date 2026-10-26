import { NextRequest, NextResponse } from 'next/server'
import { getAdminSessionUser } from '@/lib/admin'
import { AdminCatalogError, retireAdminProduct, saveAdminProduct } from '@/lib/admin-catalog'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  if (!await getAdminSessionUser()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const productId = Number((await params).id)
  if (!Number.isSafeInteger(productId) || productId <= 0) return NextResponse.json({ error: 'Invalid product id.' }, { status: 400 })

  try {
    const product = await saveAdminProduct(await request.json() as Record<string, unknown>, productId)
    return NextResponse.json({ product })
  } catch (error) {
    if (error instanceof AdminCatalogError) return NextResponse.json({ error: error.message }, { status: error.status })
    console.error('Neon admin product update failed:', error)
    return NextResponse.json({ error: 'Could not update product.' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  if (!await getAdminSessionUser()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const productId = Number((await params).id)
  if (!Number.isSafeInteger(productId) || productId <= 0) return NextResponse.json({ error: 'Invalid product id.' }, { status: 400 })

  try {
    const deleted = await retireAdminProduct(productId)
    return deleted
      ? NextResponse.json({ success: true, retired: true })
      : NextResponse.json({ error: 'Product not found.' }, { status: 404 })
  } catch (error) {
    console.error('Neon admin product retirement failed:', error)
    return NextResponse.json({ error: 'Could not retire product.' }, { status: 500 })
  }
}
