import 'server-only'

import Stripe from 'stripe'

let stripeClient: Stripe | null = null

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) throw new Error('Stripe is not configured.')

  stripeClient ??= new Stripe(secretKey, {
    apiVersion: '2026-07-29.dahlia',
    appInfo: { name: 'FreshCo Deli', version: '1.0.0' },
    telemetry: false,
  })

  return stripeClient
}
