import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getBlogPosts } from '@/lib/db'
import { ChevronRight } from 'lucide-react'

// Force Next.js to render page dynamically so it grabs latest products/DB state
export const revalidate = 0

export default async function BlogIndexPage() {
  const posts = await getBlogPosts()

  return (
    <div className="w-full bg-white px-4 md:px-8 py-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 font-medium">
          <Link href="/" className="hover:text-primary transition">Home</Link>
          <ChevronRight size={12} />
          <span className="text-secondary font-semibold">Blogs & News</span>
        </div>

        <div className="border-b border-border-theme pb-4 mb-10 text-left">
          <h1 className="text-xl md:text-2xl font-extrabold text-secondary">News & Articles</h1>
          <p className="text-xs text-gray-400 mt-1">Get the latest healthy organic recipes and picnic ideas from our team.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
          {posts.map((post) => (
            <article key={post.id} className="flex flex-col gap-4 border border-border-theme p-4 rounded-2xl shadow-2xs hover:shadow-md transition bg-white">
              <Link href={`/blogs/news/${post.slug}`} className="relative aspect-video rounded-xl overflow-hidden bg-gray-50 border border-gray-100 block">
                <Image 
                  src={post.image_url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=400'} 
                  alt={post.title}
                  fill
                  className="object-cover hover:scale-103 transition duration-500"
                />
              </Link>
              <div className="space-y-3 flex-grow flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <span>By {post.author}</span>
                    <span>•</span>
                    <span>{new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <h3 className="text-sm font-bold text-secondary hover:text-primary transition leading-snug line-clamp-2">
                    <Link href={`/blogs/news/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-50">
                  <Link 
                    href={`/blogs/news/${post.slug}`}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    Read Full Article →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

      </div>
    </div>
  )
}
