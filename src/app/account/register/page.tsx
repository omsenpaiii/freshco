'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth/client'
import { isAdminEmail } from '@/lib/admin-access'
import { Mail, Lock, User, AlertCircle } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [verificationLoading, setVerificationLoading] = useState<'send' | 'verify' | null>(null)
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    setVerificationEmail('')
    setOtp('')
    setOtpSent(false)

    if (password !== confirmPassword) {
      setError("Passwords do not match!")
      setLoading(false)
      return
    }

    try {
      const { data, error: authErr } = await authClient.signUp.email({
        email,
        password,
        name: fullName,
        callbackURL: new URL('/account/login?created=1', window.location.origin).toString(),
      })

      if (authErr) {
        setError(authErr.message || 'Unable to create your account.')
        return
      }

      const isAllowlistedUnverified = isAdminEmail(email) && data?.user?.emailVerified !== true
      if (isAllowlistedUnverified) {
        setVerificationEmail(data?.user?.email ?? email.trim())
        setSuccess('Account created. Verify this email before FreshCo administrator access is available. Request a code below when you are ready.')
      } else if (isAdminEmail(email)) {
        setSuccess('Account created. Sign in to continue; administrator access is checked by the server after sign-in.')
      } else {
        setSuccess('Your account is ready. You can now log in to FreshCo Deli.')
      }
      setFullName('')
      setEmail(isAllowlistedUnverified ? (data?.user?.email ?? email.trim()) : '')
      setPassword('')
      setConfirmPassword('')
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
    setSuccess('')

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
      setSuccess(`A verification code was sent to ${verificationEmail}.`)
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
    setSuccess('')
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

      setSuccess('Email verified. Sign in to continue; administrator access is checked after sign-in.')
      setVerificationEmail('')
      setOtp('')
      setOtpSent(false)
    } catch {
      if (emailVerified) {
        setSuccess('Email verified. Sign in to continue; administrator access is checked by the server after sign-in.')
        setVerificationEmail('')
        setOtp('')
        setOtpSent(false)
      } else {
        setError('We could not verify that code. Please try again.')
      }
    } finally {
      setVerificationLoading(null)
    }
  }

  return (
    <div className="w-full bg-[#f8f9fa] px-4 py-16">
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-border-theme p-8 shadow-md text-left space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-content-strong">Create Account</h1>
          <p className="text-sm text-content-muted">Create an account to view your Click &amp; Collect orders and keep your deli favourites close. No delivery address needed.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-500 rounded-xl p-3.5 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-100 text-green-600 rounded-xl p-3.5 text-xs font-semibold">
            {success}
          </div>
        )}

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

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold text-content-muted">Full Name</label>
            <div className="relative">
              <input 
                type="text" 
                required 
                placeholder="John Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-white border border-border-theme rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-primary text-xs font-semibold text-content-strong"
              />
              <User size={14} className="text-content-muted absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold text-content-muted">Email Address</label>
            <div className="relative">
              <input 
                type="email" 
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
            <label className="block text-[10px] uppercase font-bold text-content-muted">Password</label>
            <div className="relative">
              <input 
                type="password" 
                required 
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-border-theme rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-primary text-xs font-semibold text-content-strong"
              />
              <Lock size={14} className="text-content-muted absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold text-content-muted">Confirm Password</label>
            <div className="relative">
              <input 
                type="password" 
                required 
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="text-center pt-2 text-xs font-semibold text-content-muted">
          Already have an account?{' '}
          <Link href="/account/login" className="text-primary hover:underline">
            Log In Here
          </Link>
        </div>

      </div>
    </div>
  )
}
