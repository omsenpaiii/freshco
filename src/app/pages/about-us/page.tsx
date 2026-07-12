'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import {
  ChevronRight,
  Clock3,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  ShoppingBasket,
  Store,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { STORE } from '@/lib/store'

const storyPillars = [
  {
    icon: Store,
    title: 'A neighbourhood deli, not a faceless catalogue',
    copy:
      'FreshCo Deli is built around the rhythm of a real Melbourne shopping centre: quick top-up visits, weekend grazing boards, pantry refills and local recommendations you can actually use.',
  },
  {
    icon: ShoppingBasket,
    title: 'Everyday staples with a market feel',
    copy:
      'We curate the storefront around deli essentials, pantry favourites, bakery picks and crowd-pleasing grocery finds so the experience feels generous without becoming noisy.',
  },
  {
    icon: ShieldCheck,
    title: 'Designed for practical local shopping',
    copy:
      'Clear pricing in AUD, GST-inclusive totals, Melbourne delivery messaging and fast contact actions keep the experience grounded in how people here really shop.',
  },
]

const localSignals = [
  { label: 'Based in', value: 'Northcote Plaza' },
  { label: 'Phone', value: STORE.phone },
  { label: 'Delivery', value: 'Free over A$50' },
  { label: 'Style', value: 'Melbourne deli energy' },
]

