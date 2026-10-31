import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { COLLECTION, STORE } from '@/lib/store'

// Define the static routes to pre-compile them during build time
export async function generateStaticParams() {
  return [
    { slug: 'privacy-policy' },
    { slug: 'return-policy' },
    { slug: 'shipping-policy' },
    { slug: 'terms-conditions' },
    { slug: 'payment-policy' }
  ]
}

const policyPages: Record<string, { title: string; content: string[] }> = {
  'privacy-policy': {
    title: "Privacy Policy",
    content: [
      "Your privacy is critically important to us. This Privacy Policy outlines the types of personal information collected by FreshCo Deli and how we use it to fulfil orders and improve your browsing experience.",
      "We collect contact details and account preferences when you register or place an order. Payment card numbers are processed directly by Stripe and are not stored in the FreshCo Deli database.",
      "We employ cookies to track cart items, wishlist status, and visitor preferences. You may choose to disable cookies in your browser settings, though some interactive elements like the cart drawer may not operate correctly as a result."
    ]
  },
  'return-policy': {
    title: "Return & Refund Policy",
    content: [
      "Chilled and frozen food requires careful handling, so our return policy is designed to protect product quality while supporting your consumer rights.",
      "If you notice a problem with a collected item, contact FreshCo Deli promptly with your order details and a photograph so the team can review the appropriate next step.",
      "Unopened pantry products may be eligible for return in their original packaging. Contact the deli before returning an item so the team can confirm the appropriate next step."
    ]
  },
  'shipping-policy': {
    title: "Click & Collect Information",
    content: [
      "FreshCo Deli currently offers Click & Collect only. We do not offer a delivery service, and no delivery or collection fee is added to your order.",
      `Collect your order from ${COLLECTION.location}, ${COLLECTION.address}. Please contact the deli on ${STORE.phone} to confirm collection arrangements before travelling. Placing an online order does not guarantee an immediate pickup time.`,
      "Please transport chilled and frozen items home promptly and follow the storage instructions on each product. All displayed prices are in AUD and include GST."
    ]
  },
  'terms-conditions': {
    title: "Terms & Conditions",
    content: [
      "Welcome to the FreshCo Deli website. By accessing and browsing this site, you agree to comply with these terms and conditions of use.",
      "Product pricing, pack sizes and inventory may change without notice. We make every effort to display the current deli range accurately, but supplier availability may lead to temporary changes or cancellations.",
      "FreshCo Deli branding, original site content and product descriptions may not be reproduced without permission. Third-party brand names and packaging remain the property of their respective owners."
    ]
  },
  'payment-policy': {
    title: "Secure Payment Policy",
    content: [
      "FreshCo Deli uses Stripe-hosted Checkout for online payments. The total is checked against the current catalog on the server before checkout opens.",
      "You enter your payment details on Stripe’s secure checkout. FreshCo Deli does not receive or store your full card number.",
      "Online orders are for collection from Northcote Plaza only. Products marked Price pending cannot be purchased until the deli confirms their price."
    ]
  }
}

interface DynamicPolicyPageProps {
  params: Promise<{ slug: string }>
}

export default async function DynamicPolicyPage({ params }: DynamicPolicyPageProps) {
  const resolvedParams = await params
  const { slug } = resolvedParams
  const page = policyPages[slug]

  if (!page) {
    notFound()
  }

  return (
    <div className="w-full bg-white px-4 md:px-8 py-10">
      <div className="max-w-3xl mx-auto text-left">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-1.5 text-xs text-content-muted mb-6 font-medium">
          <Link href="/" className="hover:text-primary transition">Home</Link>
          <ChevronRight size={12} />
          <span className="text-content-strong font-semibold">{page.title}</span>
        </div>

        {/* Content Panel */}
        <div className="border border-border-theme rounded-2xl p-6 md:p-10 shadow-2xs space-y-6">
          <h1 className="text-xl md:text-2xl font-extrabold text-content-strong border-b border-gray-100 pb-4 mb-4">
            {page.title}
          </h1>

          <div className="space-y-4 text-xs md:text-sm text-gray-500 leading-relaxed font-medium">
            {page.content.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
