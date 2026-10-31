import { NextRequest, NextResponse } from 'next/server'
import { getAdminSessionUser } from '@/lib/admin'
import { query } from '@/lib/neon'
import { slugify } from '@/lib/catalog'
import { provenanceText } from '@/lib/catalog-provenance'

type RouteContext = { params: Promise<{ id: string }> }

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  if (!await getAdminSessionUser()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const categoryId = Number((await params).id)
  const payload = await request.json() as Record<string, unknown>
  const name = String(payload.name || '').trim()
  const slug = slugify(String(payload.slug || name))
  if (!Number.isSafeInteger(categoryId) || categoryId <= 0 || !name || !slug) {
    return NextResponse.json({ error: 'Valid category values are required.' }, { status: 400 })
  }

  try {
    const { rows } = await query(`UPDATE categories SET name=$2,slug=$3,description=$4,image_url=$5,
      image_source_url=CASE WHEN $8::boolean THEN $6 ELSE image_source_url END,
      image_license=CASE WHEN $9::boolean THEN $7 ELSE image_license END
      WHERE id=$1 RETURNING *`, [categoryId, name, slug, String(payload.description || '').trim() || null,
      String(payload.image_url || '').trim() || null, provenanceText(payload, 'image_source_url'),
      provenanceText(payload, 'image_license'),
      Object.prototype.hasOwnProperty.call(payload, 'image_source_url'),
      Object.prototype.hasOwnProperty.call(payload, 'image_license')])
    if (!rows[0]) return NextResponse.json({ error: 'Category not found.' }, { status: 404 })
    return NextResponse.json({ category: rows[0] })
  } catch (error) {
    console.error('Neon admin category update failed:', error)
    return NextResponse.json({ error: 'Could not update category. Check that its name and URL are unique.' }, { status: 409 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  if (!await getAdminSessionUser()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const categoryId = Number((await params).id)
  if (!Number.isSafeInteger(categoryId) || categoryId <= 0) return NextResponse.json({ error: 'Invalid category id.' }, { status: 400 })

  try {
    const result = await query('SELECT count(*)::integer AS count FROM products WHERE category_id=$1', [categoryId])
    if (Number(result.rows[0]?.count) > 0) {
      return NextResponse.json({ error: 'This category is still used by products. Reassign them before deleting it.' }, { status: 409 })
    }
    const deleted = await query('DELETE FROM categories WHERE id=$1 RETURNING id', [categoryId])
    if (!deleted.rows[0]) return NextResponse.json({ error: 'Category not found.' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Neon admin category delete failed:', error)
    return NextResponse.json({ error: 'Could not delete category.' }, { status: 500 })
  }
}
