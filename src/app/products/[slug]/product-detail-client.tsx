'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useStore } from '@/context/store-context'
import { 
  Heart, ShoppingBag, Plus, Minus, Star, Truck, Check, RefreshCw 
} from 'lucide-react'
import { formatAUD } from '@/lib/store'

interface ProductDetailClientProps {
  product: {
    id: number
    name: string
    slug: string
    price: number
    compare_at_price: number | null
    images: string[]
    description: string
    categories?: { name: string; slug: string } | null
  }
}

interface Review {
  id: number
  name: string
  rating: number
  title: string
  comment: string
  date: string
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { addToCart, toggleWishlist, isInWishlist } = useStore()
  const isWishlisted = isInWishlist(product.id)

  const [activeImage, setActiveImage] = useState(
    product.images?.[0] || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=600'
  )
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'shipping'>('description')
  const shortDescription = product.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 220)

  // Review Form & List Local State
  const [reviews, setReviews] = useState<Review[]>([
    {
      id: 1,
      name: "John S.",
      rating: 5,
      title: "Extremely fresh and delicious!",
      comment: "We order these weekly and they arrive in perfect shape. Very clean and fresh tasting.",
      date: "07/10/2026"
    },
    {
      id: 2,
      name: "Mariam A.",
      rating: 4,
      title: "Highly recommended organic quality",
      comment: "Taste is amazing, though the delivery took a bit longer than last time. Overall very satisfied.",
      date: "07/08/2026"
    }
  ])
  const [newReview, setNewReview] = useState({ name: '', title: '', comment: '', rating: 5 })
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  const handleQuantityChange = (val: number) => {
    if (val >= 1) setQuantity(val)
  }

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.images?.[0] || ''
    }, quantity)
  }

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newReview.name.trim() && newReview.comment.trim()) {
      const reviewObj = {
        id: reviews.length + 1,
        name: newReview.name,
        rating: newReview.rating,
        title: newReview.title || "Review",
        comment: newReview.comment,
        date: new Date().toLocaleDateString('en-US')
      }
      setReviews(prev => [reviewObj, ...prev])
      setNewReview({ name: '', title: '', comment: '', rating: 5 })
      setReviewSubmitted(true)
      setTimeout(() => setReviewSubmitted(false), 3000)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-10 rounded-3xl border border-border bg-white p-5 text-left shadow-[0_28px_80px_-55px_rgba(23,33,58,.6)] md:grid-cols-2 md:p-9">
      
      {/* 1. Left Gallery Column */}
      <div className="space-y-4">
        {/* Main Image Spotlight */}
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-brand-cloud ring-1 ring-border">
          <Image 
            src={activeImage}
            alt={product.name}
            fill
            className="object-cover transition-all duration-300"
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>

        {/* Thumbnail strip */}
        {product.images && product.images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {product.images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(img)}
                aria-label={`View ${product.name} image ${idx + 1}`}
                aria-pressed={activeImage === img}
                className={`relative w-20 h-20 bg-gray-50 border rounded-xl overflow-hidden flex-shrink-0 cursor-pointer transition ${
                  activeImage === img ? 'border-primary ring-2 ring-primary/20' : 'border-border-theme hover:border-primary'
                }`}
              >
                <Image 
                  src={img}
                  alt={`${product.name} Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. Right Detail Column */}
      <div className="space-y-6">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-primary block mb-1.5">
            {product.categories?.name || 'Organic'}
          </span>
          <h1 className="text-4xl font-bold leading-[1.05] text-brand-ink md:text-5xl">
            {product.name}
          </h1>
          
          {/* Star review header mock */}
          <div className="flex items-center gap-0.5 text-yellow-400 mt-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={15} fill={i < 4 ? 'currentColor' : 'none'} />
            ))}
            <span className="text-xs text-gray-400 ml-2">({reviews.length} Customer Reviews)</span>
          </div>
        </div>

        {/* Price Tag */}
        <div className="flex items-baseline gap-3 pb-4 border-b border-border-theme">
          <span className="text-2xl font-bold text-primary">
            {formatAUD(product.price)}
          </span>
          {product.compare_at_price && (
            <span className="text-sm text-gray-400 line-through">
              {formatAUD(product.compare_at_price)}
            </span>
          )}
          <span className="text-xs bg-green-50 text-green-600 font-bold px-2.5 py-1 rounded-full ml-2 flex items-center gap-1 border border-green-100">
            <Check size={12} /> In Stock
          </span>
        </div>

        {/* Short description */}
        <p className="text-sm leading-7 text-muted-foreground">{shortDescription}{shortDescription.length >= 220 ? '…' : ''}</p>

        {/* Quantity and Actions Row */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center border border-border-theme rounded-full bg-gray-50 p-1">
              <button 
                onClick={() => handleQuantityChange(quantity - 1)}
                aria-label="Decrease quantity"
                className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:text-primary transition hover:bg-white cursor-pointer shadow-2xs"
              >
                <Minus size={13} />
              </button>
              <input 
                type="number" 
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                className="w-12 text-center text-xs font-semibold text-secondary focus:outline-none bg-transparent"
              />
              <button 
                onClick={() => handleQuantityChange(quantity + 1)}
                aria-label="Increase quantity"
                className="w-8 h-8 rounded-full flex items-center justify-center text-secondary hover:text-primary transition hover:bg-white cursor-pointer shadow-2xs"
              >
                <Plus size={13} />
              </button>
            </div>

            <button 
              onClick={handleAddToCart}
              className="bg-primary hover:bg-[#d89311] text-white font-bold text-xs px-8 py-3.5 rounded-full flex items-center gap-2 transition cursor-pointer shadow-md uppercase tracking-wider"
            >
              Add To Cart <ShoppingBag size={16} />
            </button>

            <button 
              onClick={() => toggleWishlist(product.id)}
              aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
              aria-pressed={isWishlisted}
              className={`p-3 rounded-full border transition cursor-pointer ${
                isWishlisted 
                  ? 'bg-red-500 border-red-500 text-white hover:bg-red-600' 
                  : 'border-border-theme hover:border-primary text-secondary hover:text-primary'
              }`}
            >
              <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Brand Perks bullet row */}
        <div className="pt-6 border-t border-border-theme grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-secondary">
          <div className="flex items-center gap-2">
            <Truck size={16} className="text-primary" /> Free local delivery on orders over A$50.00
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className="text-primary" /> Easy 14-day hassle free returns
          </div>
        </div>
      </div>

      {/* 3. Below the fold Tabs panel */}
      <div className="mt-12 overflow-hidden rounded-3xl border border-border bg-white md:col-span-2">
        {/* Tab Headers */}
        <div className="flex border-b border-border-theme bg-[#f8f9fa] text-xs font-bold uppercase tracking-wider">
          <button 
            onClick={() => setActiveTab('description')}
            role="tab"
            aria-selected={activeTab === 'description'}
            className={`py-4 px-6 border-r border-border-theme cursor-pointer transition ${
              activeTab === 'description' ? 'bg-white text-primary border-b-2 border-b-primary' : 'text-secondary hover:bg-gray-100'
            }`}
          >
            Description
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            role="tab"
            aria-selected={activeTab === 'reviews'}
            className={`py-4 px-6 border-r border-border-theme cursor-pointer transition ${
              activeTab === 'reviews' ? 'bg-white text-primary border-b-2 border-b-primary' : 'text-secondary hover:bg-gray-100'
            }`}
          >
            Reviews ({reviews.length})
          </button>
          <button 
            onClick={() => setActiveTab('shipping')}
            role="tab"
            aria-selected={activeTab === 'shipping'}
            className={`py-4 px-6 cursor-pointer transition ${
              activeTab === 'shipping' ? 'bg-white text-primary border-b-2 border-b-primary' : 'text-secondary hover:bg-gray-100'
            }`}
          >
            Shipping Info
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="p-6 md:p-8 text-xs leading-relaxed text-gray-500">
          
          {/* Tab: Description */}
          {activeTab === 'description' && (
            <div 
              className="space-y-4"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}

          {/* Tab: Shipping Info */}
          {activeTab === 'shipping' && (
            <div className="space-y-4 text-secondary">
              <h4 className="font-bold text-sm">Shipping Policy</h4>
              <p>We pack and ship out all fresh vegetables daily from our local farms. Typical delivery schedules are as follows:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-500">
                <li>Local orders placed before 10 AM qualify for same-day evening delivery.</li>
                <li>Standard delivery within the county takes 1 to 2 business days.</li>
                <li>Fresh produce is transported in insulated cold storage cases to preserve nutritional content and maintain shelf life.</li>
              </ul>
            </div>
          )}

          {/* Tab: Reviews (Judge.me Mockup) */}
          {activeTab === 'reviews' && (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row gap-8 justify-between border-b border-border-theme pb-8">
                <div>
                  <h4 className="font-bold text-secondary text-sm">Customer Reviews</h4>
                  <div className="flex items-center gap-1 text-yellow-400 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={15} fill={i < 4 ? 'currentColor' : 'none'} />
                    ))}
                    <span className="text-xs text-gray-400 ml-2">Based on {reviews.length} reviews</span>
                  </div>
                </div>
                
                <div className="text-center font-bold">
                  {reviewSubmitted && (
                    <div className="text-green-600 bg-green-50 border border-green-100 px-4 py-2 rounded-xl text-xs mb-3 animate-pulse">
                      ✓ Thank you! Review submitted successfully.
                    </div>
                  )}
                </div>
              </div>

              {/* Add a review form */}
              <form onSubmit={handleReviewSubmit} className="bg-[#f8f9fa] p-5 rounded-xl border border-border-theme space-y-4">
                <h5 className="font-bold text-secondary text-xs uppercase tracking-wider">Write a review</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-gray-400">Display Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Smith" 
                      value={newReview.name}
                      onChange={(e) => setNewReview(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="w-full bg-white border border-border-theme rounded-lg py-2 px-4 focus:outline-none focus:border-primary text-secondary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] uppercase font-bold text-gray-400">Review Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Excellent service" 
                      value={newReview.title}
                      onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-white border border-border-theme rounded-lg py-2 px-4 focus:outline-none focus:border-primary text-secondary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Rating</label>
                  <div className="flex gap-1 text-yellow-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                        className="cursor-pointer hover:scale-110 transition"
                      >
                        <Star size={18} fill={star <= newReview.rating ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Review Content</label>
                  <textarea 
                    placeholder="Tell us what you liked or disliked about this product..." 
                    rows={4}
                    value={newReview.comment}
                    onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                    required
                    className="w-full bg-white border border-border-theme rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary text-secondary"
                  />
                </div>

                <button 
                  type="submit" 
                  className="bg-primary hover:bg-[#d89311] text-white font-bold text-[10px] px-6 py-2.5 rounded-full uppercase tracking-wider cursor-pointer transition shadow-xs hover:shadow-md"
                >
                  Submit Review
                </button>
              </form>

              {/* Reviews List */}
              <div className="space-y-6">
                {reviews.map((rev) => (
                  <div key={rev.id} className="border-b border-border-theme pb-5 space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <h5 className="font-bold text-secondary text-xs">{rev.name}</h5>
                        <div className="flex items-center gap-0.5 text-yellow-400 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={11} fill={i < rev.rating ? 'currentColor' : 'none'} />
                          ))}
                        </div>
                      </div>
                      <span className="text-[10px] text-gray-400 font-semibold">{rev.date}</span>
                    </div>
                    <div>
                      <h6 className="font-semibold text-secondary text-xs">{rev.title}</h6>
                      <p className="text-xs text-gray-500 mt-1">{rev.comment}</p>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>
      </div>

    </div>
  )
}
