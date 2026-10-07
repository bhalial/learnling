import type { Pose } from './animate'
import { flipX, type Grid, type Palette, type Placed } from './sprite'

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

/**
 * Each animal's own eyes. The tall eye with the colour glowing along the bottom (`classic`)
 * is the cat's; the dog's are round, the parrot's are a bird's, the whale's small beads,
 * and the robot's are lights. All keep the face's rules: dark eyes that shine, never a
 * small pupil in a pale iris (the parrot's coloured ring is thin round a big dark centre).
 * A robot's lights are drawn in the eye colour, and close in it too.
 */
export type EyeStyle = 'classic' | 'round' | 'bird' | 'bead' | 'screen'

const LIGHT_CLOSED: Record<'blink' | 'happy', Grid> = {
  blink: ['......', '......', '......', '......', 'gggggg', '......', '......'],
  happy: ['......', '......', '..gg..', '.g..g.', 'g....g', '......', '......']
}

const EYES: Record<EyeStyle, { open: Grid; blink?: Grid; happy?: Grid }> = {
  classic: { open: EYE },
  round: { open: ['.kkkk.', 'khhkkk', 'khhkkk', 'kkkkkk', 'kjjjhk', '.kggk.'] },
  bird: { open: ['.ggg.', 'gkhkg', 'gkkkg', 'gkkkg', '.ggg.'] },
  bead: { open: ['.kkk.', 'khhkk', 'khkkk', 'kkkhk', '.kkk.'] },
  screen: { open: ['GGGGGG', 'gGgggg', 'gggggg', 'gggggg', 'jjjjjj'], ...LIGHT_CLOSED }
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
export function face(pose: Pose, head: number, style: EyeStyle = 'classic'): Placed[] {
  const set = EYES[style]
  const eye = pose.eyes === 'open' ? set.open : (set[pose.eyes] ?? CLOSED[pose.eyes])
  const look = pose.eyes === 'open' ? pose.gaze : 0
  const top = head + 22 - eye.length
  // Narrower or wider eyes stay centred on the classic eye's spot.
  const shift = Math.floor((6 - eye[0].length) / 2)
  return [
    { grid: eye, x: 8 + shift + look, y: top },
    { grid: eye, x: 22 + shift + look, y: top },
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

/**
 * What the head slot holds; every theme brings its own. They are outlined in `o`, the
 * animal's own outline colour, so each one sits on its animal as if drawn with it.
 */
export type Headwear = 'wizard' | 'space' | 'crown' | 'straw' | 'goggles' | 'bow'

/** A white space cap with an orange band and an antenna with a light. */
const SPACE_CAP: Grid = [
  '.......II.......',
  '......oIIo......',
  '.......oo.......',
  '.......oo.......',
  '....oooooooo....',
  '...oWWWWWWWWo...',
  '..oWWhWWWWWWWo..',
  '..oWhWWWWWWWWo..',
  '.oWWWWWWWWWWWWo.',
  '.oOOOOOOOOOOOOo.',
  'oooooooooooooooo'
]

/** A gold crown with a red and two blue gems. */
const CROWN: Grid = [
  'o.....oo.....o',
  'oo...oyyo...oo',
  'oyo.oyyyyo.oyo',
  'oyyoyyyyyyoyyo',
  'oyyyyyryyyyyyo',
  'oyyDyyyyyyDyyo',
  'oYYYYYYYYYYYYo',
  'oooooooooooooo'
]

/** A straw hat with a red band and a wide brim. */
const STRAW_HAT: Grid = [
  '.......oooooooo.......',
  '......oSSSSSSSSo......',
  '......oSTSSSSTSo......',
  '......orrrrrrrro......',
  '..ooooSSSSSSSSSSoooo..',
  '.oSSSSTSSSSSSSSTSSSSo.',
  'oSSTSSSSSTSSSSTSSSSTSo',
  '.oooooooooooooooooooo.'
]

/** A pink bow, worn on the side of the head. */
const BOW: Grid = ['oo.....oo', 'oPoo.ooPo', 'oPPoZoPPo', 'oPoo.ooPo', 'oo.....oo']

/**
 * Swimming goggles around the eyes, with a strap and a snorkel up the left side. Every
 * face has its eyes in the same place, so the goggles fit every animal; the lenses leave
 * the eyes, and the nose and mouth below them, free.
 */
function goggles(head: number): Placed[] {
  // A thick rim with room for the eye to look left and right inside it; the thin side faces
  // the nose, so the nose stays free.
  const LENS: Grid = ['.ooooooooo.', 'oXXXXXXXXXo', 'oXXXXXXXXXo', ...Array(7).fill('oX........o'), 'oXXXXXXXXXo', '.ooooooooo.']
  const BAND: Grid = ['oooo', 'XXXX', 'oooo']
  return [
    { grid: ['ooo', 'oOo', 'oOo', ...Array(13).fill('oXo'), 'ooo'], x: 0, y: head + 1 },
    { grid: BAND, x: 2, y: head + 15 },
    { grid: BAND, x: 30, y: head + 15 },
    { grid: LENS, x: 5, y: head + 12 },
    { grid: flipX(LENS), x: 20, y: head + 12 },
    { grid: BAND, x: 16, y: head + 15 }
  ]
}

/**
 * The headwear resting on the row `crown` (the top of the head; each animal knows where
 * its own is). `head` is the head's top row, for the goggles, which sit on the eyes.
 */
export function hat(crown: number, head: number, headwear: Headwear = 'wizard'): Placed[] {
  switch (headwear) {
    case 'space':
      return [{ grid: SPACE_CAP, x: 10, y: crown - SPACE_CAP.length + 1 }]
    case 'crown':
      return [{ grid: CROWN, x: 11, y: crown - CROWN.length + 1 }]
    case 'straw':
      return [{ grid: STRAW_HAT, x: 7, y: crown - STRAW_HAT.length + 1 }]
    case 'bow':
      return [{ grid: BOW, x: 22, y: crown + 1 }]
    case 'goggles':
      return goggles(head)
    default:
      return [{ grid: HAT, x: 9, y: crown - HAT.length + 1 }]
  }
}

export const ALL_HEADWEAR: Headwear[] = ['wizard', 'space', 'crown', 'straw', 'goggles', 'bow']

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
  R: '#8f261b',
  // space cap: white, cyan light, orange band
  W: '#eef2f8',
  I: '#5fe0ff',
  O: '#ff9a3c',
  // crown gems
  D: '#3a95d6',
  // straw
  S: '#ecc874',
  T: '#c9a24a',
  // bow
  P: '#f59ac1',
  Z: '#d4688f',
  // goggles and snorkel
  X: '#34c6c3'
}
