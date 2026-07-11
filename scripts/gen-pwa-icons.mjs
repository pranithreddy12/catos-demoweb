// Rasterises public/icon-source.svg into the PNG icons the PWA manifest and
// iOS home-screen need. Re-run with `npm run icons` whenever the source changes.
import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const pub = join(here, '..', 'public')
const src = readFileSync(join(pub, 'icon-source.svg'))

const targets = [
  ['pwa-192x192.png', 192],
  ['pwa-512x512.png', 512],
  ['maskable-icon-512x512.png', 512],
  ['apple-touch-icon-180x180.png', 180],
]

for (const [name, size] of targets) {
  await sharp(src, { density: 512 })
    .resize(size, size)
    .png()
    .toFile(join(pub, name))
  console.log('wrote', name)
}
