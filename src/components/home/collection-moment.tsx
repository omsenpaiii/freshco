'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'

export default function CollectionMoment() {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] })
  const left = useTransform(scrollYProgress, [0, 1], [-140, 0])
  const right = useTransform(scrollYProgress, [0, 1], [140, 0])
  const rotation = useTransform(scrollYProgress, [0, .8, .9, 1], [-15, 2, -1, 0])
  const scale = useTransform(scrollYProgress, [0, .85, 1], [.8, 1.025, 1])
  return (
    <section ref={ref} className="home-collection-moment" aria-labelledby="collection-moment-title">
      <div className="home-container home-moment-layout">
        <div className="home-moment-art" aria-hidden="true">
          <motion.div className="home-moment-photo home-moment-photo-left" style={reduced ? undefined : { x: left, rotate: -8 }}>
            <Image src="/images/home/fresh-picks-cheese.webp" alt="" fill sizes="(max-width: 767px) 40vw, 240px" />
          </motion.div>
          <motion.div className="home-moment-photo home-moment-photo-right" style={reduced ? undefined : { x: right, rotate: 9 }}>
            <Image src="/images/home/fresh-picks-frozen.webp" alt="" fill sizes="(max-width: 767px) 40vw, 240px" />
          </motion.div>
          <motion.div className="home-moment-emblem" style={reduced ? undefined : { rotate: rotation, scale }}>
            <Image src="/images/home/food-motion-emblem.webp" alt="" fill sizes="(max-width: 767px) 55vw, 320px" />
          </motion.div>
        </div>
        <div className="home-moment-copy" data-reveal>
          <span className="eyebrow">A little of everything you love</span>
          <h2 id="collection-moment-title" className="home-section-title">Good things.<br />Better together.</h2>
          <p>Feta for the table. Filo for the oven. A few deli favourites to bring it all together.</p>
          <Link className="home-hero-button home-hero-button-primary" href="/collections">Find your favourites <ArrowRight aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  )
}
