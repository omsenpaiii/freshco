'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Mail, Phone, MapPin, Send, HelpCircle } from 'lucide-react'

export default function ContactUsPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate sending message
    await new Promise(resolve => setTimeout(resolve, 1000))

    setIsSuccess(true)
    setIsSubmitting(false)
    setForm({ name: '', email: '', subject: '', message: '' })
    setTimeout(() => setIsSuccess(false), 3000)
  }

  return (
    <div className="w-full bg-white px-4 md:px-8 py-10">
      <div className="max-w-6xl mx-auto text-left">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 font-medium">
          <Link href="/" className="hover:text-primary transition">Home</Link>
          <ChevronRight size={12} />
          <span className="text-secondary font-semibold">Contact Us</span>
        </div>

        <div className="border-b border-border-theme pb-4 mb-8">
          <h1 className="text-xl md:text-2xl font-extrabold text-secondary">Contact Us</h1>
          <p className="text-xs text-gray-400 mt-1">Get in touch with us for bulk orders, farm visits, or support.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* Info Details sidebar Column */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-[#f8f9fa] border border-border-theme p-6 rounded-2xl space-y-5">
              <h3 className="text-sm font-bold text-secondary border-b border-gray-200 pb-3 uppercase tracking-wider">
                Store Location
              </h3>
              
              <ul className="space-y-4 text-xs font-semibold text-secondary leading-relaxed">
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="text-primary mt-0.5 flex-shrink-0" />
                  <span>123 Organic Way, Greenhouse Suite 10, Farmville, CA 90210</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={18} className="text-primary flex-shrink-0" />
                  <span>+1 (800) 123-4567</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail size={18} className="text-primary flex-shrink-0" />
                  <span>support@freshco-vegist.com</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#fceecf]/25 border border-border-theme p-6 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-secondary flex items-center gap-1.5 uppercase tracking-wider">
                <HelpCircle size={15} className="text-primary" /> Looking for FAQs?
              </h4>
              <p className="text-[11px] text-gray-500 leading-relaxed font-semibold">
                Find quick answers regarding shipping schedules, return processes, and organic packaging on our support page.
              </p>
              <Link 
                href="/pages/faqs" 
                className="text-[11px] font-bold text-primary hover:underline inline-block pt-1"
              >
                Browse FAQs →
              </Link>
            </div>
          </div>

          {/* Contact form Column */}
          <div className="md:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="border border-border-theme p-6 rounded-2xl bg-white shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-secondary uppercase tracking-wider">Send us a message</h3>
              
              {isSuccess && (
                <div className="text-green-600 bg-green-50 border border-green-100 p-3 rounded-lg text-xs font-semibold">
                  ✓ Your message has been sent successfully. We will respond within 24 hours.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Your Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    required 
                    value={form.name}
                    onChange={handleChange}
                    className="w-full bg-white border border-border-theme rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary text-xs font-semibold text-secondary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] uppercase font-bold text-gray-400">Email Address</label>
                  <input 
                    type="email" 
                    name="email" 
                    required 
                    value={form.email}
                    onChange={handleChange}
                    className="w-full bg-white border border-border-theme rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary text-xs font-semibold text-secondary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-gray-400">Subject</label>
                <input 
                  type="text" 
                  name="subject" 
                  required 
                  value={form.subject}
                  onChange={handleChange}
                  className="w-full bg-white border border-border-theme rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary text-xs font-semibold text-secondary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] uppercase font-bold text-gray-400">Message</label>
                <textarea 
                  name="message" 
                  required 
                  rows={5}
                  value={form.message}
                  onChange={handleChange}
                  className="w-full bg-white border border-border-theme rounded-lg py-2.5 px-4 focus:outline-none focus:border-primary text-xs font-semibold text-secondary"
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-primary hover:bg-[#d89311] text-white font-bold text-xs px-8 py-3 rounded-full flex items-center gap-2 transition cursor-pointer shadow-xs hover:shadow-md uppercase tracking-wider"
              >
                {isSubmitting ? 'Sending...' : <>Send Message <Send size={14} /></>}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  )
}
