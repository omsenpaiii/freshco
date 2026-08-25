import { createServerComponentClient } from './supabase-server'
import categoriesData from '@/data/categories.json'
import productsData from '@/data/products.json'
import type { CatalogProduct } from '@/lib/catalog-types'
import { isCatalogBackendEnabled } from '@/lib/supabase-config'

// FreshCo Deli editorial fallback (used until the dedicated catalog backend is enabled).
const fallbackBlogs = [
  {
    id: "blog-1",
    title: "Build a Greek cheese board with FreshCo Deli favourites",
    slug: "greek-cheese-board-freshco-deli-favourites",
    excerpt: "Bring together feta, Manouri, Saganaki and Kefalograviera for a generous Greek-inspired cheese board.",
    content: "Start with a mix of textures from the FreshCo Deli cheese collection. Dodoni feta brings a familiar crumbly centrepiece, Manouri adds a softer option, and Saganaki or Kefalograviera brings a firmer cheese to slice or cook. Keep each cheese in its original packaging until you are ready to prepare the board, and use the product page to choose the Kefalograviera weight that suits your gathering.",
    author: "FreshCo Deli",
    image_url: "/blogs/freshco-greek-cheese.jpg",
    published_at: "2026-08-15T00:00:00Z"
  },
  {
    id: "blog-2",
    title: "From freezer to table: choosing a Filosophy filo pie",
    slug: "choosing-a-filosophy-filo-pie",
    excerpt: "A quick guide to FreshCo Deli’s spiral pies, family pies and mini filo pieces.",
    content: "Choose a large spiral when you want a centrepiece, a family pie for easy portions, or mini spirals, rolls and triangles for a shareable spread. The FreshCo Deli frozen collection includes feta, spinach and feta, wild greens, leek and feta, halloumi and sweet custard styles. Check the exact pack size on each product page before adding it to your cart.",
    author: "FreshCo Deli",
    image_url: "/blogs/freshco-filo-pies.jpg",
    published_at: "2026-08-14T00:00:00Z"
  },
  {
    id: "blog-3",
    title: "A simple guide to the Misko pasta shapes at FreshCo Deli",
    slug: "guide-to-misko-pasta-shapes",
    excerpt: "Meet the spaghetti, macaroni, soup pasta, Kritharaki and short shapes in our grocery collection.",
    content: "FreshCo Deli stocks Misko pasta by shape and number so it is easier to find the pack you know. The collection covers long pasta such as Spaghetti No. 6 and No. 10, hollow Macaroni No. 2 and No. 5, rice-shaped Kritharaki, and short shapes including shells, twirls, tubetti and pennaki. Every published Misko product in the current range is listed as a 500 g pack.",
    author: "FreshCo Deli",
    image_url: "/blogs/freshco-misko-pasta.jpg",
    published_at: "2026-08-13T00:00:00Z"
  }
]

// Check if supabase environment variables are valid
const isSupabaseConfigured = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return isCatalogBackendEnabled() && url && key && !url.includes('your-project') && !key.includes('...')
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
  brand?: string
  subcategory?: string
}

const normalizeProduct = (input: unknown): CatalogProduct => {
  const product = input as Record<string, unknown>
  const rawVariants = (product.product_variants || product.variants || []) as Array<Record<string, unknown>>
  const variants: Array<Record<string, unknown>> = rawVariants.map((variant) => ({
    ...variant,
    price: Number(variant.price),
  })).sort((a: Record<string, unknown>, b: Record<string, unknown>) => (Number(a.weight_grams) || 0) - (Number(b.weight_grams) || 0))
  return {
    ...product,
    price: Number(product.price),
    compare_at_price: product.compare_at_price == null ? null : Number(product.compare_at_price),
    variants,
  } as unknown as CatalogProduct
}

export async function getProducts(options: GetProductsOptions = {}): Promise<CatalogProduct[]> {
  const { categorySlug, isFeatured, isTrending, search, sortBy, brand, subcategory } = options

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerComponentClient()
      let query = supabase.from('products').select('*, categories(name, slug), product_variants(*)').eq('status', 'published')

      if (isFeatured) query = query.eq('is_featured', true)
      if (isTrending) query = query.eq('is_trending', true)
      if (search) query = query.ilike('name', `%${search}%`)
      if (brand) query = query.eq('brand', brand)
      if (subcategory) query = query.or(`subcategory_1.eq.${subcategory},subcategory_2.eq.${subcategory}`)

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
      if (!error && data) return data.map(normalizeProduct)
    } catch (e) {
      console.warn("Supabase products fetch failed, falling back to JSON", e)
    }
  }

  // Fallback implementation using local products.json
  let filtered = (productsData as unknown as CatalogProduct[]).map(normalizeProduct)

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

  if (brand) filtered = filtered.filter(p => p.brand === brand)
  if (subcategory) filtered = filtered.filter(p => p.subcategory_1 === subcategory || p.subcategory_2 === subcategory)

  // Sorting
  if (sortBy) {
    if (sortBy === 'price-asc') filtered.sort((a, b) => a.price - b.price)
    else if (sortBy === 'price-desc') filtered.sort((a, b) => b.price - a.price)
    else if (sortBy === 'title-asc') filtered.sort((a, b) => a.name.localeCompare(b.name))
    else if (sortBy === 'title-desc') filtered.sort((a, b) => b.name.localeCompare(a.name))
  }

  return filtered
}

export async function getProductBySlug(slug: string): Promise<CatalogProduct | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerComponentClient()
      const { data, error } = await supabase.from('products').select('*, categories(name, slug), product_variants(*)').eq('slug', slug).eq('status', 'published').single()
      if (!error && data) return normalizeProduct(data)
    } catch (e) {
      console.warn("Supabase single product fetch failed, falling back to JSON", e)
    }
  }
  
  const product = productsData.find(p => p.slug === slug)
  if (!product) return null

  // Find category details for the product
  const category = categoriesData.find(c => c.id === product.category_id)
  return normalizeProduct({
    ...product,
    categories: category ? { name: category.name, slug: category.slug } : null
  })
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
