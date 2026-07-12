'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ChevronRight, Clock3, MapPin, Navigation, Phone, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { STORE } from '@/lib/store'

export default function ContactUsPage() {
  const reduceMotion = useReducedMotion()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const update = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  return (
    <main className="bg-brand-cloud py-10 md:py-16">
      <div className="site-container">
        <nav aria-label="Breadcrumb" className="mb-7 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Link href="/" className="hover:text-primary">Home</Link><ChevronRight className="size-3" /><span className="font-bold text-brand-ink">Visit & contact</span></nav>
        <motion.header initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mb-10 max-w-3xl"><span className="red-stamp">Northcote’s local deli</span><h1 className="section-title">Come say hello at Northcote Plaza.</h1><p className="section-copy">Find us inside the plaza for deli favourites, local finds and helpful recommendations from the FreshCo team.</p></motion.header>

        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr]">
          <motion.section initial={reduceMotion ? false : { opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .1 }} className="brand-card overflow-hidden p-6 md:p-8">
            <h2 className="font-heading text-2xl font-bold">Store details</h2>
            <div className="mt-6 flex flex-col gap-5 text-sm">
              <a href={STORE.mapsUrl} target="_blank" rel="noreferrer" className="flex gap-3 rounded-2xl bg-brand-cloud p-4 hover:ring-2 hover:ring-primary/20"><MapPin className="mt-0.5 size-5 shrink-0 text-primary" /><span><strong className="block text-brand-ink">{STORE.name}, {STORE.unit}</strong>{STORE.centre}<br />{STORE.street}, {STORE.suburb} {STORE.state} {STORE.postcode}</span></a>
              <a href={STORE.phoneHref} className="flex items-center gap-3 rounded-2xl bg-brand-cloud p-4 font-bold text-brand-ink hover:text-primary"><Phone className="size-5 text-primary" />{STORE.phone}</a>
            </div>
            <div className="mt-8"><h3 className="flex items-center gap-2 font-heading text-lg font-bold"><Clock3 className="size-5 text-brand-red" />Northcote Plaza hours</h3><p className="mt-1 text-xs text-muted-foreground">Store hours follow standard centre trading hours and may vary on public holidays.</p><dl className="mt-4 grid gap-2 text-sm">{STORE.hours.map((row) => <div key={row.days} className="flex justify-between gap-4 border-b border-border/70 py-2"><dt className="font-semibold text-brand-ink">{row.days}</dt><dd className="text-muted-foreground">{row.hours}</dd></div>)}</dl></div>
            <div className="mt-7 flex flex-wrap gap-3"><Button nativeButton={false} render={<a href={STORE.mapsUrl} target="_blank" rel="noreferrer" />} className="h-11 rounded-full"><Navigation data-icon="inline-start" />Get directions</Button><Button nativeButton={false} variant="outline" render={<a href={STORE.phoneHref} />} className="h-11 rounded-full"><Phone data-icon="inline-start" />Call the store</Button></div>
          </motion.section>

          <motion.div initial={reduceMotion ? false : { opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .16 }} className="flex flex-col gap-8">
            <div className="brand-card overflow-hidden p-2"><iframe title="FreshCo Deli at Northcote Plaza" src={STORE.mapEmbedUrl} className="h-[360px] w-full rounded-[1.25rem] border-0 md:h-[430px]" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></div>
            <form onSubmit={async (event) => { event.preventDefault(); setSubmitting(true); await new Promise((resolve) => setTimeout(resolve, 700)); setSubmitting(false); setSuccess(true); setForm({ name: '', email: '', subject: '', message: '' }) }} className="brand-card p-6 md:p-8"><h2 className="font-heading text-2xl font-bold">Send the team a message</h2><p className="mt-2 text-sm text-muted-foreground">Questions about products, platters or a visit? Leave your details below.</p><AnimatePresence>{success && <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="status" className="mt-5 rounded-xl bg-green-50 p-3 text-sm font-bold text-brand-green">Thanks—your message has been received.</motion.p>}</AnimatePresence><div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold text-brand-ink">Name<Input name="name" required value={form.name} onChange={update} className="mt-2 h-11" /></label><label className="text-xs font-bold text-brand-ink">Email<Input name="email" type="email" required value={form.email} onChange={update} className="mt-2 h-11" /></label></div><label className="mt-4 block text-xs font-bold text-brand-ink">Subject<Input name="subject" required value={form.subject} onChange={update} className="mt-2 h-11" /></label><label className="mt-4 block text-xs font-bold text-brand-ink">Message<textarea name="message" required rows={5} value={form.message} onChange={update} className="mt-2 w-full rounded-xl border border-input bg-white px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></label><Button type="submit" disabled={submitting} className="mt-5 h-11 rounded-full px-6">{submitting ? 'Sending…' : 'Send message'}<Send data-icon="inline-end" /></Button></form>
          </motion.div>
        </div>
      </div>
    </main>
  )
}
