'use client'

import { useEffect, useRef } from 'react'
import { useStore } from '@/context/store-context'

export function ClearPaidCart({ paid }: { paid: boolean }) {
  const { clearCart } = useStore()
  const cleared = useRef(false)

  useEffect(() => {
    if (paid && !cleared.current) {
      cleared.current = true
      void clearCart()
    }
  }, [clearCart, paid])

  return null
}
