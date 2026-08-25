export type CatalogStatus = 'draft' | 'published'

export interface ProductVariant {
  id: number
  product_id: number
  title: string
  sku: string
  weight_grams: number | null
  price: number
  inventory_quantity: number
  is_default: boolean
}

export interface CatalogProduct {
  id: number
  name: string
  slug: string
  description: string
  price: number
  compare_at_price: number | null
  sku: string
  inventory_quantity: number
  images: string[]
  category_id: number
  brand: string
  unit: string
  subcategory_1: string
  subcategory_2: string
  status: CatalogStatus
  image_match_status: 'verified' | 'unverified'
  product_source_url: string | null
  image_source_url: string | null
  draft_reason?: string | null
  is_featured: boolean
  is_trending: boolean
  variants: ProductVariant[]
  categories?: { name: string; slug: string } | null
}
