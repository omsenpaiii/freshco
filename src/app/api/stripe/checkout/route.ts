import { NextResponse } from 'next/server'
import { getNeonPool } from '@/lib/neon'
import { getDeliveryFee } from '@/lib/store'
import { getStripe } from '@/lib/stripe'
import { auth } from '@/lib/auth/server'

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

    const pool = getNeonPool()
    const { rows } = await pool.query(`SELECT v.id,v.product_id,v.title,v.sku,v.price,v.inventory_quantity,
      jsonb_build_object('id',p.id,'name',p.name,'slug',p.slug,'images',p.images,'status',p.status) products
      FROM product_variants v JOIN products p ON p.id=v.product_id WHERE v.id=ANY($1::bigint[])`, [[...requested.keys()]])
    const variants = rows as unknown as CatalogVariantRow[]
    if (variants.length !== requested.size) {
      return NextResponse.json({ error: 'One or more cart items are no longer available.' }, { status: 409 })
    }

    let subtotal = 0
    for (const variant of variants) {
      const line = requested.get(Number(variant.id))!
      if (!variant.products || variant.products.status !== 'published' || Number(variant.product_id) !== line.productId) {
        return NextResponse.json({ error: 'One or more cart items are no longer available.' }, { status: 409 })
      }
      if (!Number.isFinite(Number(variant.price)) || Number(variant.price) <= 0) {
        return NextResponse.json({ error: `${variant.products.name} is not available to purchase yet.` }, { status: 409 })
      }
      if (variant.inventory_quantity < line.quantity) {
        return NextResponse.json({ error: `${variant.products.name} does not have enough stock.` }, { status: 409 })
      }
      subtotal += Number(variant.price) * line.quantity
    }

    subtotal = Math.round(subtotal * 100) / 100
    const deliveryFee = getDeliveryFee(subtotal)
    const total = Math.round((subtotal + deliveryFee) * 100) / 100
    let profileId: string | null = null
    try {
      const { data: session } = await auth.getSession()
      profileId = session?.user?.id || null
      if (profileId) await pool.query(`INSERT INTO profiles (id,email,full_name) VALUES ($1,$2,$3)
        ON CONFLICT (id) DO UPDATE SET email=EXCLUDED.email,full_name=COALESCE(profiles.full_name,EXCLUDED.full_name)`,
        [profileId, session!.user.email, session!.user.name || null])
    } catch (authError) {
      console.warn('Checkout could not attach a signed-in profile to the order:', authError)
    }
    const { rows: orderRows } = await pool.query(`INSERT INTO orders
      (profile_id,total_amount,status,payment_status,currency,shipping_name,shipping_email,shipping_address,shipping_city,shipping_state,shipping_postal_code,shipping_country)
      VALUES($1,$2,'pending','unpaid','aud',$3,$4,$5,$6,$7,$8,'Australia') RETURNING id`,
      [profileId,total,shipping.name,shipping.email,shipping.address,shipping.city,shipping.state,shipping.postcode])
    const order = orderRows[0]
    if (!order) throw new Error('Order could not be created.')
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
    for (const item of orderItems) await pool.query(`INSERT INTO order_items(order_id,product_id,variant_id,variant_title,sku,quantity,price)
      VALUES($1,$2,$3,$4,$5,$6,$7)`, [item.order_id,item.product_id,item.variant_id,item.variant_title,item.sku,item.quantity,item.price])

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

    await pool.query('UPDATE orders SET stripe_checkout_session_id=$1,updated_at=now() WHERE id=$2',[session.id,order.id])

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe Checkout creation failed:', error)
    try {
      if (stripeSessionId) await getStripe().checkout.sessions.expire(stripeSessionId)
      if (orderId) await getNeonPool().query('DELETE FROM orders WHERE id=$1', [orderId])
    } catch (cleanupError) {
      console.error('Checkout cleanup failed:', cleanupError)
    }
    return NextResponse.json({ error: 'Secure checkout is temporarily unavailable. Please try again.' }, { status: 500 })
  }
}
