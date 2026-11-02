import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/context/store-context";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import CartDrawer from "@/components/cart/cart-drawer";
import { Bricolage_Grotesque, Inter, Manrope } from "next/font/google";
import { getCategories, getProducts } from "@/lib/db";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from '@/lib/seo';

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const inter = Inter({ subsets: ["latin"], weight: "900", variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: 'FreshCo Deli',
  title: { default: SITE_TITLE, template: '%s | FreshCo Deli' },
  description: SITE_DESCRIPTION,
  category: 'Food & Grocery',
  icons: { icon: [{ url: '/icons/freshco-32.png', sizes: '32x32', type: 'image/png' }], shortcut: '/favicon.ico', apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }] },
  openGraph: { type: 'website', locale: 'en_AU', siteName: 'FreshCo Deli', title: SITE_TITLE, description: SITE_DESCRIPTION },
  twitter: { card: 'summary_large_image', title: SITE_TITLE, description: SITE_DESCRIPTION, images: ['/opengraph-image'] },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ])

  return (
    <html lang="en-AU" data-scroll-behavior="smooth" className={`${manrope.variable} ${bricolage.variable} ${inter.variable} h-full scroll-smooth`}>
      <body className="min-h-full flex flex-col font-sans">
        <a href="#main-content" className="sr-only fixed left-4 top-4 z-[100] rounded-full bg-primary px-5 py-3 font-bold text-white focus:not-sr-only">Skip to main content</a>
        <StoreProvider>
          <Header initialCategories={categories} initialProducts={products} />
          <main id="main-content" className="flex-grow min-h-[70svh]">
            {children}
          </main>
          <Footer />
          <CartDrawer />
        </StoreProvider>
      </body>
    </html>
  );
}
