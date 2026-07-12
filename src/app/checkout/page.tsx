'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useStore } from '@/context/store-context'
import { createClientComponentClient } from '@/lib/supabase-client'
import { CheckCircle, CreditCard, User, Shield } from 'lucide-react'
import confetti from 'canvas-confetti'
import { formatAUD, getDeliveryFee } from '@/lib/store'

export default function CheckoutPage() {
  const { cart, clearCart, user } = useStore()
  const supabase = createClientComponentClient()

  // Form State
  const [form, setForm] = useState({
    name: '',
    email: user?.email || '',
    address: '',
    city: '',
    state: '',
    zip: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [orderId, setOrderId] = useState('')

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
  const shipping = getDeliveryFee(subtotal)
  const total = subtotal + shipping

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate validation & payment gateway lag
    await new Promise(resolve => setTimeout(resolve, 1500))

    const mockOrderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000)
    setOrderId(mockOrderId)

    // If user is authenticated, we can optionally save order to Supabase
    if (user) {
      try {
        const { data: ord, error: ordErr } = await supabase.from('orders').insert({
          profile_id: user.id,
          total_amount: total,
          status: 'processing',
          shipping_name: form.name,
          shipping_email: form.email,
          shipping_address: form.address,
          shipping_city: form.city,
          shipping_state: form.state,
          shipping_postal_code: form.zip
        }).select('id').single()

        if (!ordErr && ord) {
          // Insert order items
          const itemsToInsert = cart.map(item => ({
            order_id: ord.id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price
          }))
          await supabase.from('order_items').insert(itemsToInsert)
        }
      } catch (err) {
        console.error("Failed to write order record:", err)
      }
    }

    // Success Actions
    setIsSuccess(true)
    setIsSubmitting(false)
    clearCart()

    // Confetti pop!
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    })
  }

  if (isSuccess) {
    return (
      <div className="w-full bg-[#f8f9fa] py-20 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-border-theme p-8 shadow-lg text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-green-100 text-green-500 flex items-center justify-center mx-auto">
            <CheckCircle size={36} className="stroke-[2.5]" />
          </div>
          <div className="space-y-2 text-center">
            <h1 className="text-xl md:text-2xl font-extrabold text-secondary">Order Placed!</h1>
            <p className="text-xs text-gray-400">Thank you for your purchase. We are preparing your fresh organic goods.</p>
          </div>

          <div className="bg-gray-50 border border-border-theme rounded-xl p-4 text-xs font-semibold text-secondary text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Order ID:</span>
              <span>{orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Estimated Delivery:</span>
              <span className="text-primary font-bold">Tomorrow, by 6:00 PM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Sent to:</span>
              <span className="line-clamp-1">{form.email}</span>
            </div>
          </div>

          <div className="pt-2">
            <Link 
              href="/"
              className="w-full bg-primary hover:bg-[#d89311] text-white text-xs font-bold py-3 text-center rounded-full transition uppercase tracking-wider block shadow-sm hover:shadow-md"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="w-full bg-white py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-secondary">Your Cart is Empty</h2>
        <p className="text-xs text-gray-400">Add products to your cart before checking out.</p>
        <Link href="/collections" className="bg-primary hover:bg-[#d89311] text-white text-xs font-bold px-6 py-2.5 rounded-full inline-block transition uppercase tracking-wider">
          Shop Now
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full bg-[#f8f9fa] px-4 md:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-extrabold text-secondary mb-8 text-left border-b border-border-theme pb-4">
          Checkout Securely
        </h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
          {/* Left Fields Column */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. Shipping Details */}
            <div className="bg-white border border-border-theme rounded-2xl p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-secondary flex items-center gap-2 border-b border-gray-100 pb-3 uppercase tracking-wider">
                <User size={16} className="text-primary" /> Shipping Address
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Full Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    required 
                    value={form.name}
                    onChange={handleChange}
                    className="w-full bg-white border border-border-theme rounded-lg py-2 px-4 focus:outline-none focus:border-primary text-xs font-semibold text-secondary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    required 
                    value={form.email}
                    onChange={handleChange}
                    className="w-full bg-white border border-border-theme rounded-lg py-2 px-4 focus:outline-none focus:border-primary text-xs font-semibold text-secondary"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-gray-400">Address Line 1</label>
                <input 
                  type="text" 
                  name="address" 
                  required 
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Street address"
                  className="w-full bg-white border border-border-theme rounded-lg py-2 px-4 focus:outline-none focus:border-primary text-xs font-semibold text-secondary"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Suburb</label>
                  <input 
                    type="text" 
                    name="city" 
                    required 
                    value={form.city}
                    onChange={handleChange}
                    className="w-full bg-white border border-border-theme rounded-lg py-2 px-4 focus:outline-none focus:border-primary text-xs font-semibold text-secondary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">State</label>
                  <input 
                    type="text" 
                    name="state" 
                    required 
                    value={form.state}
                    onChange={handleChange}
                    placeholder="VIC"
                    className="w-full bg-white border border-border-theme rounded-lg py-2 px-4 focus:outline-none focus:border-primary text-xs font-semibold text-secondary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Postcode</label>
                  <input 
                    type="text" 
                    name="zip" 
                    required 
                    value={form.zip}
                    onChange={handleChange}
                    className="w-full bg-white border border-border-theme rounded-lg py-2 px-4 focus:outline-none focus:border-primary text-xs font-semibold text-secondary"
                  />
                </div>
              </div>
            </div>

            {/* 2. Payment Details */}
            <div className="bg-white border border-border-theme rounded-2xl p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-secondary flex items-center gap-2 border-b border-gray-100 pb-3 uppercase tracking-wider">
                <CreditCard size={16} className="text-primary" /> Card Details
              </h3>
              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-gray-400">Card Number</label>
                <input 
                  type="text" 
                  name="cardNumber" 
                  required 
                  maxLength={19}
                  placeholder="4111 2222 3333 4444"
                  value={form.cardNumber}
                  onChange={handleChange}
                  className="w-full bg-white border border-border-theme rounded-lg py-2 px-4 focus:outline-none focus:border-primary text-xs font-semibold text-secondary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Expiry Date</label>
                  <input 
                    type="text" 
                    name="expiry" 
                    required 
                    maxLength={5}
                    placeholder="MM/YY"
                    value={form.expiry}
                    onChange={handleChange}
                    className="w-full bg-white border border-border-theme rounded-lg py-2 px-4 focus:outline-none focus:border-primary text-xs font-semibold text-secondary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">CVV / Security Code</label>
                  <input 
                    type="password" 
                    name="cvv" 
                    required 
                    maxLength={3}
                    placeholder="•••"
                    value={form.cvv}
                    onChange={handleChange}
                    className="w-full bg-white border border-border-theme rounded-lg py-2 px-4 focus:outline-none focus:border-primary text-xs font-semibold text-secondary"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right Summary Column */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-border-theme rounded-2xl p-6 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-secondary border-b border-gray-100 pb-3 uppercase tracking-wider">
                Your Order
              </h3>

              <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.product_id} className="flex justify-between items-center py-2.5 text-xs text-secondary font-semibold">
                    <span className="line-clamp-1 max-w-[150px]">{item.name} <span className="text-gray-400 text-[10px]">x{item.quantity}</span></span>
                    <span className="text-primary font-bold">{formatAUD(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-border-theme pt-4 space-y-2 text-xs font-semibold text-secondary">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal:</span>
                  <span>{formatAUD(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Shipping:</span>
                  <span>{shipping === 0 ? 'Free' : formatAUD(shipping)}</span>
                </div>
                <div className="flex justify-between"><span className="text-gray-400">GST:</span><span>Included</span></div>
              </div>

              <div className="border-t border-border-theme pt-4 flex justify-between items-center font-bold text-secondary">
                <span className="text-sm">Total:</span>
                <span className="text-lg text-primary">{formatAUD(total)}</span>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-[#d89311] disabled:bg-gray-300 text-white text-xs font-bold py-3.5 text-center rounded-full transition shadow-md uppercase tracking-wider block cursor-pointer"
              >
                {isSubmitting ? 'Processing payment…' : `Pay ${formatAUD(total)}`}
              </button>

              <div className="flex items-center gap-2 justify-center text-[10px] text-gray-400 font-bold">
                <Shield size={12} className="text-green-500" /> Secure SSL Encrypted Checkout
              </div>
            </div>
          </div>
        </form>

      </div>
    </div>
  )
}
