'use client'

import { useEffect, useRef } from 'react'

export default function SectionReveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let dispose = () => {}
    void Promise.all([import('gsap'), import('gsap/ScrollTrigger')]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (!ref.current) return
      gsap.registerPlugin(ScrollTrigger)
      const context = gsap.context(() => {
        gsap.fromTo(ref.current, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.65, ease: 'power2.out', scrollTrigger: { trigger: ref.current, start: 'top 88%', once: true } })
      }, ref)
      dispose = () => context.revert()
    })
    return () => dispose()
  }, [])
  return <div ref={ref} className={className}>{children}</div>
}
