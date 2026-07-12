import React from 'react'
import Link from 'next/link'
import { getCategories, getProducts } from '@/lib/db'
import ProductCard from '@/components/ui/product-card'
import { ChevronRight, Filter } from 'lucide-react'
import CollectionSort from '@/components/collections/collection-sort'

// Force Next.js to render page dynamically so it grabs latest products/DB state
export const revalidate = 0

interface CollectionsPageProps {
  searchParams: Promise<{ sortBy?: string; search?: string }>
}

export default async function CollectionsPage({ searchParams }: CollectionsPageProps) {
  const resolvedSearchParams = await searchParams
  const sortBy = resolvedSearchParams.sortBy || 'newest'
  const search = resolvedSearchParams.search || ''

  // Fetch data
  const categories = await getCategories()
  
  // Fetch filtered products
  const products = await getProducts({
    sortBy: sortBy,
    search: search
  })

  return (
    <div className="min-h-screen bg-brand-cloud py-10 md:py-14">
      <div className="site-container">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-content-muted mb-6 font-medium">
          <Link href="/" className="hover:text-primary transition">Home</Link>
          <ChevronRight size={12} />
          <span className="text-content-strong font-semibold">Shop All Products</span>
        </div>

        {/* Collection banner spotlight */}
        <div className="relative mb-10 flex min-h-[220px] w-full items-center overflow-hidden rounded-3xl bg-brand-ink p-8 text-left shadow-2xl md:p-12">
          <div className="absolute -right-12 -top-24 size-64 rounded-full bg-primary/45 blur-3xl" />
          <div className="relative max-w-2xl">
            <span className="red-stamp">The whole market</span>
            <h1 className="mt-4 text-4xl font-bold text-white md:text-6xl">Good food starts here.</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/65 md:text-base">
              Shop colourful produce, bakery favourites, pantry staples and delightful extras—all picked with FreshCo care.
            </p>
          </div>
        </div>

        {/* Two-Column Shop Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Left Sidebar (Filters & Categories) */}
          <div className="space-y-8 md:col-span-1">
            <div className="sticky top-44 space-y-6 rounded-3xl border border-border bg-white p-6 text-left shadow-[0_20px_60px_-45px_rgba(23,33,58,.5)]">
              <div className="flex items-center gap-2 text-content-strong font-bold text-sm border-b border-border-theme pb-3 uppercase tracking-wider">
                <Filter size={16} /> Shop Collections
              </div>
              <ul className="flex flex-col gap-2.5 text-xs font-semibold text-content-strong">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link 
                      href={`/collections/${cat.slug}`}
                      className="hover:text-primary transition flex items-center justify-between text-content-strong"
                    >
                      <span>{cat.name}</span>
                      <span className="text-[10px] bg-white border border-gray-150 px-2 py-0.5 rounded-full text-content-muted">
                        {cat.products_count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Main Products Grid */}
          <div className="md:col-span-3 space-y-6">
            
            {/* Header Control Row */}
            <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-border bg-white p-4 text-xs font-semibold text-brand-ink shadow-sm sm:flex-row">
              <div>
                Showing {products.length} Products
                {search && <span className="ml-1 text-content-muted">matching “{search}”</span>}
              </div>
              <CollectionSort value={sortBy} />
            </div>

            {/* Products Grid */}
            {products.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center gap-3 text-body border border-dashed border-border-theme rounded-2xl bg-gray-50">
                <h3 className="font-bold text-content-strong text-base">No Products Found</h3>
                <p className="text-xs text-content-muted">We couldn’t find any products matching your selection.</p>
                <Link 
                  href="/collections"
                  className="bg-primary hover:bg-[#d89311] text-white text-xs font-bold py-2.5 px-6 rounded-full mt-2 transition"
                >
                  Clear Filters
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
                {products.map((prod) => (
                  <ProductCard 
                    key={prod.id}
                    id={prod.id}
                    name={prod.name}
                    slug={prod.slug}
                    price={prod.price}
                    compare_at_price={prod.compare_at_price}
                    images={prod.images}
                    category_name={prod.categories?.name}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
