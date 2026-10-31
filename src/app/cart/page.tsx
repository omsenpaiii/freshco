'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useStore } from '@/context/store-context'
import { Trash2, Plus, Minus, ShoppingBag, ChevronRight, MapPin } from 'lucide-react'
import { COLLECTION, formatAUD } from '@/lib/store'

export default function CartPage() {
  const router = useRouter()
  const { cart, updateCartQuantity, removeFromCart } = useStore()
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const total = subtotal

  return (
    <div className="w-full bg-white px-4 md:px-8 py-10">
      <div className="max-w-6xl mx-auto text-left">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-content-muted mb-6 font-medium">
          <Link href="/" className="hover:text-primary transition">Home</Link>
          <ChevronRight size={12} />
          <span className="text-content-strong font-semibold">Shopping Cart</span>
        </div>

        <div className="border-b border-border-theme pb-4 mb-8">
          <h1 className="text-xl md:text-2xl font-extrabold text-content-strong">Your Cart</h1>
          <p className="text-sm text-content-muted mt-1">Review your order for collection from {COLLECTION.location}. Delivery is not available.</p>
        </div>

        {cart.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center gap-4 text-body border border-dashed border-border-theme rounded-2xl bg-gray-50 p-6">
            <ShoppingBag size={48} className="text-gray-300 stroke-[1.5]" />
            <div>
              <h3 className="font-semibold text-content-strong text-base">Your Cart is Empty</h3>
              <p className="text-xs text-content-muted mt-1">Add something from the deli catalog to your cart.</p>
            </div>
            <Link 
              href="/collections"
              className="bg-primary hover:bg-[#d89311] text-white text-xs font-bold py-2.5 px-6 rounded-full mt-2 transition uppercase tracking-wider"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            {/* Left Items Column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="border border-border-theme rounded-2xl overflow-hidden shadow-2xs bg-white">
                {/* Desktop Header */}
                <div className="hidden sm:grid grid-cols-12 gap-4 bg-gray-50 border-b border-border-theme p-4 text-[10px] uppercase font-bold text-content-muted">
                  <div className="col-span-6">Product Details</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-border-theme">
                  {cart.map((item) => (
                    <div key={`${item.product_id}:${item.variant_id}`} className="grid grid-cols-12 gap-4 p-4 items-center">
                      
                      {/* Details */}
                      <div className="col-span-12 sm:col-span-6 flex gap-4">
                        <div className="relative w-16 h-16 bg-gray-50 border border-gray-100 rounded overflow-hidden flex-shrink-0">
                          <Image 
                            src={item.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=200'}
                            alt={item.name}
                            fill
                            sizes="64px"
                            className="object-contain p-1"
                          />
                        </div>
                        <div className="flex flex-col justify-center">
                          <h3 className="text-xs md:text-sm font-semibold text-content-strong hover:text-primary transition line-clamp-2">
                            <Link href={`/products/${item.slug}`}>{item.name}</Link>
                          </h3>
                          <p className="mt-1 text-[10px] font-semibold text-muted-foreground">{item.variant_title} · {item.sku}</p>
                        </div>
                      </div>

                      {/* Price (Mobile label + val) */}
                      <div className="col-span-4 sm:col-span-2 text-left sm:text-center mt-2 sm:mt-0">
                        <span className="sm:hidden text-[9px] uppercase font-bold text-content-muted block mb-0.5">Price</span>
                        <span className="text-xs text-content-strong font-semibold">{formatAUD(item.price)}</span>
                      </div>

                      {/* Qty controls */}
                      <div className="col-span-5 sm:col-span-2 flex justify-start sm:justify-center mt-2 sm:mt-0">
                        <div className="flex items-center border border-border-theme rounded-full bg-gray-50 p-0.5">
                          <button 
                            onClick={() => updateCartQuantity(item.product_id, item.variant_id, item.quantity - 1)}
                            className="px-2 py-0.5 text-content-strong hover:text-primary transition cursor-pointer"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="px-1.5 text-xs font-semibold text-content-strong">{item.quantity}</span>
                          <button 
                            onClick={() => updateCartQuantity(item.product_id, item.variant_id, item.quantity + 1)}
                            className="px-2 py-0.5 text-content-strong hover:text-primary transition cursor-pointer"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="col-span-3 sm:col-span-2 text-right flex sm:flex-col justify-end items-center sm:items-end mt-2 sm:mt-0 gap-2 sm:gap-0.5">
                        <div className="sm:hidden text-[9px] uppercase font-bold text-content-muted">Total</div>
                        <span className="text-xs text-primary font-bold">{formatAUD(item.price * item.quantity)}</span>
                        <button 
                          onClick={() => removeFromCart(item.product_id, item.variant_id)}
                          className="text-content-muted hover:text-red-500 transition p-1 ml-2 sm:ml-0 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Summary Column */}
            <div className="space-y-6">
              
              <div className="border border-border-theme bg-brand-cloud rounded-2xl p-5 space-y-3">
                <h2 className="flex items-center gap-2 text-base font-bold text-content-strong"><MapPin size={20} className="text-primary" /> Click & Collect</h2>
                <p className="text-sm leading-6 text-content-muted">Collect from {COLLECTION.location}, {COLLECTION.address}. There is no collection fee.</p>
                <Link href="/pages/shipping-policy" className="inline-block text-sm font-bold text-primary underline underline-offset-4">Collection details</Link>
              </div>

              {/* Cart Totals */}
              <div className="border border-border-theme bg-gray-50 rounded-2xl p-6 space-y-4">
                <h2 className="text-sm font-bold text-content-strong border-b border-border-theme pb-3 uppercase tracking-wider">
                  Order Summary
                </h2>

                <div className="space-y-2.5 text-xs text-content-strong font-semibold">
                  <div className="flex justify-between">
                    <span className="text-content-muted">Cart Subtotal:</span>
                    <span>{formatAUD(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-content-muted">Click & Collect:</span>
                    <span>No collection fee</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground"><span>GST:</span><span>Included</span></div>
                </div>

                <div className="border-t border-border-theme pt-4 flex justify-between items-center font-bold text-content-strong">
                  <span className="text-sm">Total:</span>
                  <span className="text-lg text-primary">{formatAUD(total)}</span>
                </div>

                <button 
                  onClick={() => router.push('/checkout')}
                  className="w-full bg-primary hover:bg-[#d89311] text-white text-xs font-bold py-3.5 text-center rounded-full transition shadow-md uppercase tracking-wider block cursor-pointer"
                >
                  Proceed to Checkout
                </button>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  )
}
