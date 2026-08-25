import Link from 'next/link'
import { CheckCircle, Clock3, XCircle } from 'lucide-react'
import { ClearPaidCart } from './clear-cart'
import { createAdminClient } from '@/lib/supabase-admin'
import { formatAUD } from '@/lib/store'
import { getStripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams
  if (!sessionId || !sessionId.startsWith('cs_')) return <PaymentState />

  let session
  let order: { id: string; total_amount: number | string; shipping_email: string; payment_status: string } | null = null
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId)
    const { data } = await createAdminClient().from('orders')
      .select('id, total_amount, shipping_email, payment_status')
      .eq('stripe_checkout_session_id', session.id)
      .single()
    order = data
  } catch (error) {
    console.error('Checkout confirmation failed:', error)
    return <PaymentState />
  }

  const paid = session.payment_status === 'paid'
  return (
    <div className="w-full bg-[#f8f9fa] px-4 py-20">
      <ClearPaidCart paid={paid} />
      <div className="mx-auto max-w-md space-y-6 rounded-2xl border border-border-theme bg-white p-8 text-center shadow-lg">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${paid ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
          {paid ? <CheckCircle size={36} /> : <Clock3 size={36} />}
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-content-strong">{paid ? 'Payment confirmed' : 'Payment processing'}</h1>
          <p className="text-xs text-content-muted">{paid ? 'Thank you. FreshCo Deli is preparing your order.' : 'We will update your order as soon as Stripe confirms payment.'}</p>
        </div>
        {order && (
          <div className="space-y-2 rounded-xl border border-border-theme bg-gray-50 p-4 text-left text-xs font-semibold">
            <div className="flex justify-between gap-4"><span className="text-content-muted">Order</span><span>{order.id.slice(0, 8).toUpperCase()}</span></div>
            <div className="flex justify-between gap-4"><span className="text-content-muted">Total</span><span>{formatAUD(order.total_amount)}</span></div>
            <div className="flex justify-between gap-4"><span className="text-content-muted">Receipt email</span><span className="truncate">{order.shipping_email}</span></div>
          </div>
        )}
        <Link href="/" className="block w-full rounded-full bg-primary py-3 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#d89311]">Continue shopping</Link>
      </div>
    </div>
  )
}

function PaymentState() {
  return (
    <div className="w-full bg-[#f8f9fa] px-4 py-20">
      <div className="mx-auto max-w-md space-y-5 rounded-2xl border border-border-theme bg-white p-8 text-center">
        <XCircle className="mx-auto text-red-500" size={42} />
        <h1 className="text-xl font-extrabold text-content-strong">We could not verify this payment</h1>
        <p className="text-xs text-content-muted">Please check your receipt email or contact FreshCo Deli before trying again.</p>
        <Link href="/checkout" className="inline-block rounded-full bg-primary px-6 py-3 text-xs font-bold uppercase text-white">Return to checkout</Link>
      </div>
    </div>
  )
}
