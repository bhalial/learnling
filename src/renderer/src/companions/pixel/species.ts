import type { AccessoryId } from '../types'
import type { Pose } from './animate'
import { EYE_COLORS, SHARED, type EyeStyle, type Headwear } from './face'
import type { Palette } from './sprite'

/** Every pixel animal is drawn on the same frame, with room above the head for the hat. */
export const WIDTH = 36
export const HEIGHT = 46
export const TOP = 6

/** What a pixel animal has to be able to do; the timing of its moods lives in animate.ts. */
export interface PixelAnimal {
  /** Coat id → colours. The ids match the coats a companion can be dressed in. */
  coats: Record<string, Palette>
  /** Where a thought (z, ?, sparkle) floats: above the head, to the right. */
  anchor: readonly [number, number]
  /** The animal's own eyes (face.ts); the cat's classic ones when not given. */
  eyes?: EyeStyle
  /** `headwear` is what the hat slot holds; the theme decides it, the wizard hat by default. */
  frame(pose: Pose, accessory: AccessoryId, headwear?: Headwear): string[]
}

/** All the colours for one animal: its coat, the shared face and gear, and the eye colour. */
export function paletteOf(animal: PixelAnimal, coat: string, eyeColor: string): Palette {
  return { ...SHARED, ...(animal.coats[coat] ?? Object.values(animal.coats)[0]), ...EYE_COLORS[eyeColor] }
}
