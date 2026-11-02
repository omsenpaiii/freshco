import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { getCategories, getProducts, getBlogPosts } from '@/lib/db'
import ProductCard from '@/components/ui/product-card'
import HomeHeroClient from './home-hero-client'

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
    <div className="freshco-home">
      <HomeHeroClient />
      <section className="home-collections" aria-labelledby="home-collections-title">
        <div className="home-container">
          <h2 id="home-collections-title" className="home-section-title">A deli for every craving.</h2>
          <div className="home-category-grid">
            {featuredCategories.map((category) => (
              <Link key={category.id} href={`/collections/${category.slug}`} className="home-category-link">
                <Image src={collectionImages[category.slug].src} alt={collectionImages[category.slug].alt} fill sizes="(max-width: 1024px) 50vw, 25vw" className="home-category-image" />
                <span className="home-category-shade" aria-hidden="true" />
                <span className="home-category-label">{category.name}</span>
                <span className="home-category-arrow" aria-hidden="true"><ArrowRight /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="home-products" aria-labelledby="home-products-title">
        <div className="home-container">
          <div className="home-section-heading">
            <h2 id="home-products-title" className="home-section-title">Our fresh products.</h2>
            <Link href="/collections" className="home-text-link">Shop all products <ArrowRight aria-hidden="true" /></Link>
          </div>
          <div className="home-product-grid">
            {products.slice(0, 8).map((product) => (
              <ProductCard key={product.id} id={product.id} name={product.name} slug={product.slug} price={product.price} compare_at_price={product.compare_at_price} images={product.images} category_name={product.categories?.name} brand={product.brand} image_license={product.image_license} variants={product.variants} />
            ))}
          </div>
        </div>
      </section>
      <section className="home-stories" aria-labelledby="home-stories-title">
        <div className="home-container">
          <div className="home-section-heading">
            <h2 id="home-stories-title" className="home-section-title">From the deli counter.</h2>
            <Link href="/blogs/news" className="home-text-link">Read our stories <ArrowRight aria-hidden="true" /></Link>
          </div>
          <div className="home-story-grid">
            {blogPosts.slice(0, 3).map((post) => (
              <Link key={post.id} href={`/blogs/news/${post.slug}`} className="home-story-link">
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
    </div>
  )
}
