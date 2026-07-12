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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminSessionUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const productId = Number(id)
  const payload = await request.json()
  const name = String(payload.name || '').trim()
  const slug = slugify(payload.slug || name)

  if (!productId || !name || !slug) {
    return NextResponse.json({ error: 'Valid product values are required.' }, { status: 400 })
  }

  const categoryId = payload.category_id ? Number(payload.category_id) : null
  const supabase = createAdminClient()

  const { data: previousProduct } = await supabase
    .from('products')
    .select('category_id')
    .eq('id', productId)
    .single()

  const { data, error } = await supabase
    .from('products')
    .update({
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
    })
    .eq('id', productId)
    .select('*, categories(name, slug)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await recalculateCategoryProductCount(previousProduct?.category_id ?? null)
  await recalculateCategoryProductCount(categoryId)

  return NextResponse.json({ product: data })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAdminSessionUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const productId = Number(id)

  if (!productId) {
    return NextResponse.json({ error: 'Invalid product id.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: previousProduct } = await supabase
    .from('products')
    .select('category_id')
    .eq('id', productId)
    .single()

  const { error } = await supabase.from('products').delete().eq('id', productId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await recalculateCategoryProductCount(previousProduct?.category_id ?? null)

  return NextResponse.json({ success: true })
}

