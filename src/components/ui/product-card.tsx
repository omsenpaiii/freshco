'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingBag, Star } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useStore } from '@/context/store-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export interface ProductCardProps { id: number; name: string; slug: string; price: number; compare_at_price: number | null; images: string[]; is_featured?: boolean; is_trending?: boolean; category_name?: string }

export default function ProductCard({ id, name, slug, price, compare_at_price, images, category_name = 'FreshCo pick' }: ProductCardProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useStore()
  const reduceMotion = useReducedMotion()
  const wished = isInWishlist(id)
  const image = images?.[0] || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=500'
  const hoverImage = images?.[1] || image
  const discount = compare_at_price && compare_at_price > price ? Math.round(((compare_at_price - price) / compare_at_price) * 100) : 0

  return (
    <motion.article whileHover={reduceMotion ? undefined : { y: -5 }} transition={{ type: 'spring', stiffness: 320, damping: 26 }} className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/80 bg-white shadow-[0_15px_45px_-36px_rgba(23,33,58,.45)] transition-shadow hover:shadow-[0_24px_70px_-38px_rgba(41,101,241,.48)]">
      <div className="absolute left-3 top-3 z-20 flex flex-col items-start gap-1.5">{discount > 0 && <Badge variant="destructive" className="rounded-full bg-brand-red px-2.5 py-1 text-[10px] font-extrabold">SAVE {discount}%</Badge>}{id % 3 === 0 && <Badge className="rounded-full bg-brand-amber text-[10px] font-extrabold text-brand-ink">MARKET PICK</Badge>}</div>
      <Button variant="outline" size="icon-lg" aria-label={wished ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`} aria-pressed={wished} onClick={() => toggleWishlist(id)} className={`absolute right-3 top-3 z-20 rounded-full border-white/80 shadow-lg ${wished ? 'bg-brand-red text-white hover:bg-brand-red/90' : 'bg-white/90 text-brand-ink hover:text-brand-red'}`}><Heart fill={wished ? 'currentColor' : 'none'} /></Button>
      <Link href={`/products/${slug}`} className="relative block aspect-[1/1.03] overflow-hidden bg-brand-cloud">
        <Image src={image} alt={name} fill className="object-cover transition duration-500 group-hover:scale-[1.035] group-hover:opacity-0" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
        <Image src={hoverImage} alt="" fill className="absolute inset-0 object-cover opacity-0 transition duration-500 group-hover:scale-[1.035] group-hover:opacity-100" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" />
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-primary">{category_name}</span>
        <h3 className="mt-2 min-h-10 font-heading text-sm font-bold leading-5 text-brand-ink sm:text-base"><Link href={`/products/${slug}`} className="hover:text-primary">{name}</Link></h3>
        <div className="mt-2 flex items-center gap-1 text-brand-amber" aria-label="Rated 4 out of 5"><Star className="size-3.5" fill="currentColor" /><span className="text-[11px] font-bold text-muted-foreground">4.{id % 10} · {10 + (id % 40)} reviews</span></div>
        <div className="mt-4 flex items-end justify-between border-t border-border/70 pt-4"><div>{compare_at_price && compare_at_price > price && <span className="mr-2 text-xs text-muted-foreground line-through">€{Number(compare_at_price).toFixed(2)}</span>}<strong className="font-heading text-lg text-primary">€{Number(price).toFixed(2)}</strong></div><Button size="icon-lg" aria-label={`Add ${name} to cart`} onClick={() => addToCart({ id, name, slug, price, image }, 1)} className="rounded-full shadow-lg shadow-blue-200"><ShoppingBag /></Button></div>
      </div>
    </motion.article>
  )
}
