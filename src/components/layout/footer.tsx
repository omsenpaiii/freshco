'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Clock3, MapPin, Navigation, Phone } from 'lucide-react'
import { COLLECTION, STORE } from '@/lib/store'
import HomeMotion from '@/components/home/home-motion'

const columns = [
  { title: 'The deli', links: [['About us', '/pages/about-us'], ['Contact & map', '/pages/contact-us'], ['Help & FAQs', '/pages/faqs'], ['Stories & recipes', '/blogs/news']] },
  { title: 'Your order', links: [['Shop all', '/collections'], ['Wishlist', '/pages/wishlist'], ['View cart', '/cart'], ['Your account', '/account']] },
  { title: 'Good to know', links: [['Click & Collect', '/pages/shipping-policy'], ['Returns', '/pages/return-policy'], ['Privacy', '/pages/privacy-policy'], ['Terms', '/pages/terms-conditions']] },
] as const

export default function Footer() {
  return (
    <footer className="freshco-footer">
      <HomeMotion>
        <section className="footer-pickup" aria-labelledby="footer-pickup-title">
          <div className="home-container footer-pickup-layout">
            <div data-reveal>
              <span className="eyebrow">Your neighbourhood deli · Northcote Plaza</span>
              <h2 id="footer-pickup-title">See you<br />at the deli.</h2>
              <p>Your favourites, a few fresh discoveries, and one easy local pickup. Shop online with Click &amp; Collect.</p>
              <div className="footer-pickup-actions">
                <Link href="/collections" className="home-hero-button home-hero-button-primary">Shop for collection <ArrowRight aria-hidden="true" /></Link>
                <a href={STORE.mapsUrl} target="_blank" rel="noreferrer" className="footer-directions">Find us <Navigation aria-hidden="true" size={20} /></a>
              </div>
              <p className="footer-pickup-note">{COLLECTION.location} · Click &amp; Collect only. No delivery.</p>
            </div>
            <div className="footer-food-art" data-reveal data-reveal-direction="1" aria-hidden="true"><Image src="/images/home/food-motion-emblem.webp" alt="" width={400} height={400} sizes="(max-width: 767px) 220px, 340px" /></div>
          </div>
        </section>
        <div className="home-container footer-main">
          <div className="footer-intro" data-reveal>
            <Link href="/admin/login" aria-label="FreshCo Deli staff admin sign-in" className="footer-admin-logo"><Image src="/logo.png" alt="FreshCo Deli" width={180} height={79} /></Link>
            <p>A little Greece.<br />A lot to love.</p>
            <address>
              <a href={STORE.mapsUrl} target="_blank" rel="noreferrer"><MapPin aria-hidden="true" /> <span>{STORE.unit}, {STORE.centre}<br />{STORE.street}, {STORE.suburb} {STORE.state} {STORE.postcode}</span></a>
              <a href={STORE.phoneHref}><Phone aria-hidden="true" />{STORE.phone}</a>
              <Link href="/pages/contact-us"><Clock3 aria-hidden="true" />View centre hours</Link>
            </address>
          </div>
          {columns.map((column, index) => <div key={column.title} className="footer-column" data-reveal data-reveal-index={index}><h3>{column.title}</h3><nav aria-label={`${column.title} footer links`}>{column.links.map(([label, href]) => <Link key={href} href={href}>{label}<ArrowRight aria-hidden="true" size={16} /></Link>)}</nav></div>)}
        </div>
        <div className="home-container footer-bottom"><p>© {new Date().getFullYear()} FreshCo Deli, Northcote. Prices in AUD and include GST.</p><span>Secure payments through Stripe</span></div>
      </HomeMotion>
    </footer>
  )
}
