import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createServerComponentClient } from '@/lib/supabase-server'
import { getDeliveryFee } from '@/lib/store'
import { getStripe } from '@/lib/stripe'

export const runtime = 'nodejs'

type CheckoutLine = { productId?: unknown; variantId?: unknown; quantity?: unknown }
type CheckoutBody = {
  name?: unknown
  email?: unknown
  address?: unknown
  city?: unknown
  state?: unknown
  postcode?: unknown
  lines?: unknown
}

type CatalogVariantRow = {
  id: number
  product_id: number
  title: string
  sku: string
  price: number | string
  inventory_quantity: number
  products: { id: number; name: string; slug: string; images: string[]; status: string } | null
}

const text = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : ''

export async function POST(request: Request) {
  let orderId: string | null = null
  let stripeSessionId: string | null = null

  try {
    const body = await request.json() as CheckoutBody
    const shipping = {
      name: text(body.name, 120),
      email: text(body.email, 254).toLowerCase(),
      address: text(body.address, 240),
      city: text(body.city, 100),
      state: text(body.state, 40).toUpperCase(),
      postcode: text(body.postcode, 12),
    }
    if (!shipping.name || !/^\S+@\S+\.\S+$/.test(shipping.email) || !shipping.address || !shipping.city || !shipping.state || !shipping.postcode) {
      return NextResponse.json({ error: 'Please complete every shipping field.' }, { status: 400 })
    }

    if (!Array.isArray(body.lines) || body.lines.length === 0 || body.lines.length > 50) {
      return NextResponse.json({ error: 'Your cart is empty or too large.' }, { status: 400 })
    }

    const requested = new Map<number, { productId: number; quantity: number }>()
    for (const rawLine of body.lines as CheckoutLine[]) {
      const productId = Number(rawLine.productId)
      const variantId = Number(rawLine.variantId)
      const quantity = Number(rawLine.quantity)
      if (!Number.isInteger(productId) || !Number.isInteger(variantId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        return NextResponse.json({ error: 'Your cart contains an invalid item.' }, { status: 400 })
      }
      const prior = requested.get(variantId)
      requested.set(variantId, { productId, quantity: (prior?.quantity || 0) + quantity })
    }
    if ([...requested.values()].some((line) => line.quantity > 20)) {
      return NextResponse.json({ error: 'A cart line exceeds the 20-item limit.' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { data, error: catalogError } = await admin
      .from('product_variants')
      .select('id, product_id, title, sku, price, inventory_quantity, products!inner(id, name, slug, images, status)')
      .in('id', [...requested.keys()])
    if (catalogError) throw catalogError

    const variants = (data || []) as unknown as CatalogVariantRow[]
    if (variants.length !== requested.size) {
      return NextResponse.json({ error: 'One or more cart items are no longer available.' }, { status: 409 })
    }

    let subtotal = 0
    for (const variant of variants) {
      const line = requested.get(Number(variant.id))!
      if (!variant.products || variant.products.status !== 'published' || Number(variant.product_id) !== line.productId) {
        return NextResponse.json({ error: 'One or more cart items are no longer available.' }, { status: 409 })
      }
      if (variant.inventory_quantity < line.quantity) {
        return NextResponse.json({ error: `${variant.products.name} does not have enough stock.` }, { status: 409 })
      }
      subtotal += Number(variant.price) * line.quantity
    }

    subtotal = Math.round(subtotal * 100) / 100
    const deliveryFee = getDeliveryFee(subtotal)
    const total = Math.round((subtotal + deliveryFee) * 100) / 100
    const publicClient = await createServerComponentClient()
    const { data: { user } } = await publicClient.auth.getUser()

    const { data: order, error: orderError } = await admin.from('orders').insert({
      profile_id: user?.id || null,
      total_amount: total,
      status: 'pending',
      payment_status: 'unpaid',
      currency: 'aud',
      shipping_name: shipping.name,
      shipping_email: shipping.email,
      shipping_address: shipping.address,
      shipping_city: shipping.city,
      shipping_state: shipping.state,
      shipping_postal_code: shipping.postcode,
      shipping_country: 'Australia',
    }).select('id').single()
    if (orderError || !order) throw orderError || new Error('Order could not be created.')
    orderId = order.id

    const orderItems = variants.map((variant) => {
      const line = requested.get(Number(variant.id))!
      return {
        order_id: order.id,
        product_id: variant.product_id,
        variant_id: variant.id,
        variant_title: variant.title,
        sku: variant.sku,
        quantity: line.quantity,
        price: Number(variant.price),
      }
    })
    const { error: itemError } = await admin.from('order_items').insert(orderItems)
    if (itemError) throw itemError

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin).replace(/\/$/, '')
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      locale: 'en-GB',
      customer_email: shipping.email,
      client_reference_id: order.id,
      metadata: { order_id: order.id },
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout?canceled=1`,
      line_items: [
        ...variants.map((variant) => {
          const line = requested.get(Number(variant.id))!
          const image = variant.products?.images?.find((url) => /^https:\/\//.test(url))
          return {
            quantity: line.quantity,
            price_data: {
              currency: 'aud',
              unit_amount: Math.round(Number(variant.price) * 100),
              product_data: {
                name: variant.products!.name,
                description: `${variant.title} · ${variant.sku}`,
                ...(image ? { images: [image] } : {}),
              },
            },
          }
        }),
        ...(deliveryFee > 0 ? [{
          quantity: 1,
          price_data: {
            currency: 'aud',
            unit_amount: Math.round(deliveryFee * 100),
            product_data: { name: 'Local delivery' },
          },
        }] : []),
      ],
    }, { idempotencyKey: `freshco-checkout-${order.id}` })
    stripeSessionId = session.id
    if (!session.url) throw new Error('Stripe did not return a Checkout URL.')

    const { error: sessionError } = await admin.from('orders').update({
      stripe_checkout_session_id: session.id,
      updated_at: new Date().toISOString(),
    }).eq('id', order.id)
    if (sessionError) throw sessionError

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe Checkout creation failed:', error)
    try {
      if (stripeSessionId) await getStripe().checkout.sessions.expire(stripeSessionId)
      if (orderId) await createAdminClient().from('orders').delete().eq('id', orderId)
    } catch (cleanupError) {
      console.error('Checkout cleanup failed:', cleanupError)
    }
    return NextResponse.json({ error: 'Secure checkout is temporarily unavailable. Please try again.' }, { status: 500 })
  }
}
