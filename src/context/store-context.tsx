'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { authClient } from '@/lib/auth/client'
import type { ProductVariant } from '@/lib/catalog-types'

type StoreUser = { id: string; email: string; name?: string | null }

export interface CartItem {
  id?: string
  product_id: number
  variant_id: number
  variant_title: string
  sku: string
  name: string
  slug: string
  price: number
  image: string
  quantity: number
}

type AddableProduct = { id: number; name: string; slug: string; image: string; variant: ProductVariant }

interface StoreContextType {
  cart: CartItem[]
  wishlist: number[]
  isCartOpen: boolean
  setCartOpen: (open: boolean) => void
  addToCart: (product: AddableProduct, quantity?: number) => void
  removeFromCart: (productId: number, variantId: number) => void
  updateCartQuantity: (productId: number, variantId: number, quantity: number) => void
  clearCart: () => void
  toggleWishlist: (productId: number) => void
  isInWishlist: (productId: number) => boolean
  user: StoreUser | null
  setUser: (user: StoreUser | null) => void
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)
const sameLine = (item: CartItem, productId: number, variantId: number) => item.product_id === productId && item.variant_id === variantId

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<number[]>([])
  const [isCartOpen, setCartOpen] = useState(false)
  const [user, setUser] = useState<StoreUser | null>(null)
  const [isStorageHydrated, setStorageHydrated] = useState(false)
  useEffect(() => {
    authClient.getSession().then(({ data }) => setUser(data?.user ? { id: data.user.id, email: data.user.email, name: data.user.name } : null))
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const savedCart: unknown = JSON.parse(localStorage.getItem('freshco_cart_v2') || '[]')
        if (Array.isArray(savedCart)) setCart(savedCart.filter((item): item is CartItem => typeof item === 'object' && item !== null && Number.isInteger((item as CartItem).variant_id)))
        const savedWishlist: unknown = JSON.parse(localStorage.getItem('freshco_wishlist') || '[]')
        if (Array.isArray(savedWishlist)) setWishlist(savedWishlist.filter((item): item is number => Number.isInteger(item)))
      } catch {
        localStorage.removeItem('freshco_cart_v2')
      } finally {
        setStorageHydrated(true)
      }
    })
  }, [])

  useEffect(() => {
    if (isStorageHydrated) localStorage.setItem('freshco_cart_v2', JSON.stringify(cart))
  }, [cart, isStorageHydrated])
  useEffect(() => {
    if (isStorageHydrated) localStorage.setItem('freshco_wishlist', JSON.stringify(wishlist))
  }, [wishlist, isStorageHydrated])

  const addToCart = (product: AddableProduct, quantity = 1) => {
    const { variant } = product
    if (!Number.isFinite(variant.price) || variant.price <= 0 || variant.inventory_quantity <= 0) return
    setCart((current) => {
      const existing = current.find((item) => sameLine(item, product.id, variant.id))
      const newQuantity = (existing?.quantity || 0) + quantity
      if (existing) return current.map((item) => sameLine(item, product.id, variant.id) ? { ...item, quantity: newQuantity } : item)
      return [...current, {
        product_id: product.id,
        variant_id: variant.id,
        variant_title: variant.title,
        sku: variant.sku,
        name: product.name,
        slug: product.slug,
        price: variant.price,
        image: product.image,
        quantity,
      }]
    })
    setCartOpen(true)
  }

  const removeFromCart = async (productId: number, variantId: number) => {
    setCart((current) => current.filter((item) => !sameLine(item, productId, variantId)))
  }

  const updateCartQuantity = async (productId: number, variantId: number, quantity: number) => {
    if (quantity <= 0) return removeFromCart(productId, variantId)
    setCart((current) => current.map((item) => sameLine(item, productId, variantId) ? { ...item, quantity } : item))
  }

  const clearCart = async () => {
    setCart([])
  }

  const toggleWishlist = async (productId: number) => {
    const isAdded = wishlist.includes(productId)
    setWishlist((current) => isAdded ? current.filter((id) => id !== productId) : [...current, productId])
  }

  return <StoreContext.Provider value={{
    cart, wishlist, isCartOpen, setCartOpen, addToCart, removeFromCart, updateCartQuantity, clearCart,
    toggleWishlist, isInWishlist: (productId) => wishlist.includes(productId), user, setUser,
  }}>{children}</StoreContext.Provider>
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used within a StoreProvider')
  return context
}
