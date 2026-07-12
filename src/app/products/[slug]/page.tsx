import React from 'react'
import Link from 'next/link'
import { getProductBySlug, getProducts } from '@/lib/db'
import ProductDetailClient from './product-detail-client'
import ProductCard from '@/components/ui/product-card'
import { ChevronRight } from 'lucide-react'

// Force Next.js to render page dynamically so it grabs latest products/DB state
export const revalidate = 0

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const resolvedParams = await params
  const { slug } = resolvedParams

  const product = await getProductBySlug(slug)

  if (!product) {
    return (
      <div className="w-full bg-white px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-extrabold text-secondary">Product Not Found</h2>
        <p className="text-xs text-gray-400">The product you are looking for does not exist or has been removed.</p>
        <Link href="/collections" className="bg-primary hover:bg-[#d89311] text-white text-xs font-bold px-6 py-3 rounded-full inline-block transition uppercase tracking-wider">
          Return to Shop
        </Link>
      </div>
    )
  }

  // Fetch related products (same category, excluding current product)
  const relatedProducts = await getProducts({
    categorySlug: product.categories?.slug
  })
  const filteredRelated = relatedProducts.filter(p => p.id !== product.id).slice(0, 4)

  return (
    <div className="w-full bg-white px-4 md:px-8 py-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-8 font-medium">
          <Link href="/" className="hover:text-primary transition">Home</Link>
          <ChevronRight size={12} />
          <Link href="/collections" className="hover:text-primary transition">Shop</Link>
          {product.categories && (
            <>
              <ChevronRight size={12} />
              <Link href={`/collections/${product.categories.slug}`} className="hover:text-primary transition">
                {product.categories.name}
              </Link>
            </>
          )}
          <ChevronRight size={12} />
          <span className="text-secondary font-semibold line-clamp-1">{product.name}</span>
        </div>

        {/* Client side Product Details Interactive view */}
        <ProductDetailClient product={product} />

        {/* Related Products Recommendations */}
        {filteredRelated.length > 0 && (
          <section className="mt-16 pt-16 border-t border-border-theme text-left">
            <h3 className="text-lg font-bold text-secondary mb-8 uppercase tracking-wider">
              Related Products
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {filteredRelated.map((prod) => (
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
          </section>
        )}
        
      </div>
    </div>
  )
}
