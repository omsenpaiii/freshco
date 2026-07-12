'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { createClientComponentClient } from '@/lib/supabase-client'

export interface CartItem {
  id?: string // Supabase row ID
  product_id: number
  name: string
  slug: string
  price: number
  image: string
  quantity: number
}

interface StoreContextType {
  cart: CartItem[]
  wishlist: number[] // array of product_ids
  isCartOpen: boolean
  setCartOpen: (open: boolean) => void
  addToCart: (product: { id: number; name: string; slug: string; price: number; image: string }, quantity?: number) => void
  removeFromCart: (productId: number) => void
  updateCartQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  toggleWishlist: (productId: number) => void
  isInWishlist: (productId: number) => boolean
  user: any
  setUser: (user: any) => void
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<number[]>([])
  const [isCartOpen, setCartOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  const supabase = createClientComponentClient()

  // 1. Listen for auth changes and fetch initial session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // 2. Load cart & wishlist from localStorage on mount (for guests)
  useEffect(() => {
    const localCart = localStorage.getItem('freshco_cart')
    const localWishlist = localStorage.getItem('freshco_wishlist')

    if (localCart) setCart(JSON.parse(localCart))
    if (localWishlist) setWishlist(JSON.parse(localWishlist))
  }, [])

  // 3. Sync state changes to localStorage
  useEffect(() => {
    localStorage.setItem('freshco_cart', JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    localStorage.setItem('freshco_wishlist', JSON.stringify(wishlist))
  }, [wishlist])

  // 4. Fetch Cart & Wishlist from Supabase if logged in
  useEffect(() => {
    if (!user) return

    const fetchDbData = async () => {
      try {
        // Fetch cart items
        const { data: dbCart, error: cartErr } = await supabase
          .from('cart_items')
          .select('id, quantity, product_id, products(name, slug, price, images)')
        
        if (!cartErr && dbCart) {
          const formattedCart: CartItem[] = dbCart.map(item => {
            const prod = item.products as any
            return {
              id: item.id,
              product_id: item.product_id,
              name: prod.name,
              slug: prod.slug,
              price: prod.price,
              image: prod.images?.[0] || '',
              quantity: item.quantity
            }
          })
          setCart(formattedCart)
        }

        // Fetch wishlist items
        const { data: dbWish, error: wishErr } = await supabase
          .from('wishlist_items')
          .select('product_id')
        
        if (!wishErr && dbWish) {
          setWishlist(dbWish.map(w => Number(w.product_id)))
        }
      } catch (err) {
        console.error("Error syncing Supabase user data:", err)
      }
    }

    fetchDbData()
  }, [user, supabase])

  // 5. Actions
  const addToCart = async (product: { id: number; name: string; slug: string; price: number; image: string }, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id)
      if (existing) {
        const newQty = existing.quantity + quantity
        // Sync to Supabase in background
        if (user) {
          supabase.from('cart_items').upsert({
            profile_id: user.id,
            product_id: product.id,
            quantity: newQty
          }).then()
        }
        return prev.map(item => item.product_id === product.id ? { ...item, quantity: newQty } : item)
      } else {
        const newItem = {
          product_id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: product.image,
          quantity: quantity
        }
        // Sync to Supabase in background
        if (user) {
          supabase.from('cart_items').insert({
            profile_id: user.id,
            product_id: product.id,
            quantity: quantity
          }).then()
        }
        return [...prev, newItem]
      }
    })
    setCartOpen(true)
  }

  const removeFromCart = async (productId: number) => {
    setCart(prev => prev.filter(item => item.product_id !== productId))
    if (user) {
      await supabase.from('cart_items').delete().eq('profile_id', user.id).eq('product_id', productId)
    }
  }

  const updateCartQuantity = async (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setCart(prev => prev.map(item => item.product_id === productId ? { ...item, quantity } : item))
    if (user) {
      await supabase.from('cart_items').upsert({
        profile_id: user.id,
        product_id: productId,
        quantity: quantity
      })
    }
  }

  const clearCart = async () => {
    setCart([])
    if (user) {
      await supabase.from('cart_items').delete().eq('profile_id', user.id)
    }
  }

  const toggleWishlist = async (productId: number) => {
    const isAdded = wishlist.includes(productId)
    if (isAdded) {
      setWishlist(prev => prev.filter(id => id !== productId))
      if (user) {
        await supabase.from('wishlist_items').delete().eq('profile_id', user.id).eq('product_id', productId)
      }
    } else {
      setWishlist(prev => [...prev, productId])
      if (user) {
        await supabase.from('wishlist_items').insert({
          profile_id: user.id,
          product_id: productId
        })
      }
    }
  }

  const isInWishlist = (productId: number) => wishlist.includes(productId)

  return (
    <StoreContext.Provider value={{
      cart,
      wishlist,
      isCartOpen,
      setCartOpen,
      addToCart,
      removeFromCart,
      updateCartQuantity,
      clearCart,
      toggleWishlist,
      isInWishlist,
      user,
      setUser
    }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
