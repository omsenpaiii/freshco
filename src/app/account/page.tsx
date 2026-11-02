'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MapPin, ShoppingBag, LogOut, ArrowRight } from 'lucide-react'
import { authClient } from '@/lib/auth/client'
import { COLLECTION, STORE, formatAUD } from '@/lib/store'
import { useStore } from '@/context/store-context'

interface OrderSummary { id: string; created_at: string; total_amount: number; status: string; payment_status: string }

export default function AccountDashboardPage() {
  const router = useRouter()
  const { clearCart, setUser } = useStore()
  const [email, setEmail] = useState('')
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const { data, error: sessionError } = await authClient.getSession()
        if (!active) return
        if (sessionError) throw new Error('Your account session could not be loaded. Please sign in again.')
        if (!data?.user) { router.replace('/account/login'); return }
        setEmail(data.user.email)
        const response = await fetch('/api/account', { cache: 'no-store' })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Your orders could not be loaded.')
        if (active) setOrders(result.orders || [])
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'Your account could not be loaded.')
      } finally {
        if (active) setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [router])

  const signOut = async () => {
    await authClient.signOut()
    setUser(null)
    clearCart()
    router.push('/account/login')
    router.refresh()
  }

  return (
    <div className="account-login-surface px-5 py-14 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
          <div><span className="eyebrow">FreshCo Deli · Click & Collect</span><h1 className="home-section-title mt-3">Your deli orders.</h1><p className="mt-3 text-content-muted">{email || 'Your favourites, ready for a local pickup.'}</p></div>
          {email && <button onClick={signOut} className="inline-flex min-h-11 items-center gap-2 font-bold text-brand-green"><LogOut size={18} />Sign out</button>}
        </div>
        {error && <div role="alert" className="mb-6 rounded-xl bg-red-50 p-4 text-red-700">{error} <Link className="font-bold underline" href="/account/login">Sign in</Link></div>}
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <section aria-labelledby="account-orders-title" className="rounded-[2rem] border border-border bg-white p-6 sm:p-8">
            <h2 id="account-orders-title" className="mb-6 flex items-center gap-3 text-2xl font-bold"><ShoppingBag className="text-brand-green" />Order history</h2>
            {loading ? <p role="status" className="py-12 text-content-muted">Loading your collection orders…</p> : orders.length ? <ul className="divide-y divide-border">{orders.map(order => <li key={order.id} className="flex flex-wrap items-center justify-between gap-4 py-5"><div><p className="font-bold">Order {order.id.slice(0, 8).toUpperCase()}</p><p className="text-sm text-content-muted">{new Date(order.created_at).toLocaleDateString('en-AU')} · Click & Collect</p><p className="mt-1 text-sm capitalize text-content-muted">{order.status} · {order.payment_status || 'Payment pending'}</p></div><strong className="text-xl">{formatAUD(Number(order.total_amount))}</strong></li>)}</ul> : <div className="py-10"><h3 className="text-2xl font-bold">Your next deli run starts here.</h3><p className="my-4 text-content-muted">Your collection orders will appear here when you order while signed in.</p><Link href="/collections" className="home-text-link">Browse the deli <ArrowRight size={20} /></Link></div>}
          </section>
          <aside className="self-start rounded-[2rem] bg-[#cceafa] p-7">
            <MapPin className="mb-5 size-8 text-brand-green" /><h2 className="text-2xl font-bold">Collect locally.</h2><p className="mt-4 font-bold">{COLLECTION.location}</p><p className="mt-2 text-content-muted">{COLLECTION.address}</p><p className="my-4 text-sm text-content-muted">We’re Click & Collect only. No delivery address is needed.</p><a href={STORE.mapsUrl} target="_blank" rel="noreferrer" className="home-text-link">Get directions <ArrowRight size={18} /></a>
          </aside>
        </div>
      </div>
    </div>
  )
}
