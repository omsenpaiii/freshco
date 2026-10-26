import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSessionUser } from '@/lib/admin'
import { slugify } from '@/lib/catalog'

export const runtime = 'nodejs'

const BUCKET_NAME = 'store-images'
const MAX_FILE_SIZE = 5 * 1024 * 1024
const extensionForType: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export async function POST(request: NextRequest) {
  if (!await getAdminSessionUser()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file')
  const folder = String(formData.get('folder') || 'products')
  if (!(file instanceof File)) return NextResponse.json({ error: 'A file is required.' }, { status: 400 })
  if (!['products', 'categories'].includes(folder)) return NextResponse.json({ error: 'Invalid upload folder.' }, { status: 400 })
  if (!extensionForType[file.type]) return NextResponse.json({ error: 'Use a JPEG, PNG, or WebP image.' }, { status: 415 })
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Images must be 5 MB or smaller.' }, { status: 413 })

  const endpoint = process.env.AWS_ENDPOINT_URL_S3
  const region = process.env.AWS_REGION || 'us-east-2'
  if (!endpoint || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return NextResponse.json({ error: 'Neon image storage is not configured.' }, { status: 503 })
  }

  const baseName = slugify(file.name.replace(/\.[^.]+$/, '')) || 'upload'
  const key = `${folder}/${baseName}-${crypto.randomUUID()}.${extensionForType[file.type]}`
  const s3 = new S3Client({ endpoint, region, forcePathStyle: true })
  try {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
      CacheControl: 'public, max-age=31536000, immutable',
    }))
    const normalizedEndpoint = endpoint.replace(/\/$/, '')
    const encodedKey = key.split('/').map(encodeURIComponent).join('/')
    return NextResponse.json({ url: `${normalizedEndpoint}/${BUCKET_NAME}/${encodedKey}`, key })
  } catch (error) {
    console.error('Neon image upload failed:', error)
    return NextResponse.json({ error: 'Image upload failed.' }, { status: 502 })
  } finally {
    s3.destroy()
  }
}
