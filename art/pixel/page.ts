/**
 * The preview page's script: the animals, animated by the same code the app will use.
 * Bundled into preview.html by preview.ts.
 */
import { EFFECT_PALETTE, momentOf, overlays } from '../../src/renderer/src/companions/pixel/animate'
import { HEIGHT, paletteOf, WIDTH } from '../../src/renderer/src/companions/pixel/species'
import type { Grid, Palette } from '../../src/renderer/src/companions/pixel/sprite'
import type { AccessoryId, Mood } from '../../src/renderer/src/companions/types'
import { ALL_SPECIES, EYE_COLOR_NAMES, SPECIES } from '../../src/renderer/src/companions'
import { ANIMALS } from './animals'

// Names as the app shows them in Dutch.
const NAMES = Object.fromEntries(ALL_SPECIES.map((species) => [species, SPECIES[species].name.nl]))
const COAT_NAMES = Object.fromEntries(ALL_SPECIES.flatMap((species) => SPECIES[species].coats.map((coat) => [coat.id, coat.name.nl])))
const COLOR_NAMES = Object.fromEntries(Object.entries(EYE_COLOR_NAMES).map(([id, name]) => [id, name.nl]))
const MOODS: Record<Mood, string> = { idle: 'Rustig', happy: 'Blij', talk: 'Praten', curious: 'Nieuwsgierig', sleep: 'Slapen', proud: 'Trots' }
const GEAR_NAMES: Record<AccessoryId, string> = { hat: 'Tovenaarshoed', collar: 'Halsding', none: 'Niets' }

// Room above the frame for hops.
const MARGIN = 4
const first = Object.keys(ANIMALS)[0]
const state = { animal: first, mood: 'idle' as Mood, coat: Object.keys(ANIMALS[first].coats)[0], color: 'green', gear: 'hat' as AccessoryId, since: performance.now() }

const canvas = document.querySelector('canvas')!
canvas.width = WIDTH
canvas.height = HEIGHT + MARGIN
const ctx = canvas.getContext('2d')!

function draw(grid: Grid, palette: Palette, dx: number, dy: number, alpha = 1): void {
  ctx.globalAlpha = alpha
  grid.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const colour = palette[row[x]]
      if (row[x] === '.' || !colour) continue
      ctx.fillStyle = colour
      ctx.fillRect(x + dx, y + dy, 1, 1)
    }
  })
  ctx.globalAlpha = 1
}

function frame(now: number): void {
  const animal = ANIMALS[state.animal]
  const moment = momentOf(state.mood, now, now - state.since)
  // Happy and talk are reactions: they play once, then the animal settles again.
  if ((state.mood === 'happy' && now - state.since > 2400) || (state.mood === 'talk' && now - state.since > 2600)) pick('mood', 'idle')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  draw(animal.frame(moment.pose, state.gear), paletteOf(animal, state.coat, state.color), 0, MARGIN - moment.lift)
  for (const o of overlays(moment.effect, moment.phase, animal.anchor)) draw(o.grid, EFFECT_PALETTE, o.x, o.y + MARGIN - moment.lift, o.alpha)
  requestAnimationFrame(frame)
}

type Key = 'animal' | 'mood' | 'coat' | 'color' | 'gear'
const options = (key: Key): Record<string, string> => {
  if (key === 'animal') return Object.fromEntries(Object.keys(ANIMALS).map((a) => [a, NAMES[a] ?? a]))
  if (key === 'coat') return Object.fromEntries(Object.keys(ANIMALS[state.animal].coats).map((c) => [c, COAT_NAMES[c] ?? c]))
  return { mood: MOODS, color: COLOR_NAMES, gear: GEAR_NAMES }[key]
}

function pick(key: Key, value: string): void {
  ;(state as Record<Key, string>)[key] = value
  if (key === 'mood') state.since = performance.now()
  if (key === 'animal') {
    state.coat = Object.keys(ANIMALS[value].coats)[0]
    render('coat')
  }
  render(key)
}

function render(key: Key): void {
  const box = document.getElementById(key)!
  box.replaceChildren(
    ...Object.entries(options(key)).map(([value, label]) => {
      const button = document.createElement('button')
      button.textContent = label
      button.setAttribute('aria-pressed', String(state[key] === value))
      button.onclick = () => pick(key, value)
      return button
    })
  )
}

for (const key of ['animal', 'mood', 'gear', 'color', 'coat'] as Key[]) render(key)
requestAnimationFrame(frame)
