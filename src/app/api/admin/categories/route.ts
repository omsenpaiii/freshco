import { NextRequest, NextResponse } from 'next/server'
import { getAdminSessionUser } from '@/lib/admin'
import { query } from '@/lib/neon'
import { slugify } from '@/lib/catalog'

export async function GET() {
  if (!await getAdminSessionUser()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { rows } = await query('SELECT * FROM categories ORDER BY name')
    return NextResponse.json({ categories: rows })
  } catch (error) {
    console.error('Neon admin category list failed:', error)
    return NextResponse.json({ error: 'Could not load categories.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!await getAdminSessionUser()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = await request.json() as Record<string, unknown>
  const name = String(payload.name || '').trim()
  const slug = slugify(String(payload.slug || name))
  if (!name || !slug) return NextResponse.json({ error: 'Name and slug are required.' }, { status: 400 })

  try {
    const { rows } = await query(`INSERT INTO categories (id,name,slug,description,image_url,image_source_url,image_license)
      VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [
      Date.now(), name, slug, String(payload.description || '').trim() || null,
      String(payload.image_url || '').trim() || null, String(payload.image_source_url || '').trim() || null,
      String(payload.image_license || '').trim() || null,
    ])
    return NextResponse.json({ category: rows[0] })
  } catch (error) {
    console.error('Neon admin category create failed:', error)
    return NextResponse.json({ error: 'Could not create category. Check that its name and URL are unique.' }, { status: 409 })
  }
}
