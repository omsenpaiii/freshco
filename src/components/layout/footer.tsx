'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, MapPin, Send } from 'lucide-react'

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) {
      setSubscribed(true)
      setEmail('')
      setTimeout(() => setSubscribed(false), 3000)
    }
  }

  return (
    <footer className="w-full bg-[#111111] text-gray-300 border-t border-border-theme">
      {/* Top Newsletter Section */}
      <div className="w-full border-b border-gray-800 py-8 px-4 md:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-left">
            <h3 className="text-xl font-bold text-white mb-1">Become a subscriber</h3>
            <p className="text-sm text-gray-400">Get 10% discount on your first purchase. Stay updated with fresh news!</p>
          </div>
          <form onSubmit={handleSubscribe} className="flex w-full md:w-auto max-w-md flex-grow">
            <div className="relative w-full flex">
              <input 
                type="email" 
                placeholder="Your email address..." 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-l-full py-3 px-6 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button 
                type="submit" 
                className="bg-primary hover:bg-[#d89311] text-white font-bold text-sm px-6 rounded-r-full flex items-center gap-2 transition cursor-pointer"
              >
                {subscribed ? 'Subscribed!' : <>Subscribe <Send size={14} /></>}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Middle Grid Links */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
        {/* Brand details */}
        <div className="flex flex-col gap-4">
          <div className="relative w-[120px] h-[40px] bg-white p-1 rounded">
            <Image 
              src="/logo.png" 
              alt="Vegist Logo" 
              fill
              className="object-contain p-1"
            />
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Vegist is the leading organic e-commerce grocery store template clone. Providing fresh, direct-from-farm products for your active healthy lifestyle.
          </p>
          <ul className="flex flex-col gap-2.5 text-xs text-gray-400">
            <li className="flex items-start gap-2.5">
              <MapPin size={16} className="text-primary mt-0.5 flex-shrink-0" />
              <span>123 Organic Way, Greenhouse Suite 10, Farmville, CA 90210</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone size={16} className="text-primary flex-shrink-0" />
              <span>+1 (800) 123-4567</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail size={16} className="text-primary flex-shrink-0" />
              <span>support@freshco-vegist.com</span>
            </li>
          </ul>
        </div>

        {/* Quick links */}
        <div>
          <h4 className="text-sm font-bold text-white border-b border-gray-800 pb-3 mb-4 uppercase tracking-wider">
            Quick Links
          </h4>
          <ul className="flex flex-col gap-2.5 text-xs text-gray-400">
            <li>
              <Link href="/pages/about-us" className="hover:text-primary transition">About Us</Link>
            </li>
            <li>
              <Link href="/pages/contact-us" className="hover:text-primary transition">Contact Us</Link>
            </li>
            <li>
              <Link href="/pages/faqs" className="hover:text-primary transition">Help & FAQs</Link>
            </li>
            <li>
              <Link href="/blogs/news" className="hover:text-primary transition">Store News & Blogs</Link>
            </li>
            <li>
              <Link href="/pages/wishlist" className="hover:text-primary transition">My Wishlist</Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-primary transition">View Cart</Link>
            </li>
          </ul>
        </div>

        {/* Store Policies */}
        <div>
          <h4 className="text-sm font-bold text-white border-b border-gray-800 pb-3 mb-4 uppercase tracking-wider">
            Store Policies
          </h4>
          <ul className="flex flex-col gap-2.5 text-xs text-gray-400">
            <li>
              <Link href="/pages/privacy-policy" className="hover:text-primary transition">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/pages/return-policy" className="hover:text-primary transition">Returns & Refund Policy</Link>
            </li>
            <li>
              <Link href="/pages/shipping-policy" className="hover:text-primary transition">Shipping & Delivery</Link>
            </li>
            <li>
              <Link href="/pages/terms-conditions" className="hover:text-primary transition">Terms & Conditions</Link>
            </li>
            <li>
              <Link href="/pages/payment-policy" className="hover:text-primary transition">Payment Policy</Link>
            </li>
          </ul>
        </div>

        {/* Social Feed & Newsletter */}
        <div className="flex flex-col gap-4">
          <h4 className="text-sm font-bold text-white border-b border-gray-800 pb-3 mb-4 uppercase tracking-wider">
            Follow Us
          </h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            Stay tuned to our social feeds for flash sales, recipe inspiration, and updates from our partner farms.
          </p>
          <div className="flex items-center gap-3">
            <Link href="https://facebook.com" className="w-8 h-8 rounded-full bg-gray-900 border border-gray-800 hover:border-primary hover:text-primary transition flex items-center justify-center">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
              </svg>
            </Link>
            <Link href="https://twitter.com" className="w-8 h-8 rounded-full bg-gray-900 border border-gray-800 hover:border-primary hover:text-primary transition flex items-center justify-center">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
              </svg>
            </Link>
            <Link href="https://instagram.com" className="w-8 h-8 rounded-full bg-gray-900 border border-gray-800 hover:border-primary hover:text-primary transition flex items-center justify-center">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </Link>
            <Link href="https://youtube.com" className="w-8 h-8 rounded-full bg-gray-900 border border-gray-800 hover:border-primary hover:text-primary transition flex items-center justify-center">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M23.498 6.163c-.272-1.02-1.028-1.826-2.004-2.103C19.728 3.75 12 3.75 12 3.75s-7.727 0-9.494.31C1.53 4.337.773 5.143.5 6.163.167 7.93.167 12 .167 12s0 4.07.333 5.837c.272 1.02 1.028 1.826 2.004 2.103 1.767.31 9.494.31 9.494.31s7.728 0 9.494-.31c.976-.277 1.732-1.083 2.004-2.103.333-1.767.333-5.837.333-5.837s0-4.07-.333-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </Link>
          </div>
          <div className="mt-2">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest block mb-2">Accepted Payments</span>
            <div className="flex gap-1.5 flex-wrap">
              <span className="text-[10px] px-2 py-1 bg-gray-900 rounded font-semibold text-gray-400 border border-gray-800">Visa</span>
              <span className="text-[10px] px-2 py-1 bg-gray-900 rounded font-semibold text-gray-400 border border-gray-800">MasterCard</span>
              <span className="text-[10px] px-2 py-1 bg-gray-900 rounded font-semibold text-gray-400 border border-gray-800">PayPal</span>
              <span className="text-[10px] px-2 py-1 bg-gray-900 rounded font-semibold text-gray-400 border border-gray-800">Apple Pay</span>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="w-full bg-[#0a0a0a] py-6 px-4 md:px-8 text-center text-xs text-gray-500 border-t border-gray-900">
        <p>© {new Date().getFullYear()} Vegist Store - All Rights Reserved. Built with Next.js & Supabase.</p>
      </div>
    </footer>
  )
}
