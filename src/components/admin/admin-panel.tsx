'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Package, Plus, RefreshCw, Save, Search, Shapes, Trash2, Upload } from 'lucide-react'
import { formatAUD } from '@/lib/store'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type Category = {
  id: number
  name: string
  slug: string
  description: string | null
  image_url: string | null
  products_count: number
}

type Product = {
  id: number
  name: string
  slug: string
  description: string | null
  price: number
  compare_at_price: number | null
  sku: string | null
  inventory_quantity: number
  is_featured: boolean
  is_trending: boolean
  images: string[]
  category_id: number | null
  categories?: { name: string; slug: string } | null
}

type CategoryFormState = {
  name: string
  slug: string
  description: string
  image_url: string
}

type ProductFormState = {
  name: string
  slug: string
  description: string
  price: string
  compare_at_price: string
  sku: string
  inventory_quantity: string
  category_id: string
  images: string
  is_featured: boolean
  is_trending: boolean
}

const emptyCategoryForm: CategoryFormState = {
  name: '',
  slug: '',
  description: '',
  image_url: '',
}

const emptyProductForm: ProductFormState = {
  name: '',
  slug: '',
  description: '',
  price: '',
  compare_at_price: '',
  sku: '',
  inventory_quantity: '0',
  category_id: '',
  images: '',
  is_featured: false,
  is_trending: false,
}

function categoryToForm(category: Category): CategoryFormState {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description || '',
    image_url: category.image_url || '',
  }
}

function productToForm(product: Product): ProductFormState {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description || '',
    price: String(product.price),
    compare_at_price:
      product.compare_at_price == null ? '' : String(product.compare_at_price),
    sku: product.sku || '',
    inventory_quantity: String(product.inventory_quantity),
    category_id: product.category_id == null ? '' : String(product.category_id),
    images: (product.images || []).join('\n'),
    is_featured: product.is_featured,
    is_trending: product.is_trending,
  }
}

async function uploadAsset(file: File, folder: 'products' | 'categories') {
  const body = new FormData()
  body.append('file', file)
  body.append('folder', folder)

  const response = await fetch('/api/admin/upload', {
    method: 'POST',
    body,
  })

  const json = await response.json()

  if (!response.ok) {
    throw new Error(json.error || 'Upload failed')
  }

  return json.url as string
}

