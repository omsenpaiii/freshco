'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useStore } from '@/context/store-context'
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react'

export default function CartDrawer() {
  const router = useRouter()
  const { cart, isCartOpen, setCartOpen, updateCartQuantity, removeFromCart } = useStore()

  if (!isCartOpen) return null

  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)

  const handleProceedCheckout = () => {
    setCartOpen(false)
    router.push('/checkout')
  }

  const handleViewCart = () => {
    setCartOpen(false)
    router.push('/cart')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setCartOpen(false)}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex">
        {/* Drawer content */}
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-slide-in">
          {/* Header */}
          <div className="px-6 py-5 border-b border-border-theme flex items-center justify-between">
            <div className="flex items-center gap-2 text-secondary">
              <ShoppingBag size={20} className="text-primary" />
              <h2 className="text-lg font-bold">Shopping Cart ({cartCount})</h2>
            </div>
            <button 
              onClick={() => setCartOpen(false)}
              className="text-secondary hover:text-primary transition p-1 cursor-pointer"
            >
              <X size={22} />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-grow overflow-y-auto p-6 space-y-5">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-4 text-body">
                <ShoppingBag size={64} className="text-gray-200 stroke-[1.5]" />
                <div>
                  <h3 className="font-semibold text-secondary text-base">Your cart is empty</h3>
                  <p className="text-xs text-gray-400 mt-1">Add organic products to start healthy shopping.</p>
                </div>
                <button 
                  onClick={() => setCartOpen(false)}
                  className="bg-primary hover:bg-[#d89311] text-white text-xs font-bold py-2.5 px-6 rounded-full mt-2 transition cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.product_id} className="flex gap-4 pb-5 border-b border-border-theme">
                  {/* Image */}
                  <div className="relative w-20 h-20 bg-gray-50 border border-gray-100 rounded overflow-hidden flex-shrink-0">
                    <Image 
                      src={item.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=200'}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-secondary leading-tight hover:text-primary transition line-clamp-2">
                        <Link href={`/products/${item.slug}`} onClick={() => setCartOpen(false)}>
                          {item.name}
                        </Link>
                      </h4>
                      <p className="text-xs text-primary font-bold mt-1">
                        €{Number(item.price).toFixed(2)}
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-border-theme rounded-full bg-gray-50">
                        <button 
                          onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}
                          className="px-2.5 py-1 text-secondary hover:text-primary transition cursor-pointer"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-2 text-xs font-semibold text-secondary">{item.quantity}</span>
                        <button 
                          onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)}
                          className="px-2.5 py-1 text-secondary hover:text-primary transition cursor-pointer"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button 
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-gray-400 hover:text-red-500 transition p-1 cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Billing Details */}
          {cart.length > 0 && (
            <div className="border-t border-border-theme p-6 bg-gray-50 space-y-4">
              <div className="flex justify-between items-center text-sm font-semibold text-secondary">
                <span>Subtotal:</span>
                <span className="text-base text-primary font-bold">€{cartTotal.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-gray-400">Taxes and shipping calculated at checkout.</p>
              
              <div className="grid grid-cols-2 gap-3.5 pt-2">
                <button 
                  onClick={handleViewCart}
                  className="w-full bg-white hover:bg-gray-100 text-secondary border border-border-theme font-bold py-3 text-center text-xs rounded-full transition cursor-pointer uppercase tracking-wider"
                >
                  View Cart
                </button>
                <button 
                  onClick={handleProceedCheckout}
                  className="w-full bg-primary hover:bg-[#d89311] text-white font-bold py-3 text-center text-xs rounded-full transition cursor-pointer uppercase tracking-wider"
                >
                  Checkout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
