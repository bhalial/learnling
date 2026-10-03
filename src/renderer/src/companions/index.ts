import type { Lang } from '../types'
import { cat } from './pixel/cat'
import { dog } from './pixel/dog'
import { EYE_COLORS } from './pixel/face'
import { parrot } from './pixel/parrot'
import { robot } from './pixel/robot'
import { whale } from './pixel/whale'
import type { AccessoryId, CompanionLook, Species, SpeciesDefinition } from './types'

export const SPECIES: Record<Species, SpeciesDefinition> = {
  cat: {
    id: 'cat',
    name: { en: 'Cat', nl: 'Kat' },
    coats: [
      { id: 'ginger', name: { en: 'Ginger', nl: 'Rood' } },
      { id: 'midnight', name: { en: 'Midnight', nl: 'Middernacht' } },
      { id: 'silver', name: { en: 'Silver', nl: 'Zilver' } },
      { id: 'cream', name: { en: 'Cream', nl: 'Room' } }
    ],
    neckwear: { en: 'Bell collar', nl: 'Belletje' },
    art: cat
  },
  dog: {
    id: 'dog',
    name: { en: 'Dog', nl: 'Hond' },
    coats: [
      { id: 'golden', name: { en: 'Golden', nl: 'Goud' } },
      { id: 'chocolate', name: { en: 'Chocolate', nl: 'Chocolade' } },
      { id: 'husky', name: { en: 'Husky', nl: 'Husky' } },
      { id: 'snow', name: { en: 'Snow', nl: 'Sneeuw' } }
    ],
    neckwear: { en: 'Collar', nl: 'Halsband' },
    art: dog
  },
  parrot: {
    id: 'parrot',
    name: { en: 'Parrot', nl: 'Papegaai' },
    coats: [
      { id: 'scarlet', name: { en: 'Scarlet', nl: 'Ara rood' } },
      { id: 'bluegold', name: { en: 'Blue & gold', nl: 'Blauw-geel' } },
      { id: 'green', name: { en: 'Green', nl: 'Groen' } },
      { id: 'cockatoo', name: { en: 'Cockatoo', nl: 'Kaketoe' } }
    ],
    neckwear: { en: 'Bow tie', nl: 'Strikje' },
    art: parrot
  },
  whale: {
    id: 'whale',
    name: { en: 'Whale', nl: 'Walvis' },
    coats: [
      { id: 'ocean', name: { en: 'Ocean', nl: 'Oceaan' } },
      { id: 'storm', name: { en: 'Storm', nl: 'Storm' } },
      { id: 'coral', name: { en: 'Coral', nl: 'Koraal' } },
      { id: 'deep', name: { en: 'Deep sea', nl: 'Diepzee' } }
    ],
    neckwear: { en: 'Scarf', nl: 'Sjaal' },
    art: whale
  },
  robot: {
    id: 'robot',
    name: { en: 'Robot', nl: 'Robot' },
    coats: [
      { id: 'tin', name: { en: 'Silver', nl: 'Zilver' } },
      { id: 'mint', name: { en: 'Mint', nl: 'Mint' } },
      { id: 'tangerine', name: { en: 'Tangerine', nl: 'Mandarijn' } },
      { id: 'lilac', name: { en: 'Lilac', nl: 'Lila' } }
    ],
    neckwear: { en: 'Bow tie', nl: 'Strikje' },
    art: robot
  }
}

export const ALL_SPECIES: Species[] = ['cat', 'dog', 'parrot', 'whale', 'robot']

/** The coat to use: the asked one if this animal has it, else its first. */
export function coatFor(species: Species, coat: string): string {
  const coats = SPECIES[species].coats
  return coats.some((c) => c.id === coat) ? coat : coats[0].id
}

/** The colour of a coat's swatch: the animal's main colour in that coat. */
export const swatchOf = (species: Species, coat: string): string => SPECIES[species].art.coats[coat].b

export const EYE_COLOR_NAMES: Record<string, Record<Lang, string>> = {
  green: { en: 'Green', nl: 'Groen' },
  amber: { en: 'Amber', nl: 'Amber' },
  blue: { en: 'Blue', nl: 'Blauw' },
  hazel: { en: 'Hazel', nl: 'Hazelnoot' },
  violet: { en: 'Violet', nl: 'Paars' }
}

export const ALL_EYE_COLORS = Object.keys(EYE_COLORS)

/** The swatch for an eye colour: its rich middle tone. */
export const eyeSwatch = (color: string): string => EYE_COLORS[color].g

/** The eye colour to use: the asked one if it exists, else green. */
export const eyesFor = (color: string | undefined): string => (color && color in EYE_COLORS ? color : 'green')

export const ACCESSORIES: AccessoryId[] = ['hat', 'collar', 'none']

/**
 * A companion from any older book, brought up to date: the shark became a whale (its grey
 * "reef" coat is the whale's "storm"), and eye colours arrived later. Anything unknown
 * falls back to what a new book starts with.
 */
export function settleCompanion(old: { name?: string; species?: string; coat?: string; accessory?: string; eyes?: string }): CompanionLook & { name: string } {
  const shark = old.species === 'shark'
  const species: Species = shark ? 'whale' : ALL_SPECIES.includes(old.species as Species) ? (old.species as Species) : 'cat'
  const coat = shark && old.coat === 'reef' ? 'storm' : (old.coat ?? '')
  return {
    name: old.name ?? '',
    species,
    coat: coatFor(species, coat),
    accessory: ACCESSORIES.includes(old.accessory as AccessoryId) ? (old.accessory as AccessoryId) : 'hat',
    eyes: eyesFor(old.eyes)
  }
}
