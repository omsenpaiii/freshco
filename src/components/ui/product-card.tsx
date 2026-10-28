'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Check, Heart, ImageOff, ShoppingBag } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useStore } from '@/context/store-context'
import { Badge } from '@/components/ui/badge'
import { formatAUD } from '@/lib/store'
import type { ProductVariant } from '@/lib/catalog-types'

export interface ProductCardProps { id: number; name: string; slug: string; price: number; compare_at_price: number | null; images: string[]; is_featured?: boolean; is_trending?: boolean; category_name?: string; brand?: string; image_license?: string | null; variants?: ProductVariant[] }

export default function ProductCard({ id, name, slug, price, compare_at_price, images, category_name = 'FreshCo pick', brand, image_license, variants = [] }: ProductCardProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useStore()
  const reduceMotion = useReducedMotion()
  const [added, setAdded] = useState(false)
  const wished = isInWishlist(id)
  const image = images?.find((candidate) => candidate?.trim()) || ''
  const hoverImage = images?.[1] || image
  // Keep source-backed packaging fully visible. Editorial/generic food photos
  // use the panel edge-to-edge; the source license is the reliable signal
  // because both kinds of image may be stored under a product-specific key.
  const isIllustrativeImage = /pexels license|generic illustrative/i.test(image_license || '') || /\/generic-\d{8}\.jpg(?:[?#]|$)/i.test(image)
  const imageFitClass = isIllustrativeImage ? 'object-cover' : 'object-contain'
  const imageFrameClass = isIllustrativeImage ? 'bg-brand-cloud' : 'bg-white'
  // Keep packaging fully inside the frame so labels and edges are not clipped.
  // The soft blurred layer behind it fills the panel without enlarging the pack.
  const imageScaleClass = isIllustrativeImage
    ? 'group-hover:scale-[1.04]'
    : slug === 'artichoke-each'
      ? 'scale-[1.1] group-hover:scale-[1.14]'
      : 'scale-[1.04] group-hover:scale-[1.08]'
  const [imageFailed, setImageFailed] = useState(false)
  const hasImage = Boolean(image && !imageFailed)
  const hasHoverImage = hasImage && hoverImage !== image
  const discount = compare_at_price && compare_at_price > price ? Math.round(((compare_at_price - price) / compare_at_price) * 100) : 0
  const hasOptions = variants.length > 1
  const defaultVariant = variants.find((variant) => variant.is_default) || variants[0]
  const pricePending = !Number.isFinite(price) || price <= 0
  const [imageLoaded, setImageLoaded] = useState(false)

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
        <Link href={`/products/${slug}`} aria-label={`View ${name}`} className={`relative block aspect-square overflow-hidden ${imageFrameClass}`}>
          {hasImage && image ? (
            <>
              {!isIllustrativeImage && (
                <Image
                  src={image}
                  alt=""
                  fill
                  aria-hidden="true"
                  className="pointer-events-none z-0 scale-110 object-cover opacity-20 blur-2xl"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              )}
              {!imageLoaded && (
                <span aria-hidden="true" className="absolute inset-0 z-[5] bg-[linear-gradient(110deg,#f3f5fa_8%,#ffffff_18%,#f3f5fa_33%)] bg-[length:200%_100%] motion-safe:animate-pulse" />
              )}
              <Image
                src={image}
                alt={name}
                fill
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageFailed(true)}
                className={`z-10 ${imageFitClass} object-center transition duration-700 ease-out ${imageScaleClass} ${imageLoaded ? 'opacity-100' : 'opacity-0'} ${hasHoverImage ? 'group-hover:opacity-0' : ''}`}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              {hasHoverImage && hoverImage && <Image src={hoverImage} alt="" fill onError={() => setImageFailed(true)} className={`absolute inset-0 z-20 ${imageFitClass} object-center opacity-0 transition duration-700 ease-out ${imageScaleClass} group-hover:opacity-100`} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />}
            </>
          ) : (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center text-content-muted">
              <span className="flex size-14 items-center justify-center rounded-2xl border border-white/80 bg-white/75 text-primary shadow-sm"><ImageOff size={23} strokeWidth={1.7} /></span>
              <span className="text-[10px] font-extrabold uppercase tracking-[0.14em]">Product photo coming soon</span>
            </span>
          )}
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
            <strong className="font-heading text-lg font-bold tracking-tight text-brand-ink sm:text-xl">{pricePending ? 'Price pending' : `${hasOptions ? 'From ' : ''}${formatAUD(price)}`}</strong>
            {!pricePending && compare_at_price && compare_at_price > price && <span className="text-xs font-semibold text-muted-foreground line-through">{formatAUD(compare_at_price)}</span>}
          </div>
          {pricePending ? (
            <button type="button" disabled className="inline-flex min-h-12 w-full cursor-not-allowed items-center justify-center rounded-full bg-muted px-4 text-xs font-extrabold text-muted-foreground sm:text-sm">
              Price pending
            </button>
          ) : hasOptions ? (
            <Link href={`/products/${slug}`} className="group/action inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-ink px-4 text-xs font-extrabold text-white shadow-sm transition duration-300 hover:bg-primary hover:shadow-[0_12px_28px_-14px_rgba(41,101,241,.8)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 sm:text-sm">
              Choose options <ArrowRight size={16} className="transition-transform duration-300 group-hover/action:translate-x-1" />
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
