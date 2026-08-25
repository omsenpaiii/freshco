import { NextRequest, NextResponse } from 'next/server'
import { getAdminSessionUser } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase-admin'
import { normalizeImageUrls, normalizeVariants, slugify } from '@/lib/catalog'

async function recalculateCategoryProductCount(categoryId: number | null) {
  if (!categoryId) return

  const supabase = createAdminClient()
  const { count } = await supabase
    .from('products')
    .select('*', { head: true, count: 'exact' })
    .eq('category_id', categoryId)
    .eq('status', 'published')

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
    .select('*, categories(name, slug), product_variants(*)')
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
  let variants
  try {
    variants = normalizeVariants(payload.variants)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid variants.' }, { status: 400 })
  }
  const defaultVariant = variants.find((variant) => variant.is_default) || variants[0]
  const images = normalizeImageUrls(payload.images)
  if (payload.status === 'published' && (payload.image_match_status !== 'verified' || images.length === 0)) {
    return NextResponse.json({ error: 'Published products require a verified exact-match image.' }, { status: 400 })
  }
  const product = {
    id: Date.now(),
    name,
    slug,
    description: String(payload.description || ''),
    price: defaultVariant.price,
    compare_at_price:
      payload.compare_at_price === '' || payload.compare_at_price == null
        ? null
        : Number(payload.compare_at_price),
    sku: defaultVariant.sku,
    inventory_quantity: defaultVariant.inventory_quantity,
    is_featured: Boolean(payload.is_featured),
    is_trending: Boolean(payload.is_trending),
    images,
    category_id: categoryId,
    brand: String(payload.brand || '').trim(),
    unit: String(payload.unit || 'EA').trim().toUpperCase(),
    subcategory_1: String(payload.subcategory_1 || '').trim(),
    subcategory_2: String(payload.subcategory_2 || '').trim(),
    status: payload.status === 'published' ? 'published' : 'draft',
    image_match_status: payload.image_match_status === 'verified' ? 'verified' : 'unverified',
    product_source_url: String(payload.product_source_url || '').trim() || null,
    image_source_url: String(payload.image_source_url || '').trim() || null,
    draft_reason: String(payload.draft_reason || '').trim() || null,
  }

  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select('*, categories(name, slug)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { error: variantError } = await supabase.from('product_variants').insert(variants.map((variant) => ({ ...variant, product_id: product.id })))
  if (variantError) {
    await supabase.from('products').delete().eq('id', product.id)
    return NextResponse.json({ error: variantError.message }, { status: 500 })
  }

  await recalculateCategoryProductCount(categoryId)

  const { data: completeProduct } = await supabase.from('products').select('*, categories(name, slug), product_variants(*)').eq('id', product.id).single()

  return NextResponse.json({ product: completeProduct || data })
}
