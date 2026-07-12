'use client'

import React from 'react'
import Link from 'next/link'
import { useStore } from '@/context/store-context'
import ProductCard from '@/components/ui/product-card'
import productsData from '@/data/products.json'
import { Heart, ChevronRight } from 'lucide-react'

export default function WishlistPage() {
  const { wishlist } = useStore()

  // Retrieve products in wishlist
  const wishlistProducts = productsData.filter(p => wishlist.includes(p.id))

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
          <p className="text-xs text-content-muted mt-1">Keep track of your favorite organic products.</p>
        </div>

        {wishlistProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center gap-4 text-body border border-dashed border-border-theme rounded-2xl bg-gray-50 p-6">
            <Heart size={48} className="text-gray-300 stroke-[1.5]" />
            <div>
              <h3 className="font-semibold text-content-strong text-base">Your Wishlist is Empty</h3>
              <p className="text-xs text-content-muted mt-1">You haven't added any products to your wishlist yet.</p>
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
              />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
