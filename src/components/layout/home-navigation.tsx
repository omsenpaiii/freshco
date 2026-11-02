'use client'

import { useMemo, useState, type FormEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Menu, Search, ShoppingBag, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useStore } from '@/context/store-context'
import { isAdminEmail } from '@/lib/admin-access'
import { authClient } from '@/lib/auth/client'
import { formatAUD } from '@/lib/store'
import { useMotionValueEvent, useScroll, motion, useReducedMotion } from 'motion/react'

const desktopLinks = [
  { label: 'Shop', href: '/collections' },
  { label: 'Stories', href: '/blogs/news' },
  { label: 'About', href: '/pages/about-us' },
  { label: 'Contact', href: '/pages/contact-us' },
] as const

const mobileLinks = [
  { label: 'Home', href: '/' },
  ...desktopLinks,
  { label: 'FAQs', href: '/pages/faqs' },
  { label: 'Wishlist', href: '/pages/wishlist' },
] as const

interface HomeNavigationProps {
  initialProducts: Array<{ id: number; name: string; slug: string; price: number; images: string[] }>
}

const iconButtonClassName = 'inline-flex size-11 shrink-0 items-center justify-center rounded-full text-brand-green transition-colors hover:bg-brand-green/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-green'

export default function HomeNavigation({ initialProducts }: HomeNavigationProps) {
  const router = useRouter()
  const { cart, setCartOpen, user, setUser } = useStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const { scrollY, scrollYProgress } = useScroll()
  const reduced = useReducedMotion()
  useMotionValueEvent(scrollY, 'change', (value) => setScrolled(value > 32))
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const adminUser = isAdminEmail(user?.email)
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const searchResults = useMemo(() => {
    if (normalizedQuery.length < 2) return []
    return initialProducts
      .filter((product) => product.name.toLowerCase().includes(normalizedQuery))
      .slice(0, 6)
  }, [initialProducts, normalizedQuery])

  const accountHref = user ? '/account' : '/account/login'
  const accountLabel = user ? 'Your account' : 'Customer sign in'
  const drawerLinks = [
    ...mobileLinks,
    ...(adminUser ? [{ label: 'Admin panel', href: '/admin' }] : []),
    ...(user
      ? [{ label: 'My account', href: '/account' }]
      : [
          { label: 'Log in', href: '/account/login' },
          { label: 'Register', href: '/account/register' },
        ]),
  ]

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = searchQuery.trim()
    if (!query) return
    router.push(`/collections?search=${encodeURIComponent(query)}`)
    setSearchOpen(false)
  }

  const signOut = async () => {
    await authClient.signOut()
    setUser(null)
    router.refresh()
    setMenuOpen(false)
  }

  return (
    <header className={`home-navigation ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="home-navigation-inner">
        <Link
          href="/"
          aria-label="FreshCo Deli home"
          className="home-navigation-logo relative z-10 shrink-0"
        >
          <Image
            src="/logo.png"
            alt="FreshCo Deli"
            width={220}
            height={96}
            sizes="(max-width: 639px) 116px, (max-width: 1023px) 152px, 220px"
            preload
            style={{ height: 'auto' }}
            className="home-navigation-logo-image"
          />
        </Link>

        <nav
          aria-label="Primary navigation"
          className="home-navigation-links hidden items-center gap-10 xl:flex"
        >
          {desktopLinks.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex min-h-11 items-center whitespace-nowrap text-[20px] font-extrabold text-brand-ink transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="home-navigation-actions ml-auto flex items-center gap-0.5 sm:gap-1 lg:gap-5">
          <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
            <SheetTrigger render={<button type="button" className={iconButtonClassName} aria-label="Search products" />}>
              <Search aria-hidden="true" className="size-7" strokeWidth={1.8} />
            </SheetTrigger>
            <SheetContent side="top" className="gap-5 rounded-b-3xl bg-white p-5 text-brand-ink sm:p-8">
              <SheetHeader className="p-0">
                <SheetTitle className="text-2xl font-bold text-brand-ink">Search products</SheetTitle>
                <SheetDescription>Find your FreshCo Deli favourites.</SheetDescription>
              </SheetHeader>
              <form onSubmit={submitSearch} className="flex w-full max-w-3xl gap-2">
                <label htmlFor="home-product-search" className="sr-only">Search products</label>
                <Input
                  id="home-product-search"
                  type="search"
                  aria-label="Search products"
                  autoComplete="off"
                  placeholder="Search cheese, filo pies and pasta"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-11 rounded-full bg-white px-4"
                />
                <Button type="submit" className="h-11 rounded-full px-5 font-bold">Search</Button>
              </form>
              {normalizedQuery.length >= 2 && (
                searchResults.length > 0 ? (
                  <ul aria-label="Product suggestions" className="grid w-full max-w-3xl gap-2 sm:grid-cols-2">
                    {searchResults.map((product) => (
                      <li key={product.id}>
                        <Link
                          href={`/products/${product.slug}`}
                          onClick={() => setSearchOpen(false)}
                          className="flex min-h-12 items-center justify-between gap-4 rounded-xl border border-border px-4 py-2 text-sm transition-colors hover:bg-brand-cloud focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                        >
                          <span className="truncate font-semibold text-brand-ink">{product.name}</span>
                          <span className="shrink-0 text-muted-foreground">
                            {product.price > 0 ? formatAUD(product.price) : 'Price pending'}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p aria-live="polite" className="text-sm text-muted-foreground">No matching products. Try another search.</p>
                )
              )}
            </SheetContent>
          </Sheet>

          <Link href={accountHref} aria-label={accountLabel} className={iconButtonClassName}>
            <UserRound aria-hidden="true" className="size-7" strokeWidth={1.8} />
          </Link>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Open cart with ${cartCount} ${cartCount === 1 ? 'item' : 'items'}`}
            className={`${iconButtonClassName} relative`}
          >
            <ShoppingBag aria-hidden="true" className="size-7" strokeWidth={1.8} />
            {cartCount > 0 && (
              <span aria-hidden="true" className="absolute right-0.5 top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-brand-red px-1 text-[11px] font-extrabold leading-none text-white">
                {cartCount}
              </span>
            )}
          </button>

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger render={<button type="button" className={`${iconButtonClassName} xl:hidden`} aria-label="Open navigation menu" />}>
              <Menu aria-hidden="true" className="size-7" strokeWidth={1.8} />
            </SheetTrigger>
            <SheetContent side="left" className="w-[88vw] max-w-sm gap-0 overflow-y-auto bg-white p-0 text-brand-ink">
              <SheetHeader className="border-b border-border p-6">
                <SheetTitle>
                  <Image src="/logo.png" width={144} height={63} alt="FreshCo Deli" />
                </SheetTitle>
                <SheetDescription>Browse the deli, stories and store information.</SheetDescription>
              </SheetHeader>
              <nav aria-label="Mobile navigation" className="flex flex-col p-3">
                {drawerLinks.map(({ label, href }) => (
                  <Link
                    key={`${label}-${href}`}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-12 items-center justify-between rounded-xl px-4 font-bold text-brand-ink transition-colors hover:bg-brand-cloud hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    {label}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                ))}
                {user && (
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex min-h-12 items-center justify-between rounded-xl px-4 text-left font-bold text-muted-foreground transition-colors hover:bg-brand-cloud hover:text-brand-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    Log out
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      {!reduced && <motion.div className="home-scroll-progress" style={{ scaleX: scrollYProgress }} aria-hidden="true" />}
    </header>
  )
}
