import { face, hat } from './face'
import { HEIGHT, TOP, WIDTH, type PixelAnimal } from './species'
import { compose, mirror, type Grid, type Placed } from './sprite'

/**
 * The cat, sitting and facing her. Head and body are mirrored shapes; the shared face,
 * nose, tail and gear are layers on top.
 *
 *   o outline   b fur   d fur shade   l fur light   p inner ear   w white   v white shade
 *   n nose   r/R/Y/y bell collar
 */

const HEAD = mirror([
  '......o...........',
  '.....obo..........',
  '.....obbo.........',
  '.....obpbo........',
  '.....obppbo.......',
  '.....obpppbo......',
  '.....obppppbo.....',
  '.....obpppppbooooo',
  '.....obppppbbbllld',
  '.....obpppbbbbdlld',
  '....obbppbbbbbdbbd',
  '....obbbpbbbbbbbbd',
  '....obbbbbbbbbbbbb',
  '....obbbbbbbbbbbbb',
  '....obbbbbbbbbbbbb',
  '....obbbbbbbbbbbbb',
  '....obbbbbbbbbbbbb',
  '....obbbbbbbbbbbbb',
  '....obbbbbbbbbbbbb',
  '....obbbbbbbbbbbbb',
  '....odbbbbbbbbbwww',
  '....odbbbbbbbbwwww',
  '.....odbbbbbbbwwww',
  '.....odbbbbbbbbwww',
  '......odbbbbbbbbww',
  '.......oddbbbbbbww',
  '........ooddbbbbbw',
  '..........oodddddv',
  '............oooooo'
])

/** The sitting body the four-legged animals share: haunches, chest, two front paws. */
export const SITTING = mirror([
  '.........obbbwwwww',
  '........obbbbwwwww',
  '.......obbbbbwwwww',
  '.......obbbbbbwwww',
  '......obbbbbbbwwww',
  '......obbbbbbbbwww',
  '.....obbbbbbbbbwww',
  '.....obbbbbbbowwwv',
  '.....odbbbbbbowwwv',
  '.....oddbbbbowwwwv',
  '......odddddowwwwv',
  '.......ooooooooooo'
])

const TAIL_BASE = ['..odddo', '..obbbo', '..obbbo', '.obdbo.', 'obbbo..', 'obbo...', 'oo.....']
/** The tail tip in its two sway positions; the rest of the tail stays put. */
const TAIL: Grid[] = [
  ['...ooo.', '..obbbo', '..obbbo', '..odddo', '..obbbo', ...TAIL_BASE],
  ['..ooo..', '.obbbo.', '.obbbo.', '..odddo', '..obbbo', ...TAIL_BASE]
]

/** Nose and mouth, stamped over the muzzle. */
const MOUTH = {
  closed: ['.nnnn.', '..nn..', '.o..o.', '..oo..'],
  open: ['.nnnn.', '..nn..', '.oooo.', '.omto.', '..oo..'],
  small: ['.nnnn.', '..nn..', '..oo..', '..oo..']
}

const COLLAR: Grid = [
  'oorrrrrrrrrrrrrrrroo',
  '.oRRRRRRRyyRRRRRRRo.',
  '........oyyo........',
  '........oYYo........',
  '.........oo.........'
]

// Outlines are a deep shade of the fur, not black: softer, and still clear on the desk.
const NOSE = { n: '#e8798a' }

export const cat: PixelAnimal = {
  coats: {
    ginger: { ...NOSE, o: '#8a4520', b: '#ef9f52', d: '#cf7a36', l: '#f8c788', w: '#fff8ec', v: '#ead9c2' },
    midnight: { ...NOSE, o: '#17141b', b: '#4a4654', d: '#38343f', l: '#635e6d', w: '#f6f1e8', v: '#d9d1c4' },
    silver: { ...NOSE, o: '#555a68', b: '#b3b9c4', d: '#949ba8', l: '#d3d8df', w: '#fdfbf7', v: '#e3dfd8' },
    cream: { ...NOSE, o: '#9a7650', b: '#f3e0bf', d: '#dcc095', l: '#fbefd8', w: '#fffbf3', v: '#eadfcc' }
  },
  anchor: [28, 4],
  frame(pose, accessory) {
    const head = TOP + 1 - pose.bob
    const layers: Placed[] = [
      { grid: TAIL[pose.tail], x: 29, y: TOP + 26 },
      { grid: SITTING, x: 0, y: TOP + 27 },
      { grid: HEAD, x: 0, y: head },
      ...face(pose, head),
      { grid: MOUTH[pose.mouth], x: 15, y: head + 21 }
    ]
    if (accessory === 'collar') layers.push({ grid: COLLAR, x: 8, y: TOP + 29 })
    if (accessory === 'hat') layers.push(hat(head + 7))
    return compose(WIDTH, HEIGHT, layers)
  }
}
