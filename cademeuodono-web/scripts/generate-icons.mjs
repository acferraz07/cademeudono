import sharp from 'sharp'
import { existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const src = join(root, 'public', 'ICONE ATALHO CELULAR.png')
const iconsDir = join(root, 'public', 'icons')

if (!existsSync(iconsDir)) mkdirSync(iconsDir, { recursive: true })

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
]

for (const { name, size } of sizes) {
  const dest = join(iconsDir, name)
  await sharp(src).resize(size, size, { fit: 'contain', background: { r: 13, g: 59, b: 102, alpha: 1 } }).png().toFile(dest)
  console.log(`Generated ${name} (${size}x${size})`)
}

// favicon.ico: embed 16, 32, 48 px as PNG inside ICO manually via sharp → png then rename
// browsers accept a single-size PNG favicon; generate 32px for best compat
const faviconDest = join(root, 'public', 'favicon.ico')
await sharp(src).resize(32, 32, { fit: 'contain', background: { r: 13, g: 59, b: 102, alpha: 1 } }).png().toFile(faviconDest)
console.log('Generated favicon.ico (32x32 PNG-in-ICO)')
console.log('Done.')
