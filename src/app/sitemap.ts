import type { MetadataRoute } from 'next'
import { getCategories, getProducts, getBlogPosts } from '@/lib/db'
import { SITE_URL } from '@/lib/seo'

// Refresh from published catalogue data, rather than freezing the import at build time.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products, posts] = await Promise.all([getCategories(), getProducts(), getBlogPosts()])
  const paths = ['/', '/collections', '/blogs/news', '/pages/about-us', '/pages/contact-us', '/pages/faqs', '/pages/shipping-policy', '/pages/return-policy', '/pages/privacy-policy', '/pages/terms-conditions', '/pages/payment-policy']
  return [
    ...paths.map(path => ({ url: `${SITE_URL}${path}`, changeFrequency: 'weekly' as const })),
    ...categories.map(category => ({ url: `${SITE_URL}/collections/${encodeURIComponent(category.slug)}`, changeFrequency: 'daily' as const })),
    ...products.filter(product => product.status === 'published').map(product => ({ url: `${SITE_URL}/products/${encodeURIComponent(product.slug)}`, changeFrequency: 'weekly' as const })),
    ...posts.map(post => ({ url: `${SITE_URL}/blogs/news/${encodeURIComponent(post.slug)}`, ...(post.published_at ? { lastModified: post.published_at } : {}) })),
  ]
}
