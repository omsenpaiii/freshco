import React from 'react'
import Link from 'next/link'
import { getCategories, getProducts } from '@/lib/db'
import ProductCard from '@/components/ui/product-card'
import { ChevronRight, Filter } from 'lucide-react'

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
    <div className="w-full bg-white px-4 md:px-8 py-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 font-medium">
          <Link href="/" className="hover:text-primary transition">Home</Link>
          <ChevronRight size={12} />
          <span className="text-secondary font-semibold">Shop All Products</span>
        </div>

        {/* Collection banner spotlight */}
        <div className="relative w-full h-[150px] md:h-[200px] rounded-2xl overflow-hidden mb-10 border border-gray-150 bg-gray-50 flex items-center justify-center p-8 text-center">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-4xl font-extrabold text-secondary">Organic Grocery Marketplace</h1>
            <p className="text-xs md:text-sm text-gray-400 max-w-xl mx-auto">
              Shop over 70 unique fresh organic foods, bakery bagels, custom dairy products, and imported wines.
            </p>
          </div>
        </div>

        {/* Two-Column Shop Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Left Sidebar (Filters & Categories) */}
          <div className="space-y-8 md:col-span-1">
            <div className="border border-border-theme rounded-xl p-5 bg-[#f8f9fa] space-y-6 text-left">
              <div className="flex items-center gap-2 text-secondary font-bold text-sm border-b border-border-theme pb-3 uppercase tracking-wider">
                <Filter size={16} /> Shop Collections
              </div>
              <ul className="flex flex-col gap-2.5 text-xs font-semibold text-secondary">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link 
                      href={`/collections/${cat.slug}`}
                      className="hover:text-primary transition flex items-center justify-between text-secondary"
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
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 border border-border-theme rounded-xl p-4 text-xs font-semibold text-secondary">
              <div>
                Showing {products.length} Products
                {search && <span className="text-gray-400 ml-1">matching "{search}"</span>}
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
                <p className="text-xs text-gray-400">We couldn't find any products matching your selection.</p>
                <Link 
                  href="/collections"
                  className="bg-primary hover:bg-[#d89311] text-white text-xs font-bold py-2.5 px-6 rounded-full mt-2 transition"
                >
                  Clear Filters
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
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
