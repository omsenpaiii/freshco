import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/context/store-context";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import CartDrawer from "@/components/cart/cart-drawer";
import { Bricolage_Grotesque, Manrope } from "next/font/google";
import { getCategories, getProducts } from "@/lib/db";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });

export const metadata: Metadata = {
  title: "FreshCo Deli — Fresh Food, Delivered Bright",
  description: "Shop fresh produce, bakery favourites, pantry staples and organic groceries from FreshCo Deli.",
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
    <html lang="en" className={`${manrope.variable} ${bricolage.variable} h-full scroll-smooth`}>
      <body className="min-h-full flex flex-col font-sans">
        <a href="#main-content" className="sr-only fixed left-4 top-4 z-[100] rounded-full bg-primary px-5 py-3 font-bold text-white focus:not-sr-only">Skip to main content</a>
        <StoreProvider>
          <Header initialCategories={categories} initialProducts={products} />
          <main id="main-content" className="flex-grow">
            {children}
          </main>
          <Footer />
          <CartDrawer />
        </StoreProvider>
      </body>
    </html>
  );
}
