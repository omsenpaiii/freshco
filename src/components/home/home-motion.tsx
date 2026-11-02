'use client'

import { useEffect, useRef } from 'react'
import { animate, inView, useReducedMotion } from 'motion/react'

/** Progressive enhancement: the server HTML remains visible without JavaScript. */
export default function HomeMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced || !scope.current) return
    const running: ReturnType<typeof animate>[] = []
    const elements = Array.from(scope.current.querySelectorAll<HTMLElement>('[data-reveal]'))
    const stops = elements.map((element) =>
      inView(element, () => {
        const index = Number(element.dataset.revealIndex || 0)
        const direction = Number(element.dataset.revealDirection || 0)
        const card = element.dataset.reveal === 'card'
        const animation = animate(element, {
          opacity: [0, 1], y: [36, 0], x: [direction * 42, 0],
          rotate: [direction * 2, 0],
          ...(card ? { scale: [.96, 1] } : {}),
        }, { duration: .75, delay: Math.min(index * .075, .3), ease: [.22, 1, .36, 1] })
        running.push(animation)
      }, { amount: .12, margin: '0px 0px -24px 0px' }),
    )
    return () => {
      stops.forEach(stop => stop())
      running.forEach(animation => animation.stop())
      elements.forEach(element => { element.style.removeProperty('opacity'); element.style.removeProperty('transform') })
    }
  }, [reduced])

  return <div ref={scope}>{children}</div>
}
