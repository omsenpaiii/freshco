export type AdminCatalogCategory = {
  id: number
  name: string
  slug: string
  description: string | null
  image_url: string | null
  image_source_url?: string | null
  image_license?: string | null
  products_count: number
}

export type AdminCatalogVariant = {
  id: number
  title: string
  sku: string
  weight_grams: number | null
  price: number
  inventory_quantity: number
  is_default: boolean
}

export type AdminCatalogProduct = {
  id: number
  name: string
  slug: string
  description: string | null
  price: number
  compare_at_price: number | null
  sku: string | null
  inventory_quantity: number
  is_featured: boolean
  is_trending: boolean
  images: string[]
  category_id: number | null
  categories?: { name: string; slug: string } | null
  brand: string
  unit: string
  subcategory_1: string
  subcategory_2: string
  status: 'draft' | 'published'
  image_match_status: 'unverified' | 'verified'
  product_source_url: string | null
  image_source_url: string | null
  draft_reason: string | null
  product_variants: AdminCatalogVariant[]
}
