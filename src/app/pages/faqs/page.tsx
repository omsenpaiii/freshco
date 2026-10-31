'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronDown, HelpCircle } from 'lucide-react'

const faqItems = [
  {
    q: "What products are available online?",
    a: "Browse our published cheese, deli, frozen, grocery and other collections. The online range follows the current catalog and availability set by the FreshCo Deli team."
  },
  {
    q: "Do you offer delivery?",
    a: "No. FreshCo Deli currently offers Click & Collect only from Unit GX04, Northcote Plaza, 3 Separation St, Northcote VIC 3070. There is no collection fee. Please call +61 3 8589 0447 to confirm collection arrangements before travelling."
  },
  {
    q: "How should I transport chilled and frozen items?",
    a: "Collect chilled and frozen items promptly, transport them home without delay, and follow each product’s storage instructions. Contact the deli if you need handling information for a particular product."
  },
  {
    q: "How do I choose a Kefalograviera weight?",
    a: "Open the Dodoni Kefalograviera product page and select 250 g, 500 g, 700 g or 1 kg before adding it to your cart. The selected weight, price and SKU remain visible in your cart and checkout summary."
  },
  {
    q: "Why can’t I see every item from the supplied list?",
    a: "Some catalog items are dormant and remain hidden until the deli makes them active. Availability can change, so contact the team if you cannot find a product."
  },
  {
    q: "What does Price pending mean?",
    a: "The deli has not yet confirmed that item’s price. You can browse the listing, but it cannot be added to the cart or purchased until the team sets a valid price."
  },
  {
    q: "What should I do if there is a problem with a collected item?",
    a: "Contact FreshCo Deli promptly with your order details and a clear photograph of the item so the team can review the appropriate replacement or refund."
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
        <div className="flex items-center gap-1.5 text-xs text-content-muted mb-6 font-medium">
          <Link href="/" className="hover:text-primary transition">Home</Link>
          <ChevronRight size={12} />
          <span className="text-content-strong font-semibold">FAQs & Help</span>
        </div>

        <div className="border-b border-border-theme pb-4 mb-8">
          <h1 className="text-xl md:text-2xl font-extrabold text-content-strong">Frequently Asked Questions</h1>
          <p className="text-xs text-content-muted mt-1">Get quick answers about our cheese, frozen filo, pasta and ordering experience.</p>
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
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${idx}`}
                  className="w-full flex items-center justify-between p-5 text-left text-xs md:text-sm font-bold text-content-strong hover:text-primary bg-gray-50/50 hover:bg-gray-50 transition cursor-pointer"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle size={16} className="text-primary flex-shrink-0" />
                    {item.q}
                  </span>
                  <ChevronDown 
                    size={16} 
                    className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : 'text-content-muted'}`}
                  />
                </button>

                {isOpen && (
                  <div id={`faq-answer-${idx}`} className="p-5 border-t border-border-theme text-sm text-gray-500 leading-relaxed bg-white">
                    {item.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-10 p-6 bg-primary/5 rounded-2xl border border-primary/10 text-center space-y-3 max-w-xl mx-auto">
          <h4 className="font-bold text-content-strong text-sm">Still have questions?</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
            The FreshCo Deli team can help with product, availability and collection questions.
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