export default function AboutUsPage() {
  const reduceMotion = useReducedMotion()

  return (
    <main className="bg-[linear-gradient(180deg,var(--fresh-cloud)_0%,#fff_18%,#fff8ec_100%)] py-10 md:py-16">
      <div className="site-container">
        <nav aria-label="Breadcrumb" className="mb-7 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <ChevronRight className="size-3" />
          <span className="font-bold text-brand-ink">About FreshCo Deli</span>
        </nav>

        <motion.section
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-white px-6 py-8 shadow-[0_30px_80px_-40px_rgba(41,101,241,0.42)] md:px-10 md:py-12"
        >
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,var(--fresh-blue)_0%,var(--fresh-red)_65%,var(--fresh-amber)_100%)]" />
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <span className="red-stamp">Northcote local since day one</span>
              <h1 className="section-title max-w-4xl">
                FreshCo brings Melbourne deli warmth to everyday grocery shopping.
              </h1>
              <p className="section-copy max-w-3xl">
                We’ve shaped FreshCo Deli around the feel of a neighbourhood market stop:
                bright produce, pantry essentials, quick pickup ideas and a local team that
                makes the shop feel personal instead of generic.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button
                  nativeButton={false}
                  render={<a href={STORE.mapsUrl} target="_blank" rel="noreferrer" />}
                  className="h-11 rounded-full px-6"
                >
                  <Navigation data-icon="inline-start" />
                  Get directions
                </Button>
                <Button
                  nativeButton={false}
                  variant="outline"
                  render={<a href={STORE.phoneHref} />}
                  className="h-11 rounded-full px-6"
                >
                  <Phone data-icon="inline-start" />
                  Call the store
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {localSignals.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduceMotion ? 0 : 0.06 * index + 0.1 }}
                  className="rounded-[1.6rem] border border-primary/10 bg-brand-cloud/80 p-5"
                >
                  <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-primary/80">
                    {item.label}
                  </p>
                  <p className="mt-2 font-heading text-xl font-bold text-brand-ink">
                    {item.value}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <section className="section-shell grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.article
            initial={reduceMotion ? false : { opacity: 0, x: -18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            className="brand-card p-6 md:p-8"
          >
            <span className="eyebrow">Our approach</span>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-[-0.03em] text-brand-ink md:text-4xl">
              A cleaner, friendlier storefront shaped around local trust.
            </h2>
            <p className="mt-4 text-sm leading-7 text-content-muted md:text-base">
              The FreshCo experience is intentionally calmer than the original template. We
              use stronger hierarchy, clearer actions and more thoughtful spacing so the
              brand feels like a credible Melbourne deli rather than a placeholder shop.
            </p>
            <p className="mt-4 text-sm leading-7 text-content-muted md:text-base">
              That means practical details stay visible: where the store is, how to reach
              us, what the delivery threshold is and why shoppers can feel confident adding
              favourites to their basket.
            </p>
          </motion.article>

          <motion.article
            initial={reduceMotion ? false : { opacity: 0, x: 18 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            className="rounded-[2rem] border border-brand-red/10 bg-[linear-gradient(135deg,rgba(255,48,56,0.08),rgba(41,101,241,0.04))] p-6 md:p-8"
          >
            <div className="flex items-center gap-3 text-brand-red">
              <Users className="size-5" />
              <span className="text-[0.68rem] font-extrabold uppercase tracking-[0.18em]">
                Why shoppers remember us
              </span>
            </div>
            <div className="mt-5 space-y-5">
              {storyPillars.map(({ icon: Icon, title, copy }, index) => (
                <motion.div
                  key={title}
                  initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ delay: reduceMotion ? 0 : 0.08 * index }}
                  className="rounded-[1.6rem] bg-white/88 p-5 shadow-[0_22px_40px_-34px_rgba(23,33,58,0.28)] backdrop-blur"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-brand-cloud text-primary">
                      <Icon className="size-5" />
                    </span>
                    <div>
                      <h3 className="font-heading text-xl font-bold text-brand-ink">{title}</h3>
                      <p className="mt-2 text-sm leading-7 text-content-muted">{copy}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.article>
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.article
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            className="brand-card p-6 md:p-8"
          >
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-primary" />
              <span className="eyebrow">Visit the store</span>
            </div>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-[-0.03em] text-brand-ink">
              Find FreshCo inside Northcote Plaza.
            </h2>
            <p className="mt-3 text-sm leading-7 text-content-muted">
              Drop in for deli favourites, everyday groceries and a quicker way to shop local.
              The same Melbourne details you see across the site live here too, so the About
              page feels useful as well as on-brand.
            </p>

            <a
              href={STORE.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 flex gap-3 rounded-[1.5rem] bg-brand-cloud p-4 transition hover:ring-2 hover:ring-primary/20"
            >
              <MapPin className="mt-0.5 size-5 shrink-0 text-primary" />
              <span className="text-sm leading-6 text-content-muted">
                <strong className="block text-brand-ink">
                  {STORE.name}, {STORE.unit}
                </strong>
                {STORE.centre}
                <br />
                {STORE.street}, {STORE.suburb} {STORE.state} {STORE.postcode}
              </span>
            </a>

            <div className="mt-6 rounded-[1.5rem] border border-border/80 bg-white p-4">
              <h3 className="flex items-center gap-2 font-heading text-lg font-bold text-brand-ink">
                <Clock3 className="size-5 text-brand-red" />
                Centre trading hours
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Hours follow Northcote Plaza standard trading times and may shift on public
                holidays.
              </p>
              <dl className="mt-4 grid gap-2 text-sm">
                {STORE.hours.map((row) => (
                  <div
                    key={row.days}
                    className="flex justify-between gap-4 border-b border-border/70 py-2 last:border-b-0"
                  >
                    <dt className="font-semibold text-brand-ink">{row.days}</dt>
                    <dd className="text-content-muted">{row.hours}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                nativeButton={false}
                render={<a href={STORE.mapsUrl} target="_blank" rel="noreferrer" />}
                className="h-11 rounded-full"
              >
                <Navigation data-icon="inline-start" />
                Get directions
              </Button>
              <Button
                nativeButton={false}
                variant="outline"
                render={<Link href="/pages/contact-us" />}
                className="h-11 rounded-full"
              >
                <MapPin data-icon="inline-start" />
                Visit contact page
              </Button>
            </div>
          </motion.article>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            className="brand-card overflow-hidden p-2"
          >
            <iframe
              title="FreshCo Deli at Northcote Plaza on the map"
              src={STORE.mapEmbedUrl}
              className="h-[360px] w-full rounded-[1.5rem] border-0 md:h-[100%] md:min-h-[620px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </motion.div>
        </section>
      </div>
    </main>
  )
}
