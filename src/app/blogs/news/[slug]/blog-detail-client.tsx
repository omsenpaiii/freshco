'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { createClientComponentClient } from '@/lib/supabase-client'
import { User, Calendar, MessageSquare, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface BlogDetailClientProps {
  post: {
    id: string
    title: string
    content: string
    author: string
    image_url: string
    published_at: string
  }
  initialComments: any[]
}

export default function BlogDetailClient({ post, initialComments }: BlogDetailClientProps) {
  const [comments, setComments] = useState<any[]>(initialComments || [])
  const [form, setForm] = useState({ name: '', email: '', comment: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  
  const supabase = createClientComponentClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const commentObj = {
      id: Math.random().toString(),
      post_id: post.id,
      author_name: form.name,
      author_email: form.email,
      content: form.comment,
      created_at: new Date().toISOString()
    }

    // Attempt to write to Supabase if configured
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const isConfigured = url && !url.includes('your-project')
      if (isConfigured) {
        await supabase.from('blog_comments').insert({
          post_id: post.id,
          author_name: form.name,
          author_email: form.email,
          content: form.comment
        })
      }
    } catch (err) {
      console.warn("Failed to write comment to database, using local memory state", err)
    }

    setComments(prev => [commentObj, ...prev])
    setForm({ name: '', email: '', comment: '' })
    setIsSuccess(true)
    setIsSubmitting(false)
    
    setTimeout(() => setIsSuccess(false), 3000)
  }

  return (
    <div className="space-y-8 text-left mt-4">
      {/* Back button */}
      <div>
        <Link 
          href="/blogs/news"
          className="text-xs font-bold text-content-muted hover:text-primary transition flex items-center gap-1 w-fit"
        >
          <ArrowLeft size={14} /> Back to Blogs
        </Link>
      </div>

      {/* Main Title & Metadata */}
      <div className="space-y-4">
        <h1 className="text-2xl md:text-4xl font-extrabold text-content-strong leading-tight">
          {post.title}
        </h1>
        <div className="flex items-center gap-4 text-xs text-content-muted font-semibold border-b border-border-theme pb-4">
          <span className="flex items-center gap-1.5"><User size={14} /> {post.author}</span>
          <span className="flex items-center gap-1.5">
            <Calendar size={14} /> 
            {new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
          <span className="flex items-center gap-1.5"><MessageSquare size={14} /> {comments.length} Comments</span>
        </div>
      </div>

      {/* Featured Banner Image */}
      <div className="relative aspect-video max-h-[450px] w-full rounded-2xl overflow-hidden bg-gray-50 border border-border-theme shadow-2xs">
        <Image 
          src={post.image_url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=800'}
          alt={post.title}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Article Body Content */}
      <div className="text-sm text-gray-500 leading-relaxed space-y-4 py-4">
        <p className="font-semibold text-content-strong text-base">
          Fresh, certified organic elements from our farm direct to your table.
        </p>
        <p>
          {post.content}
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac leo ac ante convallis pretium. Mauris finibus diam metus, sit amet fringilla enim luctus nec. Vestibulum viverra dictum metus, in facilisis arcu eleifend facilisis. Duis porta lectus at dui ultrices vulputate. Morbi in urna nisl. Integer interdum finibus dictum. Aliquam id massa sed nibh rhoncus hendrerit.
        </p>
        <blockquote className="border-l-4 border-primary pl-4 py-2 my-6 bg-gray-50 text-content-strong italic rounded-r-lg font-medium text-xs">
          "Eating organic produce is not just a diet choice; it's a pledge to support sustainable farming and care for your long-term physical wellness."
        </blockquote>
        <p>
          In aenean pretium facilisis accumsan at. At elementum pulvinar vitae facilisis volutpat scelerisque porttitor. Velit, dictumst sit dictumst et sodales in mi leo. Condimentum ac nisl vulputate sodales scelerisque donec. Vel, leo sit in diam dictumst.
        </p>
      </div>

      {/* Comments Section */}
      <div className="pt-10 border-t border-border-theme space-y-8">
        <h3 className="text-lg font-bold text-content-strong uppercase tracking-wider">
          Comments ({comments.length})
        </h3>

        {/* Comment list */}
        <div className="space-y-6">
          {comments.length === 0 ? (
            <p className="text-xs text-content-muted italic">No comments yet. Be the first to share your thoughts!</p>
          ) : (
            comments.map((comm) => (
              <div key={comm.id} className="bg-[#f8f9fa] border border-border-theme p-5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs text-content-strong font-bold">
                  <span className="flex items-center gap-1.5"><User size={13} className="text-primary" /> {comm.author_name}</span>
                  <span className="text-[10px] text-content-muted">{new Date(comm.created_at).toLocaleDateString('en-US')}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed font-semibold">
                  {comm.content}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Submit Comment Form */}
        <form onSubmit={handleSubmit} className="border border-border-theme rounded-2xl p-6 space-y-4 bg-white shadow-2xs">
          <h4 className="font-bold text-content-strong text-xs uppercase tracking-wider">Leave a Comment</h4>
          
          {isSuccess && (
            <div className="text-green-600 bg-green-50 border border-green-100 p-3 rounded-lg text-xs font-semibold">
              ✓ Comment submitted successfully!
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-content-muted">Name</label>
              <input 
                type="text" 
                name="name" 
                required 
                value={form.name}
                onChange={handleChange}
                className="w-full bg-white border border-border-theme rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary text-xs font-semibold text-content-strong"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-content-muted">Email</label>
              <input 
                type="email" 
                name="email" 
                required 
                value={form.email}
                onChange={handleChange}
                className="w-full bg-white border border-border-theme rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary text-xs font-semibold text-content-strong"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold text-content-muted">Comment</label>
            <textarea 
              name="comment" 
              required 
              rows={4}
              value={form.comment}
              onChange={handleChange}
              className="w-full bg-white border border-border-theme rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary text-xs font-semibold text-content-strong"
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="bg-primary hover:bg-[#d89311] text-white font-bold text-[10px] px-8 py-3 rounded-full uppercase tracking-wider cursor-pointer transition shadow-xs hover:shadow-md"
          >
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      </div>
    </div>
  )
}
