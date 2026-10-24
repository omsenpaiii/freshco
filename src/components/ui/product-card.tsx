'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Check, Heart, ShoppingBag } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useStore } from '@/context/store-context'
import { Badge } from '@/components/ui/badge'
import { formatAUD } from '@/lib/store'
import type { ProductVariant } from '@/lib/catalog-types'

export interface ProductCardProps { id: number; name: string; slug: string; price: number; compare_at_price: number | null; images: string[]; is_featured?: boolean; is_trending?: boolean; category_name?: string; brand?: string; variants?: ProductVariant[] }

export default function ProductCard({ id, name, slug, price, compare_at_price, images, category_name = 'FreshCo pick', brand, variants = [] }: ProductCardProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useStore()
  const reduceMotion = useReducedMotion()
  const [added, setAdded] = useState(false)
  const wished = isInWishlist(id)
  const image = images?.[0] || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=500'
  const hoverImage = images?.[1] || image
  const hasHoverImage = hoverImage !== image
  const discount = compare_at_price && compare_at_price > price ? Math.round(((compare_at_price - price) / compare_at_price) * 100) : 0
  const hasOptions = variants.length > 1
  const defaultVariant = variants.find((variant) => variant.is_default) || variants[0]

  useEffect(() => {
    if (!added) return
    const timeout = window.setTimeout(() => setAdded(false), 1500)
    return () => window.clearTimeout(timeout)
  }, [added])

  return (
    <motion.article
      whileHover={reduceMotion ? undefined : { y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 27, mass: 0.7 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-[1.65rem] border border-border/80 bg-white shadow-[0_16px_44px_-34px_rgba(23,33,58,.48)] transition-[border-color,box-shadow] duration-300 hover:border-primary/25 hover:shadow-[0_24px_58px_-34px_rgba(41,101,241,.42)] sm:rounded-[1.9rem]"
    >
      <div className="relative">
        <Link href={`/products/${slug}`} aria-label={`View ${name}`} className="relative block aspect-[1/1.02] overflow-hidden bg-[radial-gradient(circle_at_50%_38%,#ffffff_0%,#f6f8ff_62%,#edf2ff_100%)]">
          <Image src={image} alt={name} fill className={`object-contain p-5 transition duration-700 ease-out sm:p-6 ${hasHoverImage ? 'group-hover:scale-[1.04] group-hover:opacity-0' : 'group-hover:scale-[1.055]'}`} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
          {hasHoverImage && <Image src={hoverImage} alt="" fill className="absolute inset-0 object-contain p-5 opacity-0 transition duration-700 ease-out group-hover:scale-[1.04] group-hover:opacity-100 sm:p-6" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />}
        </Link>
        <div className="absolute left-3.5 top-3.5 z-10 flex flex-col items-start gap-1.5 sm:left-4 sm:top-4">
          {discount > 0 && <Badge variant="destructive" className="rounded-full border border-white/25 bg-brand-red px-3 py-1.5 text-[10px] font-extrabold tracking-wide shadow-lg">SAVE {discount}%</Badge>}
        </div>
        <button
          type="button"
          aria-label={wished ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
          aria-pressed={wished}
          onClick={() => toggleWishlist(id)}
          className={`absolute right-3.5 top-3.5 z-10 flex size-11 items-center justify-center rounded-full border border-white/80 shadow-[0_8px_22px_-12px_rgba(23,33,58,.7)] backdrop-blur-md transition duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 sm:right-4 sm:top-4 ${wished ? 'bg-brand-red text-white' : 'bg-white/90 text-brand-ink hover:text-brand-red'}`}
        >
          <Heart size={19} fill={wished ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-4 sm:px-5 sm:pb-5 sm:pt-5">
        <span className="truncate text-[10px] font-extrabold uppercase tracking-[0.17em] text-primary">{brand || category_name}</span>
        <h3 className="mt-2 min-h-10 font-heading text-sm font-bold leading-5 text-brand-ink sm:text-base">
          <Link href={`/products/${slug}`} className="transition-colors hover:text-primary">{name}</Link>
        </h3>

        <div className="mt-auto pt-4">
          <div className="mb-3 flex min-h-7 items-baseline gap-2 border-t border-border/70 pt-3.5">
            <strong className="font-heading text-lg font-bold tracking-tight text-brand-ink sm:text-xl">{hasOptions ? 'From ' : ''}{formatAUD(price)}</strong>
            {compare_at_price && compare_at_price > price && <span className="text-xs font-semibold text-muted-foreground line-through">{formatAUD(compare_at_price)}</span>}
          </div>
          {hasOptions ? (
            <Link href={`/products/${slug}`} className="group/action inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-ink px-4 text-xs font-extrabold text-white shadow-sm transition duration-300 hover:bg-primary hover:shadow-[0_12px_28px_-14px_rgba(41,101,241,.8)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 sm:text-sm">
              Choose a size <ArrowRight size={16} className="transition-transform duration-300 group-hover/action:translate-x-1" />
            </Link>
          ) : (
            <button
              type="button"
              aria-label={added ? `${name} added to bag` : `Add ${name} to bag`}
              disabled={!defaultVariant}
              onClick={() => {
                if (!defaultVariant) return
                addToCart({ id, name, slug, image, variant: defaultVariant }, 1)
                setAdded(true)
              }}
              className={`group/action inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-4 text-xs font-extrabold text-white shadow-sm transition duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground sm:text-sm ${added ? 'bg-brand-green' : 'bg-primary hover:bg-brand-ink hover:shadow-[0_12px_28px_-14px_rgba(41,101,241,.8)]'}`}
            >
              {added ? <><Check size={17} /> Added to bag</> : <>Add to bag <ShoppingBag size={17} className="transition-transform duration-300 group-hover/action:-translate-y-0.5" /></>}
            </button>
          )}
        </div>
      </div>
    </motion.article>
  )
}
