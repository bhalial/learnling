import type { Mood } from '../types'
import type { Grid, Palette } from './sprite'

/**
 * How every pixel animal moves, whatever it is. A mood becomes a pose (which eyes, where
 * they look, breathing, tail, mouth), a lift for hops, and an effect floating nearby.
 * Animals only draw the poses; the timing lives here, so they feel like one family.
 */

export interface Pose {
  eyes: 'open' | 'blink' | 'happy'
  /** -1 looks to her left, 1 to her right (towards the book). */
  gaze: number
  /** 1 lifts the head a pixel: breathing in, or a proud chin. */
  bob: number
  tail: number
  mouth: 'closed' | 'open' | 'small'
}

export type Effect = 'z' | 'sparkle' | 'question'

export interface Moment {
  pose: Pose
  /** Pixels the whole animal is lifted off the ground (a hop). */
  lift: number
  effect: Effect | null
  /** 0 to 1 through the effect's loop. */
  phase: number
}

const HOP = [0, 1, 2, 3, 3, 2, 1, 0]
const step = (time: number, ms: number): number => Math.floor(time / ms)
const loop = (time: number, ms: number): number => (time % ms) / ms

/**
 * The pose for a mood. `now` and `sinceMood` are milliseconds (since start, since the mood
 * began); `seed` offsets the idle rhythm so two animals never blink in unison.
 */
export function momentOf(mood: Mood, now: number, sinceMood: number, seed = 0): Moment {
  // A frame's timestamp can fall a hair before the moment the mood was set.
  const moodTime = Math.max(0, sinceMood)
  const blinking = (now + seed * 1300) % 3800 < 160
  const base: Pose = { eyes: blinking ? 'blink' : 'open', gaze: 0, bob: step(now, 700) % 2, tail: step(now + seed * 300, 900) % 2, mouth: 'closed' }
  const still = { lift: 0, effect: null, phase: 0 }

  switch (mood) {
    case 'happy': {
      const beat = step(moodTime, 110)
      const pose: Pose = { ...base, eyes: 'happy', bob: 0, tail: beat % 2, mouth: 'open' }
      return { pose, lift: moodTime < 1200 ? HOP[beat % HOP.length] : 0, effect: 'sparkle', phase: loop(moodTime, 900) }
    }
    case 'talk':
      return { ...still, pose: { ...base, mouth: step(moodTime, 180) % 2 ? 'closed' : 'open', bob: step(moodTime, 360) % 2 } }
    case 'curious':
      return { pose: { ...base, gaze: blinking ? 0 : 1, mouth: 'small', tail: step(now, 1400) % 2 }, lift: 0, effect: 'question', phase: loop(now, 1600) }
    case 'sleep':
      return { pose: { ...base, eyes: 'blink', bob: step(now, 1400) % 2, tail: 0 }, lift: 0, effect: 'z', phase: loop(now, 2400) }
    case 'proud':
      return { pose: { ...base, eyes: 'happy', bob: 1, tail: step(now, 1200) % 2 }, lift: 0, effect: 'sparkle', phase: loop(now, 1800) }
    default: {
      // Now and then a look aside: to her left, back, to her right.
      const look = step(now + 2500 + seed * 700, 1500) % 6
      return { ...still, pose: { ...base, gaze: blinking ? 0 : look === 1 ? -1 : look === 4 ? 1 : 0 } }
    }
  }
}

/** The floating bits, in the paper colour of the book. */
export const EFFECT_PALETTE: Palette = { s: '#fff3c4', z: '#f6ecd6', q: '#f6ecd6' }
const Z: Grid = ['zzz', '..z', '.z.', 'zzz']
const SPARKLE: Grid = ['.s.', 'sss', '.s.']
const QUESTION: Grid = ['.qq.', 'q..q', '..q.', '.q..', '....', '.q..']

export interface Overlay {
  grid: Grid
  x: number
  y: number
  alpha: number
}

/**
 * Where an effect is drawn, in the animal's frame. `anchor` is a point just above and to
 * the right of its head, where a thought would float.
 */
export function overlays(effect: Effect | null, phase: number, anchor: readonly [number, number]): Overlay[] {
  const [ax, ay] = anchor
  if (effect === 'z') return [{ grid: Z, x: ax + Math.round(phase * 3), y: ay - Math.round(phase * 6), alpha: 1 - phase }]
  if (effect === 'question') return [{ grid: QUESTION, x: ax, y: ay - (phase < 0.5 ? 0 : 1), alpha: 1 }]
  if (effect === 'sparkle') {
    // Three sparkles that take turns.
    const spots: Array<[number, number]> = [[ax, ay], [ax - 26, ay + 4], [ax + 2, ay + 14]]
    return spots.map(([x, y], i) => ({ grid: SPARKLE, x, y, alpha: Math.max(0, Math.sin((phase + i / 3) * Math.PI * 2)) }))
  }
  return []
}
