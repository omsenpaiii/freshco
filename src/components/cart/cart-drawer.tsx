'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useStore } from '@/context/store-context'
import { Button, buttonVariants } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { formatAUD } from '@/lib/store'

export default function CartDrawer() {
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const { cart, isCartOpen, setCartOpen, updateCartQuantity, removeFromCart } = useStore()
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const count = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
      <SheetContent side="right" className="w-full max-w-md gap-0 bg-white p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border bg-brand-cloud px-6 py-5">
          <SheetTitle className="flex items-center gap-2 font-heading text-xl font-bold"><span className="flex size-9 items-center justify-center rounded-full bg-primary text-white"><ShoppingBag /></span>Your market bag <span className="text-primary">({count})</span></SheetTitle>
          <SheetDescription>Fresh picks reserved while you keep shopping.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {cart.length === 0 ? <div className="flex min-h-[65vh] flex-col items-center justify-center text-center"><span className="mb-5 flex size-24 items-center justify-center rounded-full bg-brand-cloud text-primary"><ShoppingBag className="size-10" /></span><h3 className="font-heading text-2xl font-bold">Your bag is ready for something fresh.</h3><p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">Browse the market and add a few favourites for delivery.</p><Button onClick={() => setCartOpen(false)} className="mt-6 h-11 rounded-full px-6">Continue shopping</Button></div> : <AnimatePresence initial={false}>{cart.map((item) => <motion.article key={item.product_id} layout={!reduceMotion} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 30 }} className="flex gap-4 border-b border-border py-5"><Link href={`/products/${item.slug}`} onClick={() => setCartOpen(false)} className="relative size-24 shrink-0 overflow-hidden rounded-2xl bg-muted"><Image src={item.image || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=200'} alt={item.name} fill className="object-cover" /></Link><div className="flex min-w-0 flex-1 flex-col"><Link href={`/products/${item.slug}`} onClick={() => setCartOpen(false)} className="font-heading text-sm font-bold leading-5 text-brand-ink hover:text-primary">{item.name}</Link><span className="mt-1 text-sm font-extrabold text-primary">{formatAUD(item.price)}</span><div className="mt-auto flex items-center justify-between"><div className="flex items-center rounded-full border border-border bg-brand-cloud p-1"><Button variant="ghost" size="icon-xs" aria-label={`Decrease ${item.name} quantity`} onClick={() => updateCartQuantity(item.product_id, item.quantity - 1)}><Minus /></Button><span className="w-8 text-center text-xs font-bold">{item.quantity}</span><Button variant="ghost" size="icon-xs" aria-label={`Increase ${item.name} quantity`} onClick={() => updateCartQuantity(item.product_id, item.quantity + 1)}><Plus /></Button></div><Button variant="ghost" size="icon-sm" aria-label={`Remove ${item.name}`} onClick={() => removeFromCart(item.product_id)} className="text-muted-foreground hover:text-destructive"><Trash2 /></Button></div></div></motion.article>)}</AnimatePresence>}
        </div>
        {cart.length > 0 && <SheetFooter className="border-t border-border bg-brand-cloud p-6"><div className="flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Subtotal</p><p className="mt-1 text-xs text-muted-foreground">Shipping calculated at checkout</p></div><strong className="font-heading text-2xl text-brand-ink">{formatAUD(total)}</strong></div><Button className="mt-2 h-12 rounded-full text-sm font-extrabold" onClick={() => { setCartOpen(false); router.push('/checkout') }}>Checkout securely<ArrowRight data-icon="inline-end" /></Button><Link href="/cart" onClick={() => setCartOpen(false)} className={cn(buttonVariants({ variant: 'outline' }), 'h-11 rounded-full')}>View full cart</Link></SheetFooter>}
      </SheetContent>
    </Sheet>
  )
}
