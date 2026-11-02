// Deterministic derivatives of the existing FreshCo logo, not a replacement logo.
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(process.argv[2] || '.')
const logo = resolve(root, 'public/logo.png')
const f = await sharp(logo).extract({ left: 8, top: 4, width: 76, height: 146 }).resize({ height: 265 }).png().toBuffer()
const c = await sharp(logo).extract({ left: 480, top: 4, width: 98, height: 146 }).resize({ height: 265 }).png().toBuffer()
const master = await sharp({ create: { width: 512, height: 512, channels: 4, background: '#fff8ec' } })
  .composite([{ input: f, left: 88, top: 123 }, { input: c, left: 246, top: 123 }]).png().toBuffer()
await mkdir(resolve(root, 'public/icons'), { recursive: true })
for (const size of [32, 192, 512]) await sharp(master).resize(size, size).png().toFile(resolve(root, `public/icons/freshco-${size}.png`))
await sharp(master).resize(180, 180).png().toFile(resolve(root, 'src/app/apple-icon.png'))
const sizes = [16, 32, 48, 64]
const frames = await Promise.all(sizes.map(size => sharp(master).resize(size, size).png().toBuffer()))
const header = Buffer.alloc(6 + frames.length * 16)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(frames.length, 4)
let offset = header.length
frames.forEach((frame, index) => {
  const entry = 6 + index * 16
  header[entry] = sizes[index]
  header[entry + 1] = sizes[index]
  header.writeUInt16LE(1, entry + 4)
  header.writeUInt16LE(32, entry + 6)
  header.writeUInt32LE(frame.length, entry + 8)
  header.writeUInt32LE(offset, entry + 12)
  offset += frame.length
})
await writeFile(resolve(root, 'src/app/favicon.ico'), Buffer.concat([header, ...frames]))
await sharp(resolve(root, 'public/images/home/fresh-picks-hero-desktop.webp')).jpeg({ quality: 88 }).toFile(resolve(root, 'public/images/home/social-share-bg.jpg'))
