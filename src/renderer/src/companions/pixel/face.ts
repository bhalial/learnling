import type { Pose } from './animate'
import type { Grid, Palette, Placed } from './sprite'

/**
 * The face every pixel animal shares, so they look like one family: the same eyes, the
 * same shines, the same blush and the same hat. An animal only adds its own nose, beak or
 * grin. The rules behind it are in docs/companions.md.
 *
 *   k dark   h shine   j/g/G eye colour (deep, rich, light)   p blush
 */

/**
 * Big eyes whose dark part reads as one large pupil, with two shines (big upper left,
 * small lower right) and the eye colour glowing along the bottom. A pale iris around a
 * small pupil stares, and slit pupils look sly: both are out. Looking aside moves the
 * whole eye.
 */
const EYE: Grid = ['.kkkk.', 'khhkkk', 'khhkkk', 'kkkkkk', 'kjjjhk', 'kggggk', '.kGGk.']

/** Closed eyes are arcs: a relaxed one for blinking and sleep, ^ ^ for happy. */
const CLOSED: Record<'blink' | 'happy', Grid> = {
  blink: ['......', '......', '......', 'k....k', '.kkkk.', '......', '......'],
  happy: ['......', '......', '..kk..', '.k..k.', 'k....k', '......', '......']
}

/** Eye colours, each in three tones: deep, rich, light. */
export const EYE_COLORS: Record<string, Palette> = {
  green: { j: '#2f7d3c', g: '#4fb34c', G: '#97dc72' },
  amber: { j: '#9c5a14', g: '#e39a28', G: '#f7d070' },
  blue: { j: '#1f5d93', g: '#3a95d6', G: '#8ccdf2' },
  hazel: { j: '#6e4320', g: '#b2783a', G: '#e0b26c' },
  violet: { j: '#4f3a92', g: '#8a66d6', G: '#bea6f2' }
}

/**
 * Eyes and blush for a head drawn with its top row at `head`. Every head puts its eyes in
 * the same place: low on the face, their bottom on row 21, 14 pixels apart. The younger a
 * face looks, the lower its eyes sit.
 */
export function face(pose: Pose, head: number): Placed[] {
  const eye = pose.eyes === 'open' ? EYE : CLOSED[pose.eyes]
  const look = pose.eyes === 'open' ? pose.gaze : 0
  const top = head + 22 - eye.length
  return [
    { grid: eye, x: 8 + look, y: top },
    { grid: eye, x: 22 + look, y: top },
    { grid: ['ppp'], x: 6, y: head + 22 },
    { grid: ['ppp'], x: 27, y: head + 22 }
  ]
}

/** The wizard hat, tip leaning right. Its brim is 18 wide, centred on the frame. */
const HAT: Grid = [
  '...........qq.....',
  '..........quq.....',
  '.........quUq.....',
  '.........quUUq....',
  '........quUyUq....',
  '........quyyyq....',
  '.......quUUyUUq...',
  '.......quUUUUUq...',
  '......qYYYYYYYYq..',
  '......qYyyyYYYYq..',
  '..qqquuUUUUUUUqqq.',
  '.quuuuUUUUUUUUUUq.',
  '..qqqqqqqqqqqqqq..'
]

/** The hat resting with its brim on the row `crown` (the top of the head). */
export function hat(crown: number): Placed {
  return { grid: HAT, x: 9, y: crown - HAT.length + 1 }
}

/** Colours every animal shares: blush, eyes, mouths and the gear. */
export const SHARED: Palette = {
  p: '#f7a6ad',
  k: '#2a1d1a',
  h: '#ffffff',
  m: '#9c3b4a',
  t: '#f28c96',
  q: '#2e1f4f',
  U: '#5b3f9a',
  u: '#7f62c4',
  Y: '#d9a93c',
  y: '#f5d679',
  r: '#c0392b',
  R: '#8f261b'
}
