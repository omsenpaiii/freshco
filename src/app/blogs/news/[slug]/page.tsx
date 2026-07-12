import React from 'react'
import Link from 'next/link'
import { getBlogPostBySlug, getBlogComments } from '@/lib/db'
import BlogDetailClient from './blog-detail-client'
import { ChevronRight } from 'lucide-react'

// Force Next.js to render page dynamically so it grabs latest products/DB state
export const revalidate = 0

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const resolvedParams = await params
  const { slug } = resolvedParams

  const post = await getBlogPostBySlug(slug)

  if (!post) {
    return (
      <div className="w-full bg-white px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-extrabold text-secondary">Article Not Found</h2>
        <p className="text-xs text-gray-400">The news article you are looking for does not exist or has been removed.</p>
        <Link href="/blogs/news" className="bg-primary hover:bg-[#d89311] text-white text-xs font-bold px-6 py-3 rounded-full inline-block transition uppercase tracking-wider">
          Return to Blogs
        </Link>
      </div>
    )
  }

  // Fetch comments from Supabase if configured
  const dbComments = await getBlogComments(post.id)

  return (
    <div className="w-full bg-white px-4 md:px-8 py-10">
      <div className="max-w-4xl mx-auto">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 font-medium">
          <Link href="/" className="hover:text-primary transition">Home</Link>
          <ChevronRight size={12} />
          <Link href="/blogs/news" className="hover:text-primary transition">Blogs</Link>
          <ChevronRight size={12} />
          <span className="text-secondary font-semibold line-clamp-1">{post.title}</span>
        </div>

        {/* Client side Blog Detail with interactive comments */}
        <BlogDetailClient post={post} initialComments={dbComments} />

      </div>
    </div>
  )
}
