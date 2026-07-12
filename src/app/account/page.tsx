'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useStore } from '@/context/store-context'
import { createClientComponentClient } from '@/lib/supabase-client'
import { 
  User, MapPin, ShoppingBag, Plus, Trash2, Home, LogOut, ChevronRight, CheckCircle, Clock 
} from 'lucide-react'

export default function AccountDashboardPage() {
  const router = useRouter()
  const { user, clearCart } = useStore()
  const [addresses, setAddresses] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newAddress, setNewAddress] = useState({
    line1: '', city: '', state: '', zip: '', phone: ''
  })
  const [showAddressForm, setShowAddressForm] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Check auth status
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/account/login')
      } else {
        fetchAccountData(session.user.id)
      }
    }
    checkAuth()
  }, [router, supabase])

  const fetchAccountData = async (userId: string) => {
    try {
      // Fetch addresses
      const { data: addrData } = await supabase
        .from('addresses')
        .select('*')
        .eq('profile_id', userId)
      if (addrData) setAddresses(addrData)

      // Fetch orders
      const { data: ordData } = await supabase
        .from('orders')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false })
      if (ordData) setOrders(ordData)
    } catch (e) {
      console.warn("Failed to fetch database profiles data", e)
    } finally {
      setLoading(false)
    }
  }

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const { data, error } = await supabase.from('addresses').insert({
        profile_id: user.id,
        address_line_1: newAddress.line1,
        city: newAddress.city,
        state: newAddress.state,
        postal_code: newAddress.zip,
        phone: newAddress.phone,
        country: 'United States'
      }).select()

      if (!error && data) {
        setAddresses(prev => [...prev, ...data])
        setNewAddress({ line1: '', city: '', state: '', zip: '', phone: '' })
        setShowAddressForm(false)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteAddress = async (addrId: string) => {
    try {
      const { error } = await supabase.from('addresses').delete().eq('id', addrId)
      if (!error) {
        setAddresses(prev => prev.filter(a => a.id !== addrId))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    clearCart()
    router.push('/account/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="w-full bg-white py-20 text-center text-xs font-semibold text-gray-400">
        Loading dashboard details...
      </div>
    )
  }

  return (
    <div className="w-full bg-[#f8f9fa] px-4 md:px-8 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Breadcrumbs Row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-theme pb-5">
          <div className="text-left">
            <h1 className="text-xl md:text-2xl font-extrabold text-secondary">My Account</h1>
            <p className="text-xs text-gray-400 mt-1">Hello, <span className="text-secondary font-bold">{user?.email}</span></p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 transition cursor-pointer"
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Column 1: Addresses */}
          <div className="md:col-span-1 bg-white border border-border-theme p-6 rounded-2xl shadow-2xs space-y-6 text-left">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-secondary flex items-center gap-2 uppercase tracking-wider">
                <MapPin size={16} className="text-primary" /> Saved Addresses
              </h3>
              <button 
                onClick={() => setShowAddressForm(!showAddressForm)}
                className="text-primary hover:text-[#d89311] p-1 cursor-pointer"
              >
                <Plus size={16} />
              </button>
            </div>

            {showAddressForm && (
              <form onSubmit={handleAddAddress} className="bg-gray-50 border border-border-theme p-4 rounded-xl space-y-3">
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase font-bold text-gray-400">Street Address</label>
                  <input 
                    type="text" 
                    required 
                    value={newAddress.line1}
                    onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })}
                    className="w-full bg-white border border-border-theme rounded-lg py-2 px-3 text-xs text-secondary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] uppercase font-bold text-gray-400">City</label>
                    <input 
                      type="text" 
                      required 
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="w-full bg-white border border-border-theme rounded-lg py-2 px-3 text-xs text-secondary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] uppercase font-bold text-gray-400">State</label>
                    <input 
                      type="text" 
                      required 
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="w-full bg-white border border-border-theme rounded-lg py-2 px-3 text-xs text-secondary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[9px] uppercase font-bold text-gray-400">Zip Code</label>
                    <input 
                      type="text" 
                      required 
                      value={newAddress.zip}
                      onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })}
                      className="w-full bg-white border border-border-theme rounded-lg py-2 px-3 text-xs text-secondary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[9px] uppercase font-bold text-gray-400">Phone</label>
                    <input 
                      type="text" 
                      required 
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      className="w-full bg-white border border-border-theme rounded-lg py-2 px-3 text-xs text-secondary"
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full bg-primary hover:bg-[#d89311] text-white text-[10px] font-bold py-2 rounded-lg transition uppercase tracking-wider"
                >
                  Save Address
                </button>
              </form>
            )}

            {/* List saved addresses */}
            <div className="space-y-4">
              {addresses.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No saved addresses yet.</p>
              ) : (
                addresses.map((addr) => (
                  <div key={addr.id} className="border border-border-theme rounded-xl p-4 space-y-2 relative bg-gray-50/50">
                    <p className="text-xs text-secondary font-semibold leading-relaxed">
                      {addr.address_line_1}<br />
                      {addr.city}, {addr.state} {addr.postal_code}<br />
                      <span className="text-[10px] text-gray-400">Tel: {addr.phone}</span>
                    </p>
                    <button 
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition p-1 cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Order History */}
          <div className="md:col-span-2 bg-white border border-border-theme p-6 rounded-2xl shadow-2xs space-y-6 text-left">
            <h3 className="text-sm font-bold text-secondary flex items-center gap-2 border-b border-gray-100 pb-3 uppercase tracking-wider">
              <ShoppingBag size={16} className="text-primary" /> Order History ({orders.length})
            </h3>

            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <p className="text-xs text-gray-400 italic">You haven't placed any orders yet.</p>
                  <Link 
                    href="/collections"
                    className="bg-primary hover:bg-[#d89311] text-white text-[10px] font-bold px-6 py-2 rounded-full uppercase tracking-wider inline-block"
                  >
                    Start Shopping
                  </Link>
                </div>
              ) : (
                orders.map((ord) => (
                  <div key={ord.id} className="border border-border-theme rounded-xl p-4 flex justify-between items-center bg-gray-50/50">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-secondary">ID: {ord.id.substring(0, 8).toUpperCase()}</h4>
                      <div className="flex gap-3 text-[10px] text-gray-400 font-semibold">
                        <span>{new Date(ord.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="text-primary font-bold">€{Number(ord.total_amount).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-extrabold tracking-wider px-3 py-1 bg-green-50 text-green-600 border border-green-150 rounded-full">
                      <CheckCircle size={12} /> {ord.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
