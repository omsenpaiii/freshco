import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getCategories, getProducts } from '@/lib/db'
import ProductCard from '@/components/ui/product-card'
import { ChevronRight, Filter } from 'lucide-react'
import CollectionSort from '@/components/collections/collection-sort'
import SectionReveal from '@/components/ui/section-reveal'

// Force Next.js to render page dynamically so it grabs latest products/DB state
export const revalidate = 0

function normalizeLabel(value: string) {
  return value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase()
    .replace(/[^\p{Letter}\p{Number}]/gu, '')
}

function uniqueLabels(values: Array<string | null | undefined>) {
  const labels = new Map<string, { label: string; count: number }>()
  for (const value of values) {
    const label = value?.trim().replace(/\s+/g, ' ')
    if (!label) continue
    const key = normalizeLabel(label)
    const current = labels.get(key)
    if (current) current.count += 1
    else labels.set(key, { label, count: 1 })
  }
  return [...labels.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .map(({ label }) => label)
}

interface CollectionPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sortBy?: string; search?: string; brand?: string; subcategory?: string }>
}

export default async function CollectionPage({ params, searchParams }: CollectionPageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  
  const currentSlug = resolvedParams.slug
  const sortBy = resolvedSearchParams.sortBy || 'newest'
  const search = resolvedSearchParams.search || ''
  const brand = resolvedSearchParams.brand || ''
  const subcategory = resolvedSearchParams.subcategory || ''

  // Fetch the category and its products in parallel. Reuse this one product
  // result for the filter options and the visible list to avoid duplicate
  // database round-trips on every collection visit.
  const [categories, unfilteredProducts] = await Promise.all([
    getCategories(),
    getProducts({ categorySlug: currentSlug }),
  ])
  const currentCategory = categories.find((category) => category.slug === currentSlug) || null
  if (!currentCategory) notFound()
  const brands = uniqueLabels(unfilteredProducts.map((product) => product.brand))
  // The workbook's first subcategory is the collection's product type. The
  // second level is a refinement, not another peer option (e.g. legacy
  // “Cow & Sheep Feta” must not appear beside “Feta”).
  const subcategories = uniqueLabels(unfilteredProducts.map((product) => product.subcategory_1))

  const searchTerm = search.trim().toLocaleLowerCase()
  const selectedBrand = normalizeLabel(brand.trim())
  const selectedSubcategory = normalizeLabel(subcategory.trim())
  const products = unfilteredProducts
    .filter((product) => !searchTerm || product.name.toLocaleLowerCase().includes(searchTerm))
    .filter((product) => !selectedBrand || normalizeLabel(product.brand?.trim() || '') === selectedBrand)
    .filter((product) => !selectedSubcategory || normalizeLabel(product.subcategory_1?.trim() || '') === selectedSubcategory)
    .sort((left, right) => {
      if (sortBy === 'price-asc') return (left.price <= 0 ? 1 : 0) - (right.price <= 0 ? 1 : 0) || left.price - right.price
      if (sortBy === 'price-desc') return (left.price <= 0 ? 1 : 0) - (right.price <= 0 ? 1 : 0) || right.price - left.price
      if (sortBy === 'title-asc') return left.name.localeCompare(right.name)
      if (sortBy === 'title-desc') return right.name.localeCompare(left.name)
      return Date.parse(right.created_at || '') - Date.parse(left.created_at || '')
    })

  return (
    <div className="min-h-screen bg-brand-cloud py-10 md:py-14">
      <div className="site-container">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-content-muted mb-6 font-medium">
          <Link href="/" className="hover:text-primary transition">Home</Link>
          <ChevronRight size={12} />
          <Link href="/collections" className="hover:text-primary transition">Collections</Link>
          {currentCategory && (
            <>
              <ChevronRight size={12} />
              <span className="text-content-strong font-semibold">{currentCategory.name}</span>
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
              loading="eager"
              sizes="100vw"
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
              <div className="flex items-center gap-2 text-content-strong font-bold text-sm border-b border-border-theme pb-3 uppercase tracking-wider">
                <Filter size={16} /> Categories
              </div>
              <ul className="flex flex-col gap-2.5 text-xs font-semibold text-content-strong">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <Link 
                      href={`/collections/${cat.slug}`}
                      className={`flex min-h-10 items-center justify-between rounded-xl px-3 transition hover:bg-brand-cloud hover:text-primary ${
                        currentSlug === cat.slug ? 'bg-brand-cloud text-primary' : 'text-content-strong'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className="text-[10px] bg-white border border-gray-150 px-2 py-0.5 rounded-full text-content-muted">
                        {cat.products_count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <form className="space-y-4 border-t border-border pt-5" action={`/collections/${currentSlug}`}>
                <div>
                  <label htmlFor="brand" className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Brand</label>
                  <select id="brand" name="brand" defaultValue={brand} className="h-12 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold text-brand-ink transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10">
                    <option value="">All brands</option>
                    {brands.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="subcategory" className="mb-1.5 block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">Product type</label>
                  <select id="subcategory" name="subcategory" defaultValue={subcategory} className="h-12 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold text-brand-ink transition focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10">
                    <option value="">All types</option>
                    {subcategories.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
                <button className="h-12 w-full rounded-full bg-primary text-sm font-extrabold text-white shadow-[0_10px_24px_-14px_rgba(41,101,241,.85)] transition hover:-translate-y-0.5 hover:bg-brand-ink">Apply filters</button>
                {(brand || subcategory) && <Link href={`/collections/${currentSlug}`} className="block text-center text-xs font-bold text-primary hover:underline">Clear filters</Link>}
              </form>
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
              <SectionReveal className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
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
                    brand={prod.brand}
                    image_license={prod.image_license}
                    variants={prod.variants}
                  />
                ))}
              </SectionReveal>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
