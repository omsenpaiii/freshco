'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingBag, Sparkles } from 'lucide-react'
import { useStore } from '@/context/store-context'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatAUD } from '@/lib/store'
import type { ProductVariant } from '@/lib/catalog-types'

interface DealOfTheDayProps {
  product: {
    id: number
    name: string
    slug: string
    price: number
    compare_at_price: number | null
    images: string[]
    description: string
    variants: ProductVariant[]
  }
}

export default function DealOfTheDayClient({ product }: DealOfTheDayProps) {
  const { addToCart } = useStore()
  const variant = product.variants.find((item) => item.is_default) || product.variants[0]
  const hasOptions = product.variants.length > 1

  return (
    <section className="section-shell border-y border-border bg-brand-cream">
      <div className="site-container grid grid-cols-1 items-center gap-10 md:grid-cols-2">
        <div className="relative aspect-square max-h-[440px] overflow-hidden rounded-3xl border-8 border-white bg-white shadow-2xl">
          <Image src={product.images[0]} alt={product.name} fill className="object-contain p-10" sizes="(max-width: 768px) 100vw, 50vw" />
        </div>
        <div className="space-y-6 text-left">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary"><Sparkles size={18} /> Featured from the deli</div>
          <h2 className="text-2xl font-extrabold leading-tight text-content-strong md:text-3xl">{product.name}</h2>
          <p className="text-2xl font-bold text-primary">{hasOptions ? 'From ' : ''}{formatAUD(product.price)}</p>
          <p className="max-w-lg text-sm leading-7 text-muted-foreground">{product.description}</p>
          {hasOptions && <p className="text-xs font-semibold text-brand-ink">Available in {product.variants.map((item) => item.title).join(', ')}.</p>}
          <div className="flex gap-4 pt-2">
            {hasOptions ? (
              <Link href={`/products/${product.slug}`} className={cn(buttonVariants(), 'h-12 rounded-full px-7 text-xs font-extrabold uppercase tracking-wider')}>Choose options</Link>
            ) : (
              <Button disabled={!variant} onClick={() => variant && addToCart({ id: product.id, name: product.name, slug: product.slug, image: product.images[0] || '', variant }, 1)} className="h-12 rounded-full px-7 text-xs font-extrabold uppercase tracking-wider">Add to cart <ShoppingBag data-icon="inline-end" /></Button>
            )}
            <Link href={`/products/${product.slug}`} className={cn(buttonVariants({ variant: 'outline' }), 'h-12 rounded-full px-7 text-xs font-extrabold uppercase tracking-wider')}>Details</Link>
          </div>
        </div>
      </div>
    </section>
  )
}
