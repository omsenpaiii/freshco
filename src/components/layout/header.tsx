'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useStore } from '@/context/store-context'
import { createClientComponentClient } from '@/lib/supabase-client'
import { 
  Search, Heart, ShoppingBag, User, Menu, X, ChevronDown, Phone, MapPin, CheckCircle
} from 'lucide-react'
import productsData from '@/data/products.json'
import categoriesData from '@/data/categories.json'

export default function Header() {
  const router = useRouter()
  const { cart, wishlist, setCartOpen, user } = useStore()
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const supabase = createClientComponentClient()

  // Calculate cart count & total
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0)

  // Handle Search Input
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      return
    }
    const filtered = productsData.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5)
    setSearchResults(filtered)
  }, [searchQuery])

  // Close search results when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/collections?search=${encodeURIComponent(searchQuery)}`)
      setSearchFocused(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <header className="w-full border-b border-border-theme relative z-40 bg-white">
      {/* Top Utility Bar */}
      <div className="w-full bg-[#f8f9fa] border-b border-border-theme text-xs py-2 px-4 md:px-8 text-body flex flex-col md:flex-row justify-between items-center gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Phone size={13} className="text-primary" /> +1 (800) 123-4567
          </span>
          <span className="hidden sm:flex items-center gap-1">
            <MapPin size={13} className="text-primary" /> Store Locator
          </span>
        </div>
        <div className="text-center font-medium tracking-wide text-secondary">
          ⚡ FREE SHIPPING ON ALL ORDERS OVER €50.00!
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 cursor-pointer hover:text-primary">
            English <ChevronDown size={10} />
          </div>
          <div className="flex items-center gap-1 cursor-pointer hover:text-primary">
            EUR <ChevronDown size={10} />
          </div>
          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/account" className="hover:text-primary font-medium text-secondary">
                My Account
              </Link>
              <span>|</span>
              <button onClick={handleLogout} className="hover:text-primary cursor-pointer text-red-500 font-medium">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/account/login" className="hover:text-primary font-medium text-secondary">
                Log In
              </Link>
              <span>/</span>
              <Link href="/account/register" className="hover:text-primary font-medium text-secondary">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Header Row */}
      <div className="w-full px-4 md:px-8 py-5 flex items-center justify-between gap-4">
        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-secondary p-1 hover:text-primary transition"
          onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <div className="relative w-[120px] h-[45px] md:w-[150px] md:h-[50px]">
            <Image 
              src="/logo.png" 
              alt="Vegist Logo" 
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* Search Bar */}
        <div ref={searchRef} className="hidden md:block flex-grow max-w-xl relative">
          <form onSubmit={handleSearchSubmit} className="flex w-full">
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSearchFocused(true)
              }}
              onFocus={() => setSearchFocused(true)}
              className="w-full border border-r-0 border-border-theme rounded-l-full py-2.5 px-6 text-sm text-secondary focus:outline-none focus:border-primary transition"
            />
            <button 
              type="submit" 
              className="bg-primary hover:bg-[#d89311] text-white rounded-r-full px-6 flex items-center justify-center transition border border-primary cursor-pointer"
            >
              <Search size={18} />
            </button>
          </form>

          {/* Autocomplete Dropdown */}
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border-theme rounded-lg shadow-xl overflow-hidden z-50">
              {searchResults.map(prod => (
                <Link 
                  key={prod.id}
                  href={`/products/${prod.slug}`}
                  onClick={() => {
                    setSearchQuery('')
                    setSearchFocused(false)
                  }}
                  className="flex items-center gap-3 p-3 border-b border-border-theme hover:bg-gray-50 transition"
                >
                  <div className="relative w-12 h-12 flex-shrink-0 bg-gray-100 rounded border border-gray-100">
                    <Image 
                      src={prod.images?.[0] || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=200'}
                      alt={prod.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-grow">
                    <h4 className="text-sm font-semibold text-secondary line-clamp-1">{prod.name}</h4>
                    <p className="text-xs text-primary font-medium">€{Number(prod.price).toFixed(2)}</p>
                  </div>
                </Link>
              ))}
              <div 
                onClick={handleSearchSubmit}
                className="text-center p-2.5 bg-gray-50 text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                View all results
              </div>
            </div>
          )}
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4 md:gap-6">
          <Link href="/pages/wishlist" className="relative p-1 text-secondary hover:text-primary transition">
            <Heart size={22} />
            {wishlist.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                {wishlist.length}
              </span>
            )}
          </Link>

          <button 
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-2 p-1 text-secondary hover:text-primary transition cursor-pointer"
          >
            <div className="relative">
              <ShoppingBag size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </div>
            <div className="hidden lg:block text-left text-xs leading-none">
              <span className="block text-[10px] text-body mb-0.5">My Cart</span>
              <span className="font-bold text-secondary">€{cartTotal.toFixed(2)}</span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Navigation (Desktop) */}
      <nav className="hidden md:block w-full border-t border-border-theme px-8 py-3 bg-[#ffffff]">
        <ul className="flex items-center gap-8 justify-center text-sm font-medium text-secondary">
          <li>
            <Link href="/" className="hover:text-primary transition py-2 block">
              Home
            </Link>
          </li>
          <li className="relative group">
            <Link href="/collections" className="hover:text-primary transition py-2 flex items-center gap-1">
              Shop Collections <ChevronDown size={14} />
            </Link>
            {/* Mega Dropdown */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 bg-white border border-border-theme p-6 shadow-xl rounded-b-xl hidden group-hover:grid grid-cols-4 w-[800px] z-50 transition duration-200">
              <div className="flex flex-col gap-2">
                <h4 className="font-bold text-secondary border-b border-border-theme pb-2 mb-2">Organic Produce</h4>
                {categoriesData.slice(0, 5).map(cat => (
                  <Link key={cat.id} href={`/collections/${cat.slug}`} className="text-body hover:text-primary text-xs transition">
                    {cat.name}
                  </Link>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="font-bold text-secondary border-b border-border-theme pb-2 mb-2">Bakery & Grains</h4>
                {categoriesData.slice(5, 10).map(cat => (
                  <Link key={cat.id} href={`/collections/${cat.slug}`} className="text-body hover:text-primary text-xs transition">
                    {cat.name}
                  </Link>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <h4 className="font-bold text-secondary border-b border-border-theme pb-2 mb-2">Beverages & Gourmet</h4>
                {categoriesData.slice(10, 15).map(cat => (
                  <Link key={cat.id} href={`/collections/${cat.slug}`} className="text-body hover:text-primary text-xs transition">
                    {cat.name}
                  </Link>
                ))}
              </div>
              <div className="flex flex-col gap-2 bg-gray-50 p-4 rounded-lg flex-center relative overflow-hidden">
                <div className="relative z-10 text-center">
                  <span className="text-[9px] uppercase tracking-widest text-primary font-bold">New Season</span>
                  <h4 className="font-bold text-secondary text-sm my-1">Fresh Eggplant 100% Organic</h4>
                  <Link href="/collections/fruits" className="inline-block bg-primary hover:bg-[#d89311] text-white text-[10px] font-bold px-3 py-1.5 rounded-full mt-2 transition">
                    Shop Now
                  </Link>
                </div>
              </div>
            </div>
          </li>
          <li>
            <Link href="/blogs/news" className="hover:text-primary transition py-2 block">
              Blogs
            </Link>
          </li>
          <li>
            <Link href="/pages/about-us" className="hover:text-primary transition py-2 block">
              About Us
            </Link>
          </li>
          <li>
            <Link href="/pages/contact-us" className="hover:text-primary transition py-2 block">
              Contact Us
            </Link>
          </li>
          <li>
            <Link href="/pages/faqs" className="hover:text-primary transition py-2 block">
              FAQs
            </Link>
          </li>
        </ul>
      </nav>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden transition">
          <div className="w-[80%] max-w-[300px] h-full bg-white flex flex-col p-6 shadow-2xl relative">
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 text-secondary hover:text-primary transition"
            >
              <X size={24} />
            </button>
            <div className="mb-8 mt-4">
              <form onSubmit={handleSearchSubmit} className="flex w-full relative">
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-border-theme rounded-full py-2 px-4 text-sm text-secondary focus:outline-none focus:border-primary"
                />
                <button type="submit" className="absolute right-2 top-1.5 text-body hover:text-primary">
                  <Search size={18} />
                </button>
              </form>
            </div>
            <ul className="flex flex-col gap-4 text-secondary font-medium">
              <li>
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary block py-1 border-b border-gray-100">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/collections" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary block py-1 border-b border-gray-100">
                  Shop Collections
                </Link>
              </li>
              <li>
                <Link href="/blogs/news" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary block py-1 border-b border-gray-100">
                  Blogs
                </Link>
              </li>
              <li>
                <Link href="/pages/about-us" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary block py-1 border-b border-gray-100">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/pages/contact-us" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary block py-1 border-b border-gray-100">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/pages/faqs" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary block py-1 border-b border-gray-100">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  )
}
