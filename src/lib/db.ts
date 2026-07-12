import { createServerComponentClient } from './supabase-server'
import categoriesData from '@/data/categories.json'
import productsData from '@/data/products.json'

// Fallback static mock blog data (in case DB isn't seeded)
const fallbackBlogs = [
  {
    id: "blog-1",
    title: "All time fresh, every time healthy organic food recipes",
    slug: "all-time-fresh-every-time-healthy",
    excerpt: "Organic foods are grown without artificial chemicals. Here are some quick organic recipes to boost your health.",
    content: "Prepare meals with fresh ingredients. Organic food has more nutrients, and eating fresh vegetables keeps your body energized throughout the day. Try blending avocado, spinach, and apples for a green health booster.",
    author: "Vegist Admin",
    image_url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=800&auto=format&fit=crop",
    published_at: "2026-07-12T00:00:00Z"
  },
  {
    id: "blog-2",
    title: "Fresh organics brand and picnic ideas for summer holidays",
    slug: "fresh-organics-brand-and-picnic",
    excerpt: "Planning a picnic? Here are some summer ideas using organic fresh goods that will surprise your family.",
    content: "A summer picnic is the perfect way to connect with nature. Bundle organic grapes, fresh cherries, artisanal sourdough bread, and natural local cheeses. Keep things cooled using insulated bags.",
    author: "Vegist Admin",
    image_url: "https://images.unsplash.com/photo-1530124560072-aab9a51df75a?q=80&w=800&auto=format&fit=crop",
    published_at: "2026-07-11T00:00:00Z"
  },
  {
    id: "blog-3",
    title: "Green onion, knife and fresh salad placed on table",
    slug: "green-onion-knife-and-salad-placed",
    excerpt: "Learn how to prepare the perfect chef's salad using green onions and organic leafy greens.",
    content: "Proper knife skills and fresh produce make cooking a delight. Chop organic red radishes, green onions, and sweet cucumbers. Toss in olive oil and organic lemon juice for a quick dressing.",
    author: "Vegist Admin",
    image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop",
    published_at: "2026-07-10T00:00:00Z"
  }
]

// Check if supabase environment variables are valid
const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return url && key && !url.includes('your-project') && !key.includes('...')
}

// Categories Fetching
export async function getCategories() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerComponentClient()
      const { data, error } = await supabase.from('categories').select('*').order('name')
      if (!error && data && data.length > 0) return data
    } catch (e) {
      console.warn("Supabase category fetch failed, falling back to JSON", e)
    }
  }
  return categoriesData
}

export async function getCategoryBySlug(slug: string) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerComponentClient()
      const { data, error } = await supabase.from('categories').select('*').eq('slug', slug).single()
      if (!error && data) return data
    } catch (e) {
      console.warn("Supabase single category fetch failed, falling back to JSON", e)
    }
  }
  return categoriesData.find(c => c.slug === slug) || null
}

// Products Fetching
export interface GetProductsOptions {
  categorySlug?: string
  isFeatured?: boolean
  isTrending?: boolean
  search?: string
  sortBy?: string // 'price-asc', 'price-desc', 'title-asc', 'title-desc', 'newest'
}

export async function getProducts(options: GetProductsOptions = {}) {
  const { categorySlug, isFeatured, isTrending, search, sortBy } = options

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerComponentClient()
      let query = supabase.from('products').select('*, categories(name, slug)')

      if (isFeatured) query = query.eq('is_featured', true)
      if (isTrending) query = query.eq('is_trending', true)
      if (search) query = query.ilike('name', `%${search}%`)

      if (categorySlug) {
        // First find the category
        const { data: catData } = await supabase.from('categories').select('id').eq('slug', categorySlug).single()
        if (catData) {
          query = query.eq('category_id', catData.id)
        }
      }

      // Apply sorting
      if (sortBy) {
        if (sortBy === 'price-asc') query = query.order('price', { ascending: true })
        else if (sortBy === 'price-desc') query = query.order('price', { ascending: false })
        else if (sortBy === 'title-asc') query = query.order('name', { ascending: true })
        else if (sortBy === 'title-desc') query = query.order('name', { ascending: false })
        else query = query.order('created_at', { ascending: false })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const { data, error } = await query
      if (!error && data && data.length > 0) return data
    } catch (e) {
      console.warn("Supabase products fetch failed, falling back to JSON", e)
    }
  }

  // Fallback implementation using local products.json
  let filtered = [...productsData] as any[]

  if (categorySlug) {
    const cat = categoriesData.find(c => c.slug === categorySlug)
    if (cat) {
      filtered = filtered.filter(p => p.category_id === cat.id)
    }
  }

  if (isFeatured) {
    filtered = filtered.filter(p => p.is_featured)
  }

  if (isTrending) {
    filtered = filtered.filter(p => p.is_trending)
  }

  if (search) {
    const cleanSearch = search.toLowerCase()
    filtered = filtered.filter(p => p.name.toLowerCase().includes(cleanSearch))
  }

  // Sorting
  if (sortBy) {
    if (sortBy === 'price-asc') filtered.sort((a, b) => a.price - b.price)
    else if (sortBy === 'price-desc') filtered.sort((a, b) => b.price - a.price)
    else if (sortBy === 'title-asc') filtered.sort((a, b) => a.name.localeCompare(b.name))
    else if (sortBy === 'title-desc') filtered.sort((a, b) => b.name.localeCompare(a.name))
  }

  return filtered
}

export async function getProductBySlug(slug: string) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerComponentClient()
      const { data, error } = await supabase.from('products').select('*, categories(name, slug)').eq('slug', slug).single()
      if (!error && data) return data
    } catch (e) {
      console.warn("Supabase single product fetch failed, falling back to JSON", e)
    }
  }
  
  const product = productsData.find(p => p.slug === slug)
  if (!product) return null

  // Find category details for the product
  const category = categoriesData.find(c => c.id === product.category_id)
  return {
    ...product,
    categories: category ? { name: category.name, slug: category.slug } : null
  }
}

// Blog Fetching
export async function getBlogPosts() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerComponentClient()
      const { data, error } = await supabase.from('blog_posts').select('*').order('published_at', { ascending: false })
      if (!error && data && data.length > 0) return data
    } catch (e) {
      console.warn("Supabase blog posts fetch failed, falling back to JSON", e)
    }
  }
  return fallbackBlogs
}

export async function getBlogPostBySlug(slug: string) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerComponentClient()
      const { data, error } = await supabase.from('blog_posts').select('*').eq('slug', slug).single()
      if (!error && data) return data
    } catch (e) {
      console.warn("Supabase blog post fetch failed, falling back to JSON", e)
    }
  }
  return fallbackBlogs.find(b => b.slug === slug) || null
}

// Comments Fetching & Inserting
export async function getBlogComments(postId: string) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerComponentClient()
      const { data, error } = await supabase.from('blog_comments').select('*').eq('post_id', postId).order('created_at', { ascending: true })
      if (!error && data) return data
    } catch (e) {
      console.warn("Supabase blog comments fetch failed", e)
    }
  }
  return []
}
