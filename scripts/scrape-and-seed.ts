import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'

// Helper to manually read .env.local
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return {}
  const content = fs.readFileSync(envPath, 'utf8')
  const env: Record<string, string> = {}
  content.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const index = trimmed.indexOf('=')
    if (index === -1) return
    const key = trimmed.substring(0, index).trim()
    const val = trimmed.substring(index + 1).trim()
    env[key] = val
  })
  return env
}

const env = loadEnv()
const SUPABASE_URL = env['NEXT_PUBLIC_SUPABASE_URL'] || process.env['NEXT_PUBLIC_SUPABASE_URL']
const SUPABASE_SERVICE_KEY = env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SUPABASE_SERVICE_ROLE_KEY']

const isConfigured = 
  SUPABASE_URL && 
  SUPABASE_SERVICE_KEY && 
  !SUPABASE_URL.includes('your-project') &&
  !SUPABASE_SERVICE_KEY.includes('... ')

// Initialize Supabase Client if configured
const supabase = isConfigured ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY) : null

// Helper to fetch JSON from URL
async function fetchJson<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    https.get(url, { headers }, (res) => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try {
          resolve(JSON.parse(data) as T)
        } catch (e) {
          reject(new Error(`Failed to parse JSON from ${url}: ${e}`))
        }
      })
    }).on('error', err => reject(err))
  })
}

// Helper to download image as Buffer
async function downloadImage(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks: Buffer[] = []
      res.on('data', chunk => chunks.push(Buffer.from(chunk)))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', err => reject(err))
    })
  })
}

