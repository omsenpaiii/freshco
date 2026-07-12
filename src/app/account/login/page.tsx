'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase-client'
import { ChevronRight, Mail, Lock, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authErr) {
      setError(authErr.message)
      setLoading(false)
    } else {
      router.push('/account')
      router.refresh()
    }
  }

  return (
    <div className="w-full bg-[#f8f9fa] px-4 py-16">
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-border-theme p-8 shadow-md text-left space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-secondary">Welcome Back</h1>
          <p className="text-xs text-gray-400">Log in to manage your orders, cart, and address details.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-500 rounded-xl p-3.5 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold text-gray-400">Email Address</label>
            <div className="relative">
              <input 
                type="email" 
                required 
                placeholder="yourname@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border border-border-theme rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-primary text-xs font-semibold text-secondary"
              />
              <Mail size={14} className="text-gray-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold text-gray-400">Password</label>
            <div className="relative">
              <input 
                type="password" 
                required 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-border-theme rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-primary text-xs font-semibold text-secondary"
              />
              <Lock size={14} className="text-gray-400 absolute left-3.5 top-3.5" />
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

        <div className="text-center pt-2 text-xs font-semibold text-gray-400">
          New to Vegist?{' '}
          <Link href="/account/register" className="text-primary hover:underline">
            Register an Account
          </Link>
        </div>

      </div>
    </div>
  )
}
