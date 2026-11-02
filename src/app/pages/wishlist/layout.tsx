import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Your favourites', robots: { index: false, follow: false } }
export default function WishlistLayout({ children }: { children: React.ReactNode }) { return children }
