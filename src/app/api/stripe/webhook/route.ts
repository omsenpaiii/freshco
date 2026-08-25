import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'

async function completeOrder(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id || session.client_reference_id
  if (!orderId || session.payment_status !== 'paid') return

  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id || null
  const { error } = await createAdminClient().rpc('complete_stripe_order', {
    p_order_id: orderId,
    p_session_id: session.id,
    p_payment_intent_id: paymentIntentId,
  })
  if (error) throw error
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
      await createAdminClient().from('orders').update({
        status: 'cancelled',
        payment_status: 'expired',
        updated_at: new Date().toISOString(),
      }).eq('stripe_checkout_session_id', session.id).eq('payment_status', 'unpaid')
    }
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(`Stripe webhook ${event.id} failed:`, error)
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 })
  }
}
