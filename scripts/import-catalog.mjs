import fs from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const root = process.cwd()
const manifest = JSON.parse(await fs.readFile(path.join(root, 'src/data/catalog-manifest.json'), 'utf8'))
const productCount = manifest.products.length
const variants = manifest.products.flatMap((product) => product.variants)
const published = manifest.products.filter((product) => product.status === 'published')
const allSkus = variants.map((variant) => variant.sku)

const assert = (condition, message) => { if (!condition) throw new Error(message) }
assert(productCount === 260, `Expected 260 products, received ${productCount}`)
assert(variants.length === 275, `Expected 275 variants, received ${variants.length}`)
assert(new Set(manifest.products.map((product) => product.slug)).size === productCount, 'Product slugs must be unique')
assert(new Set(allSkus).size === allSkus.length, 'SKUs must be unique')
assert(variants.every((variant) => variant.inventory_quantity === (variant.price > 0 ? 100 : 0)), 'Sellable SKUs must start with 100 units and unpriced drafts with zero')
assert(manifest.products.every((product) => ['Cheese', 'Frozen', 'Grocery', 'Deli', 'Small Goods'].includes(product.categories.name)), 'Unexpected category mapping')
assert(published.every((product) => product.image_match_status === 'verified' && product.image_source_url && product.product_source_url), 'Published products require verified image and product sources')

const kefalo = manifest.products.find((product) => product.name === 'Dodoni Kefalograviera')
assert(JSON.stringify(kefalo.variants.map((variant) => variant.price)) === JSON.stringify([11.5, 23, 32.19, 45.99]), 'Kefalograviera prices are incorrect')

console.log(`Validated ${productCount} products, ${variants.length} variants, ${published.length} publishable products.`)
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
  for (const category of manifest.categories) await fetchImage(category.image_url)
  for (const product of published) await fetchImage(product.image_source_url)
  console.log(`Verified ${published.length} product images and ${manifest.categories.length} collection images over HTTP.`)
  process.exit(0)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
assert(url && !url.includes('your-project'), 'NEXT_PUBLIC_SUPABASE_URL is not configured')
assert(serviceRoleKey, 'SUPABASE_SERVICE_ROLE_KEY is not configured')

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
const bucket = 'store-images'
const { error: bucketError } = await supabase.storage.createBucket(bucket, { public: true, fileSizeLimit: 10 * 1024 * 1024, allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] })
if (bucketError && !/already exists/i.test(bucketError.message)) throw bucketError

async function uploadImage(sourceUrl, storagePath) {
  const { body, contentType } = await fetchImage(sourceUrl)
  const { error } = await supabase.storage.from(bucket).upload(storagePath, body, { contentType, upsert: true, cacheControl: '31536000' })
  if (error) throw error
  return supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl
}

// Validate and upload every approved asset before changing catalog records.
const uploadedCategoryImages = new Map()
for (const category of manifest.categories) {
  uploadedCategoryImages.set(category.id, await uploadImage(category.image_url, `collections/${category.slug}.jpg`))
}
const uploadedProductImages = new Map()
for (const product of published) {
  uploadedProductImages.set(product.id, await uploadImage(product.image_source_url, `products/${product.slug}/primary`))
}

const categoryRows = manifest.categories.map((category) => ({
  ...Object.fromEntries(Object.entries(category).filter(([key]) => !['image_source_url', 'image_license'].includes(key))),
  image_url: uploadedCategoryImages.get(category.id),
  products_count: 0,
}))
let result = await supabase.from('categories').upsert(categoryRows, { onConflict: 'id' })
if (result.error) throw result.error

const productRows = manifest.products.map((product) => {
  const row = Object.fromEntries(Object.entries(product).filter(([key]) => !['variants', 'categories', 'workbook_row'].includes(key)))
  return {
    ...row,
    status: 'draft',
    images: uploadedProductImages.has(product.id) ? [uploadedProductImages.get(product.id)] : [],
  }
})
result = await supabase.from('products').upsert(productRows, { onConflict: 'id' })
if (result.error) throw result.error

result = await supabase.from('product_variants').upsert(variants, { onConflict: 'id' })
if (result.error) throw result.error

const { data: existingProducts, error: existingProductError } = await supabase.from('products').select('id')
if (existingProductError) throw existingProductError
const keepProductIds = new Set(manifest.products.map((product) => product.id))
const obsoleteProductIds = existingProducts.filter((row) => !keepProductIds.has(Number(row.id))).map((row) => row.id)
if (obsoleteProductIds.length) {
  const { error } = await supabase.from('products').delete().in('id', obsoleteProductIds)
  if (error) throw error
}

const { data: existingCategories, error: existingCategoryError } = await supabase.from('categories').select('id')
if (existingCategoryError) throw existingCategoryError
const keepCategoryIds = new Set(manifest.categories.map((category) => category.id))
const obsoleteCategoryIds = existingCategories.filter((row) => !keepCategoryIds.has(Number(row.id))).map((row) => row.id)
if (obsoleteCategoryIds.length) {
  const { error } = await supabase.from('categories').delete().in('id', obsoleteCategoryIds)
  if (error) throw error
}

result = await supabase.from('products').update({ status: 'published' }).in('id', published.map((product) => product.id))
if (result.error) throw result.error
result = await supabase.rpc('refresh_category_product_counts')
if (result.error) throw result.error

console.log(`Imported ${productCount} products and ${variants.length} variants; published ${published.length} exact-image matches.`)
