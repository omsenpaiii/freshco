import categoriesData from '@/data/categories.json'
import productsData from '@/data/products.json'
import type { CatalogProduct } from '@/lib/catalog-types'
import { isNeonConfigured, query } from '@/lib/neon'

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

// Categories Fetching
// Database rows and the static fallback intentionally share a loose shape for resilience.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getCategories(): Promise<any[]> {
  if (isNeonConfigured()) {
    try {
      const { rows } = await query('SELECT * FROM categories ORDER BY name')
      if (rows.length > 0) return rows
    } catch (e) {
      console.warn("Neon category fetch failed, falling back to JSON", e)
    }
  }
  return categoriesData
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getCategoryBySlug(slug: string): Promise<any | null> {
  if (isNeonConfigured()) {
    try {
      const { rows } = await query('SELECT * FROM categories WHERE slug=$1 LIMIT 1', [slug])
      if (rows[0]) return rows[0]
    } catch (e) {
      console.warn("Neon single category fetch failed, falling back to JSON", e)
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
  const variants: Array<Record<string, unknown>> = rawVariants.filter((variant) => Number(variant.inventory_quantity ?? 0) > 0).map((variant) => ({
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

  if (isNeonConfigured()) {
    try {
      const clauses = ["p.status='published'"]
      const values: unknown[] = []
      const add = (sql: string, value: unknown) => { values.push(value); clauses.push(sql.replace('?', `$${values.length}`)) }
      if (isFeatured) clauses.push('p.is_featured=true')
      if (isTrending) clauses.push('p.is_trending=true')
      if (search) add('p.name ILIKE ?', `%${search}%`)
      if (brand) { values.push(brand.trim()); clauses.push(`LOWER(BTRIM(p.brand))=LOWER($${values.length})`) }
      if (subcategory) { values.push(subcategory.trim()); clauses.push(`LOWER(BTRIM(p.subcategory_1))=LOWER($${values.length})`) }
      if (categorySlug) add('c.slug=?', categorySlug)
      const order = sortBy === 'price-asc' ? 'p.price ASC' : sortBy === 'price-desc' ? 'p.price DESC' : sortBy === 'title-asc' ? 'p.name ASC' : sortBy === 'title-desc' ? 'p.name DESC' : 'p.created_at DESC'
      const { rows } = await query(`SELECT p.*, jsonb_build_object('name',c.name,'slug',c.slug) categories,
        COALESCE(jsonb_agg(to_jsonb(v) ORDER BY v.weight_grams) FILTER (WHERE v.id IS NOT NULL),'[]') product_variants
        FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN product_variants v ON v.product_id=p.id
        WHERE ${clauses.join(' AND ')} GROUP BY p.id,c.name,c.slug ORDER BY ${order}`, values)
      return rows.map(normalizeProduct)
    } catch (e) {
      console.warn("Neon products fetch failed, falling back to JSON", e)
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

  if (brand) filtered = filtered.filter(p => p.brand?.trim().toLocaleLowerCase() === brand.trim().toLocaleLowerCase())
  if (subcategory) filtered = filtered.filter(p => p.subcategory_1?.trim().toLocaleLowerCase() === subcategory.trim().toLocaleLowerCase())

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
  if (isNeonConfigured()) {
    try {
      const { rows } = await query(`SELECT p.*,jsonb_build_object('name',c.name,'slug',c.slug) categories,
        COALESCE(jsonb_agg(to_jsonb(v) ORDER BY v.weight_grams) FILTER (WHERE v.id IS NOT NULL),'[]') product_variants
        FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN product_variants v ON v.product_id=p.id
        WHERE p.slug=$1 AND p.status='published' GROUP BY p.id,c.name,c.slug LIMIT 1`, [slug])
      if (rows[0]) return normalizeProduct(rows[0])
    } catch (e) {
      console.warn("Neon single product fetch failed, falling back to JSON", e)
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
  if (isNeonConfigured()) {
    try {
      const { rows } = await query<(typeof fallbackBlogs)[number]>('SELECT * FROM blog_posts ORDER BY published_at DESC')
      if (rows.length > 0) return rows
    } catch (e) {
      console.warn("Neon blog posts fetch failed, falling back to JSON", e)
    }
  }
  return fallbackBlogs
}

export async function getBlogPostBySlug(slug: string) {
  if (isNeonConfigured()) {
    try {
      const { rows } = await query<(typeof fallbackBlogs)[number]>('SELECT * FROM blog_posts WHERE slug=$1 LIMIT 1', [slug])
      if (rows[0]) return rows[0]
    } catch (e) {
      console.warn("Neon blog post fetch failed, falling back to JSON", e)
    }
  }
  return fallbackBlogs.find(b => b.slug === slug) || null
}

// Comments Fetching & Inserting
export async function getBlogComments(postId: string) {
  if (isNeonConfigured()) {
    try {
      const { rows } = await query<{ id: string; post_id: string; author_name: string; author_email: string; content: string; created_at: string }>('SELECT * FROM blog_comments WHERE post_id=$1 ORDER BY created_at', [postId])
      return rows
    } catch (e) {
      console.warn("Neon blog comments fetch failed", e)
    }
  }
  return []
}
