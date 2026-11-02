const productionOrigin = 'https://freshcodeli.com.au'

/** Canonical, validated payment-return origin; never forward malformed env text. */
export function checkoutOrigin(requestUrl: string, configured?: string, environment?: string) {
  // Production is pinned to the live storefront, not a request Host or preview URL.
  if (environment === 'production') return productionOrigin
  for (const candidate of [configured, requestUrl]) {
    if (!candidate) continue
    const cleaned = candidate.trim().replace(/^(['"])(.*)\1$/, '$2')
    if (/\s/.test(cleaned)) continue
    try {
      const url = new URL(cleaned)
      const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
      if (url.username || url.password || !['https:', 'http:'].includes(url.protocol)) continue
      if (url.protocol === 'http:' && !local) continue
      return url.origin
    } catch { /* Try the known request origin, then the canonical storefront. */ }
  }
  return productionOrigin
}
