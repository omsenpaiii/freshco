'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createClientComponentClient } from '@/lib/supabase-client'
import type { ProductVariant } from '@/lib/catalog-types'
import type { User } from '@supabase/supabase-js'

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
  user: User | null
  setUser: (user: User | null) => void
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)
const sameLine = (item: CartItem, productId: number, variantId: number) => item.product_id === productId && item.variant_id === variantId

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<number[]>([])
  const [isCartOpen, setCartOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isStorageHydrated, setStorageHydrated] = useState(false)
  const supabase = useMemo(() => createClientComponentClient(), [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [supabase])

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

  useEffect(() => {
    if (!user) return
    const fetchDbData = async () => {
      const { data: dbCart, error: cartError } = await supabase
        .from('cart_items')
        .select('id, quantity, product_id, variant_id, products(name, slug, images), product_variants(title, sku, price)')
      if (!cartError && dbCart) {
        type DbCartRow = { id: string; quantity: number; product_id: number; variant_id: number | null; products: { name: string; slug: string; images: string[] } | null; product_variants: { title: string; sku: string; price: number | string } | null }
        setCart((dbCart as unknown as DbCartRow[]).flatMap((item) => {
          if (!item.products || !item.product_variants || !item.variant_id) return []
          return [{
            id: item.id,
            product_id: Number(item.product_id),
            variant_id: Number(item.variant_id),
            variant_title: item.product_variants.title,
            sku: item.product_variants.sku,
            name: item.products.name,
            slug: item.products.slug,
            price: Number(item.product_variants.price),
            image: item.products.images?.[0] || '',
            quantity: item.quantity,
          }]
        }))
      }
      const { data: dbWish } = await supabase.from('wishlist_items').select('product_id')
      if (dbWish) setWishlist(dbWish.map((row) => Number(row.product_id)))
    }
    fetchDbData().catch((error) => console.error('Error syncing account data:', error))
  }, [user, supabase])

  const addToCart = (product: AddableProduct, quantity = 1) => {
    const { variant } = product
    setCart((current) => {
      const existing = current.find((item) => sameLine(item, product.id, variant.id))
      const newQuantity = (existing?.quantity || 0) + quantity
      if (user) {
        supabase.from('cart_items').upsert({
          profile_id: user.id, product_id: product.id, variant_id: variant.id, quantity: newQuantity,
        }, { onConflict: 'profile_id,product_id,variant_id' }).then()
      }
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
    if (user) await supabase.from('cart_items').delete().eq('profile_id', user.id).eq('product_id', productId).eq('variant_id', variantId)
  }

  const updateCartQuantity = async (productId: number, variantId: number, quantity: number) => {
    if (quantity <= 0) return removeFromCart(productId, variantId)
    setCart((current) => current.map((item) => sameLine(item, productId, variantId) ? { ...item, quantity } : item))
    if (user) await supabase.from('cart_items').upsert({ profile_id: user.id, product_id: productId, variant_id: variantId, quantity }, { onConflict: 'profile_id,product_id,variant_id' })
  }

  const clearCart = async () => {
    setCart([])
    if (user) await supabase.from('cart_items').delete().eq('profile_id', user.id)
  }

  const toggleWishlist = async (productId: number) => {
    const isAdded = wishlist.includes(productId)
    setWishlist((current) => isAdded ? current.filter((id) => id !== productId) : [...current, productId])
    if (!user) return
    if (isAdded) await supabase.from('wishlist_items').delete().eq('profile_id', user.id).eq('product_id', productId)
    else await supabase.from('wishlist_items').insert({ profile_id: user.id, product_id: productId })
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
