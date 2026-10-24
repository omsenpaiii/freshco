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
      <section className="section-shell overflow-hidden bg-brand-cloud">
        <div className="site-container">
          <SectionReveal className="mb-9 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between md:mb-12">
            <div className="max-w-2xl">
              <span className="eyebrow">A good place to start</span>
              <h2 className="section-title">Find your corner of the deli.</h2>
              <p className="section-copy">Greek cheese for the table, filo for the freezer and the pantry favourites you reach for all week.</p>
            </div>
            <Link href="/collections" className="group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-brand-ink/10 bg-white px-5 text-sm font-extrabold text-brand-ink shadow-sm transition duration-300 hover:border-primary/25 hover:bg-primary hover:text-white hover:shadow-[0_12px_30px_-14px_rgba(41,101,241,.65)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20">
              Browse all collections <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </SectionReveal>

          <SectionReveal className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5">
            {featuredCategories.map((cat) => {
              const catImage = cat.image_url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=600'
              return (
                <Link
                  key={cat.id}
                  href={`/collections/${cat.slug}`}
                  className="group relative isolate flex min-h-[210px] overflow-hidden rounded-[1.6rem] border border-white bg-brand-ink shadow-[0_18px_45px_-32px_rgba(23,33,58,.55)] transition duration-500 hover:-translate-y-1 hover:shadow-[0_24px_55px_-30px_rgba(23,33,58,.48)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 sm:min-h-[250px] sm:rounded-[1.9rem]"
                >
                  <Image
                    src={catImage}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 20vw"
                    className="z-0 object-cover transition duration-700 ease-out group-hover:scale-110"
                  />
                  <div aria-hidden="true" className="absolute inset-0 z-10 bg-gradient-to-t from-brand-ink/90 via-brand-ink/15 to-brand-ink/10 transition duration-500 group-hover:from-brand-ink/95" />
                  <span className="absolute left-3.5 top-3.5 z-20 rounded-full border border-white/35 bg-white/90 px-3 py-1.5 text-[0.62rem] font-extrabold uppercase tracking-[0.12em] text-brand-ink shadow-sm backdrop-blur sm:left-4 sm:top-4">
                    {cat.products_count} {cat.products_count === 1 ? 'item' : 'items'}
                  </span>
                  <div className="relative z-20 mt-auto flex w-full items-end justify-between gap-2 p-3.5 text-white sm:p-5">
                    <div className="min-w-0">
                      <h3 className="truncate font-heading text-lg font-bold tracking-tight !text-white sm:text-xl">{cat.name}</h3>
                      <span className="mt-1 block text-xs font-semibold text-white/75 transition-colors group-hover:text-white">Explore the aisle</span>
                    </div>
                    <span aria-hidden="true" className="mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/15 text-white backdrop-blur transition duration-300 group-hover:translate-x-0.5 group-hover:border-white group-hover:bg-white group-hover:text-primary sm:size-11">
                      <ArrowRight size={18} />
                    </span>
                  </div>
                </Link>
              )
            })}
          </SectionReveal>
        </div>
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
        <SectionReveal className="mx-auto mb-8 flex max-w-6xl items-end justify-between border-b border-border-theme pb-4">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-primary">Top Choice</span>
            <h2 className="text-xl md:text-2xl font-extrabold text-content-strong mt-1">Trending Products</h2>
          </div>
          <Link href="/collections" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </SectionReveal>

        <SectionReveal className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 md:grid-cols-4 md:gap-6">
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
        </SectionReveal>
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

        <SectionReveal className="mx-auto grid max-w-6xl grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
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
        </SectionReveal>
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

        <SectionReveal className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
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
        </SectionReveal>
      </section>
    </div>
  )
}
