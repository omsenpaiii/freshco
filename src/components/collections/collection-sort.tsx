'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'motion/react'

const options = [
  ['newest', 'Newest items'],
  ['price-asc', 'Price: low to high'],
  ['price-desc', 'Price: high to low'],
  ['title-asc', 'Name: A to Z'],
  ['title-desc', 'Name: Z to A'],
] as const

export default function CollectionSort({ value }: { value: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  return (
    <motion.label initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
      <span className="text-muted-foreground">Sort by</span>
      <select
        aria-label="Sort products"
        value={value}
        onChange={(event) => {
          const params = new URLSearchParams(searchParams.toString())
          params.set('sortBy', event.target.value)
          router.push(`?${params.toString()}`, { scroll: false })
        }}
        className="h-10 rounded-full border border-border bg-white px-4 font-bold text-brand-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      >
        {options.map(([option, label]) => <option key={option} value={option}>{label}</option>)}
      </select>
    </motion.label>
  )
}
