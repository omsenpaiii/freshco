'use client'

import Link from 'next/link'
import { getImageProps } from 'next/image'
import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'

const common = { alt: '', sizes: '100vw', loading: 'eager' as const, fetchPriority: 'high' as const }
const { props: { srcSet: desktop } } = getImageProps({ ...common, src: '/images/home/fresh-picks-hero-desktop.webp', width: 1866, height: 843 })
const { props: { srcSet: mobile, ...imageProps } } = getImageProps({ ...common, src: '/images/home/fresh-picks-mobile-light.webp', width: 1024, height: 1536 })

export default function HomeHeroClient() {
  const reduceMotion = useReducedMotion()
  return (
    <section className="home-hero" aria-labelledby="home-hero-title">
      <picture className="home-hero-picture">
        <source media="(min-width: 901px)" srcSet={desktop} />
        <source media="(max-width: 900px)" srcSet={mobile} />
        {/* getImageProps supplies Next's responsive URLs for art direction. */}
        <img {...imageProps} alt="" aria-hidden="true" className="home-hero-image" />
      </picture>
      <div className="home-hero-inner">
        <motion.div className="home-hero-copy" initial={reduceMotion ? false : { y: 16 }} animate={{ y: 0 }} transition={{ duration: .65, ease: [0.22, 1, 0.36, 1] }}>
          <h1 id="home-hero-title"><span>Fresh picks.</span><span>Big flavours.</span></h1>
          <p>Your Greek deli favourites, ready for<br className="home-hero-desktop-break" /> Click &amp; Collect at Northcote Plaza.</p>
          <div className="home-hero-actions">
            <Link href="/collections" className="home-hero-button home-hero-button-primary">Shop the deli <ArrowRight aria-hidden="true" /></Link>
            <Link href="/pages/shipping-policy" className="home-hero-button home-hero-button-secondary">How to collect <ArrowRight aria-hidden="true" /></Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
