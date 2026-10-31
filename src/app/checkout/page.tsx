'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { LockKeyhole, MapPin, ShieldCheck, User } from 'lucide-react'
import { useStore } from '@/context/store-context'
import { COLLECTION, formatAUD, STORE } from '@/lib/store'

export default function CheckoutPage() {
  const { cart } = useStore()
  const [form, setForm] = useState({ name: '', email: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = subtotal

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          lines: cart.map((item) => ({ productId: item.product_id, variantId: item.variant_id, quantity: item.quantity })),
        }),
      })
      const result = await response.json() as { url?: string; error?: string }
      if (!response.ok || !result.url) throw new Error(result.error || 'Checkout could not be started.')
      window.location.assign(result.url)
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Checkout could not be started.')
      setIsSubmitting(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="w-full bg-white py-20 text-center space-y-4">
        <h1 className="text-xl font-bold text-content-strong">Your cart is empty</h1>
        <p className="text-xs text-content-muted">Add products to your cart before checking out.</p>
        <Link href="/collections" className="inline-block rounded-full bg-primary px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#d89311]">Shop now</Link>
      </div>
    )
  }

  return (
    <div className="w-full bg-[#f8f9fa] px-4 py-12 md:px-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-3 text-3xl font-extrabold text-content-strong">Click & Collect checkout</h1>
        <p className="mb-8 border-b border-border-theme pb-5 text-base leading-7 text-content-muted">Order online and collect from FreshCo Deli at Northcote Plaza. Delivery is not available.</p>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8 text-left lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <section className="space-y-4 rounded-2xl border border-border-theme bg-white p-6 shadow-2xs">
              <h2 className="flex items-center gap-2 border-b border-gray-100 pb-3 text-lg font-bold text-content-strong"><User size={20} className="text-primary" /> Collection contact</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full name" name="name" value={form.name} onChange={handleChange} autoComplete="name" />
                <Field label="Email address" name="email" type="email" value={form.email} onChange={handleChange} autoComplete="email" />
              </div>
              <p className="text-sm leading-6 text-content-muted">Use the name of the person collecting the order and an email address for the payment receipt.</p>
            </section>

            <section className="space-y-3 rounded-2xl border border-border-theme bg-white p-6 shadow-2xs">
              <h2 className="flex items-center gap-2 text-lg font-bold text-content-strong"><MapPin size={20} className="text-primary" /> Collect from the deli</h2>
              <p className="text-base font-bold text-content-strong">{COLLECTION.location}</p>
              <p className="text-sm text-content-muted">{COLLECTION.address}</p>
              <p className="text-sm leading-6 text-content-muted">Please call the deli to confirm your collection arrangements. Placing an order does not guarantee an immediate pickup time.</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-primary">
                <a href={STORE.phoneHref} className="underline underline-offset-4">{STORE.phone}</a>
                <a href={STORE.mapsUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4">Get directions</a>
              </div>
            </section>

            <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-blue-700"><LockKeyhole size={19} /></div>
                <div className="space-y-1">
                  <h2 className="text-base font-extrabold text-content-strong">Payment handled securely by Stripe</h2>
                  <p className="text-sm leading-6 text-content-muted">After you review your order, you’ll continue to Stripe’s encrypted checkout to choose an available payment method. FreshCo Deli never sees or stores your card number.</p>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <div className="space-y-4 rounded-2xl border border-border-theme bg-white p-6 shadow-2xs">
              <h2 className="border-b border-gray-100 pb-3 text-sm font-bold uppercase tracking-wider text-content-strong">Your order</h2>
              <div className="max-h-56 divide-y divide-gray-100 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={`${item.product_id}:${item.variant_id}`} className="flex items-center justify-between gap-3 py-2.5 text-xs font-semibold text-content-strong">
                    <span className="line-clamp-2">{item.name} <span className="text-[10px] text-content-muted">({item.variant_title}) ×{item.quantity}</span></span>
                    <span className="shrink-0 font-bold text-primary">{formatAUD(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-border-theme pt-4 text-xs font-semibold text-content-strong">
                <div className="flex justify-between"><span className="text-content-muted">Subtotal</span><span>{formatAUD(subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-content-muted">Click & Collect</span><span>No collection fee</span></div>
                <div className="flex justify-between"><span className="text-content-muted">GST</span><span>Included</span></div>
              </div>
              <div className="flex items-center justify-between border-t border-border-theme pt-4 font-bold text-content-strong"><span className="text-sm">Total</span><span className="text-lg text-primary">{formatAUD(total)}</span></div>
              {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</p>}
              <button type="submit" disabled={isSubmitting} className="block w-full cursor-pointer rounded-full bg-primary py-3.5 text-center text-xs font-bold uppercase tracking-wider text-white shadow-md transition hover:bg-[#d89311] disabled:cursor-wait disabled:bg-gray-300">{isSubmitting ? 'Opening secure checkout…' : `Continue to payment · ${formatAUD(total)}`}</button>
              <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-content-muted"><ShieldCheck size={13} className="text-green-600" /> Server-verified prices · Stripe-hosted payment</div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  )
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }

function Field({ label, name, ...props }: FieldProps) {
  return (
    <label className="space-y-1">
      <span className="block text-sm font-bold text-content-muted">{label}</span>
      <input name={name} required {...props} className="min-h-12 w-full rounded-lg border border-border-theme bg-white px-4 py-3 text-base font-semibold text-content-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
    </label>
  )
}
