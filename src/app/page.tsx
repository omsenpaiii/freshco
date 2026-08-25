import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getCategories, getProducts, getBlogPosts } from '@/lib/db'
import ProductCard from '@/components/ui/product-card'
import HomeHeroClient from './home-hero-client'
import DealOfTheDayClient from './deal-of-the-day-client'
import SectionReveal from '@/components/ui/section-reveal'
import { ArrowRight, Leaf, ShieldCheck, Truck, Sparkles } from 'lucide-react'

// Force Next.js to render page dynamically so it grabs latest products/DB state
export const revalidate = 0

export default async function Home() {
  const categories = await getCategories()
  const allProducts = await getProducts()
  const trendingProducts = allProducts.slice(8, 12)
  const blogPosts = await getBlogPosts()

  // Get subset of featured categories for homepage circles (limit to 8)
  const featuredCategories = categories.slice(0, 8)

  // Get general featured products
  const featuredProducts = allProducts.slice(0, 8)

  return (
    <div className="w-full flex flex-col">
      {/* 1. Hero Slider */}
      <HomeHeroClient />

      {/* 2. Features Badges Row */}
      <section className="border-b border-border bg-brand-cloud py-7">
        <SectionReveal className="site-container grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-4 rounded-2xl border border-white bg-white/70 p-5">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Truck size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-content-strong">Free Shipping</h4>
              <p className="text-xs text-content-muted mt-0.5">Across Melbourne on orders over A$50</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-white bg-white/70 p-5">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Leaf size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-content-strong">Deli selection</h4>
              <p className="text-xs text-content-muted mt-0.5">Cheese, frozen filo and pantry staples</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-white bg-white/70 p-5">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-content-strong">Secure Payments</h4>
              <p className="text-xs text-content-muted mt-0.5">100% SSL protected checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-white bg-white/70 p-5">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Sparkles size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-content-strong">Verified packs</h4>
              <p className="text-xs text-content-muted mt-0.5">Only exact-image matches are published</p>
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* 3. Shop By Category */}
      <section className="section-shell bg-white">
        <SectionReveal className="site-container">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="text-xs uppercase font-bold tracking-widest text-primary">Discover Freshness</span>
          <h2 className="section-title">A colourful aisle for every craving.</h2>
          <p className="section-copy mx-auto">From daily staples to something special, start with the part of the market you love most.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {featuredCategories.map((cat) => {
            const catImage = cat.image_url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=150'
            return (
              <Link 
                key={cat.id} 
                href={`/collections/${cat.slug}`}
                className="group flex flex-col items-center gap-3 rounded-2xl border border-transparent p-3 text-center transition duration-300 hover:border-border hover:bg-brand-cloud"
              >
                <div className="relative size-20 overflow-hidden rounded-[1.6rem] border-4 border-white bg-brand-cloud shadow-lg transition duration-300 group-hover:-rotate-2 group-hover:shadow-xl">
                  <Image 
                    src={catImage} 
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 40vw, (max-width: 1024px) 22vw, 12vw"
                    className="object-cover group-hover:scale-108 transition duration-500"
                  />
                </div>
                <h4 className="text-xs font-semibold text-content-strong group-hover:text-primary transition line-clamp-1">
                  {cat.name}
                </h4>
              </Link>
            )
          })}
        </div></SectionReveal>
      </section>

      {/* 4. Banner Promo Section */}
      <section className="bg-white pb-20">
        <SectionReveal className="site-container grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="group relative h-[260px] overflow-hidden rounded-3xl border border-border shadow-xl">
            <Image 
              src="https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?q=85&w=1000&auto=format&fit=crop"
              alt="Promo Banner 1"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover group-hover:scale-103 transition duration-700"
            />
            <div className="absolute inset-0 flex flex-col items-start justify-center bg-gradient-to-r from-brand-ink/85 to-transparent p-8 md:p-10">
              <span className="text-xs uppercase font-extrabold tracking-wider text-primary bg-white/95 px-3 py-1 rounded-full shadow-2xs">Deli fridge</span>
              <h3 className="text-xl md:text-2xl font-bold text-white mt-3 leading-tight max-w-[220px]">Dodoni Greek Cheese</h3>
              <p className="text-xs text-white/90 mt-1.5 font-medium">Feta and speciality cheese packs</p>
              <Link href="/collections/cheese" className="inline-block bg-primary hover:bg-[#d89311] text-white text-xs font-bold px-4 py-2 rounded-full mt-4 transition">
                Shop Cheese
              </Link>
            </div>
          </div>

          <div className="group relative h-[260px] overflow-hidden rounded-3xl border border-border shadow-xl">
            <Image 
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop" 
              alt="Promo Banner 2"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover group-hover:scale-103 transition duration-700"
            />
            <div className="absolute inset-0 flex flex-col items-start justify-center bg-gradient-to-r from-brand-ink/85 to-transparent p-8 md:p-10">
              <span className="text-xs uppercase font-extrabold tracking-wider text-primary bg-white/95 px-3 py-1 rounded-full shadow-2xs">Pantry ready</span>
              <h3 className="text-xl md:text-2xl font-bold text-white mt-3 leading-tight max-w-[220px]">Misko Greek Pasta</h3>
              <p className="text-xs text-white/90 mt-1.5 font-medium">Classic shapes for weeknight cooking</p>
              <Link href="/collections/grocery" className="inline-block bg-primary hover:bg-[#d89311] text-white text-xs font-bold px-4 py-2 rounded-full mt-4 transition">
                Shop Grocery
              </Link>
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* 5. Trending Products Grid */}
      <section className="section-shell bg-brand-cloud">
        <div className="max-w-6xl mx-auto flex items-end justify-between border-b border-border-theme pb-4 mb-8">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-primary">Top Choice</span>
            <h2 className="text-xl md:text-2xl font-extrabold text-content-strong mt-1">Trending Products</h2>
          </div>
          <Link href="/collections" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 md:grid-cols-4 md:gap-6">
          {trendingProducts.slice(0, 4).map((prod) => (
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
              variants={prod.variants}
            />
          ))}
        </div>
      </section>

      {/* 6. Deal Of the Day (Countdown Timer) */}
      {featuredProducts.length > 0 && (
        <DealOfTheDayClient product={featuredProducts[0]} />
      )}

      {/* 7. Featured Products Tabbed Section */}
      <section className="section-shell bg-white">
        <div className="max-w-6xl mx-auto text-center space-y-2 mb-10">
          <span className="text-xs uppercase font-bold tracking-widest text-primary">Our Selection</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-content-strong">Our Fresh Products</h2>
          <div className="w-12 h-1 bg-primary mx-auto rounded-full mt-2" />
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {featuredProducts.map((prod) => (
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
              variants={prod.variants}
            />
          ))}
        </div>
      </section>

      {/* 9. Blog Section */}
      <section className="section-shell bg-white">
        <div className="max-w-6xl mx-auto flex items-end justify-between border-b border-border-theme pb-4 mb-8">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-primary">Our Stories</span>
            <h2 className="text-xl md:text-2xl font-extrabold text-content-strong mt-1">From the FreshCo Deli Counter</h2>
          </div>
          <Link href="/blogs/news" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            Read Blogs <ArrowRight size={14} />
          </Link>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {blogPosts.slice(0, 3).map((post) => (
            <Link 
              key={post.id}
              href={`/blogs/news/${post.slug}`}
              className="group flex flex-col gap-4"
            >
              <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shadow-2xs group-hover:shadow-md transition">
                <Image 
                  src={post.image_url || '/blogs/freshco-greek-cheese.jpg'}
                  alt={post.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-103 transition duration-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-[10px] text-content-muted font-bold">
                  <span>By {post.author}</span>
                  <span>•</span>
                  <span>{new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <h3 className="text-sm font-bold text-content-strong group-hover:text-primary transition leading-snug line-clamp-2 h-10">
                  {post.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                  {post.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
