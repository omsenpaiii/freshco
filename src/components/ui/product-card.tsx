'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useStore } from '@/context/store-context'
import { Heart, ShoppingBag, Star } from 'lucide-react'

export interface ProductCardProps {
  id: number
  name: string
  slug: string
  price: number
  compare_at_price: number | null
  images: string[]
  is_featured?: boolean
  is_trending?: boolean
  category_name?: string
}

export default function ProductCard({
  id,
  name,
  slug,
  price,
  compare_at_price,
  images,
  category_name = 'Organic'
}: ProductCardProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useStore()
  const isWishlisted = isInWishlist(id)

  const imageSrc = images?.[0] || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=300'
  const hoverImageSrc = images?.[1] || imageSrc // show second image on hover if available

  // Calculate discount percentage
  const discount = compare_at_price && compare_at_price > price
    ? Math.round(((compare_at_price - price) / compare_at_price) * 100)
    : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addToCart({
      id,
      name,
      slug,
      price,
      image: imageSrc
    }, 1)
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    toggleWishlist(id)
  }

  return (
    <div className="group bg-white rounded-xl border border-border-theme overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 relative flex flex-col h-full">
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
        {discount > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            -{discount}%
          </span>
        )}
        {id % 3 === 0 && (
          <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Hot
          </span>
        )}
      </div>

      {/* Image container */}
      <Link href={`/products/${slug}`} className="block relative aspect-square bg-gray-50 overflow-hidden">
        {/* Primary Image */}
        <Image 
          src={imageSrc} 
          alt={name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105 group-hover:opacity-0"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />
        {/* Hover Image */}
        <Image 
          src={hoverImageSrc} 
          alt={`${name} Hover`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105 opacity-0 group-hover:opacity-100 absolute inset-0"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />

        {/* Hover quick action overlay (Wishlist Toggle) */}
        <button 
          onClick={handleWishlist}
          className={`absolute top-3 right-3 p-2 rounded-full shadow-md z-20 transition cursor-pointer ${
            isWishlisted 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-white text-secondary hover:bg-primary hover:text-white'
          }`}
        >
          <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
        </button>
      </Link>

      {/* Details */}
      <div className="p-4 flex flex-col flex-grow justify-between gap-2.5">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
            {category_name}
          </span>
          <h3 className="text-xs md:text-sm font-semibold text-secondary hover:text-primary transition line-clamp-2 h-9">
            <Link href={`/products/${slug}`}>{name}</Link>
          </h3>
          
          {/* Rating stars mock */}
          <div className="flex items-center gap-0.5 text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={12} 
                fill={i < 4 + (id % 2) ? 'currentColor' : 'none'} 
                className={i < 4 + (id % 2) ? 'text-yellow-400' : 'text-gray-200'} 
              />
            ))}
            <span className="text-[10px] text-gray-400 ml-1">({10 + (id % 40)})</span>
          </div>
        </div>

        {/* Price and Add to Cart Button */}
        <div className="flex items-center justify-between mt-1 gap-2 border-t border-gray-50 pt-3">
          <div className="flex flex-col">
            {compare_at_price && compare_at_price > price && (
              <span className="text-xs text-gray-400 line-through">
                €{Number(compare_at_price).toFixed(2)}
              </span>
            )}
            <span className="text-sm font-bold text-primary">
              €{Number(price).toFixed(2)}
            </span>
          </div>

          <button 
            onClick={handleAddToCart}
            className="bg-primary hover:bg-[#d89311] text-white p-2 rounded-full transition flex items-center justify-center cursor-pointer shadow-xs hover:shadow-md"
            title="Add to Cart"
          >
            <ShoppingBag size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
