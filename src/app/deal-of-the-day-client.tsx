'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useStore } from '@/context/store-context'
import { ShoppingBag, Star, Flame } from 'lucide-react'

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
    <section className="w-full bg-[#fceecf]/30 border-y border-border-theme px-4 md:px-8 py-16">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        
        {/* Banner Spotlight Graphic */}
        <div className="relative aspect-video md:aspect-square max-h-[400px] rounded-2xl overflow-hidden shadow-xs border border-gray-150 bg-white">
          <Image 
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800"
            alt="Deal of the Day Banner"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/25 flex flex-col justify-end p-8 text-white text-left">
            <span className="text-xs uppercase font-extrabold tracking-widest text-primary bg-white/95 px-3 py-1 rounded-full inline-block w-fit mb-2">
              Limited Offer
            </span>
            <h3 className="text-xl md:text-2xl font-bold max-w-[280px]">Hot Organic Vegetable Deals of the Week</h3>
            <p className="text-xs text-gray-200 mt-1 font-medium">Flash sales refreshed daily at midnight</p>
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
              €{Number(product.price).toFixed(2)}
            </span>
            {product.compare_at_price && (
              <span className="text-sm text-gray-400 line-through">
                €{Number(product.compare_at_price).toFixed(2)}
              </span>
            )}
          </div>

          <p 
            className="text-xs text-gray-500 leading-relaxed line-clamp-3"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />

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
            <button 
              onClick={handleAddToCart}
              className="bg-primary hover:bg-[#d89311] text-white text-xs font-bold px-8 py-3 rounded-full flex items-center gap-2 transition cursor-pointer shadow-md uppercase tracking-wider"
            >
              Add To Cart <ShoppingBag size={15} />
            </button>
            <Link 
              href={`/products/${product.slug}`}
              className="border border-border-theme hover:bg-white hover:border-primary text-secondary hover:text-primary text-xs font-bold px-8 py-3 rounded-full transition inline-block uppercase tracking-wider"
            >
              Details
            </Link>
          </div>
        </div>

      </div>
    </section>
  )
}