async function main() {
  console.log("=== STARTING SCRAPING FLOW ===")
  
  if (!isConfigured) {
    console.log("⚠️ Supabase credentials not fully configured in .env.local.")
    console.log("We will scrape the Shopify store data and save it locally as JSON files in the scratch directory.")
  }

  try {
    // 1. Fetch Collections
    console.log("Fetching collections...")
    const collectionsRes = await fetchJson<{ collections: any[] }>("https://vegina-store.myshopify.com/collections.json")
    const rawCollections = collectionsRes.collections || []
    console.log(`Found ${rawCollections.length} collections.`)

    // 2. Fetch all products in each collection to map categories
    const categories: any[] = []
    const productsMap: Map<number, any> = new Map()
    const productCategoryMapping: Record<number, number> = {} // product_id -> category_id

    for (const coll of rawCollections) {
      console.log(`Processing collection: ${coll.title} (${coll.handle})`)
      categories.push({
        id: coll.id,
        name: coll.title,
        slug: coll.handle,
        description: coll.description || '',
        image_url: coll.image?.src || '',
        products_count: coll.products_count || 0
      })

      // Fetch products inside this collection
      try {
        const prodUrl = `https://vegina-store.myshopify.com/collections/${coll.handle}/products.json?limit=250`
        const colProds = await fetchJson<{ products: any[] }>(prodUrl)
        const productsInColl = colProds.products || []
        
        for (const p of productsInColl) {
          productCategoryMapping[p.id] = coll.id
          if (!productsMap.has(p.id)) {
            productsMap.set(p.id, p)
          }
        }
      } catch (err) {
        console.log(`⚠️ Could not fetch products for collection ${coll.title}: ${(err as Error).message}`)
      }
    }

    // 3. Fallback: Fetch general products feed to fill any remaining products
    console.log("Fetching general products...")
    const generalProds = await fetchJson<{ products: any[] }>("https://vegina-store.myshopify.com/products.json?limit=250")
    const allProds = generalProds.products || []
    for (const p of allProds) {
      if (!productsMap.has(p.id)) {
        productsMap.set(p.id, p)
      }
    }

    console.log(`Total unique products gathered: ${productsMap.size}`)

    // Clean products list
    const products: any[] = Array.from(productsMap.values()).map(p => {
      const price = parseFloat(p.variants?.[0]?.price || '0.00')
      const comparePrice = p.variants?.[0]?.compare_at_price ? parseFloat(p.variants[0].compare_at_price) : null
      
      return {
        id: p.id,
        name: p.title,
        slug: p.handle,
        description: p.body_html || '',
        price: price,
        compare_at_price: comparePrice,
        sku: p.variants?.[0]?.sku || '',
        inventory_quantity: p.variants?.[0]?.inventory_quantity || 100,
        is_featured: p.tags?.includes('featured') || Math.random() > 0.8,
        is_trending: p.tags?.includes('trending') || Math.random() > 0.8,
        images: p.images?.map((img: any) => img.src) || [],
        category_id: productCategoryMapping[p.id] || null
      }
    })

    // Create scratch directories for local caching if needed
    const scratchDir = path.join(process.cwd(), '.gemini', 'antigravity', 'scratch')
    if (!fs.existsSync(scratchDir)) {
      fs.mkdirSync(scratchDir, { recursive: true })
    }

    // Save JSON data locally as cache
    fs.writeFileSync(path.join(scratchDir, 'scraped_categories.json'), JSON.stringify(categories, null, 2))
    fs.writeFileSync(path.join(scratchDir, 'scraped_products.json'), JSON.stringify(products, null, 2))
    console.log("✅ Successfully saved scraped metadata to scratch directory.")

    // 4. Seeding Supabase
    if (supabase) {
      console.log("Seeding to Supabase...")

      // Ensure storage bucket exists
      console.log("Ensuring Supabase Storage bucket 'store-images' exists...")
      try {
        const { data: buckets, error: getBucketsError } = await supabase.storage.listBuckets()
        if (getBucketsError) throw getBucketsError
        
        const bucketExists = buckets?.some(b => b.name === 'store-images')
        if (!bucketExists) {
          const { error: bucketError } = await supabase.storage.createBucket('store-images', {
            public: true,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
            fileSizeLimit: 5242880 // 5MB
          })
          if (bucketError) throw bucketError
          console.log("Created public storage bucket 'store-images'")
        } else {
          console.log("Storage bucket 'store-images' already exists")
        }
      } catch (err) {
        console.log(`⚠️ Error creating bucket (might be due to permission policies): ${(err as Error).message}`)
      }

      // Seeding Categories
      console.log("Seeding categories...")
      for (const cat of categories) {
        let hostedImageUrl = cat.image_url
        if (cat.image_url) {
          try {
            console.log(`Downloading category image: ${cat.name}`)
            const buffer = await downloadImage(cat.image_url)
            const filename = `categories/${cat.slug}${path.extname(cat.image_url.split('?')[0]) || '.jpg'}`
            
            const { error: uploadError } = await supabase.storage
              .from('store-images')
              .upload(filename, buffer, { contentType: 'image/jpeg', upsert: true })

            if (!uploadError) {
              const { data: publicUrlData } = supabase.storage.from('store-images').getPublicUrl(filename)
              hostedImageUrl = publicUrlData.publicUrl
            }
          } catch (e) {
            console.log(`⚠️ Failed to self-host image for category ${cat.name}: ${(e as Error).message}`)
          }
        }

        const { error: catError } = await supabase.from('categories').upsert({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          image_url: hostedImageUrl,
          products_count: cat.products_count
        })

        if (catError) {
          console.log(`Error seeding category ${cat.name}: ${catError.message}`)
        }
      }

      // Seeding Products
      console.log("Seeding products...")
      for (const prod of products) {
        const hostedImages: string[] = []
        for (let i = 0; i < prod.images.length; i++) {
          const imgUrl = prod.images[i]
          let finalUrl = imgUrl
          try {
            console.log(`Downloading product image ${i+1}/${prod.images.length} for ${prod.name}`)
            const buffer = await downloadImage(imgUrl)
            const ext = path.extname(imgUrl.split('?')[0]) || '.jpg'
            const filename = `products/${prod.slug}-${i}${ext}`

            const { error: uploadError } = await supabase.storage
              .from('store-images')
              .upload(filename, buffer, { contentType: 'image/jpeg', upsert: true })

            if (!uploadError) {
              const { data: publicUrlData } = supabase.storage.from('store-images').getPublicUrl(filename)
              finalUrl = publicUrlData.publicUrl
            }
          } catch (e) {
            console.log(`⚠️ Failed to self-host product image for ${prod.name}: ${(e as Error).message}`)
          }
          hostedImages.push(finalUrl)
        }

        const { error: prodError } = await supabase.from('products').upsert({
          id: prod.id,
          name: prod.name,
          slug: prod.slug,
          description: prod.description,
          price: prod.price,
          compare_at_price: prod.compare_at_price,
          sku: prod.sku,
          inventory_quantity: prod.inventory_quantity,
          is_featured: prod.is_featured,
          is_trending: prod.is_trending,
          images: hostedImages,
          category_id: prod.category_id
        })

        if (prodError) {
          console.log(`Error seeding product ${prod.name}: ${prodError.message}`)
        }
      }

      // Seed mock blogs
      console.log("Seeding mock blog posts...")
      const mockBlogs = [
        {
          title: "All time fresh, every time healthy organic food recipes",
          slug: "all-time-fresh-every-time-healthy",
          excerpt: "Organic foods are grown without artificial chemicals. Here are some quick organic recipes to boost your health.",
          content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent ac leo ac ante convallis pretium. Mauris finibus diam metus, sit amet fringilla enim luctus nec. Vestibulum viverra dictum metus, in facilisis arcu eleifend facilisis. Organic vegetables are rich in antioxidants, which reduce the risk of chronic diseases.",
          image_url: "https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=800&auto=format&fit=crop"
        },
        {
          title: "Fresh organics brand and picnic ideas for summer holidays",
          slug: "fresh-organics-brand-and-picnic",
          excerpt: "Planning a picnic? Here are some summer ideas using organic fresh goods that will surprise your family.",
          content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam elementum, leo a sodales eleifend, magna tortor euismod sem, in rhoncus lorem ex rhoncus lectus. Prepare sandwiches with organic avocado, tomatoes, spinach, and fresh orange juice.",
          image_url: "https://images.unsplash.com/photo-1530124560072-aab9a51df75a?q=80&w=800&auto=format&fit=crop"
        },
        {
          title: "Green onion, knife and fresh salad placed on table",
          slug: "green-onion-knife-and-salad-placed",
          excerpt: "Learn how to prepare the perfect chef's salad using green onions and organic leafy greens.",
          content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec ut eleifend lorem, et pulvinar ante. Proin lacinia ac dui sed eleifend. Green onions add a sharp taste and are loaded with vitamin K.",
          image_url: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800&auto=format&fit=crop"
        }
      ]

      for (const blog of mockBlogs) {
        const { error: blogError } = await supabase.from('blog_posts').upsert(blog, { onConflict: 'slug' })
        if (blogError) {
          console.log(`Error seeding blog ${blog.title}: ${blogError.message}`)
        }
      }

      console.log("🎉 Seeding completed successfully!")
    } else {
      console.log("\n💡 Next Steps for Supabase Seeding:")
      console.log("1. Go to your Supabase Project dashboard (https://supabase.com)")
      console.log("2. Open SQL Editor and execute the schema located in supabase/migrations/20260712000000_initial_schema.sql")
      console.log("3. Update NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY inside .env.local")
      console.log("4. Run `npx tsx scripts/scrape-and-seed.ts` again to seed all scraped products & collections.")
    }
  } catch (err) {
    console.error("Fatal error during scraping/seeding:", err)
  }
}

main()
