import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/context/store-context";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import CartDrawer from "@/components/cart/cart-drawer";

export const metadata: Metadata = {
  title: "Vegist - Fresh Food and Organic Grocery Store",
  description: "Shopify theme suitable for vegetable stores, organic food, supermarkets, grocery stores. High-fidelity Next.js and Supabase clone.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full flex flex-col font-sans selection:bg-primary selection:text-white">
        <StoreProvider>
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <CartDrawer />
        </StoreProvider>
      </body>
    </html>
  );
}

