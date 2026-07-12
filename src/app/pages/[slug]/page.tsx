import React from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight } from 'lucide-react'

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
      "Your privacy is critically important to us. This Privacy Policy document outlines the types of personal information collected by Vegist Store and how we use it to fulfill orders and customize your browsing experience.",
      "We collect email addresses, shipping details, and account preferences when you register or execute orders. Payment card numbers are processed directly by our secure payment partners (such as Stripe or PayPal) and are never stored on our local database servers.",
      "We employ cookies to track cart items, wishlist status, and visitor preferences. You may choose to disable cookies in your browser settings, though some interactive elements like the cart drawer may not operate correctly as a result."
    ]
  },
  'return-policy': {
    title: "Return & Refund Policy",
    content: [
      "Because fresh organic food items are highly perishable, our return policy is optimized to prevent waste while protecting your shopping rights. Please read our guidelines below:",
      "Fresh produce, bakery, and dairy items cannot be physically returned. However, if any product arrives damaged, bruised, or spoiled, please email our support team with photographic proof within 24 hours of delivery to qualify for a full replacement or refund credit.",
      "Non-perishable shelf goods (like organic wines, dry almonds, and bakers' racks) can be returned within 14 days of delivery if they are unopened, in original packaging, and include the purchase receipt."
    ]
  },
  'shipping-policy': {
    title: "Shipping & Delivery Policy",
    content: [
      "We ship daily directly from our partner farm packing warehouses. We take great care to ensure that your fresh organic groceries are handled carefully during transport.",
      "Local same-day deliveries are available for orders completed before 10:00 AM. Orders completed after the cutoff qualify for next-day dispatch. Fresh vegetables are transported in insulated, cold-storage boxes.",
      "Local Melbourne delivery is free for orders over A$50. Orders below the threshold carry a flat A$4.99 delivery fee. All displayed prices include GST."
    ]
  },
  'terms-conditions': {
    title: "Terms & Conditions",
    content: [
      "Welcome to the Vegist e-commerce store website. By accessing and browsing this site, you agree to comply with and be bound by the following terms and conditions of usage.",
      "All product pricing, sizing details, and inventory statuses are subject to change without prior notice. We make every effort to display fresh inventory quantities accurately, but supply shortages on organic farms may lead to temporary item cancellations.",
      "All intellectual property, logo designs, custom CSS variables, and product descriptions shown on this website are owned by Vegist Store and cannot be reproduced without explicit written consent."
    ]
  },
  'payment-policy': {
    title: "Secure Payment Policy",
    content: [
      "Vegist Store provides a secure, encrypted e-commerce environment. We support several safe methods to settle your invoices including Visa, MasterCard, PayPal, and Apple Pay.",
      "All checkout data transactions are protected using Secure Sockets Layer (SSL) certificates and robust encryption protocols. We process payments via Level 1 PCI-compliant payment gateways, ensuring that card credentials remain fully masked.",
      "For local demonstration and development sandboxes, we support Mock Checkout cards for simulation. Genuine billing cycles will only be processed under live configurations."
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
