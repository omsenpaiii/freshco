'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Heart, ShoppingBag, Menu, ChevronDown, Phone, MapPin, Search, ArrowRight } from 'lucide-react'
import { useStore } from '@/context/store-context'
import { createClientComponentClient } from '@/lib/supabase-client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import productsData from '@/data/products.json'
import categoriesData from '@/data/categories.json'
import { motion } from 'motion/react'
import { formatAUD, STORE } from '@/lib/store'

const navItems = [
  ['Home', '/'], ['Shop', '/collections'], ['Stories', '/blogs/news'], ['About', '/pages/about-us'], ['Contact', '/pages/contact-us'], ['FAQs', '/pages/faqs'],
] as const

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { cart, wishlist, setCartOpen, user } = useStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClientComponentClient(), [])
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)
  const searchResults = useMemo(() => searchQuery.trim().length < 2 ? [] : productsData.filter((product) => product.name.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5), [searchQuery])

  useEffect(() => {
    const close = (event: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(event.target as Node)) setSearchFocused(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault()
    if (!searchQuery.trim()) return
    router.push(`/collections?search=${encodeURIComponent(searchQuery.trim())}`)
    setSearchFocused(false)
    setMobileOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-white/95 shadow-[0_10px_35px_-28px_rgba(23,33,58,.55)] backdrop-blur-xl">
      <div className="bg-brand-ink text-white">
        <div className="site-container flex min-h-9 items-center justify-center text-[0.68rem] font-bold sm:justify-between">
          <div className="hidden items-center gap-5 sm:flex"><a href={STORE.phoneHref} className="flex items-center gap-1.5 hover:text-brand-amber"><Phone className="size-3.5 text-brand-amber" />{STORE.phone}</a><a href={STORE.mapsUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-brand-amber"><MapPin className="size-3.5 text-brand-amber" />Northcote Plaza</a></div>
          <p className="tracking-wide"><span className="text-brand-amber">Melbourne fresh:</span> free local delivery over A$50</p>
          <div className="hidden items-center gap-3 sm:flex">{user ? <><Link href="/account">My account</Link><button onClick={async () => { await supabase.auth.signOut(); router.refresh() }} className="text-white/65 hover:text-white">Log out</button></> : <><Link href="/account/login">Log in</Link><Link href="/account/register" className="text-white/65 hover:text-white">Register</Link></>}</div>
        </div>
      </div>

      <div className="site-container flex min-h-20 items-center gap-4 py-3 lg:gap-8">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger render={<button className="flex size-11 items-center justify-center rounded-full text-brand-ink hover:bg-brand-cloud lg:hidden" aria-label="Open navigation" />}><Menu /></SheetTrigger>
          <SheetContent side="left" className="w-[88vw] max-w-sm gap-0 bg-white p-0">
            <SheetHeader className="border-b border-border p-6"><SheetTitle><Image src="/logo.png" width={138} height={54} alt="FreshCo Deli" /></SheetTitle><SheetDescription>Fresh food and everyday groceries.</SheetDescription></SheetHeader>
            <form onSubmit={submitSearch} className="flex gap-2 border-b border-border p-5"><Input aria-label="Search products" placeholder="Search the aisles" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="h-11" /><Button type="submit" size="icon-lg" aria-label="Submit search"><Search /></Button></form>
            <nav aria-label="Mobile navigation" className="flex flex-col p-3">{navItems.map(([label, href]) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="flex min-h-12 items-center justify-between rounded-xl px-4 font-bold text-brand-ink hover:bg-brand-cloud hover:text-primary">{label}<ArrowRight className="size-4" /></Link>)}</nav>
          </SheetContent>
        </Sheet>

        <Link href="/" aria-label="FreshCo Deli home" className="shrink-0"><Image src="/logo.png" alt="FreshCo Deli" width={154} height={62} priority className="w-[118px] sm:w-[145px]" style={{ height: 'auto' }} /></Link>

        <div ref={searchRef} className="relative mx-auto hidden w-full max-w-xl md:block">
          <form onSubmit={submitSearch} className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-primary" />
            <Input aria-label="Search products" placeholder="Search fruit, bread, pantry and more" value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); setSearchFocused(true) }} onFocus={() => setSearchFocused(true)} className="h-12 rounded-full border-border bg-brand-cloud pl-11 pr-28 text-sm shadow-inner" />
            <Button type="submit" className="absolute right-1.5 top-1.5 h-9 rounded-full px-5 font-bold">Search</Button>
          </form>
          {searchFocused && searchResults.length > 0 && <div className="absolute left-0 right-0 top-full mt-3 overflow-hidden rounded-2xl border border-border bg-white p-2 shadow-2xl">{searchResults.map((product) => <Link key={product.id} href={`/products/${product.slug}`} onClick={() => { setSearchQuery(''); setSearchFocused(false) }} className="flex items-center gap-3 rounded-xl p-2 hover:bg-brand-cloud"><span className="relative size-12 overflow-hidden rounded-xl bg-muted"><Image src={product.images?.[0]} alt="" fill className="object-cover" /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-brand-ink">{product.name}</strong><span className="text-xs font-bold text-primary">{formatAUD(product.price)}</span></span></Link>)}</div>}
        </div>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <Button nativeButton={false} variant="ghost" size="icon-lg" render={<Link href="/pages/wishlist" aria-label={`Wishlist with ${wishlist.length} items`} />} className="relative rounded-full"><Heart />{wishlist.length > 0 && <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-brand-red text-[9px] font-extrabold text-white">{wishlist.length}</span>}</Button>
          <Button variant="ghost" onClick={() => setCartOpen(true)} className="h-11 rounded-full px-2 sm:px-3" aria-label={`Open cart with ${cartCount} items`}><span className="relative"><ShoppingBag />{cartCount > 0 && <motion.span key={cartCount} initial={{ scale: .6 }} animate={{ scale: 1 }} className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-brand-red text-[9px] font-extrabold text-white">{cartCount}</motion.span>}</span><span className="hidden text-left lg:block"><small className="block text-[9px] uppercase tracking-wider text-muted-foreground">My cart</small><strong className="text-xs text-brand-ink">{formatAUD(cartTotal)}</strong></span></Button>
        </div>
      </div>

      <nav aria-label="Primary navigation" className="hidden border-t border-border/70 lg:block"><div className="site-container flex h-12 items-center justify-center gap-8">{navItems.map(([label, href]) => label === 'Shop' ? <div key={href} className="group relative"><Link href={href} aria-current={pathname.startsWith('/collections') ? 'page' : undefined} className="flex items-center gap-1 py-4 text-sm font-bold text-brand-ink hover:text-primary aria-[current=page]:text-primary">Shop collections<ChevronDown className="size-4" /></Link><div className="invisible absolute left-1/2 top-full grid w-[720px] -translate-x-1/2 grid-cols-3 gap-6 rounded-b-3xl border border-border bg-white p-7 opacity-0 shadow-2xl transition group-hover:visible group-hover:opacity-100">{[0, 5, 10].map((start, index) => <div key={start}><p className="mb-3 text-xs font-extrabold uppercase tracking-widest text-primary">{['Fresh picks', 'Bakery & pantry', 'Drinks & treats'][index]}</p>{categoriesData.slice(start, start + 5).map((category) => <Link key={category.id} href={`/collections/${category.slug}`} className="block rounded-lg py-1.5 text-xs font-semibold text-muted-foreground hover:text-brand-red">{category.name}</Link>)}</div>)}</div></div> : <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined} className="py-4 text-sm font-bold text-brand-ink hover:text-primary aria-[current=page]:text-primary">{label}</Link>)}</div></nav>
    </header>
  )
}
