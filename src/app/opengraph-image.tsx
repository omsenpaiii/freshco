import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt = 'FreshCo Deli — fresh picks, big flavours. Click & Collect at Northcote Plaza.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function SocialImage() {
  const [logo, hero] = await Promise.all([
    readFile(join(process.cwd(), 'public/logo.png')),
    readFile(join(process.cwd(), 'public/images/home/social-share-bg.jpg')),
  ])
  return new ImageResponse(
    <div style={{ display: 'flex', width: '100%', height: '100%', position: 'relative', background: '#cceafa' }}>
      {/* Static, owned-brand assets rendered by the social-image pipeline. */}
      <img src={`data:image/jpeg;base64,${hero.toString('base64')}`} alt="" width={1395} height={630} style={{ position: 'absolute', right: 0, top: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', padding: '44px 48px', width: 680 }}>
        <img src={`data:image/png;base64,${logo.toString('base64')}`} alt="FreshCo Deli" width={190} height={83} />
        <div style={{ fontSize: 78, fontWeight: 700, lineHeight: .98, letterSpacing: '-5px', color: '#08132e', marginTop: 60, display: 'flex', flexDirection: 'column' }}><span>Fresh picks.</span><span>Big flavours.</span></div>
        <div style={{ fontSize: 26, color: '#17213a', marginTop: 26 }}>Click & Collect at Northcote Plaza.</div>
      </div>
    </div>, size,
  )
}
