import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@/lib/supabase-server'
import { isAdminEmail } from '@/lib/admin-access'

export async function GET(request: NextRequest) {
  const origin = 'https://freshcodeli.com.au'
  const code = request.nextUrl.searchParams.get('code')
  const tokenHash = request.nextUrl.searchParams.get('token_hash')
  if (tokenHash && request.nextUrl.searchParams.get('type') === 'email') {
    const supabase = await createServerComponentClient()
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'email' })
    if (!error && data.user) {
      const response = NextResponse.redirect(new URL(isAdminEmail(data.user.email) ? '/admin' : '/account', origin))
      response.headers.set('Cache-Control', 'no-store')
      return response
    }
  }
  if (code) {
    const supabase = await createServerComponentClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const response = NextResponse.redirect(new URL(isAdminEmail(data.user.email) ? '/admin' : '/account', origin))
      response.headers.set('Cache-Control', 'no-store')
      return response
    }
  }
  return NextResponse.redirect(new URL('/account/login?confirmation=retry', origin))
}
