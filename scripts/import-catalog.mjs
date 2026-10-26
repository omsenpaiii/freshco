import fs from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const manifest = JSON.parse(await fs.readFile(path.join(root, 'src/data/catalog-manifest.json'), 'utf8'))
const productCount = manifest.products.length
const variants = manifest.products.flatMap((product) => product.variants)
const published = manifest.products.filter((product) => product.status === 'published')
const allSkus = variants.map((variant) => variant.sku)
const categories = manifest.categories.map((category) => category.name).sort()
const activeProducts = manifest.products.filter((product) => product.source_active)
const missingActivePrice = activeProducts.filter((product) => product.workbook_price == null).length
const missingActiveUnit = activeProducts.filter((product) => !product.workbook_unit?.trim()).length
const unsellableActive = activeProducts.filter((product) => product.workbook_price == null || !product.unit?.trim()).length
const sellableActive = activeProducts.filter((product) => product.workbook_price != null && Boolean(product.unit?.trim()))

const assert = (condition, message) => { if (!condition) throw new Error(message) }
assert(productCount === 572, `Expected 572 products from ITEMS (3).xlsx, received ${productCount}`)
assert(variants.length === 659, `Expected 659 variants from ITEMS (3).xlsx, received ${variants.length}`)
assert(manifest.summary?.green_unique_products === 479, 'Expected 479 unique green products in the latest workbook')
assert(activeProducts.length === manifest.summary.green_unique_products, 'Green product count does not match the workbook audit')
assert(missingActivePrice === 20 && missingActivePrice === manifest.summary.green_missing_price, 'Green rows with missing prices do not match the workbook audit')
assert(missingActiveUnit === 38 && missingActiveUnit === manifest.summary.green_missing_unit, 'Green rows with missing units do not match the workbook audit')
assert(unsellableActive === 20, 'Only green rows with missing prices or unresolved units should remain unsellable')
assert(manifest.summary.source_rows === 574 && manifest.summary.unique_products === 572 && manifest.summary.duplicate_rows_removed.length === 2, 'Workbook duplicate-collapse totals do not match the audit')
assert(JSON.stringify(categories) === JSON.stringify(['Cheese', 'Deli', 'Festive', 'Feta', 'Frozen', 'Grocery', 'Olives', 'Religious', 'Small Goods']), 'Category mappings do not match the latest workbook')
assert(new Set(manifest.products.map((product) => product.slug)).size === productCount, 'Product slugs must be unique')
assert(new Set(allSkus).size === allSkus.length, 'SKUs must be unique')
assert(variants.every((variant) => {
  const product = manifest.products.find((candidate) => candidate.id === variant.product_id)
  const sellable = product?.source_active && product.workbook_price != null && Boolean(product.unit?.trim())
  return variant.inventory_quantity === (sellable ? 100 : 0)
}), 'Only active products with a workbook price and unit may start with 100 units')
assert(manifest.products.every((product) => categories.includes(product.categories.name)), 'Unexpected category mapping')
assert(published.length === activeProducts.length, 'Every green workbook product with a reviewed image must appear in the public catalogue')
assert(published.every((product) => product.source_active && product.image_match_status === 'verified' && product.image_source_url && product.product_source_url), 'Published products require an active workbook row and visually reviewed image/product sources')
assert(published.filter((product) => product.workbook_price != null && product.unit?.trim()).length === sellableActive.length, 'Every priced green product with a resolved unit must appear in the public catalogue')
assert(published.filter((product) => product.workbook_price == null).every((product) => product.price === 0 && product.inventory_quantity === 0 && product.variants.every((variant) => variant.price === 0 && variant.inventory_quantity === 0)), 'Green products without workbook prices must be visible as price pending and have no sellable inventory')
assert(manifest.products.filter((product) => !product.source_active).every((product) => product.status === 'draft' && product.inventory_quantity === 0), 'Non-green workbook rows must remain dormant and out of stock')
assert(manifest.categories.every((category) => category.products_count === published.filter((product) => product.category_id === category.id).length), 'Collection counts must equal published products only')

const kefalo = manifest.products.find((product) => product.name === 'Dodoni Kefalograviera')
assert(JSON.stringify(kefalo.variants.map((variant) => variant.price)) === JSON.stringify([11, 22, 30.79, 43.99]), 'Kefalograviera prices are incorrect')
assert(JSON.stringify(kefalo.variants.map((variant) => variant.weight_grams)) === JSON.stringify([250, 500, 700, 1000]), 'Kefalograviera pack sizes are incorrect')

console.log(`Validated ${productCount} products, ${variants.length} variants, ${manifest.summary.green_unique_products} green products (${sellableActive.length} priced and ${unsellableActive} price pending), and ${published.length} published products.`)
if (process.argv.includes('--validate')) process.exit(0)

async function fetchImage(sourceUrl) {
  const response = await fetch(sourceUrl, { headers: { 'User-Agent': 'FreshCo-Catalog-Importer/1.0' } })
  if (!response.ok) throw new Error(`Image fetch failed (${response.status}): ${sourceUrl}`)
  const contentType = (response.headers.get('content-type') || '').split(';')[0]
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(contentType)) throw new Error(`Unsupported image type ${contentType}: ${sourceUrl}`)
  const body = Buffer.from(await response.arrayBuffer())
  if (body.length < 5000) throw new Error(`Image file is unexpectedly small: ${sourceUrl}`)
  return { body, contentType }
}

if (process.argv.includes('--verify-images')) {
  // Fetch the image asset itself; image_source_url is the attribution/product page and
  // may be HTML rather than a raw image.
  for (const category of manifest.categories) if (category.image_url) await fetchImage(category.image_url)
  for (const product of published) await fetchImage(product.image_source_url)
  console.log(`Verified ${published.length} product images and ${manifest.categories.length} collection images over HTTP.`)
  process.exit(0)
}

console.log('No database writes were performed. Supabase catalog imports are disabled after the FreshCo Neon cutover; use the audited Neon SQL batches for an approved database import.')
