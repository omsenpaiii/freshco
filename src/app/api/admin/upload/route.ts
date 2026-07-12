import { NextRequest, NextResponse } from 'next/server'
import { getAdminSessionUser } from '@/lib/admin'
import { createAdminClient } from '@/lib/supabase-admin'
import { slugify } from '@/lib/catalog'

const BUCKET_NAME = 'store-images'

async function ensureBucket() {
  const supabase = createAdminClient()
  const { data: buckets, error } = await supabase.storage.listBuckets()

  if (error) {
    throw error
  }

  const exists = buckets?.some((bucket) => bucket.name === BUCKET_NAME)

  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 5 * 1024 * 1024,
    })

    if (createError) {
      throw createError
    }
  }

  return supabase
}

export async function POST(request: NextRequest) {
  const user = await getAdminSessionUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  const folder = String(formData.get('folder') || 'products')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'A file is required.' }, { status: 400 })
  }

  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg'
  const baseName = slugify(file.name.replace(/\.[^.]+$/, '')) || 'upload'
  const filePath = `${folder}/${Date.now()}-${baseName}.${ext}`

  try {
    const supabase = await ensureBucket()
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: true,
      })

    if (error) {
      throw error
    }

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath)

    return NextResponse.json({ url: data.publicUrl })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

