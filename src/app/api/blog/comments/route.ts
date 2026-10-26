import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/neon'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const payload = await request.json() as Record<string, unknown>
  const slug = typeof payload.post_slug === 'string' ? payload.post_slug.trim().slice(0, 160) : ''
  const name = typeof payload.author_name === 'string' ? payload.author_name.trim().slice(0, 100) : ''
  const email = typeof payload.author_email === 'string' ? payload.author_email.trim().slice(0, 254).toLowerCase() : ''
  const content = typeof payload.content === 'string' ? payload.content.trim().slice(0, 2000) : ''
  if (!slug || !name || !/^\S+@\S+\.\S+$/.test(email) || content.length < 3) {
    return NextResponse.json({ error: 'Enter your name, a valid email address and a comment of at least 3 characters.' }, { status: 400 })
  }

  try {
    const { rows } = await query(`INSERT INTO blog_comments (post_id,author_name,author_email,content)
      SELECT id,$2,$3,$4 FROM blog_posts WHERE slug=$1 RETURNING id,post_id,author_name,content,created_at`, [slug, name, email, content])
    return rows[0]
      ? NextResponse.json({ comment: rows[0] }, { status: 201 })
      : NextResponse.json({ error: 'Comments are not available for this article yet.' }, { status: 404 })
  } catch (cause) {
    console.error('Neon blog comment create failed:', cause)
    return NextResponse.json({ error: 'Could not submit your comment.' }, { status: 500 })
  }
}
