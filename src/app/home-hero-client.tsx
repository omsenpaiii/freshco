'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Pause, Play, ArrowUpRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

const slides = [
  { id: 1, title: 'Fresh food, full of colour.', subtitle: 'Picked for today', desc: 'Pesticide-conscious produce and everyday essentials selected from growers and makers we trust.', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1600&auto=format&fit=crop', btnText: 'Shop fresh produce', link: '/collections/fruits', note: 'Farm to fridge' },
  { id: 2, title: 'Big flavour. Small-batch spice.', subtitle: 'Pantry with personality', desc: 'Fragrant Indian blends, whole spices and grains chosen to make weeknight cooking taste anything but ordinary.', image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=1600&auto=format&fit=crop', btnText: 'Explore the pantry', link: '/collections/dry-fruits', note: 'Ground fresh' },
  { id: 3, title: 'Better bread, baked daily.', subtitle: 'The morning counter', desc: 'Sourdough, seeded loaves and bakery favourites made with honest ingredients and delivered at their best.', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1600&auto=format&fit=crop', btnText: 'Shop the bakery', link: '/collections/bread', note: 'Fresh every day' },
]

export default function HomeHeroClient() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const reduceMotion = useReducedMotion()
  const rootRef = useRef<HTMLElement>(null)

  const goTo = useCallback((index: number) => setCurrentSlide((index + slides.length) % slides.length), [])

  useEffect(() => {
    if (isPaused) return
    const timer = window.setInterval(() => setCurrentSlide((slide) => (slide + 1) % slides.length), 6500)
    return () => window.clearInterval(timer)
  }, [isPaused])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let cleanup = () => {}
    void import('gsap').then(({ gsap }) => {
      if (!rootRef.current) return
      const context = gsap.context(() => {
        gsap.fromTo('[data-hero-copy]', { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.75, ease: 'power3.out', stagger: 0.08 })
      }, rootRef)
      cleanup = () => context.revert()
    })
    return () => cleanup()
  }, [currentSlide])

  const slide = slides[currentSlide]

  return (
    <section ref={rootRef} aria-roledescription="carousel" aria-label="FreshCo seasonal highlights" className="relative isolate min-h-[620px] overflow-hidden bg-brand-ink md:min-h-[680px]">
      <AnimatePresence initial={false} mode="sync">
        <motion.div key={slide.id} initial={reduceMotion ? false : { opacity: 0, scale: 1.025 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: .75, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0">
          <Image src={slide.image} alt="" fill loading="eager" className="object-cover object-center" sizes="100vw" />
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,22,52,.92)_0%,rgba(15,31,67,.72)_48%,rgba(15,31,67,.18)_100%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_75%_20%,#2965f1_0,transparent_34%),radial-gradient(circle_at_20%_90%,#ff3038_0,transparent_24%)]" />

      <div className="site-container relative z-10 flex min-h-[620px] items-center py-20 md:min-h-[680px]">
        <motion.div key={`copy-${slide.id}`} initial={reduceMotion ? false : { opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .5 }} className="max-w-3xl text-white">
          <div data-hero-copy className="mb-6 flex items-center gap-3">
            <span className="red-stamp">{slide.subtitle}</span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">{slide.note}</span>
          </div>
          <h1 data-hero-copy className="max-w-3xl font-heading text-5xl font-bold leading-[0.92] tracking-[-0.055em] text-white sm:text-6xl md:text-7xl lg:text-[6.2rem]">{slide.title}</h1>
          <p data-hero-copy className="mt-7 max-w-xl text-base leading-7 text-white/80 md:text-lg md:leading-8">{slide.desc}</p>
          <div data-hero-copy className="mt-9 flex flex-wrap items-center gap-4">
            <Link href={slide.link} className={cn(buttonVariants({ size: 'lg' }), 'h-13 rounded-full bg-primary px-7 text-sm font-extrabold shadow-xl shadow-blue-950/20 hover:bg-white hover:text-primary')}>
              {slide.btnText}<ArrowUpRight data-icon="inline-end" />
            </Link>
            <Link href="/collections" className="rounded-full px-5 py-3 text-sm font-bold text-white underline decoration-white/30 underline-offset-8 transition hover:decoration-white">Browse every aisle</Link>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 z-20">
        <div className="site-container flex items-center justify-between">
          <div className="flex items-center gap-2" aria-label={`Slide ${currentSlide + 1} of ${slides.length}`}>
            {slides.map((item, index) => <button key={item.id} aria-label={`Show slide ${index + 1}`} aria-current={index === currentSlide} onClick={() => goTo(index)} className={cn('h-1.5 rounded-full bg-white/35 transition-all', index === currentSlide ? 'w-10 bg-white' : 'w-4')} />)}
          </div>
          <div className="flex gap-2">
            <button aria-label={isPaused ? 'Play carousel' : 'Pause carousel'} onClick={() => setIsPaused((paused) => !paused)} className="flex size-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition hover:bg-white hover:text-primary">{isPaused ? <Play /> : <Pause />}</button>
            <motion.button whileHover={reduceMotion ? undefined : { scale: 1.08 }} whileTap={reduceMotion ? undefined : { scale: .92 }} aria-label="Previous slide" onClick={() => goTo(currentSlide - 1)} className="flex size-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition hover:bg-white hover:text-primary"><ChevronLeft /></motion.button>
            <motion.button whileHover={reduceMotion ? undefined : { scale: 1.08 }} whileTap={reduceMotion ? undefined : { scale: .92 }} aria-label="Next slide" onClick={() => goTo(currentSlide + 1)} className="flex size-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-md transition hover:bg-white hover:text-primary"><ChevronRight /></motion.button>
          </div>
        </div>
      </div>
    </section>
  )
}
