import { describe, expect, it } from 'vitest'
import { ACCESSORIES, ALL_EYE_COLORS, ALL_SPECIES, settleCompanion, SPECIES } from '.'
import type { Pose } from './pixel/animate'
import { HEIGHT, paletteOf, WIDTH } from './pixel/species'

const POSES: Pose[] = (['open', 'blink', 'happy'] as const).flatMap((eyes) =>
  (['closed', 'open', 'small'] as const).flatMap((mouth) =>
    [0, 1].flatMap((tail) => [-1, 0, 1].map((gaze) => ({ eyes, mouth, tail, gaze, bob: tail })))
  )
)

describe('pixel companions', () => {
  it.each(ALL_SPECIES)('%s: the coats in the app are the coats in the art', (species) => {
    const { coats, art } = SPECIES[species]
    expect(coats.map((c) => c.id).sort()).toEqual(Object.keys(art.coats).sort())
  })

  it.each(ALL_SPECIES)('%s: every pixel of every pose has a colour, in every coat and eye colour', (species) => {
    const { coats, art } = SPECIES[species]
    for (const accessory of ACCESSORIES) {
      for (const pose of POSES) {
        const frame = art.frame(pose, accessory)
        expect(frame).toHaveLength(HEIGHT)
        expect(frame.every((row) => row.length === WIDTH)).toBe(true)
        const used = new Set(frame.join('').replace(/\./g, ''))
        for (const coat of coats)
          for (const eyes of ALL_EYE_COLORS) {
            const palette = paletteOf(art, coat.id, eyes)
            expect([...used].filter((char) => !palette[char])).toEqual([])
          }
      }
    }
  })
})

describe('settleCompanion', () => {
  it('turns the shark into the whale, keeping its colour', () => {
    expect(settleCompanion({ name: 'Bruce', species: 'shark', coat: 'reef', accessory: 'collar' })).toEqual({
      name: 'Bruce',
      species: 'whale',
      coat: 'storm',
      accessory: 'collar',
      eyes: 'green'
    })
    expect(settleCompanion({ species: 'shark', coat: 'coral' }).coat).toBe('coral')
  })

  it('keeps a look that is still valid, and gives older books an eye colour', () => {
    expect(settleCompanion({ name: 'Mochi', species: 'cat', coat: 'midnight', accessory: 'hat' })).toEqual({
      name: 'Mochi',
      species: 'cat',
      coat: 'midnight',
      accessory: 'hat',
      eyes: 'green'
    })
    expect(settleCompanion({ species: 'dog', coat: 'husky', accessory: 'none', eyes: 'violet' }).eyes).toBe('violet')
  })

  it('falls back for anything it does not know', () => {
    expect(settleCompanion({ species: 'dragon', coat: 'gold', accessory: 'crown', eyes: 'red' })).toEqual({
      name: '',
      species: 'cat',
      coat: 'ginger',
      accessory: 'hat',
      eyes: 'green'
    })
  })
})
