import { face, hat } from './face'
import { HEIGHT, TOP, WIDTH, type PixelAnimal } from './species'
import { compose, flipX, mirror, type Grid, type Placed } from './sprite'

/**
 * The robot, for whoever would rather not have an animal: a rounded box of a head with
 * the shared face on a light screen, knobs for ears, an antenna with a light that wobbles
 * beside the hat, a chest light, little arms and feet. Wears a bow tie.
 *
 *   o outline   b casing   d casing shade   l casing light   f face screen
 *   c chest panel   a light
 */

const HEAD = mirror([
  '..................',
  '..................',
  '..................',
  '..................',
  '..................',
  '..................',
  '.....ooooooooooooo',
  '....olllllllllllll',
  '...obbbbbbbbbbbbbb',
  '...obdbbbbbbbbbbbb',
  '...obbbooooooooooo',
  '...obbofffffffffff',
  '...oboffffffffffff',
  '...oboffffffffffff',
  '...oboffffffffffff',
  '...oboffffffffffff',
  '...oboffffffffffff',
  '...oboffffffffffff',
  '...oboffffffffffff',
  '...oboffffffffffff',
  '...oboffffffffffff',
  '...oboffffffffffff',
  '...oboffffffffffff',
  '...oboffffffffffff',
  '...obbofffffffffff',
  '...obbbooooooooooo',
  '...obdbbbbbbbbbbbb',
  '....oddddddddddddd',
  '.....ooooooooooooo'
])

/** The left ear knob, half hidden behind the head; the right one is its mirror image. */
const EAR: Grid = ['..oo', '.olb', 'olbb', 'obdb', 'obdb', 'odbb', '.odb', '..oo']

/** The antenna, its light wobbling between two positions. Stands beside the hat. */
const ANTENNA: Grid[] = [
  ['.ooo.', 'ohaao', 'oaaao', '.ooo.', '..o..', '..o..', '..o..', '..o..'],
  ['..ooo', '.ohaa', '.oaaa', '..ooo', '..o..', '..o..', '..o..', '..o..']
]

const BODY = mirror([
  '.......obbbbbbbbbb',
  '.......obbbbbbbbbb',
  '.......obbbboooooo',
  '.......obbbboccccc',
  '.......obbbboccccc',
  '.......obbbboccccc',
  '.......obbbboccccc',
  '.......obbbboooooo',
  '.......obbbbbbbbbb',
  '.......odbbbbbbbbb',
  '.......odddddddddd',
  '........oooooooooo'
])

const LIGHT: Grid = ['.aa.', 'ahaa', 'aaaa', '.aa.']
const ARM: Grid = ['.oo.', 'obbo', 'obbo', 'obbo', 'obbo', 'oddo', '.oo.']
const FOOT: Grid = ['obbbbo', 'oddddo', 'oooooo']

/** A small smile on the screen; open, a little square speaker of a mouth. */
const MOUTH = {
  closed: ['o....o', '.oooo.'],
  open: ['oooooo', 'omttmo', '.oooo.'],
  small: ['..oo..', '..oo..']
}

const BOW_TIE: Grid = ['oo....oo', 'orroorro', 'orrRRrro', 'orroorro', 'oo....oo']

export const robot: PixelAnimal = {
  coats: {
    tin: { o: '#4a5260', b: '#b8c2cc', d: '#8f9aa8', l: '#dde3e9', f: '#f5f8fa', c: '#5a6472', a: '#ff6b81' },
    mint: { o: '#2f6656', b: '#8fd3c1', d: '#6bb8a4', l: '#bdeadd', f: '#f4fbf8', c: '#2f6656', a: '#ffb347' },
    tangerine: { o: '#8a4512', b: '#f5a04a', d: '#d9822e', l: '#fbc98c', f: '#fff7ee', c: '#7a3d10', a: '#5fd3e6' },
    lilac: { o: '#4e3b7a', b: '#b9a3e3', d: '#9a84cc', l: '#d9cdf3', f: '#faf7ff', c: '#4e3b7a', a: '#ff8fb8' }
  },
  anchor: [30, 4],
  frame(pose, accessory, headwear) {
    const head = TOP + 1 - pose.bob
    // Where the others sway a tail, the robot swings its arms.
    const swing = pose.tail
    const layers: Placed[] = [
      { grid: ANTENNA[pose.tail], x: 25, y: head - 1 },
      { grid: EAR, x: 0, y: head + 12 },
      { grid: flipX(EAR), x: 32, y: head + 12 },
      { grid: FOOT, x: 9, y: TOP + 37 },
      { grid: FOOT, x: 21, y: TOP + 37 },
      { grid: BODY, x: 0, y: TOP + 27 },
      { grid: LIGHT, x: 16, y: TOP + 31 },
      { grid: ARM, x: 3, y: TOP + 29 - swing },
      { grid: flipX(ARM), x: 29, y: TOP + 29 - (1 - swing) },
      { grid: HEAD, x: 0, y: head },
      ...face(pose, head),
      { grid: MOUTH[pose.mouth], x: 15, y: head + 23 }
    ]
    if (accessory === 'collar') layers.push({ grid: BOW_TIE, x: 14, y: TOP + 28 })
    if (accessory === 'hat') layers.push(...hat(head + 6, head, headwear))
    return compose(WIDTH, HEIGHT, layers)
  }
}
