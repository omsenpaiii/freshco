import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getCategories, getProducts, getBlogPosts } from '@/lib/db'
import ProductCard from '@/components/ui/product-card'
import HomeHeroClient from './home-hero-client'
import DealOfTheDayClient from './deal-of-the-day-client'
import { ArrowRight, Leaf, ShieldCheck, Heart, Truck, Sparkles } from 'lucide-react'

// Force Next.js to render page dynamically so it grabs latest products/DB state
export const revalidate = 0

export default async function Home() {
  const categories = await getCategories()
  const trendingProducts = await getProducts({ isTrending: true })
  const allProducts = await getProducts()
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
      <section className="w-full bg-[#f8f9fa] border-b border-border-theme py-8 px-4 md:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-4 bg-white p-5 rounded-xl border border-gray-100 shadow-2xs hover:shadow-sm transition">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Truck size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-secondary">Free Shipping</h4>
              <p className="text-xs text-gray-400 mt-0.5">On all orders over €50.00</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white p-5 rounded-xl border border-gray-100 shadow-2xs hover:shadow-sm transition">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Leaf size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-secondary">100% Organic</h4>
              <p className="text-xs text-gray-400 mt-0.5">Direct from local farms</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white p-5 rounded-xl border border-gray-100 shadow-2xs hover:shadow-sm transition">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-secondary">Secure Payments</h4>
              <p className="text-xs text-gray-400 mt-0.5">100% SSL protected checkout</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white p-5 rounded-xl border border-gray-100 shadow-2xs hover:shadow-sm transition">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Sparkles size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-secondary">Daily Deals</h4>
              <p className="text-xs text-gray-400 mt-0.5">Up to 40% off on fresh veggies</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Shop By Category */}
      <section className="w-full px-4 md:px-8 py-16 bg-white">
        <div className="max-w-6xl mx-auto text-center space-y-2 mb-10">
          <span className="text-xs uppercase font-bold tracking-widest text-primary">Discover Freshness</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-secondary">Shop By Category</h2>
          <div className="w-12 h-1 bg-primary mx-auto rounded-full mt-2" />
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4 justify-center">
          {featuredCategories.map((cat) => {
            const catImage = cat.image_url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=150'
            return (
              <Link 
                key={cat.id} 
                href={`/collections/${cat.slug}`}
                className="group flex flex-col items-center text-center gap-3 p-3 rounded-2xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition duration-300"
              >
                <div className="relative w-18 h-18 rounded-full overflow-hidden bg-gray-50 border border-gray-100 shadow-2xs group-hover:shadow-md transition duration-300">
                  <Image 
                    src={catImage} 
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-108 transition duration-500"
                  />
                </div>
                <h4 className="text-xs font-semibold text-secondary group-hover:text-primary transition line-clamp-1">
                  {cat.name}
                </h4>
              </Link>
            )
          })}
        </div>
      </section>

      {/* 4. Banner Promo Section */}
      <section className="w-full px-4 md:px-8 py-4 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative h-[200px] md:h-[250px] rounded-2xl overflow-hidden shadow-xs group cursor-pointer border border-gray-100">
            <Image 
              src="https://images.unsplash.com/photo-1610348725531-843dff163e2c?q=80&w=800&auto=format&fit=crop" 
              alt="Promo Banner 1"
              fill
              className="object-cover group-hover:scale-103 transition duration-700"
            />
            <div className="absolute inset-0 bg-black/20 flex flex-col justify-center items-start p-8 md:p-10">
              <span className="text-xs uppercase font-extrabold tracking-wider text-primary bg-white/95 px-3 py-1 rounded-full shadow-2xs">Best Offer</span>
              <h3 className="text-xl md:text-2xl font-bold text-white mt-3 leading-tight max-w-[200px]">Fresh Fruits & Vegetables</h3>
              <p className="text-xs text-white/90 mt-1.5 font-medium">Get €10.00 Off on orders above €80.00</p>
              <Link href="/collections" className="inline-block bg-primary hover:bg-[#d89311] text-white text-xs font-bold px-4 py-2 rounded-full mt-4 transition">
                Shop Fruits
              </Link>
            </div>
          </div>

          <div className="relative h-[200px] md:h-[250px] rounded-2xl overflow-hidden shadow-xs group cursor-pointer border border-gray-100">
            <Image 
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800&auto=format&fit=crop" 
              alt="Promo Banner 2"
              fill
              className="object-cover group-hover:scale-103 transition duration-700"
            />
            <div className="absolute inset-0 bg-black/20 flex flex-col justify-center items-start p-8 md:p-10">
              <span className="text-xs uppercase font-extrabold tracking-wider text-primary bg-white/95 px-3 py-1 rounded-full shadow-2xs">100% Fresh</span>
              <h3 className="text-xl md:text-2xl font-bold text-white mt-3 leading-tight max-w-[200px]">Healthy Organic Wines</h3>
              <p className="text-xs text-white/90 mt-1.5 font-medium">Naturally brewed wines from premium vineyards</p>
              <Link href="/collections/organic-wine" className="inline-block bg-primary hover:bg-[#d89311] text-white text-xs font-bold px-4 py-2 rounded-full mt-4 transition">
                Shop Wine
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Trending Products Grid */}
      <section className="w-full px-4 md:px-8 py-16 bg-white">
        <div className="max-w-6xl mx-auto flex items-end justify-between border-b border-border-theme pb-4 mb-8">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-primary">Top Choice</span>
            <h2 className="text-xl md:text-2xl font-extrabold text-secondary mt-1">Trending Products</h2>
          </div>
          <Link href="/collections" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
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
            />
          ))}
        </div>
      </section>

      {/* 6. Deal Of the Day (Countdown Timer) */}
      {featuredProducts.length > 0 && (
        <DealOfTheDayClient product={featuredProducts[0]} />
      )}

      {/* 7. Featured Products Tabbed Section */}
      <section className="w-full px-4 md:px-8 py-16 bg-white">
        <div className="max-w-6xl mx-auto text-center space-y-2 mb-10">
          <span className="text-xs uppercase font-bold tracking-widest text-primary">Our Selection</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-secondary">Our Fresh Products</h2>
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
            />
          ))}
        </div>
      </section>

      {/* 8. Testimonials Section */}
      <section className="w-full px-4 md:px-8 py-16 bg-[#f8f9fa] border-y border-border-theme">
        <div className="max-w-6xl mx-auto text-center space-y-2 mb-10">
          <span className="text-xs uppercase font-bold tracking-widest text-primary">Feedbacks</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-secondary">Our Customer Say</h2>
          <div className="w-12 h-1 bg-primary mx-auto rounded-full mt-2" />
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-2xs border border-gray-100 space-y-4">
            <div className="flex items-center gap-0.5 text-yellow-400">
              {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
            </div>
            <p className="text-xs leading-relaxed text-gray-500 italic">
              "Amazing quality of organic avocados and strawberries! They tasted incredibly fresh and were delivered on time. The packaging is fully biodegradable which is a massive plus. Highly recommend Vegist!"
            </p>
            <div>
              <h5 className="font-bold text-secondary text-sm">Tokenfaith</h5>
              <span className="text-[10px] text-gray-400 block">Verified Buyer</span>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-2xs border border-gray-100 space-y-4">
            <div className="flex items-center gap-0.5 text-yellow-400">
              {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
            </div>
            <p className="text-xs leading-relaxed text-gray-500 italic">
              "This checkout flow and cart drawer feels so fast. The fresh vegetables stay crisp since they are sourced locally. We ordered Baker's rack bagels as well and they were absolutely delicious!"
            </p>
            <div>
              <h5 className="font-bold text-secondary text-sm">Refine Digital</h5>
              <span className="text-[10px] text-gray-400 block">Loyal Customer</span>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Blog Section */}
      <section className="w-full px-4 md:px-8 py-16 bg-white">
        <div className="max-w-6xl mx-auto flex items-end justify-between border-b border-border-theme pb-4 mb-8">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest text-primary">Our Stories</span>
            <h2 className="text-xl md:text-2xl font-extrabold text-secondary mt-1">Recent Articles & News</h2>
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
                  src={post.image_url || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=400'} 
                  alt={post.title}
                  fill
                  className="object-cover group-hover:scale-103 transition duration-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold">
                  <span>By {post.author}</span>
                  <span>•</span>
                  <span>{new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <h3 className="text-sm font-bold text-secondary group-hover:text-primary transition leading-snug line-clamp-2 h-10">
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

// Inline Testimonial Star Helper
function Star({ size, fill }: { size: number, fill?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill={fill || "none"} 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className="lucide lucide-star"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
