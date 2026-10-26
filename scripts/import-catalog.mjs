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

async function fetchImage(sourceUrl, referer) {
  const response = await fetch(sourceUrl, {
    headers: {
      'User-Agent': 'FreshCo-Catalog-Importer/1.0',
      ...(referer ? { Referer: referer } : {}),
    },
    signal: AbortSignal.timeout(25000),
  })
  if (!response.ok) throw new Error(`Image fetch failed (${response.status}): ${sourceUrl}`)
  const body = Buffer.from(await response.arrayBuffer())
  if (body.length < 1024) throw new Error(`Image file is unexpectedly small: ${sourceUrl}`)
  // Some legitimate image CDNs return application/octet-stream or the non-standard
  // image/jpg alias. Validate the file signature and use its actual media type instead.
  const isJpeg = body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff
  const isPng = body.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  const isWebp = body.toString('ascii', 0, 4) === 'RIFF' && body.toString('ascii', 8, 12) === 'WEBP'
  const majorBrand = body.toString('ascii', 8, 12)
  const isAvif = body.toString('ascii', 4, 8) === 'ftyp' && ['avif', 'avis'].includes(majorBrand)
  const contentType = isJpeg ? 'image/jpeg' : isPng ? 'image/png' : isWebp ? 'image/webp' : isAvif ? 'image/avif' : null
  if (!contentType) throw new Error(`Unsupported image content (${response.headers.get('content-type') || 'unknown type'}): ${sourceUrl}`)
  return { body, contentType }
}

if (process.argv.includes('--verify-images')) {
  // Validate the URLs the storefront actually serves. image_source_url is provenance
  // and can later become inaccessible or return anti-bot HTML while the verified,
  // uploaded Neon copy remains healthy.
  const sources = new Map()
  for (const category of manifest.categories) {
    if (category.image_url && !sources.has(category.image_url)) sources.set(category.image_url, null)
  }
  for (const product of published) {
    for (const imageUrl of product.images || []) {
      if (imageUrl && !sources.has(imageUrl)) sources.set(imageUrl, null)
    }
  }
  const images = [...sources].map(([url, referer]) => ({ url, referer }))
  const concurrency = 6
  const failures = []
  let completed = 0
  let nextIndex = 0
  async function worker() {
    while (true) {
      const index = nextIndex++
      if (index >= images.length) return
      const { url, referer } = images[index]
      try {
        await fetchImage(url, referer)
      } catch (error) {
        failures.push(`${url}: ${error instanceof Error ? error.message : 'unknown error'}`)
      }
      completed++
      if (completed % 50 === 0 || completed === images.length) {
        console.log(`Image verification progress: ${completed}/${images.length}; failed: ${failures.length}.`)
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker))
  if (failures.length) throw new Error(`Image verification failed for ${failures.length} of ${images.length} unique sources:\n${failures.join('\n')}`)
  console.log(`Verified storefront image delivery for ${published.length} published products across ${images.length} unique product and collection assets over HTTP.`)
  process.exit(0)
}

console.log('No database writes were performed. Supabase catalog imports are disabled after the FreshCo Neon cutover; use the audited Neon SQL batches for an approved database import.')
