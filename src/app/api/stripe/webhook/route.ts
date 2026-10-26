import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { query } from '@/lib/neon'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'

async function completeOrder(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id || session.client_reference_id
  if (!orderId || session.payment_status !== 'paid') return

  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id || null
  await query('SELECT complete_stripe_order($1,$2,$3)', [orderId, session.id, paymentIntentId])
}

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook is not configured.' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, webhookSecret)
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      await completeOrder(event.data.object)
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object
      await query("UPDATE orders SET status='cancelled',payment_status='expired',updated_at=now() WHERE stripe_checkout_session_id=$1 AND payment_status='unpaid'", [session.id])
    }
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(`Stripe webhook ${event.id} failed:`, error)
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 })
  }
}
