import assert from 'node:assert/strict'
import test from 'node:test'

import { isAdminEmail, isVerifiedAdmin } from '../src/lib/admin-access.ts'

test('admin email allowlist is normalized', () => {
  assert.equal(isAdminEmail(' TINYATLAS01@GMAIL.COM '), true)
  assert.equal(isAdminEmail('unknown@example.com'), false)
  assert.equal(isAdminEmail(null), false)
})

test('admin access requires an explicitly verified allowlisted email', () => {
  assert.equal(isVerifiedAdmin('tinyatlas01@gmail.com', true), true)
  assert.equal(isVerifiedAdmin(' TINYATLAS01@GMAIL.COM ', true), true)
  assert.equal(isVerifiedAdmin('tinyatlas01@gmail.com', false), false)
  assert.equal(isVerifiedAdmin('tinyatlas01@gmail.com', undefined), false)
  assert.equal(isVerifiedAdmin('tinyatlas01@gmail.com', 'true'), false)
  assert.equal(isVerifiedAdmin('unknown@example.com', true), false)
})
