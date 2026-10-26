import 'server-only'

import { getNeonPool, query } from '@/lib/neon'
import { normalizeImageUrls, normalizeVariants, slugify } from '@/lib/catalog'
import type { AdminCatalogCategory, AdminCatalogProduct } from '@/lib/admin-types'

type ProductVariantInput = ReturnType<typeof normalizeVariants>[number]

export class AdminCatalogError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

function adminProductSelect(where = '') {
  return `SELECT p.*, CASE WHEN c.id IS NULL THEN NULL ELSE jsonb_build_object('name',c.name,'slug',c.slug) END categories,
    COALESCE(jsonb_agg(to_jsonb(v) ORDER BY v.weight_grams NULLS LAST,v.id) FILTER (WHERE v.id IS NOT NULL),'[]') product_variants
    FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN product_variants v ON v.product_id=p.id
    ${where} GROUP BY p.id,c.id`
}

function normalizeAdminProduct(row: Record<string, unknown>) {
  const variants = ((row.product_variants || []) as Array<Record<string, unknown>>).map((variant) => ({
    ...variant,
    price: Number(variant.price),
    weight_grams: variant.weight_grams == null ? null : Number(variant.weight_grams),
  }))
  return {
    ...row,
    price: Number(row.price),
    compare_at_price: row.compare_at_price == null ? null : Number(row.compare_at_price),
    product_variants: variants,
  }
}

export async function getAdminCatalog() {
  const [categories, products] = await Promise.all([
    query('SELECT * FROM categories ORDER BY name'),
    query(`${adminProductSelect()} ORDER BY p.created_at DESC`),
  ])
  return {
    categories: categories.rows as unknown as AdminCatalogCategory[],
    products: products.rows.map(normalizeAdminProduct) as AdminCatalogProduct[],
  }
}

export async function getAdminProduct(id: number) {
  const result = await query(`${adminProductSelect('WHERE p.id=$1')} LIMIT 1`, [id])
  return result.rows[0] ? normalizeAdminProduct(result.rows[0]) as AdminCatalogProduct : null
}

export async function refreshCategoryProductCounts(categoryIds: Array<number | null | undefined>) {
  const ids = [...new Set(categoryIds.filter((id): id is number => Number.isInteger(id) && Number(id) > 0))]
  if (ids.length === 0) return
  await query(`UPDATE categories c SET products_count=(SELECT count(*)::integer FROM products p WHERE p.category_id=c.id AND p.status='published') WHERE c.id=ANY($1::bigint[])`, [ids])
}

