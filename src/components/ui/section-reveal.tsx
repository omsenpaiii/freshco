'use client'

import { motion, useReducedMotion } from 'motion/react'

export default function SectionReveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: .14 }}
      transition={{ duration: .65, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
