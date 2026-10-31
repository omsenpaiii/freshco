import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { stripTypeScriptTypes } from 'node:module'
import { compileFunction } from 'node:vm'
import { COLLECTION, getDeliveryFee, STORE } from '../src/lib/store.ts'

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('all order sizes have no fulfillment surcharge', () => {
  assert.equal(COLLECTION.method, 'collection')
  assert.equal(COLLECTION.fee, 0)
  for (const subtotal of [0, 0.01, 4.99, 49.99, 50, 100, 1000]) {
    assert.equal(getDeliveryFee(subtotal), 0)
  }
})

test('pickup destination uses the store record rather than shopper address input', async () => {
  assert.ok(COLLECTION.location.includes(STORE.centre))
  assert.ok(COLLECTION.orderAddress.includes('Click & Collect'))
  const route = await source('src/app/api/stripe/checkout/route.ts')
  assert.ok(route.includes('COLLECTION.orderAddress,STORE.suburb,STORE.state,STORE.postcode'))
  assert.ok(!route.includes('body.address'))
  assert.ok(!route.includes('getDeliveryFee'))
  assert.ok(!route.includes("name: 'Local delivery'"))
  assert.ok(route.includes('const total = subtotal'))
})

test('Stripe Session and PaymentIntent carry explicit collection metadata', async () => {
  const route = await source('src/app/api/stripe/checkout/route.ts')
  assert.equal(route.match(/fulfillment_method: COLLECTION.method/g)?.length, 2)
  assert.ok(route.includes('custom_text:'))
  assert.ok(route.includes('No delivery service is available.'))
  assert.ok(route.includes('Number(variant.price) <= 0'))
})

test('checkout contact fields do not ask for a shipping address', async () => {
  const checkout = await source('src/app/checkout/page.tsx')
  assert.ok(checkout.includes('Collection contact'))
  assert.ok(checkout.includes('name="name"'))
  assert.ok(checkout.includes('name="email"'))
  assert.ok(!checkout.includes('name="address"'))
  assert.ok(!checkout.includes('name="postcode"'))
  assert.ok(checkout.includes('No collection fee'))
})

test('cart totals no longer advertise an unsupported client-only discount', async () => {
  const cart = await source('src/app/cart/page.tsx')
  const footer = await source('src/components/layout/footer.tsx')
  assert.ok(!cart.includes('FRESH10'))
  assert.ok(!cart.includes('discountAmount'))
  assert.ok(!footer.includes('10% off'))
  assert.ok(!footer.includes('setSubscribed'))
})

async function mockCheckout({ price = 12.5, stock = 100, status = 'published' } = {}) {
  const route = await source('src/app/api/stripe/checkout/route.ts')
  const js = stripTypeScriptTypes(route)
    .replace(/^import .+$/gm, '')
    .replace(/^export const runtime = .+$/m, '')
    .replace('export async function POST', 'async function POST')
  const calls = { queries: [], stripe: [] }
  const pool = {
    query: async (sql, values) => {
      calls.queries.push({ sql, values })
      if (sql.includes('SELECT v.id')) return { rows: [{
        id: 11, product_id: 1, title: '250 g', sku: 'TEST-250G', price,
        inventory_quantity: stock,
        products: { id: 1, name: 'Test cheese', slug: 'test-cheese', images: [], status },
      }] }
      if (sql.includes('INSERT INTO orders')) return { rows: [{ id: 'test-order' }] }
      return { rows: [] }
    },
  }
  const stripe = {
    checkout: { sessions: {
      create: async (params) => { calls.stripe.push(params); return { id: 'cs_test_mock', url: 'https://checkout.stripe.com/test-only' } },
      expire: async () => {},
    } },
  }
  const factory = compileFunction(`${js}\nreturn POST`, ['NextResponse', 'getNeonPool', 'COLLECTION', 'STORE', 'getStripe', 'auth'])
  const handler = factory({ json: Response.json }, () => pool, COLLECTION, STORE, () => stripe, { getSession: async () => ({ data: null }) })
  return { handler, calls }
}

const checkoutRequest = (body) => new Request('https://freshcodeli.com.au/api/stripe/checkout', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
})

test('checkout accepts collection contact without a shipping address and charges only product total', async () => {
  const { handler, calls } = await mockCheckout()
  const response = await handler(checkoutRequest({ name: 'Test Collector', email: 'collector@example.com', lines: [{ productId: 1, variantId: 11, quantity: 2 }] }))
  assert.equal(response.status, 200)
  const order = calls.queries.find(({ sql }) => sql.includes('INSERT INTO orders'))
  assert.equal(order.values[1], 25)
  assert.equal(order.values[4], COLLECTION.orderAddress)
  assert.equal(calls.stripe.length, 1)
  assert.equal(calls.stripe[0].line_items.length, 1)
  assert.equal(calls.stripe[0].metadata.fulfillment_method, 'collection')
  assert.equal(calls.stripe[0].payment_intent_data.metadata.fulfillment_method, 'collection')
  assert.equal(calls.stripe[0].shipping_address_collection, undefined)
})

test('invalid contact is rejected before a database or payment call', async () => {
  const { handler, calls } = await mockCheckout()
  const response = await handler(checkoutRequest({ name: '', email: 'invalid', lines: [{ productId: 1, variantId: 11, quantity: 1 }] }))
  assert.equal(response.status, 400)
  assert.equal(calls.queries.length, 0)
  assert.equal(calls.stripe.length, 0)
})

test('price-pending items cannot create orders or payment sessions', async () => {
  const { handler, calls } = await mockCheckout({ price: 0 })
  const response = await handler(checkoutRequest({ name: 'Test Collector', email: 'collector@example.com', lines: [{ productId: 1, variantId: 11, quantity: 1 }] }))
  assert.equal(response.status, 409)
  assert.equal(calls.queries.some(({ sql }) => sql.includes('INSERT INTO orders')), false)
  assert.equal(calls.stripe.length, 0)
})
