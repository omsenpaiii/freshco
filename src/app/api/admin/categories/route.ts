import { NextRequest, NextResponse } from 'next/server'
import { getAdminSessionUser } from '@/lib/admin'
import { slugify } from '@/lib/catalog'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET() {
  const user = await getAdminSessionUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ categories: data ?? [] })
}

export async function POST(request: NextRequest) {
  const user = await getAdminSessionUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await request.json()
  const name = String(payload.name || '').trim()
  const description = String(payload.description || '').trim()
  const imageUrl = String(payload.image_url || '').trim()
  const slug = slugify(payload.slug || name)

  if (!name || !slug) {
    return NextResponse.json({ error: 'Name and slug are required.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const category = {
    id: Date.now(),
    name,
    slug,
    description,
    image_url: imageUrl,
    products_count: 0,
  }

  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ category: data })
}

