import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/neon'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const rawIds = request.nextUrl.searchParams.get('ids') || ''
  const ids = [...new Set(rawIds.split(',').map(Number).filter((id) => Number.isSafeInteger(id) && id > 0))].slice(0, 100)
  if (!ids.length) return NextResponse.json({ products: [] })
  try {
    const { rows } = await query(`SELECT p.*,COALESCE(jsonb_agg(to_jsonb(v) ORDER BY v.weight_grams NULLS LAST,v.id)
      FILTER (WHERE v.id IS NOT NULL AND v.inventory_quantity>0),'[]') product_variants
      FROM products p LEFT JOIN product_variants v ON v.product_id=p.id WHERE p.id=ANY($1::bigint[]) AND p.status='published'
      GROUP BY p.id ORDER BY array_position($1::bigint[],p.id)`, [ids])
    return NextResponse.json({ products: rows.map((product) => ({
      ...product,
      price: Number(product.price),
      compare_at_price: product.compare_at_price == null ? null : Number(product.compare_at_price),
      product_variants: (product.product_variants as Array<Record<string, unknown>>).map((variant) => ({ ...variant, price: Number(variant.price) })),
    })) })
  } catch (cause) {
    console.error('Neon wishlist read failed:', cause)
    return NextResponse.json({ error: 'Could not load saved products.' }, { status: 500 })
  }
}
