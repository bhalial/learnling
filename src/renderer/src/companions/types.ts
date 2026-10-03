import type { Lang } from '../types'
import type { PixelAnimal } from './pixel/species'

/**
 * The companion contract. The app only ever speaks this language: which animal,
 * how it looks, and what mood it is in. A new animal is a new SpeciesDefinition
 * with its pixel art; nothing else in the app changes.
 */

export type Species = 'cat' | 'dog' | 'parrot' | 'whale' | 'robot'

/**
 * idle     nothing special: breathing, blinking, looking around
 * happy    a celebration: something got done or arrived
 * talk     it is saying something (a new line, a notification)
 * curious  a mystery scroll is waiting to be deciphered
 * sleep    late in the evening or at night
 * proud    today's page is done
 */
export type Mood = 'idle' | 'happy' | 'talk' | 'curious' | 'sleep' | 'proud'

/** Every animal has a head slot and a neck slot; what goes there is the animal's own. */
export type AccessoryId = 'hat' | 'collar' | 'none'

export interface CompanionLook {
  species: Species
  /** One of the species' coat ids. */
  coat: string
  accessory: AccessoryId
  /** The eye colour, shared by every animal (see EYE_COLORS). */
  eyes: string
}

export interface Coat {
  id: string
  name: Record<Lang, string>
}

export interface SpeciesDefinition {
  id: Species
  name: Record<Lang, string>
  coats: Coat[]
  /** What the neck slot is called for this animal (a bell collar, a scarf, a bow tie). */
  neckwear: Record<Lang, string>
  /** How it is drawn: companions/pixel/<animal>.ts. */
  art: PixelAnimal
}
