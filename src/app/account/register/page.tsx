'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@/lib/supabase-client'
import { ChevronRight, Mail, Lock, User, AlertCircle } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  
  const supabase = createClientComponentClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError("Passwords do not match!")
      setLoading(false)
      return
    }

    const { error: authErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })

    if (authErr) {
      setError(authErr.message)
      setLoading(false)
    } else {
      setSuccess("Registration successful! Check your email for a confirmation link or try logging in.")
      setLoading(false)
      setFullName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <div className="w-full bg-[#f8f9fa] px-4 py-16">
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-border-theme p-8 shadow-md text-left space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-secondary">Create Account</h1>
          <p className="text-xs text-gray-400">Join Vegist to unlock personalized farm-fresh shopping benefits.</p>
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

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold text-gray-400">Full Name</label>
            <div className="relative">
              <input 
                type="text" 
                required 
                placeholder="John Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-white border border-border-theme rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-primary text-xs font-semibold text-secondary"
              />
              <User size={14} className="text-gray-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

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
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border border-border-theme rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:border-primary text-xs font-semibold text-secondary"
              />
              <Lock size={14} className="text-gray-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] uppercase font-bold text-gray-400">Confirm Password</label>
            <div className="relative">
              <input 
                type="password" 
                required 
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="text-center pt-2 text-xs font-semibold text-gray-400">
          Already have an account?{' '}
          <Link href="/account/login" className="text-primary hover:underline">
            Log In Here
          </Link>
        </div>

      </div>
    </div>
  )
}
