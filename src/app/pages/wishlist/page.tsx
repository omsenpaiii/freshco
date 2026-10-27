'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useStore } from '@/context/store-context'
import ProductCard from '@/components/ui/product-card'
import { Heart, ChevronRight } from 'lucide-react'
import type { ProductVariant } from '@/lib/catalog-types'

interface WishlistProduct {
  id: number
  name: string
  slug: string
  price: number
  compare_at_price: number | null
  images: string[]
  brand: string
  image_license?: string | null
  variants: ProductVariant[]
}

export default function WishlistPage() {
  const { wishlist } = useStore()
  const [wishlistProducts, setWishlistProducts] = useState<WishlistProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetchWishlistProducts = async () => {
      if (wishlist.length === 0) {
        setWishlistProducts([])
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const response = await fetch(`/api/wishlist?ids=${wishlist.join(',')}`, { cache: 'no-store' })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Could not load saved products.')
        if (!cancelled) setWishlistProducts((result.products || []).map((product: Record<string, unknown>) => ({
          ...product,
          price: Number(product.price),
          compare_at_price: product.compare_at_price == null ? null : Number(product.compare_at_price),
          variants: (product.product_variants as ProductVariant[] | undefined) || [],
        })) as WishlistProduct[])
      } catch (error) {
        console.warn('Failed to fetch saved products', error)
        if (!cancelled) setWishlistProducts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchWishlistProducts()
    return () => { cancelled = true }
  }, [wishlist])

  return (
    <div className="w-full bg-white px-4 md:px-8 py-10">
      <div className="max-w-6xl mx-auto text-left">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-content-muted mb-6 font-medium">
          <Link href="/" className="hover:text-primary transition">Home</Link>
          <ChevronRight size={12} />
          <span className="text-content-strong font-semibold">My Wishlist</span>
        </div>

        <div className="border-b border-border-theme pb-4 mb-8">
          <h1 className="text-xl md:text-2xl font-extrabold text-content-strong">My Wishlist</h1>
          <p className="text-xs text-content-muted mt-1">Keep track of your favourite deli products.</p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-border-theme bg-gray-50 py-16 text-center text-sm font-semibold text-content-muted">Loading saved products…</div>
        ) : wishlistProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center gap-4 text-body border border-dashed border-border-theme rounded-2xl bg-gray-50 p-6">
            <Heart size={48} className="text-gray-300 stroke-[1.5]" />
            <div>
              <h3 className="font-semibold text-content-strong text-base">Your Wishlist is Empty</h3>
              <p className="text-xs text-content-muted mt-1">Your saved products will appear here.</p>
            </div>
            <Link 
              href="/collections"
              className="bg-primary hover:bg-[#d89311] text-white text-xs font-bold py-2.5 px-6 rounded-full mt-2 transition uppercase tracking-wider"
            >
              Discover Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {wishlistProducts.map((prod) => (
              <ProductCard 
                key={prod.id}
                id={prod.id}
                name={prod.name}
                slug={prod.slug}
                price={prod.price}
                compare_at_price={prod.compare_at_price}
                images={prod.images}
                brand={prod.brand}
                image_license={prod.image_license}
                variants={prod.variants}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
