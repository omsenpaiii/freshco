import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifest = JSON.parse(await fs.readFile(path.join(root, 'src/data/catalog-manifest.json'), 'utf8'))
const bucket = process.env.AWS_S3_BUCKET || 'store-images'
const endpoint = process.env.AWS_ENDPOINT_URL_S3
const region = process.env.AWS_REGION || 'us-east-2'
const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

if (!endpoint || !accessKeyId || !secretAccessKey) {
  throw new Error('Set AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY before uploading catalog images.')
}

const client = new S3Client({
  endpoint,
  region,
  forcePathStyle: true,
  credentials: { accessKeyId, secretAccessKey },
})
// Keep draft product photography ready as well. Draft visibility is controlled by
// catalog status, not by whether its approved image has been uploaded.
const retrySlugs = new Set((process.env.CATALOG_ONLY_SLUGS || '').split(',').map((slug) => slug.trim()).filter(Boolean))
const retryRows = new Set((process.env.CATALOG_ONLY_SOURCE_ROWS || '').split(',').map((row) => Number.parseInt(row, 10)).filter(Number.isFinite))
const products = manifest.products.filter((product) =>
  product.storage_object_key && product.image_source_url &&
  (!retrySlugs.size || retrySlugs.has(product.slug)) &&
  (!retryRows.size || retryRows.has(product.source_row)),
)
const concurrency = Math.max(1, Math.min(8, Number.parseInt(process.env.CATALOG_UPLOAD_CONCURRENCY || '6', 10) || 6))
let completed = 0
let nextIndex = 0
const failures = []

function sourceReferer(product) {
  try {
    // URL.href percent-encodes non-ASCII source-page paths for Fetch Headers.
    return new URL(product.product_source_url).href
  } catch {
    return undefined
  }
}

async function upload(product) {
  let body
  let contentType
  let lastError
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(product.image_source_url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          ...(sourceReferer(product) ? { Referer: sourceReferer(product) } : {}),
        },
        signal: AbortSignal.timeout(25000),
      })
      if (!response.ok) throw new Error(`Image fetch failed (${response.status}).`)
      body = Buffer.from(await response.arrayBuffer())
      if (body.length < 5000) throw new Error('Image file is unexpectedly small.')

      // Some image hosts use generic or incorrect MIME headers. Trust the file
      // signature so the stored object is served with a usable image content type.
      if (body.subarray(0, 3).toString('hex') === 'ffd8ff') contentType = 'image/jpeg'
      else if (body.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') contentType = 'image/png'
      else if (body.subarray(0, 4).toString() === 'RIFF' && body.subarray(8, 12).toString() === 'WEBP') contentType = 'image/webp'
      else if (body.subarray(4, 12).toString() === 'ftypavif') contentType = 'image/avif'
      else throw new Error('Downloaded file is not a supported JPEG, PNG, WebP, or AVIF image.')
      break
    } catch (error) {
      lastError = error
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 900))
    }
  }
  if (!body || !contentType) throw lastError || new Error('Image fetch failed after retries.')

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: product.storage_object_key,
    Body: body,
    ContentLength: body.length,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  }))
  const uploaded = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: product.storage_object_key }))
  if (uploaded.ContentLength !== body.length || uploaded.ContentType !== contentType) {
    throw new Error('Storage verification did not match the uploaded image.')
  }
}

async function worker() {
  while (true) {
    const index = nextIndex++
    if (index >= products.length) return
    const product = products[index]
    try {
      await upload(product)
    } catch (error) {
      failures.push({ id: product.id, slug: product.slug, reason: error instanceof Error ? error.message : 'Unknown upload error' })
    }
    completed++
    if (completed % 25 === 0 || completed === products.length) {
      console.log(`Image upload progress: ${completed}/${products.length}; failed: ${failures.length}.`)
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, worker))
if (failures.length) {
  console.error(JSON.stringify(failures))
  throw new Error(`${failures.length} product images could not be uploaded and verified.`)
}

console.log(`Uploaded and verified all ${products.length} catalog product images (published and draft) with concurrency ${concurrency}.`)
