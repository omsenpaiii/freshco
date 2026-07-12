'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Mail, MapPin, Phone } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const columns = [
  { title: 'FreshCo', links: [['About us', '/pages/about-us'], ['Contact us', '/pages/contact-us'], ['Help & FAQs', '/pages/faqs'], ['Stories & recipes', '/blogs/news']] },
  { title: 'Your order', links: [['Shop all', '/collections'], ['Wishlist', '/pages/wishlist'], ['View cart', '/cart'], ['Your account', '/account']] },
  { title: 'Good to know', links: [['Delivery', '/pages/shipping-policy'], ['Returns', '/pages/return-policy'], ['Privacy', '/pages/privacy-policy'], ['Terms', '/pages/terms-conditions']] },
] as const

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  return (
    <footer className="mt-auto overflow-hidden bg-brand-ink text-white">
      <div className="bg-primary">
        <div className="site-container grid gap-7 py-9 md:grid-cols-[1fr_1.1fr] md:items-center">
          <div><span className="text-xs font-extrabold uppercase tracking-[0.2em] text-white/70">A fresher inbox</span><h2 className="mt-2 font-heading text-3xl font-bold text-white">Get 10% off your first market run.</h2></div>
          <form onSubmit={(event) => { event.preventDefault(); if (email.trim()) { setSubscribed(true); setEmail('') } }} className="flex rounded-full bg-white p-1.5 shadow-2xl">
            <Input aria-label="Email address" type="email" required placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} className="h-11 flex-1 border-0 bg-transparent px-5 text-brand-ink shadow-none" />
            <Button type="submit" className="h-11 rounded-full bg-brand-red px-5 hover:bg-brand-red/90">{subscribed ? 'You’re on the list' : 'Join the list'}<ArrowRight data-icon="inline-end" /></Button>
          </form>
        </div>
      </div>
      <div className="site-container grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div><span className="inline-flex rounded-xl bg-white p-2"><Image src="/logo.png" alt="FreshCo Deli" width={142} height={58} /></span><p className="mt-5 max-w-sm text-sm leading-7 text-white/60">Colourful groceries, bakery favourites and pantry staples—picked with care and delivered with a little more joy.</p><div className="mt-6 flex flex-col gap-3 text-xs font-semibold text-white/65"><span className="flex items-center gap-2"><MapPin className="size-4 text-brand-amber" />123 Organic Way, Farmville</span><span className="flex items-center gap-2"><Phone className="size-4 text-brand-amber" />+1 (800) 123-4567</span><span className="flex items-center gap-2"><Mail className="size-4 text-brand-amber" />hello@freshco-deli.com</span></div></div>
        {columns.map((column) => <div key={column.title}><h3 className="text-sm font-extrabold uppercase tracking-[0.16em] text-white">{column.title}</h3><nav className="mt-5 flex flex-col gap-3">{column.links.map(([label, href]) => <Link key={href} href={href} className="text-sm text-white/60 transition hover:translate-x-1 hover:text-white">{label}</Link>)}</nav></div>)}
      </div>
      <div className="border-t border-white/10"><div className="site-container flex flex-col gap-4 py-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} FreshCo Deli. Fresh food, delivered bright.</p><div className="flex items-center gap-4"><span>Visa</span><span>Mastercard</span><span>Apple Pay</span><a href="https://instagram.com" aria-label="FreshCo on Instagram" className="text-[10px] font-black text-white hover:text-brand-red">IG</a></div></div></div>
    </footer>
  )
}
