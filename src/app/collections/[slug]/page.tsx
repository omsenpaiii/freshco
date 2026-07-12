import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getCategories, getCategoryBySlug, getProducts } from '@/lib/db'
import ProductCard from '@/components/ui/product-card'
import { ChevronRight, Filter } from 'lucide-react'

// Force Next.js to render page dynamically so it grabs latest products/DB state
export const revalidate = 0

interface CollectionPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sortBy?: string; search?: string }>
}

export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  
  const currentSlug = resolvedParams.slug
  const sortBy = resolvedSearchParams.sortBy || 'newest'
  const search = resolvedSearchParams.search || ''

  // Fetch data
  const categories = await getCategories()
  const currentCategory = await getCategoryBySlug(currentSlug)
  
  // Fetch filtered products
  const products = await getProducts({
    categorySlug: currentSlug,
    sortBy: sortBy,
    search: search
  })

  return (
    <div className="min-h-screen bg-brand-cloud py-10 md:py-14">
      <div className="site-container">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 font-medium">
          <Link href="/" className="hover:text-primary transition">Home</Link>
          <ChevronRight size={12} />
          <Link href="/collections" className="hover:text-primary transition">Collections</Link>
          {currentCategory && (
            <>
              <ChevronRight size={12} />
              <span className="text-secondary font-semibold">{currentCategory.name}</span>
            </>
          )}
        </div>

        {/* Collection banner spotlight */}
        {currentCategory && (
          <div className="relative mb-10 h-[220px] w-full overflow-hidden rounded-3xl border-8 border-white shadow-2xl md:h-[300px]">
            <Image 
              src={currentCategory.image_url || 'https://images.unsplash.com/photo-1610348725531-843dff163e2c?q=80&w=1200'} 
              alt={currentCategory.name}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/35 flex flex-col justify-center p-8 md:p-12 text-white text-left">
              <h1 className="text-2xl md:text-4xl font-extrabold">{currentCategory.name}</h1>
              <p className="text-xs md:text-sm text-gray-200 mt-2 max-w-xl line-clamp-2">
                {currentCategory.description || "Browse our fresh, hand-picked collection of natural goods curated just for you."}
              </p>
            </div>
          </div>
        )}

        {/* Two-Column Shop Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Left Sidebar (Filters & Categories) */}
          <div className="space-y-8 md:col-span-1">
            <div className="sticky top-44 space-y-6 rounded-3xl border border-border bg-white p-6 text-left shadow-[0_20px_60px_-45px_rgba(23,33,58,.5)]">
              <div className="flex items-center gap-2 text-secondary font-bold text-sm border-b border-border-theme pb-3 uppercase tracking-wider">
                <Filter size={16} /> Categories
              </div>
              <ul className="flex flex-col gap-2.5 text-xs font-semibold text-secondary">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link 
                      href={`/collections/${cat.slug}`}
                      className={`hover:text-primary transition flex items-center justify-between ${
                        currentSlug === cat.slug ? 'text-primary' : 'text-secondary'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className="text-[10px] bg-white border border-gray-150 px-2 py-0.5 rounded-full text-gray-400">
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
                {search && <span className="ml-1 text-gray-400">matching “{search}”</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Sort By:</span>
                <form method="GET" className="inline-block">
                  {search && <input type="hidden" name="search" value={search} />}
                  <select 
                    name="sortBy" 
                    defaultValue={sortBy}
                    onChange={(e) => {
                      const url = new URL(window.location.href)
                      url.searchParams.set('sortBy', e.target.value)
                      window.location.href = url.toString()
                    }}
                    className="border border-border-theme rounded bg-white py-1 px-3.5 focus:outline-none focus:border-primary text-secondary cursor-pointer"
                  >
                    <option value="newest">Newest Items</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="title-asc">Name: A to Z</option>
                    <option value="title-desc">Name: Z to A</option>
                  </select>
                </form>
              </div>
            </div>

            {/* Products Grid */}
            {products.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center gap-3 text-body border border-dashed border-border-theme rounded-2xl bg-gray-50">
                <h3 className="font-bold text-secondary text-base">No Products Found</h3>
                <p className="text-xs text-gray-400">We couldn’t find any products matching your selection.</p>
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
