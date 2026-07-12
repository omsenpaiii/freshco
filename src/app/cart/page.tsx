'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useStore } from '@/context/store-context'
import { Trash2, Plus, Minus, ShoppingBag, ChevronRight, Gift } from 'lucide-react'

export default function CartPage() {
  const router = useRouter()
  const { cart, updateCartQuantity, removeFromCart } = useStore()
  const [couponCode, setCouponCode] = useState('')
  const [discountAmount, setDiscountAmount] = useState(0)
  const [couponError, setCouponError] = useState('')
  const [couponSuccess, setCouponSuccess] = useState('')

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const shipping = subtotal >= 50.00 || subtotal === 0 ? 0.00 : 4.99
  const tax = subtotal * 0.07 // 7% VAT
  const total = subtotal - discountAmount + shipping + tax

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    if (couponCode.toUpperCase() === 'FRESH10') {
      const discount = subtotal * 0.10 // 10% off
      setDiscountAmount(discount)
      setCouponSuccess('10% discount applied successfully!')
      setCouponError('')
    } else {
      setCouponError('Invalid coupon code. Try FRESH10!')
      setCouponSuccess('')
    }
  }

  return (
    <div className="w-full bg-white px-4 md:px-8 py-10">
      <div className="max-w-6xl mx-auto text-left">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 font-medium">
          <Link href="/" className="hover:text-primary transition">Home</Link>
          <ChevronRight size={12} />
          <span className="text-secondary font-semibold">Shopping Cart</span>
        </div>

        <div className="border-b border-border-theme pb-4 mb-8">
          <h1 className="text-xl md:text-2xl font-extrabold text-secondary">Your Cart</h1>
          <p className="text-xs text-gray-400 mt-1">Review the fresh products in your cart before check out.</p>
        </div>

        {cart.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center gap-4 text-body border border-dashed border-border-theme rounded-2xl bg-gray-50 p-6">
            <ShoppingBag size={48} className="text-gray-300 stroke-[1.5]" />
            <div>
              <h3 className="font-semibold text-secondary text-base">Your Cart is Empty</h3>
              <p className="text-xs text-gray-400 mt-1">Add organic goods to your shopping cart.</p>
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
                <div className="hidden sm:grid grid-cols-12 gap-4 bg-gray-50 border-b border-border-theme p-4 text-[10px] uppercase font-bold text-gray-400">
                  <div className="col-span-6">Product Details</div>
                  <div className="col-span-2 text-center">Price</div>
                  <div className="col-span-2 text-center">Quantity</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-border-theme">
                  {cart.map((item) => (
                    <div key={item.product_id} className="grid grid-cols-12 gap-4 p-4 items-center">
                      
                      {/* Details */}
                      <div className="col-span-12 sm:col-span-6 flex gap-4">
                        <div className="relative w-16 h-16 bg-gray-50 border border-gray-100 rounded overflow-hidden flex-shrink-0">
                          <Image 
                            src={item.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=200'}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-col justify-center">
                          <h3 className="text-xs md:text-sm font-semibold text-secondary hover:text-primary transition line-clamp-2">
                            <Link href={`/products/${item.slug}`}>{item.name}</Link>
                          </h3>
                        </div>
                      </div>

                      {/* Price (Mobile label + val) */}
                      <div className="col-span-4 sm:col-span-2 text-left sm:text-center mt-2 sm:mt-0">
                        <span className="sm:hidden text-[9px] uppercase font-bold text-gray-400 block mb-0.5">Price</span>
                        <span className="text-xs text-secondary font-semibold">€{Number(item.price).toFixed(2)}</span>
                      </div>

                      {/* Qty controls */}
                      <div className="col-span-5 sm:col-span-2 flex justify-start sm:justify-center mt-2 sm:mt-0">
                        <div className="flex items-center border border-border-theme rounded-full bg-gray-50 p-0.5">
                          <button 
                            onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}
                            className="px-2 py-0.5 text-secondary hover:text-primary transition cursor-pointer"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="px-1.5 text-xs font-semibold text-secondary">{item.quantity}</span>
                          <button 
                            onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)}
                            className="px-2 py-0.5 text-secondary hover:text-primary transition cursor-pointer"
                          >
                            <Plus size={11} />
                          </button>
                        </div>
                      </div>

                      {/* Total */}
                      <div className="col-span-3 sm:col-span-2 text-right flex sm:flex-col justify-end items-center sm:items-end mt-2 sm:mt-0 gap-2 sm:gap-0.5">
                        <div className="sm:hidden text-[9px] uppercase font-bold text-gray-400">Total</div>
                        <span className="text-xs text-primary font-bold">€{(item.price * item.quantity).toFixed(2)}</span>
                        <button 
                          onClick={() => removeFromCart(item.product_id)}
                          className="text-gray-400 hover:text-red-500 transition p-1 ml-2 sm:ml-0 cursor-pointer"
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
              
              {/* Promo Coupon Form */}
              <div className="border border-border-theme bg-gray-50 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-secondary uppercase tracking-wider border-b border-border-theme pb-3">
                  <Gift size={16} className="text-primary" /> Apply Coupon
                </div>
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter code (e.g. FRESH10)" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="w-full bg-white border border-border-theme rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-primary text-secondary"
                  />
                  <button 
                    type="submit" 
                    className="bg-primary hover:bg-[#d89311] text-white text-[10px] font-bold px-4 py-2 rounded-lg transition uppercase cursor-pointer"
                  >
                    Apply
                  </button>
                </form>
                {couponError && <p className="text-[10px] text-red-500 font-semibold">{couponError}</p>}
                {couponSuccess && <p className="text-[10px] text-green-600 font-semibold">{couponSuccess}</p>}
              </div>

              {/* Cart Totals */}
              <div className="border border-border-theme bg-gray-50 rounded-2xl p-6 space-y-4">
                <h2 className="text-sm font-bold text-secondary border-b border-border-theme pb-3 uppercase tracking-wider">
                  Order Summary
                </h2>

                <div className="space-y-2.5 text-xs text-secondary font-semibold">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cart Subtotal:</span>
                    <span>€{subtotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount (10%):</span>
                      <span>-€{discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Shipping:</span>
                    <span>{shipping === 0 ? 'Free Shipping' : `€${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Estimated Taxes (7%):</span>
                    <span>€{tax.toFixed(2)}</span>
                  </div>
                </div>

                <div className="border-t border-border-theme pt-4 flex justify-between items-center font-bold text-secondary">
                  <span className="text-sm">Total:</span>
                  <span className="text-lg text-primary">€{total.toFixed(2)}</span>
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
