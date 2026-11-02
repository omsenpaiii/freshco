import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { getCategories, getProducts, getBlogPosts } from '@/lib/db'
import ProductCard from '@/components/ui/product-card'
import HomeHeroClient from './home-hero-client'
import HomeMotion from '@/components/home/home-motion'
import CollectionMoment from '@/components/home/collection-moment'

export const revalidate = 0

const collectionImages: Record<string, { src: string; alt: string }> = {
  cheese: { src: '/images/home/fresh-picks-cheese.webp', alt: 'Greek feta with herbs and olive oil' },
  deli: { src: '/images/home/fresh-picks-deli.webp', alt: 'An antipasti selection of olives, peppers, eggplant and artichokes' },
  frozen: { src: '/images/home/fresh-picks-frozen.webp', alt: 'Delicate flour-dusted filo pastries' },
  grocery: { src: '/images/home/fresh-picks-pantry.webp', alt: 'Olive oil and preserved vegetables in pantry jars' },
}

export default async function Home() {
  const [categories, products, blogPosts] = await Promise.all([getCategories(), getProducts(), getBlogPosts()])
  const featuredCategories = ['cheese', 'deli', 'frozen', 'grocery'].flatMap((slug) => {
    const category = categories.find((item) => item.slug === slug)
    return category ? [category] : []
  })
  return (
    <HomeMotion><div className="freshco-home">
      <HomeHeroClient />
      <section className="home-collections" aria-labelledby="home-collections-title">
        <div className="home-container">
          <h2 id="home-collections-title" className="home-section-title" data-reveal>A deli for every craving.</h2>
          <div className="home-category-grid">
            {featuredCategories.map((category, index) => (
              <Link key={category.id} href={`/collections/${category.slug}`} className="home-category-link" data-reveal data-reveal-index={index} data-reveal-direction={index < 2 ? -1 : 1}>
                <Image src={collectionImages[category.slug].src} alt={collectionImages[category.slug].alt} fill sizes="(max-width: 1024px) 50vw, 25vw" className="home-category-image" />
                <span className="home-category-shade" aria-hidden="true" />
                <span className="home-category-label">{category.name}</span>
                <span className="home-category-arrow" aria-hidden="true"><ArrowRight /></span>
              </Link>
            ))}
          </div>
          <div className="home-more-categories" data-reveal>
            <span>More to discover</span>
            {categories.filter(category => !featuredCategories.some(featured => featured.id === category.id) && (category.products_count || 0) > 0).map(category => (
              <Link key={category.id} href={`/collections/${category.slug}`}>{category.name}<ArrowRight aria-hidden="true" size={18} /></Link>
            ))}
          </div>
        </div>
      </section>
      <section className="home-products" aria-labelledby="home-products-title">
        <div className="home-container">
          <div className="home-section-heading" data-reveal>
            <h2 id="home-products-title" className="home-section-title">Our fresh products.</h2>
            <Link href="/collections" className="home-text-link">Shop all products <ArrowRight aria-hidden="true" /></Link>
          </div>
          <div className="home-product-grid">
            {products.slice(0, 8).map((product, index) => (
              <div key={product.id} data-reveal data-reveal-index={index % 4}><ProductCard id={product.id} name={product.name} slug={product.slug} price={product.price} compare_at_price={product.compare_at_price} images={product.images} category_name={product.categories?.name} brand={product.brand} image_license={product.image_license} variants={product.variants} /></div>
            ))}
          </div>
        </div>
      </section>
      <CollectionMoment />
      <section id="how-to-collect" className="home-collect-guide" aria-labelledby="home-collect-title">
        <div className="home-container">
          <div className="home-section-heading" data-reveal>
            <h2 id="home-collect-title" className="home-section-title">Your deli run.<br />A little easier.</h2>
            <p>Shop online. Collect at Northcote Plaza.<br />No delivery. Just your local favourites.</p>
          </div>
          <ol className="home-collect-steps">
            {[
              ['Pick your favourites', 'Explore the deli and add available items to your bag.'],
              ['Checkout online', 'Review your order and choose Click & Collect at checkout.'],
              ['Collect locally', 'Follow your order confirmation for collection from Unit GX04, Northcote Plaza.'],
            ].map(([title, description], index) => (
              <li key={title} data-reveal data-reveal-index={index}><span className="home-step-number">0{index + 1}</span><h3>{title}</h3><p>{description}</p></li>
            ))}
          </ol>
          <Link href="/pages/shipping-policy" className="home-text-link">Collection details <ArrowRight aria-hidden="true" /></Link>
        </div>
      </section>
      <section className="home-stories" aria-labelledby="home-stories-title">
        <div className="home-container">
          <div className="home-section-heading" data-reveal>
            <h2 id="home-stories-title" className="home-section-title">From the deli counter.</h2>
            <Link href="/blogs/news" className="home-text-link">Read our stories <ArrowRight aria-hidden="true" /></Link>
          </div>
          <div className="home-story-grid">
            {blogPosts.slice(0, 3).map((post, index) => (
              <Link key={post.id} href={`/blogs/news/${post.slug}`} className="home-story-link" data-reveal data-reveal-index={index}>
                <div className="home-story-image"><Image src={post.image_url || '/blogs/freshco-greek-cheese.jpg'} alt={post.title} fill sizes="(max-width: 767px) 100vw, 33vw" /></div>
                <p className="home-story-author">By {post.author}</p>
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <span className="home-story-read">Read story <ArrowRight aria-hidden="true" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div></HomeMotion>
  )
}
