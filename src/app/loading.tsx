import Image from 'next/image'

export default function Loading() {
  return (
    <main className="freshco-page-loader" role="status" aria-label="FreshCo is loading">
      <div className="freshco-loader-content">
        <Image src="/logo.png" alt="FreshCo Deli" width={144} height={63} priority className="h-auto w-36" />
        <span aria-hidden="true" className="freshco-loader-orbit">
          <span />
        </span>
        <p className="font-heading text-lg font-bold tracking-tight text-brand-ink sm:text-xl">Fresh picks are on their way</p>
        <span className="text-sm font-medium text-content-muted">A little goodness, packed with care.</span>
        <span className="sr-only">Loading page content</span>
      </div>
    </main>
  )
}
