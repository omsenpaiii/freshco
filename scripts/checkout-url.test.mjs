import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkoutOrigin } from '../src/lib/checkout-url.ts'

test('production payment URLs always return to the canonical HTTPS storefront', () => {
  for (const configured of [undefined, 'freshcodeli.com.au', '"https://freshcodeli.com.au"', 'http://localhost:3000', 'https://wrong.example']) {
    assert.equal(checkoutOrigin('https://preview.vercel.app/api/stripe/checkout', configured, 'production'), 'https://freshcodeli.com.au')
  }
})
test('normalizes valid configured origins and removes paths, query and hash', () => {
  assert.equal(checkoutOrigin('https://preview.vercel.app/api', ' "https://freshcodeli.com.au/path?x=1#test" '), 'https://freshcodeli.com.au')
})
test('malformed, credential-bearing and unsafe config falls back to the request origin', () => {
  for (const configured of ['freshcodeli.com.au', 'https://freshcodeli.com.au\ninvalid', 'javascript:alert(1)', 'https://name:pass@example.com', 'http://example.com']) {
    assert.equal(checkoutOrigin('https://preview.vercel.app/api', configured), 'https://preview.vercel.app')
  }
})
test('local development remains supported; invalid origins use the canonical fallback', () => {
  assert.equal(checkoutOrigin('http://localhost:3000/api'), 'http://localhost:3000')
  assert.equal(checkoutOrigin('not-a-url', 'not-a-url'), 'https://freshcodeli.com.au')
})
