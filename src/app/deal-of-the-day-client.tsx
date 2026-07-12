'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useStore } from '@/context/store-context'
import { ShoppingBag, Star, Flame } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { formatAUD } from '@/lib/store'

interface DealOfTheDayProps {
  product: {
    id: number
    name: string
    slug: string
    price: number
    compare_at_price: number | null
    images: string[]
    description: string
  }
}

export default function DealOfTheDayClient({ product }: DealOfTheDayProps) {
  const { addToCart } = useStore()
  
  // Setup Countdown Timer (24h from mount or fixed remaining hours)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 18,
    minutes: 42,
    seconds: 9
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 }
        } else {
          clearInterval(interval)
          return prev
        }
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.images?.[0] || ''
    }, 1)
  }

  // Inventory progress calculations
  const totalQty = 150
  const soldQty = 98
  const pctSold = Math.round((soldQty / totalQty) * 100)

  return (
    <section className="section-shell border-y border-border bg-brand-cream">
      <div className="site-container grid grid-cols-1 items-center gap-10 md:grid-cols-2">
        
        {/* Banner Spotlight Graphic */}
        <div className="relative aspect-video max-h-[440px] overflow-hidden rounded-3xl border-8 border-white bg-white shadow-2xl md:aspect-square">
          <Image 
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800"
            alt="Deal of the Day Banner"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-brand-ink/90 via-brand-ink/25 to-transparent p-8 text-left text-white">
            <span className="text-xs uppercase font-extrabold tracking-widest text-primary bg-white/95 px-3 py-1 rounded-full inline-block w-fit mb-2">
              Limited Offer
            </span>
            <h3 className="max-w-[310px] text-2xl font-bold text-white md:text-3xl">Today’s brightest pick, at a kinder price.</h3>
            <p className="mt-2 text-xs font-medium text-white/75">A limited market special while this batch lasts.</p>
          </div>
        </div>

        {/* Product Details & Countdown Spotlight */}
        <div className="space-y-6 text-left">
          <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
            <Flame size={18} className="fill-current text-primary animate-pulse" /> Deal of the Day!
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-secondary leading-tight">
            {product.name}
          </h2>

          {/* Rating stars mock */}
          <div className="flex items-center gap-0.5 text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={15} fill={i < 4 ? 'currentColor' : 'none'} />
            ))}
            <span className="text-xs text-gray-400 ml-2">({50 + (product.id % 12)} Reviews)</span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-primary">
              {formatAUD(product.price)}
            </span>
            {product.compare_at_price && (
              <span className="text-sm text-gray-400 line-through">
                {formatAUD(product.compare_at_price)}
              </span>
            )}
          </div>

          <p className="max-w-lg text-sm leading-7 text-muted-foreground">Freshly selected, carefully packed and ready for your next meal. Add today’s market special to your basket before this batch sells through.</p>

          {/* Countdown Clock Displays */}
          <div className="grid grid-cols-4 gap-3 max-w-[320px]">
            <div className="bg-white border border-border-theme p-3 rounded-xl text-center shadow-2xs">
              <span className="block text-xl font-bold text-secondary">{timeLeft.days}</span>
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Days</span>
            </div>
            <div className="bg-white border border-border-theme p-3 rounded-xl text-center shadow-2xs">
              <span className="block text-xl font-bold text-secondary">{timeLeft.hours}</span>
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Hrs</span>
            </div>
            <div className="bg-white border border-border-theme p-3 rounded-xl text-center shadow-2xs">
              <span className="block text-xl font-bold text-secondary">{timeLeft.minutes}</span>
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Mins</span>
            </div>
            <div className="bg-white border border-border-theme p-3 rounded-xl text-center shadow-2xs">
              <span className="block text-xl font-bold text-secondary">{timeLeft.seconds}</span>
              <span className="text-[10px] text-gray-400 uppercase font-semibold">Secs</span>
            </div>
          </div>

          {/* Inventory bar */}
          <div className="space-y-2 max-w-md">
            <div className="flex justify-between text-xs font-semibold text-secondary">
              <span>Hurry Up! Only {totalQty - soldQty} items left in stock!</span>
              <span>{pctSold}% Sold</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-1000"
                style={{ width: `${pctSold}%` }}
              />
            </div>
          </div>

          <div className="pt-2 flex gap-4">
            <Button
              onClick={handleAddToCart}
              className="h-12 rounded-full px-7 text-xs font-extrabold uppercase tracking-wider"
            >
              Add To Cart <ShoppingBag data-icon="inline-end" />
            </Button>
            <Link 
              href={`/products/${product.slug}`}
              className={cn(buttonVariants({ variant: 'outline' }), 'h-12 rounded-full px-7 text-xs font-extrabold uppercase tracking-wider')}
            >
              Details
            </Link>
          </div>
        </div>

      </div>
    </section>
  )
}
