import assert from 'node:assert/strict'
import test from 'node:test'
import { provenanceText } from '../src/lib/catalog-provenance.ts'

test('partial product/category edits preserve omitted provenance', () => {
  for (const field of ['product_source_url', 'image_source_url', 'image_license']) {
    assert.equal(provenanceText({ name: 'Updated name' }, field, 'Existing source or permission note'), 'Existing source or permission note')
  }
})

test('explicit updates trim and replace provenance', () => {
  assert.equal(provenanceText({ image_license: '  Supplier permission received  ' }, 'image_license', 'Old note'), 'Supplier permission received')
})

test('explicit blank or null can intentionally clear a provenance field', () => {
  assert.equal(provenanceText({ image_license: '' }, 'image_license', 'Old note'), null)
  assert.equal(provenanceText({ image_license: null }, 'image_license', 'Old note'), null)
})

test('new records without provenance remain unset', () => {
  assert.equal(provenanceText({}, 'image_license'), null)
})
