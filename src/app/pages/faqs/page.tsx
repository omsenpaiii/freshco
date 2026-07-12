'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronDown, HelpCircle } from 'lucide-react'

const faqItems = [
  {
    q: "How organic is your organic produce?",
    a: "All of our vegetables, fruits, and grains are sourced from certified organic farms that do not employ synthetic fertilizers, chemical pesticides, or genetic modification (Non-GMO). Our suppliers are audited and follow strict national agricultural guidelines."
  },
  {
    q: "What are your delivery schedules and lead times?",
    a: "Local orders made before 10:00 AM are eligible for same-day delivery by 6:00 PM. Standard county shipping typically delivers within 1 to 2 business days. Fresh produce is shipped inside temperature-controlled cooling containers."
  },
  {
    q: "How does the custom database cart syncing work?",
    a: "If you log in via your Supabase account, your shopping cart and wishlist automatically sync to the database so that you can view them on other devices. Guest shopping profiles default to using local storage on the client side."
  },
  {
    q: "Do you support Stripe or other payment processing methods?",
    a: "For demonstration purposes, we support a fully functional Mock Checkout. A real Stripe configuration can be enabled by setting the environment variables in .env.local with secure keys."
  },
  {
    q: "What is your refund policy on fresh vegetables?",
    a: "Since produce is perishable, we offer refunds or replacements for fresh vegetables within 24 hours of delivery if they arrive damaged, bruised, or spoiled. Please snap a picture and email our customer care team."
  }
]

export default function FaqsPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx)
  }

  return (
    <div className="w-full bg-white px-4 md:px-8 py-10">
      <div className="max-w-4xl mx-auto text-left">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-6 font-medium">
          <Link href="/" className="hover:text-primary transition">Home</Link>
          <ChevronRight size={12} />
          <span className="text-secondary font-semibold">FAQs & Help</span>
        </div>

        <div className="border-b border-border-theme pb-4 mb-8">
          <h1 className="text-xl md:text-2xl font-extrabold text-secondary">Frequently Asked Questions</h1>
          <p className="text-xs text-gray-400 mt-1">Get quick answers to common questions about fresh products and delivery.</p>
        </div>

        {/* Accordions grid */}
        <div className="space-y-4">
          {faqItems.map((item, idx) => {
            const isOpen = openIndex === idx
            return (
              <div 
                key={idx}
                className="border border-border-theme rounded-2xl overflow-hidden shadow-2xs bg-white transition duration-300"
              >
                <button 
                  onClick={() => toggleFaq(idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-xs md:text-sm font-bold text-secondary hover:text-primary bg-gray-50/50 hover:bg-gray-50 transition cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle size={16} className="text-primary flex-shrink-0" />
                    {item.q}
                  </span>
                  <ChevronDown 
                    size={16} 
                    className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-gray-400'}`} 
                  />
                </button>

                {isOpen && (
                  <div className="p-5 border-t border-border-theme text-xs text-gray-500 leading-relaxed bg-white">
                    {item.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-10 p-6 bg-primary/5 rounded-2xl border border-primary/10 text-center space-y-3 max-w-xl mx-auto">
          <h4 className="font-bold text-secondary text-sm">Still have questions?</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
            Our active organic farmer support team is here to assist you with wholesale requests or deliveries.
          </p>
          <Link 
            href="/pages/contact-us"
            className="bg-primary hover:bg-[#d89311] text-white text-xs font-bold px-6 py-2.5 rounded-full inline-block transition uppercase tracking-wider shadow-2xs hover:shadow-sm"
          >
            Contact Support
          </Link>
        </div>

      </div>
    </div>
  )
}
