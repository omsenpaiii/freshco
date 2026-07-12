import { NextRequest, NextResponse } from 'next/server'
import { getAdminSessionUser } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase-admin'
import { normalizeImageUrls, slugify } from '@/lib/catalog'

async function recalculateCategoryProductCount(categoryId: number | null) {
  if (!categoryId) return

  const supabase = createAdminClient()
  const { count } = await supabase
    .from('products')
    .select('*', { head: true, count: 'exact' })
    .eq('category_id', categoryId)

  await supabase
    .from('categories')
    .update({ products_count: count ?? 0 })
    .eq('id', categoryId)
}

export async function GET() {
  const user = await getAdminSessionUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name, slug)')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ products: data ?? [] })
}

export async function POST(request: NextRequest) {
  const user = await getAdminSessionUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await request.json()
  const name = String(payload.name || '').trim()
  const slug = slugify(payload.slug || name)

  if (!name || !slug) {
    return NextResponse.json({ error: 'Name and slug are required.' }, { status: 400 })
  }

  const categoryId = payload.category_id ? Number(payload.category_id) : null
  const supabase = createAdminClient()
  const product = {
    id: Date.now(),
    name,
    slug,
    description: String(payload.description || ''),
    price: Number(payload.price || 0),
    compare_at_price:
      payload.compare_at_price === '' || payload.compare_at_price == null
        ? null
        : Number(payload.compare_at_price),
    sku: String(payload.sku || '').trim(),
    inventory_quantity: Number(payload.inventory_quantity || 0),
    is_featured: Boolean(payload.is_featured),
    is_trending: Boolean(payload.is_trending),
    images: normalizeImageUrls(payload.images),
    category_id: categoryId,
  }

  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select('*, categories(name, slug)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await recalculateCategoryProductCount(categoryId)

  return NextResponse.json({ product: data })
}

