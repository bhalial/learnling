/**
 * Builds the product page into site/out: bundles main.ts (with the app's own buddies),
 * copies the page, styles, pictures and fonts (served from the page itself, no font CDN),
 * and draws og.png, the picture a shared link shows.
 *
 *   npm run site
 */
import { copyFileSync, cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { build } from 'esbuild'
import { ALL_SPECIES, SPECIES } from '../src/renderer/src/companions'
import type { Pose } from '../src/renderer/src/companions/pixel/animate'
import { HEIGHT, paletteOf, WIDTH } from '../src/renderer/src/companions/pixel/species'
import { ALL_THEMES, THEMES, type ThemeId } from '../src/renderer/src/themes'
import { Picture } from '../art/pixel/png'

/**
 * What the page needs beyond the app's colours: an accent for headings and sparkles that
 * reads on the theme's ground, whether the ground is dark, and for the spellbook the page's
 * own rounder heading face and gold download button.
 */
const SITE_LOOK: Record<ThemeId, { accent: string; dark: boolean; display?: string; button?: [string, string] }> = {
  magic: { accent: '#e3b54a', dark: true, display: "'Fredoka', var(--body)", button: ['#e3b54a', '#2b2118'] },
  garden: { accent: '#3d7027', dark: false },
  ocean: { accent: '#ff9d8b', dark: true },
  space: { accent: '#ff9a3c', dark: true },
  quest: { accent: '#ffd23f', dark: true },
  notebook: { accent: '#b8322a', dark: false }
}

const root = __dirname
const out = join(root, 'out')
const modules = join(root, '..', 'node_modules')

rmSync(out, { recursive: true, force: true })
mkdirSync(join(out, 'fonts'), { recursive: true })

await build({ entryPoints: [join(root, 'main.ts')], bundle: true, minify: true, format: 'iife', target: 'es2020', outfile: join(out, 'app.js') })

for (const file of ['index.html', 'styles.css']) copyFileSync(join(root, file), join(out, file))
cpSync(join(root, 'img'), join(out, 'img'), { recursive: true })
copyFileSync(join(root, '..', 'resources', 'icon.png'), join(out, 'icon.png'))

const FONTS: Record<string, string[]> = {
  fredoka: ['fredoka-latin-500-normal.woff2', 'fredoka-latin-600-normal.woff2', 'fredoka-latin-700-normal.woff2'],
  'alegreya-sans': ['alegreya-sans-latin-400-normal.woff2', 'alegreya-sans-latin-700-normal.woff2', 'alegreya-sans-latin-400-italic.woff2'],
  caveat: ['caveat-latin-600-normal.woff2', 'caveat-latin-700-normal.woff2'],
  // The other themes' display faces, for their headings when that theme is picked.
  'baloo-2': ['baloo-2-latin-700-normal.woff2'],
  quicksand: ['quicksand-latin-700-normal.woff2'],
  'exo-2': ['exo-2-latin-700-normal.woff2'],
  bungee: ['bungee-latin-400-normal.woff2']
}
for (const [family, files] of Object.entries(FONTS)) {
  const available = readdirSync(join(modules, '@fontsource', family, 'files'))
  for (const file of files) {
    if (!available.includes(file)) throw new Error(`missing font ${file}`)
    copyFileSync(join(modules, '@fontsource', family, 'files', file), join(out, 'fonts', file))
  }
}

// themes.css: the page in each of the app's themes, with the app's own colours (themes.ts),
// so the page and the app never drift apart.
const face = (family: string, weight: number, file: string): string =>
  `@font-face{font-family:'${family}';font-weight:${weight};font-display:swap;src:url('fonts/${file}') format('woff2')}`
const faces = [
  face('Caveat', 700, 'caveat-latin-700-normal.woff2'),
  face('Baloo 2', 700, 'baloo-2-latin-700-normal.woff2'),
  face('Quicksand', 700, 'quicksand-latin-700-normal.woff2'),
  face('Exo 2', 700, 'exo-2-latin-700-normal.woff2'),
  face('Bungee', 400, 'bungee-latin-400-normal.woff2')
]
const themeRules = ALL_THEMES.map((id) => {
  const { colors, fonts } = THEMES[id]
  const page = SITE_LOOK[id]
  const vars: Record<string, string> = {
    desk: colors.desk,
    'desk-light': colors.glow,
    leather: colors.leather,
    paper: colors.paper,
    'paper-deep': colors['paper-deep'],
    note: colors.note,
    ink: colors.ink,
    'ink-soft': colors['ink-soft'],
    cream: colors.cream,
    'cream-soft': colors['cream-soft'],
    'on-cream': colors['on-cream'],
    wax: colors.wax,
    quill: colors.quill,
    button: page.button?.[0] ?? colors.button,
    'on-button': page.button?.[1] ?? colors['on-button'],
    accent: page.accent,
    display: page.display ?? `${fonts.display.split(',')[0]}, var(--body)`,
    'display-weight': String(page.display ? 600 : fonts.displayWeight)
  }
  const body = Object.entries(vars)
    .map(([name, value]) => `--${name}:${value}`)
    .join(';')
  return `html[data-theme='${id}']{${body};color-scheme:${page.dark ? 'dark' : 'light'}}`
})
writeFileSync(join(out, 'themes.css'), [...faces, ...themeRules].join('\n') + '\n')

// og.png: the five buddies on a stack of books, on the desk, 1200 × 630.
const picture = new Picture(1200, 630, [0x24, 0x19, 0x11])
const scale = 6
const step = (WIDTH - 6) * scale
const left = Math.round((1200 - step * (ALL_SPECIES.length - 1) - WIDTH * scale) / 2)
const top = 90
const books: Array<[number, [number, number, number]]> = [
  [860, [0x6b, 0x2b, 0x2b]],
  [980, [0x2f, 0x4a, 0x6b]],
  [920, [0x56, 0x62, 0x2c]]
]
const shelf = top + HEIGHT * scale - 18
books.forEach(([width, colour], i) => picture.rect(Math.round((1200 - width) / 2), shelf + i * 26, width, 22, colour))
const happy: Pose = { eyes: 'happy', gaze: 0, bob: 1, tail: 0, mouth: 'open' }
// Each in another theme's headwear: there is more than one way to wear it.
const looks = [
  { species: 'dog', coat: 'golden', headwear: 'straw', eyes: 'amber' },
  { species: 'parrot', coat: 'green', headwear: 'bow', eyes: 'blue' },
  { species: 'cat', coat: 'ginger', headwear: 'wizard', eyes: 'green' },
  { species: 'whale', coat: 'ocean', headwear: 'goggles', eyes: 'violet' },
  { species: 'robot', coat: 'lilac', headwear: 'crown', eyes: 'hazel' }
] as const
looks.forEach((look, i) => {
  const art = SPECIES[look.species].art
  const pose: Pose = i === 2 ? happy : { ...happy, eyes: 'open', mouth: 'closed', gaze: i < 2 ? 1 : -1 }
  picture.draw(art.frame(pose, 'hat', look.headwear), paletteOf(art, look.coat, look.eyes), left + i * step, top, scale)
})
// The name underneath, in a little 5 × 7 pixel font, gold with a dark shadow.
const GLYPHS: Record<string, string[]> = {
  L: ['X....', 'X....', 'X....', 'X....', 'X....', 'X....', 'XXXXX'],
  E: ['XXXXX', 'X....', 'X....', 'XXXX.', 'X....', 'X....', 'XXXXX'],
  A: ['.XXX.', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X', 'X...X'],
  R: ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X.X..', 'X..X.', 'X...X'],
  N: ['X...X', 'XX..X', 'X.X.X', 'X..XX', 'X...X', 'X...X', 'X...X'],
  I: ['XXXXX', '..X..', '..X..', '..X..', '..X..', '..X..', 'XXXXX'],
  G: ['.XXX.', 'X...X', 'X....', 'X.XXX', 'X...X', 'X...X', '.XXXX']
}
const word = 'LEARNLING'
const unit = 8
const wordLeft = Math.round((1200 - (word.length * 6 - 1) * unit) / 2)
const wordTop = shelf + 3 * 26 + 44
for (const [colour, offset] of [[[0x5b, 0x2b, 0x23], unit / 2], [[0xe3, 0xb5, 0x4a], 0]] as const) {
  ;[...word].forEach((letter, i) =>
    GLYPHS[letter].forEach((row, y) =>
      [...row].forEach((cell, x) => {
        if (cell === 'X') picture.rect(wordLeft + (i * 6 + x) * unit + offset, wordTop + y * unit + offset, unit, unit, colour)
      })
    )
  )
}
writeFileSync(join(out, 'og.png'), picture.toPng())

console.log('built', out)
