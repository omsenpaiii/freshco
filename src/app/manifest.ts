import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FreshCo Deli', short_name: 'FreshCo', lang: 'en-AU',
    description: 'Your Northcote deli favourites, ready for Click & Collect.',
    start_url: '/', scope: '/', display: 'browser', background_color: '#fff8ec', theme_color: '#cceafa',
    icons: [192, 512].map(size => ({ src: `/icons/freshco-${size}.png`, sizes: `${size}x${size}`, type: 'image/png', purpose: 'any' })),
  }
}
