import { ALL_SPECIES, SPECIES } from '../../src/renderer/src/companions'
import type { PixelAnimal } from '../../src/renderer/src/companions/pixel/species'

/** Every companion in the app, by species id, for the preview. */
export const ANIMALS: Record<string, PixelAnimal> = Object.fromEntries(ALL_SPECIES.map((species) => [species, SPECIES[species].art]))
