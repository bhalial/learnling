import { SITTING } from './cat'
import { face, hat } from './face'
import { HEIGHT, TOP, WIDTH, type PixelAnimal } from './species'
import { compose, flipX, mirror, type Grid, type Placed } from './sprite'

/**
 * The dog: a puppy with a round head, floppy ears, a light snout with a big shiny nose,
 * a wagging tail and a collar with a tag. Sits like the cat.
 *
 *   o outline   b fur   d fur shade   l fur light   w snout / chest   v snout shade
 *   e ear   E ear shade   N nose
 */

const HEAD = mirror([
  '..................',
  '..................',
  '..................',
  '..................',
  '............oooooo',
  '.........ooollllll',
  '.......oobblllllll',
  '......obbbbbllllll',
  '.....obbbbbbbbbbbb',
  '....obbbbbbbbbbbbb',
  '....obbbbbbbbbbbbb',
  '...obbbbbbbbbbbbbb',
  '...obbbbbbbbbbbbbb',
  '...obbbbbbbbbbbbbb',
  '...obbbbbbbbbbbbbb',
  '...obbbbbbbbbbbbbb',
  '...obbbbbbbbbbbbbb',
  '...obbbbbbbbbbbbbb',
  '...obbbbbbbbbbbbbb',
  '...obbbbbbbbbbbwww',
  '...obbbbbbbbbbwwww',
  '...odbbbbbbbbwwwww',
  '....odbbbbbbbwwwww',
  '....odbbbbbbbwwwww',
  '.....odbbbbbbwwwww',
  '......oddbbbbwwwww',
  '.......ooddbbbwwww',
  '.........ooddddvvv',
  '...........ooooooo'
])

/** The left ear, hanging over the side of the head; the right one is its mirror image. */
const EAR: Grid = [
  '...ooo.',
  '..oeeeo',
  '.oeeeeo',
  '.oeeeeo',
  'oeeeeeo',
  'oeeeeeo',
  'oeeeeeo',
  'oeeeeEo',
  'oeeeeEo',
  'oeeeEo.',
  'oeeeEo.',
  'oEeeEo.',
  '.oEEo..',
  '.oEEo..',
  '..oo...'
]

/** The tail wags between two positions. */
const TAIL: Grid[] = [
  ['....oo.', '...obbo', '...obbo', '..obbo.', '..obbo.', '.obbo..', 'obbo...', 'oo.....'],
  ['..oo...', '.obbo..', '.obbo..', '..obbo.', '..obbo.', '.obbo..', 'obbo...', 'oo.....']
]

/** Nose and mouth on the snout. */
const MOUTH = {
  closed: ['..NNNN..', '.NhNNNN.', '..NNNN..', '...oo...', 'o..oo..o', '.oo..oo.'],
  open: ['..NNNN..', '.NhNNNN.', '..NNNN..', '...oo...', '.oommoo.', '..omto..', '...tt...'],
  small: ['..NNNN..', '.NhNNNN.', '..NNNN..', '...oo...', '..o..o..', '...oo...']
}

const COLLAR: Grid = [
  'oorrrrrrrrrrrrrrrroo',
  '.oRRRRRRRRRRRRRRRRo.',
  '........oYYo........',
  '........oyYo........',
  '.........oo.........'
]

const NOSE = { N: '#2e2220' }

export const dog: PixelAnimal = {
  coats: {
    golden: { ...NOSE, o: '#8a5a26', b: '#e2ad62', d: '#c48a42', l: '#f2cd8e', w: '#fbeed3', v: '#ecd8b0', e: '#b97f3e', E: '#9a6530' },
    chocolate: { ...NOSE, o: '#3e2414', b: '#8a5636', d: '#6e4128', l: '#a66e4a', w: '#d9b48e', v: '#c49c76', e: '#5c3720', E: '#4a2b18' },
    husky: { ...NOSE, o: '#3e444c', b: '#86909b', d: '#6d7682', l: '#a5aeb8', w: '#f6f6f2', v: '#dcdcd6', e: '#5d6570', E: '#4b525c' },
    snow: { ...NOSE, o: '#9a8466', b: '#f4efe6', d: '#e2d9c8', l: '#fffdf8', w: '#ffffff', v: '#ece4d6', e: '#d9c7ab', E: '#c4ae8c' }
  },
  anchor: [28, 6],
  frame(pose, accessory) {
    const head = TOP + 1 - pose.bob
    const layers: Placed[] = [
      { grid: TAIL[pose.tail], x: 29, y: TOP + 28 },
      { grid: SITTING, x: 0, y: TOP + 27 },
      { grid: HEAD, x: 0, y: head },
      ...face(pose, head),
      { grid: MOUTH[pose.mouth], x: 14, y: head + 21 },
      { grid: EAR, x: 0, y: head + 8 },
      { grid: flipX(EAR), x: 29, y: head + 8 }
    ]
    if (accessory === 'collar') layers.push({ grid: COLLAR, x: 8, y: TOP + 29 })
    if (accessory === 'hat') layers.push(hat(head + 4))
    return compose(WIDTH, HEIGHT, layers)
  }
}
