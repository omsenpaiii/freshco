'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Clock3, MapPin, Navigation, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { COLLECTION, STORE } from '@/lib/store'

const columns = [
  { title: 'FreshCo', links: [['About us', '/pages/about-us'], ['Contact & map', '/pages/contact-us'], ['Help & FAQs', '/pages/faqs'], ['Stories & recipes', '/blogs/news']] },
  { title: 'Your order', links: [['Shop all', '/collections'], ['Wishlist', '/pages/wishlist'], ['View cart', '/cart'], ['Your account', '/account']] },
  { title: 'Good to know', links: [['Click & Collect', '/pages/shipping-policy'], ['Returns', '/pages/return-policy'], ['Privacy', '/pages/privacy-policy'], ['Terms', '/pages/terms-conditions']] },
] as const

export default function Footer() {
  return (
    <footer className="mt-auto overflow-hidden bg-brand-ink text-white">
      <div className="bg-primary"><div className="site-container grid gap-7 py-10 md:grid-cols-[1.2fr_1fr] md:items-center"><div><h2 className="font-heading text-3xl font-bold text-white md:text-4xl">Your favourites, ready for a local pickup.</h2><p className="mt-3 text-base leading-7 text-white/85">Shop online with Click & Collect from {COLLECTION.location}. No delivery service is available.</p></div><div className="flex flex-wrap gap-3 md:justify-end"><Button nativeButton={false} render={<Link href="/collections" />} className="h-12 rounded-full bg-brand-red px-6 text-base font-bold hover:bg-brand-red/90">Shop for collection<ArrowRight data-icon="inline-end" /></Button><Button nativeButton={false} variant="outline" render={<a href={STORE.mapsUrl} target="_blank" rel="noreferrer" />} className="h-12 rounded-full border-white/40 bg-transparent px-6 text-base text-white hover:bg-white hover:text-primary">Get directions<Navigation data-icon="inline-end" /></Button></div></div></div>
      <div className="site-container grid gap-12 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div><span className="inline-flex rounded-xl bg-white p-2"><Image src="/logo.png" alt="FreshCo Deli" width={144} height={63} /></span><p className="mt-5 max-w-sm text-sm leading-7 text-white/60">A Northcote deli for Greek cheese, frozen filo favourites, pasta and friendly local recommendations.</p><div className="mt-6 flex flex-col gap-3 text-xs font-semibold text-white/65"><a href={STORE.mapsUrl} target="_blank" rel="noreferrer" className="flex items-start gap-2 hover:text-white"><MapPin className="mt-0.5 size-4 shrink-0 text-brand-amber" />{STORE.unit}, {STORE.centre}<br />{STORE.street}, {STORE.suburb} {STORE.state} {STORE.postcode}</a><a href={STORE.phoneHref} className="flex items-center gap-2 hover:text-white"><Phone className="size-4 text-brand-amber" />{STORE.phone}</a><Link href="/pages/contact-us" className="flex items-center gap-2 hover:text-white"><Clock3 className="size-4 text-brand-amber" />View centre hours</Link><a href={STORE.mapsUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-white hover:bg-white hover:text-brand-ink"><Navigation className="size-3.5" />Get directions</a></div></div>
        {columns.map((column) => <div key={column.title}><h3 className="text-sm font-extrabold uppercase tracking-[0.16em] text-white">{column.title}</h3><nav className="mt-5 flex flex-col gap-3">{column.links.map(([label, href]) => <Link key={href} href={href} className="text-sm text-white/60 transition hover:translate-x-1 hover:text-white">{label}</Link>)}</nav></div>)}
      </div>
      <div className="border-t border-white/10"><div className="site-container flex flex-col gap-4 py-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} FreshCo Deli, Northcote. Prices in AUD and include GST.</p><div className="flex items-center gap-4"><span>Visa</span><span>Mastercard</span><span>Apple Pay</span></div></div></div>
    </footer>
  )
}