export async function saveAdminProduct(payload: Record<string, unknown>, productId?: number) {
  const name = String(payload.name || '').trim()
  const slug = slugify(String(payload.slug || name))
  if (!name || !slug) throw new AdminCatalogError('Name and slug are required.', 400)

  const categoryId = payload.category_id ? Number(payload.category_id) : null
  if (categoryId !== null && (!Number.isInteger(categoryId) || categoryId <= 0)) throw new AdminCatalogError('Choose a valid category.', 400)
  let variants: ReturnType<typeof normalizeVariants>
  try {
    variants = normalizeVariants(payload.variants)
  } catch (error) {
    throw new AdminCatalogError(error instanceof Error ? error.message : 'Invalid variants.', 400)
  }
  if (!variants.some((variant) => variant.is_default)) variants[0].is_default = true
  const images = normalizeImageUrls(payload.images)
  const status = payload.status === 'published' ? 'published' : 'draft'
  const imageMatchStatus = payload.image_match_status === 'verified' ? 'verified' : 'unverified'
  if (status === 'published' && (imageMatchStatus !== 'verified' || images.length === 0)) {
    throw new AdminCatalogError('Published products require a visually reviewed, relevant image.', 400)
  }
  const defaultVariant = variants.find((variant) => variant.is_default)!
  const compareAtPrice = payload.compare_at_price === '' || payload.compare_at_price == null ? null : Number(payload.compare_at_price)
  if (compareAtPrice !== null && (!Number.isFinite(compareAtPrice) || compareAtPrice < 0)) throw new AdminCatalogError('Comparison price must be a non-negative number.', 400)

  const pool = getNeonPool()
  const client = await pool.connect()
  let previousCategoryId: number | null = null
  const id = productId ?? Date.now()
  try {
    await client.query('BEGIN')
    if (productId) {
      const existing = await client.query('SELECT category_id FROM products WHERE id=$1 FOR UPDATE', [productId])
      if (!existing.rows[0]) throw new AdminCatalogError('Product not found.', 404)
      previousCategoryId = existing.rows[0].category_id == null ? null : Number(existing.rows[0].category_id)
    }

    const productValues = [
      id,
      name,
      slug,
      String(payload.description || ''),
      defaultVariant.price,
      compareAtPrice,
      defaultVariant.sku,
      variants.reduce((sum, variant) => sum + variant.inventory_quantity, 0),
      Boolean(payload.is_featured),
      Boolean(payload.is_trending),
      images,
      categoryId,
      String(payload.brand || '').trim(),
      String(payload.unit || 'EA').trim().toUpperCase(),
      String(payload.subcategory_1 || '').trim(),
      String(payload.subcategory_2 || '').trim(),
      status,
      imageMatchStatus,
      String(payload.product_source_url || '').trim() || null,
      String(payload.image_source_url || '').trim() || null,
      String(payload.image_license || '').trim() || null,
      String(payload.draft_reason || '').trim() || null,
    ]

    if (productId) {
      await client.query(`UPDATE products SET name=$2,slug=$3,description=$4,price=$5,compare_at_price=$6,sku=$7,inventory_quantity=$8,
        is_featured=$9,is_trending=$10,images=$11,category_id=$12,brand=$13,unit=$14,subcategory_1=$15,subcategory_2=$16,status=$17,
        image_match_status=$18,product_source_url=$19,image_source_url=$20,image_license=$21,draft_reason=$22 WHERE id=$1`, productValues)
      await client.query('UPDATE product_variants SET is_default=false WHERE product_id=$1', [id])
    } else {
      await client.query(`INSERT INTO products (id,name,slug,description,price,compare_at_price,sku,inventory_quantity,is_featured,is_trending,images,category_id,
        brand,unit,subcategory_1,subcategory_2,status,image_match_status,product_source_url,image_source_url,image_license,draft_reason)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`, productValues)
    }

    const keptIds: number[] = []
    for (const variant of variants as ProductVariantInput[]) {
      const values = [id, variant.title, variant.sku, variant.weight_grams, variant.price, variant.inventory_quantity, variant.is_default]
      if (variant.id) {
        const updated = await client.query(`UPDATE product_variants SET title=$2,sku=$3,weight_grams=$4,price=$5,inventory_quantity=$6,is_default=$7,updated_at=now()
          WHERE id=$8 AND product_id=$1 RETURNING id`, [...values, variant.id])
        if (!updated.rows[0]) throw new AdminCatalogError('A variant no longer belongs to this product. Refresh and try again.', 409)
        keptIds.push(Number(updated.rows[0].id))
      } else {
        const inserted = await client.query(`INSERT INTO product_variants (product_id,title,sku,weight_grams,price,inventory_quantity,is_default)
          VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`, values)
        keptIds.push(Number(inserted.rows[0].id))
      }
    }
    await client.query('UPDATE product_variants SET inventory_quantity=0,is_default=false,updated_at=now() WHERE product_id=$1 AND NOT(id=ANY($2::bigint[]))', [id, keptIds])
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }

  await refreshCategoryProductCounts([previousCategoryId, categoryId])
  return getAdminProduct(id)
}

export async function retireAdminProduct(productId: number) {
  const { rows } = await query('UPDATE products SET status=\'draft\',inventory_quantity=0,draft_reason=COALESCE(draft_reason,\'Retired by admin\') WHERE id=$1 RETURNING category_id', [productId])
  if (!rows[0]) return false
  await query('UPDATE product_variants SET inventory_quantity=0,is_default=false,updated_at=now() WHERE product_id=$1', [productId])
  await refreshCategoryProductCounts([rows[0].category_id == null ? null : Number(rows[0].category_id)])
  return true
}
