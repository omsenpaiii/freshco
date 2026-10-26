'use client'

import { motion, useReducedMotion } from 'motion/react'

export default function SectionReveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      // Tall product grids may be many screens high. Even a 1% threshold can
      // exceed a short viewport, leaving the whole grid transparent. Reveal
      // as soon as a small sliver enters view.
      viewport={{ once: true, amount: .001 }}
      transition={{ duration: .65, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
