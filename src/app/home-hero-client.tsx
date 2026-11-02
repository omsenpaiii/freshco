'use client'

import Link from 'next/link'
import { getImageProps } from 'next/image'
import { ArrowRight } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { animate, motion, useReducedMotion, useScroll, useTransform } from 'motion/react'

const common = { alt: '', sizes: '100vw', loading: 'eager' as const, fetchPriority: 'high' as const }
const { props: { srcSet: desktop } } = getImageProps({ ...common, src: '/images/home/fresh-picks-hero-desktop.webp', width: 1866, height: 843 })
const { props: { srcSet: mobile, ...imageProps } } = getImageProps({ ...common, src: '/images/home/fresh-picks-mobile-light.webp', width: 1024, height: 1536 })

export default function HomeHeroClient() {
  const reduceMotion = useReducedMotion()
  const hero = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: hero, offset: ['start start', 'end start'] })
  const artworkY = useTransform(scrollYProgress, [0, 1], [0, 64])
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -36])
  useEffect(() => {
    if (reduceMotion || !hero.current) return
    const lines = Array.from(hero.current.querySelectorAll('h1 span'))
    const animations = lines.map((line, index) => animate(line, { y: [30, 0], opacity: [0, 1] }, { duration: .8, delay: index * .12, ease: [.22, 1, .36, 1] }))
    return () => {
      animations.forEach(animation => animation.stop())
      lines.forEach(line => { (line as HTMLElement).style.removeProperty('opacity'); (line as HTMLElement).style.removeProperty('transform') })
    }
  }, [reduceMotion])
  return (
    <section ref={hero} className="home-hero" aria-labelledby="home-hero-title">
      <motion.picture className="home-hero-picture" style={reduceMotion ? undefined : { y: artworkY }}>
        <source media="(min-width: 901px)" srcSet={desktop} />
        <source media="(max-width: 900px)" srcSet={mobile} />
        {/* getImageProps supplies Next's responsive URLs for art direction. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- Art-directed picture uses Next-optimized getImageProps URLs. */}
        <img {...imageProps} alt="" aria-hidden="true" className="home-hero-image" />
      </motion.picture>
      <div className="home-hero-inner">
        <motion.div className="home-hero-copy" style={reduceMotion ? undefined : { y: copyY }}>
          <h1 id="home-hero-title"><span>Fresh picks.</span><span>Big flavours.</span></h1>
          <p>Your Greek deli favourites, ready for<br className="home-hero-desktop-break" /> Click &amp; Collect at Northcote Plaza.</p>
          <div className="home-hero-actions">
            <Link href="/collections" className="home-hero-button home-hero-button-primary">Shop the deli <ArrowRight aria-hidden="true" /></Link>
            <Link href="#how-to-collect" className="home-hero-button home-hero-button-secondary">How to collect <ArrowRight aria-hidden="true" /></Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
