import { test } from 'node:test'
import assert from 'node:assert/strict'
import { pageMetadata, plainDescription, serializeJsonLd, SITE_URL } from '../src/lib/seo.ts'

test('metadata uses the canonical storefront and unique route identity', () => {
  assert.equal(SITE_URL, 'https://freshcodeli.com.au')
  const metadata = pageMetadata('Feta', '/collections/feta', 'Shop feta for local collection.')
  assert.equal(metadata.alternates.canonical, '/collections/feta')
  assert.equal(metadata.openGraph.locale, 'en_AU')
  assert.equal(metadata.twitter.card, 'summary_large_image')
})
test('catalogue descriptions are plain, bounded text', () => {
  assert.equal(plainDescription('<p>Greek <b>feta</b></p>'), 'Greek feta')
  assert.equal(plainDescription('x'.repeat(500)).length, 160)
})
test('JSON-LD cannot close its enclosing script element', () => {
  const output = serializeJsonLd({ name: '</script><script>alert(1)</script>' })
  assert.ok(!output.includes('<'))
  assert.equal(JSON.parse(output).name, '</script><script>alert(1)</script>')
})