export default function AdminPanel({
  initialCategories,
  initialProducts,
  adminEmail,
}: {
  initialCategories: Category[]
  initialProducts: Product[]
  adminEmail: string
}) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm)
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm)
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [categorySearch, setCategorySearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [feedback, setFeedback] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [uploadingField, setUploadingField] = useState<'category' | 'product' | null>(null)

  const filteredCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase()
    if (!query) return categories
    return categories.filter((category) => {
      return (
        category.name.toLowerCase().includes(query) ||
        category.slug.toLowerCase().includes(query)
      )
    })
  }, [categories, categorySearch])

  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase()
    if (!query) return products
    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.slug.toLowerCase().includes(query) ||
        (product.sku || '').toLowerCase().includes(query)
      )
    })
  }, [products, productSearch])

  async function submitCategory(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setFeedback('')

    const response = await fetch(
      editingCategoryId
        ? `/api/admin/categories/${editingCategoryId}`
        : '/api/admin/categories',
      {
        method: editingCategoryId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm),
      }
    )

    const json = await response.json()
    setBusy(false)

    if (!response.ok) {
      setError(json.error || 'Could not save category.')
      return
    }

    const nextCategory = json.category as Category
    setCategories((current) => {
      if (editingCategoryId) {
        return current.map((item) => (item.id === nextCategory.id ? nextCategory : item))
      }

      return [nextCategory, ...current]
    })

    setCategoryForm(emptyCategoryForm)
    setEditingCategoryId(null)
    setFeedback(editingCategoryId ? 'Category updated.' : 'Category created.')
    router.refresh()
  }

  async function submitProduct(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setFeedback('')

    const response = await fetch(
      editingProductId ? `/api/admin/products/${editingProductId}` : '/api/admin/products',
      {
        method: editingProductId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productForm),
      }
    )

    const json = await response.json()
    setBusy(false)

    if (!response.ok) {
      setError(json.error || 'Could not save product.')
      return
    }

    const nextProduct = json.product as Product
    setProducts((current) => {
      if (editingProductId) {
        return current.map((item) => (item.id === nextProduct.id ? nextProduct : item))
      }

      return [nextProduct, ...current]
    })

    setProductForm(emptyProductForm)
    setEditingProductId(null)
    setFeedback(editingProductId ? 'Product updated.' : 'Product created.')
    router.refresh()
  }

  async function deleteCategory(id: number) {
    if (!window.confirm('Delete this category? Products in it will lose their category link.')) {
      return
    }

    setBusy(true)
    setError('')
    setFeedback('')

    const response = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    const json = await response.json()
    setBusy(false)

    if (!response.ok) {
      setError(json.error || 'Could not delete category.')
      return
    }

    setCategories((current) => current.filter((item) => item.id !== id))
    setProducts((current) =>
      current.map((item) => (item.category_id === id ? { ...item, category_id: null, categories: null } : item))
    )
    setFeedback('Category deleted.')
    router.refresh()
  }

  async function deleteProduct(id: number) {
    if (!window.confirm('Delete this product?')) {
      return
    }

    setBusy(true)
    setError('')
    setFeedback('')

    const response = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    const json = await response.json()
    setBusy(false)

    if (!response.ok) {
      setError(json.error || 'Could not delete product.')
      return
    }

    setProducts((current) => current.filter((item) => item.id !== id))
    setFeedback('Product deleted.')
    router.refresh()
  }

  async function handleImageUpload(
    event: React.ChangeEvent<HTMLInputElement>,
    target: 'category' | 'product'
  ) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingField(target)
    setError('')
    setFeedback('')

    try {
      const url = await uploadAsset(file, target === 'category' ? 'categories' : 'products')
      if (target === 'category') {
        setCategoryForm((current) => ({ ...current, image_url: url }))
      } else {
        setProductForm((current) => ({
          ...current,
          images: current.images.trim() ? `${current.images.trim()}\n${url}` : url,
        }))
      }
      setFeedback('Image uploaded and linked.')
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Upload failed.')
    } finally {
      setUploadingField(null)
      event.target.value = ''
    }
  }

  return (
    <main className="bg-[linear-gradient(180deg,var(--fresh-cloud)_0%,#fff_18%,#fff8ec_100%)] py-10 md:py-14">
      <div className="site-container">
        <section className="rounded-[2rem] border border-primary/10 bg-white p-6 shadow-[0_26px_70px_-44px_rgba(41,101,241,0.38)] md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="red-stamp">FreshCo Admin</span>
              <h1 className="section-title max-w-3xl">Manage the live Melbourne storefront.</h1>
              <p className="section-copy max-w-3xl">
                Update product names, descriptions, pricing, inventory, category structure and
                image assets from one place. Signed in as {adminEmail}.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['Products', String(products.length)],
                ['Categories', String(categories.length)],
                ['Inventory units', String(products.reduce((sum, item) => sum + item.inventory_quantity, 0))],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[1.4rem] border border-primary/10 bg-brand-cloud/75 px-5 py-4">
                  <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-primary/80">{label}</p>
                  <p className="mt-2 font-heading text-2xl font-bold text-brand-ink">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-6 flex min-h-8 items-center gap-3 text-sm">
          {feedback ? <p className="font-semibold text-brand-green">{feedback}</p> : null}
          {error ? <p className="font-semibold text-brand-red">{error}</p> : null}
          {busy ? <p className="font-semibold text-primary">Saving changes…</p> : null}
        </div>

        <Tabs defaultValue="products" className="mt-6 space-y-6">
          <TabsList className="grid w-full grid-cols-2 rounded-full bg-white p-1 shadow-[0_14px_40px_-34px_rgba(23,33,58,.45)] md:w-[360px]">
            <TabsTrigger value="products" className="rounded-full">
              <Package className="size-4" />
              Products
            </TabsTrigger>
            <TabsTrigger value="categories" className="rounded-full">
              <Shapes className="size-4" />
              Categories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <section className="brand-card p-5 md:p-6">
                <div className="flex flex-col gap-4 border-b border-border/70 pb-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="font-heading text-2xl font-bold">Product catalogue</h2>
                    <p className="mt-1 text-sm text-content-muted">Edit existing lines or review inventory at a glance.</p>
                  </div>
                  <label className="relative block md:w-72">
                    <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-primary" />
                    <Input
                      value={productSearch}
                      onChange={(event) => setProductSearch(event.target.value)}
                      placeholder="Search products or SKU"
                      className="h-11 rounded-full pl-11"
                    />
                  </label>
                </div>

                <div className="mt-5 space-y-3">
                  {filteredProducts.map((product) => (
                    <motion.article
                      key={product.id}
                      layout
                      className="grid gap-4 rounded-[1.5rem] border border-border/80 bg-white p-4 shadow-[0_14px_32px_-30px_rgba(23,33,58,.45)] md:grid-cols-[92px_1fr_auto]"
                    >
                      <div className="relative h-24 overflow-hidden rounded-[1.2rem] bg-brand-cloud">
                        <Image
                          src={product.images?.[0] || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=300'}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="92px"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-heading text-xl font-bold text-brand-ink">{product.name}</h3>
                          {product.is_featured ? <span className="rounded-full bg-brand-amber px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand-ink">Featured</span> : null}
                          {product.is_trending ? <span className="rounded-full bg-brand-red/10 px-2 py-1 text-[10px] font-extrabold uppercase tracking-[0.14em] text-brand-red">Trending</span> : null}
                        </div>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary/80">
                          {product.categories?.name || 'Uncategorized'}
                        </p>
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-content-muted">
                          {(product.description || '').replace(/<[^>]+>/g, ' ')}
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-content-muted">
                          <span>{formatAUD(product.price)}</span>
                          <span>Inventory {product.inventory_quantity}</span>
                          <span>SKU {product.sku || 'Not set'}</span>
                        </div>
                      </div>
                      <div className="flex flex-row gap-2 md:flex-col">
                        <Button
                          variant="outline"
                          className="rounded-full"
                          onClick={() => {
                            setEditingProductId(product.id)
                            setProductForm(productToForm(product))
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                        >
                          <Save className="size-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-full text-brand-red hover:text-brand-red"
                          onClick={() => deleteProduct(product.id)}
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </Button>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </section>

              <section className="brand-card p-5 md:p-6">
                <div className="flex items-center justify-between border-b border-border/70 pb-5">
                  <div>
                    <h2 className="font-heading text-2xl font-bold">
                      {editingProductId ? 'Edit product' : 'Create product'}
                    </h2>
                    <p className="mt-1 text-sm text-content-muted">
                      Add new products, refresh photos, update descriptions and manage stock.
                    </p>
                  </div>
                  {editingProductId ? (
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        setEditingProductId(null)
                        setProductForm(emptyProductForm)
                      }}
                    >
                      <RefreshCw className="size-4" />
                      Reset
                    </Button>
                  ) : null}
                </div>

                <form onSubmit={submitProduct} className="mt-5 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-xs font-bold text-brand-ink">
                      Product name
                      <Input value={productForm.name} onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))} className="mt-2 h-11" required />
                    </label>
                    <label className="text-xs font-bold text-brand-ink">
                      Slug
                      <Input value={productForm.slug} onChange={(event) => setProductForm((current) => ({ ...current, slug: event.target.value }))} className="mt-2 h-11" required />
                    </label>
                  </div>

                  <label className="block text-xs font-bold text-brand-ink">
                    Description
                    <textarea value={productForm.description} onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))} rows={7} className="mt-2 w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-xs font-bold text-brand-ink">
                      Price (AUD)
                      <Input type="number" step="0.01" min="0" value={productForm.price} onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))} className="mt-2 h-11" required />
                    </label>
                    <label className="text-xs font-bold text-brand-ink">
                      Compare-at price
                      <Input type="number" step="0.01" min="0" value={productForm.compare_at_price} onChange={(event) => setProductForm((current) => ({ ...current, compare_at_price: event.target.value }))} className="mt-2 h-11" />
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="text-xs font-bold text-brand-ink">
                      SKU
                      <Input value={productForm.sku} onChange={(event) => setProductForm((current) => ({ ...current, sku: event.target.value }))} className="mt-2 h-11" />
                    </label>
                    <label className="text-xs font-bold text-brand-ink">
                      Inventory
                      <Input type="number" min="0" value={productForm.inventory_quantity} onChange={(event) => setProductForm((current) => ({ ...current, inventory_quantity: event.target.value }))} className="mt-2 h-11" required />
                    </label>
                    <label className="text-xs font-bold text-brand-ink">
                      Category
                      <select value={productForm.category_id} onChange={(event) => setProductForm((current) => ({ ...current, category_id: event.target.value }))} className="mt-2 h-11 w-full rounded-xl border border-input bg-white px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                        <option value="">No category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-xs font-bold text-brand-ink">
                      Product images
                      <textarea value={productForm.images} onChange={(event) => setProductForm((current) => ({ ...current, images: event.target.value }))} rows={5} placeholder="Paste one URL per line" className="mt-2 w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                    </label>
                    <div className="rounded-[1.5rem] border border-border/80 bg-brand-cloud/45 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary/80">Image upload</p>
                      <p className="mt-2 text-sm leading-6 text-content-muted">Upload to Supabase Storage and append the public image URL automatically.</p>
                      <label className="mt-4 inline-flex">
                        <input type="file" accept="image/*" className="hidden" onChange={(event) => handleImageUpload(event, 'product')} />
                        <span className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-white">
                          <Upload className="size-4" />
                          {uploadingField === 'product' ? 'Uploading…' : 'Upload product image'}
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-brand-ink">
                      <input type="checkbox" checked={productForm.is_featured} onChange={(event) => setProductForm((current) => ({ ...current, is_featured: event.target.checked }))} />
                      Featured
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm font-semibold text-brand-ink">
                      <input type="checkbox" checked={productForm.is_trending} onChange={(event) => setProductForm((current) => ({ ...current, is_trending: event.target.checked }))} />
                      Trending
                    </label>
                  </div>

                  <Button type="submit" className="h-11 rounded-full px-6" disabled={busy}>
                    <Plus className="size-4" />
                    {editingProductId ? 'Save product changes' : 'Create product'}
                  </Button>
                </form>
              </section>
            </div>
          </TabsContent>

          <TabsContent value="categories">
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="brand-card p-5 md:p-6">
                <div className="flex flex-col gap-4 border-b border-border/70 pb-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="font-heading text-2xl font-bold">Categories</h2>
                    <p className="mt-1 text-sm text-content-muted">Rename aisles, update artwork and keep collection counts tidy.</p>
                  </div>
                  <label className="relative block md:w-72">
                    <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-primary" />
                    <Input
                      value={categorySearch}
                      onChange={(event) => setCategorySearch(event.target.value)}
                      placeholder="Search categories"
                      className="h-11 rounded-full pl-11"
                    />
                  </label>
                </div>

                <div className="mt-5 space-y-3">
                  {filteredCategories.map((category) => (
                    <motion.article
                      key={category.id}
                      layout
                      className="grid gap-4 rounded-[1.5rem] border border-border/80 bg-white p-4 shadow-[0_14px_32px_-30px_rgba(23,33,58,.45)] md:grid-cols-[88px_1fr_auto]"
                    >
                      <div className="relative h-20 overflow-hidden rounded-[1.15rem] bg-brand-cloud">
                        {category.image_url ? (
                          <Image src={category.image_url} alt={category.name} fill className="object-cover" sizes="88px" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-primary">
                            <Shapes className="size-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-heading text-xl font-bold text-brand-ink">{category.name}</h3>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary/80">{category.slug}</p>
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-content-muted">
                          {category.description || 'No category description yet.'}
                        </p>
                        <p className="mt-3 text-sm font-semibold text-content-muted">
                          {category.products_count} products
                        </p>
                      </div>
                      <div className="flex flex-row gap-2 md:flex-col">
                        <Button
                          variant="outline"
                          className="rounded-full"
                          onClick={() => {
                            setEditingCategoryId(category.id)
                            setCategoryForm(categoryToForm(category))
                            window.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                        >
                          <Save className="size-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          className="rounded-full text-brand-red hover:text-brand-red"
                          onClick={() => deleteCategory(category.id)}
                        >
                          <Trash2 className="size-4" />
                          Delete
                        </Button>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </section>

              <section className="brand-card p-5 md:p-6">
                <div className="flex items-center justify-between border-b border-border/70 pb-5">
                  <div>
                    <h2 className="font-heading text-2xl font-bold">
                      {editingCategoryId ? 'Edit category' : 'Create category'}
                    </h2>
                    <p className="mt-1 text-sm text-content-muted">Add new aisles or refresh how existing ones appear across the storefront.</p>
                  </div>
                  {editingCategoryId ? (
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={() => {
                        setEditingCategoryId(null)
                        setCategoryForm(emptyCategoryForm)
                      }}
                    >
                      <RefreshCw className="size-4" />
                      Reset
                    </Button>
                  ) : null}
                </div>

                <form onSubmit={submitCategory} className="mt-5 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-xs font-bold text-brand-ink">
                      Category name
                      <Input value={categoryForm.name} onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))} className="mt-2 h-11" required />
                    </label>
                    <label className="text-xs font-bold text-brand-ink">
                      Slug
                      <Input value={categoryForm.slug} onChange={(event) => setCategoryForm((current) => ({ ...current, slug: event.target.value }))} className="mt-2 h-11" required />
                    </label>
                  </div>

                  <label className="block text-xs font-bold text-brand-ink">
                    Description
                    <textarea value={categoryForm.description} onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))} rows={6} className="mt-2 w-full rounded-2xl border border-input bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  </label>

                  <label className="block text-xs font-bold text-brand-ink">
                    Category image URL
                    <Input value={categoryForm.image_url} onChange={(event) => setCategoryForm((current) => ({ ...current, image_url: event.target.value }))} className="mt-2 h-11" />
                  </label>

                  <div className="rounded-[1.5rem] border border-border/80 bg-brand-cloud/45 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary/80">Image upload</p>
                    <p className="mt-2 text-sm leading-6 text-content-muted">Upload new category artwork to Supabase Storage and fill the image field automatically.</p>
                    <label className="mt-4 inline-flex">
                      <input type="file" accept="image/*" className="hidden" onChange={(event) => handleImageUpload(event, 'category')} />
                      <span className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-white">
                        <Upload className="size-4" />
                        {uploadingField === 'category' ? 'Uploading…' : 'Upload category image'}
                      </span>
                    </label>
                  </div>

                  <Button type="submit" className="h-11 rounded-full px-6" disabled={busy}>
                    <Plus className="size-4" />
                    {editingCategoryId ? 'Save category changes' : 'Create category'}
                  </Button>
                </form>
              </section>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}

