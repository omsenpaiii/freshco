import { NextRequest, NextResponse } from 'next/server'
import { getAdminSessionUser } from '@/lib/admin'
import { slugify } from '@/lib/catalog'
import { createAdminClient } from '@/lib/supabase-admin'

async function recalculateProductCount(categoryId: number) {
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
  const categoryId = Number(id)
  const payload = await request.json()
  const name = String(payload.name || '').trim()
  const description = String(payload.description || '').trim()
  const imageUrl = String(payload.image_url || '').trim()
  const slug = slugify(payload.slug || name)

  if (!categoryId || !name || !slug) {
    return NextResponse.json({ error: 'Valid category values are required.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('categories')
    .update({
      name,
      slug,
      description,
      image_url: imageUrl,
    })
    .eq('id', categoryId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await recalculateProductCount(categoryId)

  return NextResponse.json({ category: data })
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
  const categoryId = Number(id)

  if (!categoryId) {
    return NextResponse.json({ error: 'Invalid category id.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from('categories').delete().eq('id', categoryId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

