'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { isAdminEmail } from '@/lib/admin-access'
import { useStore } from '@/context/store-context'
import { Mail, Lock, AlertCircle } from 'lucide-react'

export default function LoginForm({ mode = 'customer' }: { mode?: 'customer' | 'admin' }) {
  const router = useRouter()
  const { setUser } = useStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [verificationLoading, setVerificationLoading] = useState<'send' | 'verify' | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const noticeText = params.get('verified') === '1'
      ? 'Email confirmed. You can now log in to FreshCo Deli.'
      : params.get('created') === '1'
        ? 'Your account was created. Sign in to view your collection orders.'
        : ''
    if (noticeText) {
      const timer = window.setTimeout(() => setNotice(noticeText), 0)
      return () => window.clearTimeout(timer)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setNotice('')
    setVerificationEmail('')
    setOtp('')
    setOtpSent(false)

    try {
      const { data, error: authErr } = await authClient.signIn.email({ email, password })
      if (authErr) {
        setError(authErr.message || 'Unable to log in.')
        return
      }
      if (data?.user) setUser({ id: data.user.id, email: data.user.email, name: data.user.name })

      if (mode === 'admin' && !isAdminEmail(data?.user?.email ?? email)) {
        setError('This account does not have administrator access. Use customer sign-in to view your orders.')
        return
      }
      if (mode === 'admin' && data?.user?.emailVerified !== true) {
        setVerificationEmail(data?.user?.email ?? email.trim())
        setNotice('Verify this email address before opening FreshCo admin tools. Request a code below when you are ready.')
        return
      }

      if (mode === 'admin') {
        const adminResponse = await fetch('/api/admin/status', { cache: 'no-store' })
        const adminJson = adminResponse.ok ? await adminResponse.json() : null
        if (adminJson?.isAdmin !== true) {
          setError('Your administrator session could not be verified. Please sign in again.')
          return
        }
      }
      router.push(mode === 'admin' ? '/admin' : '/account')
      router.refresh()
    } catch {
      setError('We could not reach the account service. Please try again in a moment.')
    } finally {
      setLoading(false)
    }
  }

  const handleSendVerificationCode = async () => {
    if (!verificationEmail || !isAdminEmail(verificationEmail)) return
    setVerificationLoading('send')
    setError('')
    setNotice('')

    try {
      const { data, error: otpError } = await authClient.emailOtp.sendVerificationOtp({
        email: verificationEmail,
        type: 'email-verification',
      })
      if (otpError || data?.success !== true) {
        setError(otpError?.message || 'We could not send a verification code. Please try again.')
        return
      }
      setOtpSent(true)
      setNotice(`A verification code was sent to ${verificationEmail}.`)
    } catch {
      setError('We could not send a verification code. Please try again in a moment.')
    } finally {
      setVerificationLoading(null)
    }
  }

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!verificationEmail || !isAdminEmail(verificationEmail)) return
    setVerificationLoading('verify')
    setError('')
    setNotice('')
    let emailVerified = false

    try {
      const { data, error: otpError } = await authClient.emailOtp.verifyEmail({
        email: verificationEmail,
        otp: otp.trim(),
      })
      if (otpError || data?.status !== true) {
        setError(otpError?.message || 'That code could not be verified. Check it and try again.')
        return
      }
      emailVerified = true

      const adminResponse = await fetch('/api/admin/status', { cache: 'no-store' })
      const adminJson = adminResponse.ok ? await adminResponse.json() : null
      if (adminJson?.isAdmin === true) {
        router.push('/admin')
        router.refresh()
        return
      }

      setVerificationEmail('')
      setOtp('')
      setOtpSent(false)
      setNotice('Email verified. Sign in again to continue; admin access is checked after sign-in.')
    } catch {
      if (emailVerified) {
        setVerificationEmail('')
        setOtp('')
        setOtpSent(false)
        setNotice('Email verified. Sign in again to continue; admin access is checked after sign-in.')
      } else {
        setError('We could not verify that code. Please try again.')
      }
    } finally {
      setVerificationLoading(null)
    }
  }

  return (
    <div className="account-login-surface w-full px-4 py-16">
      <div className="max-w-md mx-auto bg-white rounded-[2rem] border border-border-theme p-8 shadow-sm text-left space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <span className="eyebrow">{mode === 'admin' ? 'FreshCo staff' : 'Your local favourites'}</span>
          <h1 className="text-3xl font-extrabold text-content-strong">{mode === 'admin' ? 'Admin sign-in' : 'Welcome back.'}</h1>
          <p className="text-sm text-content-muted">{mode === 'admin' ? 'Sign in with your verified administrator account to manage the deli catalogue.' : 'Sign in to view your collection orders and keep your favourites close.'}</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-500 rounded-xl p-3.5 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {notice && <div role="status" className="rounded-xl border border-green-100 bg-green-50 p-3.5 text-xs font-semibold text-green-700">{notice}</div>}

        {verificationEmail && (
          <section aria-label="Verify admin email" className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-3">
            <div>
              <h2 className="text-sm font-bold text-content-strong">Verify your email</h2>
              <p className="mt-1 text-xs text-content-muted">Administrator access is available only after verifying {verificationEmail}.</p>
            </div>
            <button
              type="button"
              onClick={handleSendVerificationCode}
              disabled={verificationLoading !== null}
              className="w-full rounded-full border border-primary bg-white py-2.5 text-xs font-bold uppercase tracking-wider text-primary transition hover:bg-blue-50 disabled:opacity-60"
            >
              {verificationLoading === 'send' ? 'Sending code...' : otpSent ? 'Send a new code' : 'Send verification code'}
            </button>
            {otpSent && (
              <form onSubmit={handleVerifyEmail} className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-[10px] uppercase font-bold text-content-muted">Verification code</span>
                  <input
                    type="text"
                    required
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    className="w-full rounded-lg border border-border-theme bg-white px-4 py-2.5 text-sm font-semibold text-content-strong focus:outline-none focus:border-primary"
                    placeholder="Enter the code from your email"
                  />
                </label>
                <button
                  type="submit"
                  disabled={verificationLoading !== null || !otp.trim()}
                  className="w-full rounded-full bg-primary py-3 text-xs font-bold uppercase tracking-wider text-white transition disabled:bg-gray-300"
                >
                  {verificationLoading === 'verify' ? 'Verifying...' : 'Verify email'}
                </button>
              </form>
            )}
          </section>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="login-email" className="block text-sm font-bold text-content-muted">Email address</label>
            <div className="relative">
              <input 
                type="email" 
                id="login-email"
                autoComplete="username"
                required 
                placeholder="yourname@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-border-theme rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-primary text-xs font-semibold text-content-strong"
              />
              <Mail size={14} className="text-content-muted absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="login-password" className="block text-sm font-bold text-content-muted">Password</label>
            <div className="relative">
              <input 
                type="password" 
                id="login-password"
                autoComplete="current-password"
                required 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-border-theme rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-primary text-xs font-semibold text-content-strong"
              />
              <Lock size={14} className="text-content-muted absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary hover:bg-[#d89311] disabled:bg-gray-300 text-white font-bold text-xs py-3.5 rounded-full transition shadow-sm hover:shadow-md uppercase tracking-wider cursor-pointer"
          >
            {loading ? 'Logging In...' : 'Log In'}
          </button>
        </form>

        <div className="text-center pt-2 text-xs font-semibold text-content-muted">
          {mode === 'admin' ? <Link href="/account/login" className="text-primary hover:underline">Customer sign-in instead</Link> : <>New to FreshCo?{' '}<Link href="/account/register" className="text-primary hover:underline">Create an account</Link></>}
        </div>

      </div>
    </div>
  )
}
