/**
 * Renders the pixel companions for review: PNG contact sheets (big, crisp pixels, on the
 * desk colour) and preview.html, where the cat runs on the same animation code as the app.
 *
 *   npx vite-node art/pixel/preview.ts [png-dir]
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { build } from 'esbuild'
import type { Pose } from '../../src/renderer/src/companions/pixel/animate'
import { HEIGHT, paletteOf, WIDTH } from '../../src/renderer/src/companions/pixel/species'
import { rgba } from '../../src/renderer/src/companions/pixel/sprite'
import { ANIMALS } from './animals'
import { png } from './png'

const out = process.argv[2] ?? join(__dirname, 'renders')
mkdirSync(out, { recursive: true })

/** Frames in a row, each scaled up, on the app's desk colour. */
function sheet(frames: Uint8ClampedArray[], scale: number, background = [0x24, 0x19, 0x11]): Buffer {
  const gap = 2
  const width = ((WIDTH + gap) * frames.length + gap) * scale
  const height = (HEIGHT + gap * 2) * scale
  const pixels = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i++) pixels.set([...background, 255], i * 4)
  frames.forEach((frame, f) => {
    const ox = (gap + f * (WIDTH + gap)) * scale
    for (let y = 0; y < HEIGHT; y++)
      for (let x = 0; x < WIDTH; x++) {
        const s = (y * WIDTH + x) * 4
        if (frame[s + 3] === 0) continue
        for (let dy = 0; dy < scale; dy++)
          for (let dx = 0; dx < scale; dx++) pixels.set(frame.subarray(s, s + 4), ((gap * scale + y * scale + dy) * width + ox + x * scale + dx) * 4)
      }
  })
  return png(width, height, pixels)
}

const pose = (p: Partial<Pose> = {}): Pose => ({ eyes: 'open', gaze: 0, bob: 0, tail: 0, mouth: 'closed', ...p })
const poses: Pose[] = [
  pose(),
  pose({ gaze: -1, bob: 1, tail: 1 }),
  pose({ eyes: 'blink' }),
  pose({ eyes: 'happy', mouth: 'open' }),
  pose({ gaze: 1, mouth: 'small' }),
  pose({ eyes: 'happy', bob: 1 })
]
for (const [name, animal] of Object.entries(ANIMALS)) {
  const first = paletteOf(animal, Object.keys(animal.coats)[0], 'green')
  writeFileSync(join(out, `${name}-poses.png`), sheet(poses.map((p) => rgba(animal.frame(p, 'none'), first)), 8))
  writeFileSync(join(out, `${name}-gear.png`), sheet((['hat', 'collar', 'none'] as const).map((g) => rgba(animal.frame(pose(), g), first)), 8))
  writeFileSync(join(out, `${name}-coats.png`), sheet(Object.keys(animal.coats).map((coat) => rgba(animal.frame(pose(), 'hat'), paletteOf(animal, coat, 'green'))), 8))
}

// The family side by side: same size, same eyes, same hat?
const family = Object.values(ANIMALS)
writeFileSync(join(out, 'family.png'), sheet(family.map((a) => rgba(a.frame(pose(), 'hat'), paletteOf(a, Object.keys(a.coats)[0], 'green'))), 8))
writeFileSync(join(out, 'family-bare.png'), sheet(family.map((a) => rgba(a.frame(pose({ eyes: 'happy', mouth: 'open' }), 'collar'), paletteOf(a, Object.keys(a.coats)[1], 'amber'))), 8))

async function page(): Promise<void> {
  const bundle = await build({ entryPoints: [join(__dirname, 'page.ts')], bundle: true, write: false, format: 'iife', target: 'es2022' })
  const html = `<!doctype html>
<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pixel-maatjes</title>
<style>
  body { margin: 0; background: #241911; color: #f6ecd6; font: 16px/1.4 system-ui, sans-serif; }
  main { max-width: 760px; margin: 0 auto; padding: 24px 16px 40px; text-align: center; }
  h1 { font: 400 30px Georgia, serif; margin: 0 0 4px; }
  p { margin: 0 0 18px; color: #c9b48e; }
  canvas { image-rendering: pixelated; width: ${WIDTH * 8}px; height: ${(HEIGHT + 4) * 8}px; max-width: 100%; }
  .row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin: 10px 0; }
  button { font: inherit; border: 1.5px solid #c9b48e; background: transparent; color: #f6ecd6; border-radius: 4px; padding: 8px 14px; cursor: pointer; }
  button[aria-pressed="true"] { background: #f6ecd6; color: #2b2118; border-color: #f6ecd6; }
</style></head>
<body><main>
  <h1>Pixel-maatjes</h1>
  <p>Alle maatjes in dezelfde stijl: dezelfde oogjes, dezelfde hoed, dezelfde stemmingen.</p>
  <div class="row" id="animal"></div>
  <canvas></canvas>
  <div class="row" id="mood"></div>
  <div class="row" id="gear"></div>
  <div class="row" id="color"></div>
  <div class="row" id="coat"></div>
</main>
<script>${bundle.outputFiles[0].text}</script>
</body></html>`
  writeFileSync(join(__dirname, 'preview.html'), html)
}

void page().then(() => console.log('wrote', out, 'and preview.html'))
