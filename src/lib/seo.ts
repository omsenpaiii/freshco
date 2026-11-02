import type { Metadata } from 'next'

export const SITE_URL = 'https://freshcodeli.com.au'
export const SITE_TITLE = 'FreshCo Deli — Click & Collect in Northcote'
export const SITE_DESCRIPTION = 'Shop Greek cheese, deli favourites, frozen filo pies and pantry staples. Click & Collect from FreshCo Deli at Northcote Plaza, Melbourne.'

export function plainDescription(value: string, fallback = SITE_DESCRIPTION) {
  return (value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || fallback).slice(0, 160)
}

export function pageMetadata(title: string, path: string, description = SITE_DESCRIPTION, image?: string): Metadata {
  const images = image ? [{ url: image, alt: title }] : [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'FreshCo Deli — fresh picks, big flavours' }]
  return {
    title, description, alternates: { canonical: path },
    openGraph: { type: 'website', locale: 'en_AU', siteName: 'FreshCo Deli', title, description, url: path, images },
    twitter: { card: 'summary_large_image', title, description, images: images.map(image => image.url) },
  }
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
