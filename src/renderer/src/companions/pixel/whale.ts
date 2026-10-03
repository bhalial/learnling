import { face, hat } from './face'
import { HEIGHT, TOP, WIDTH, type PixelAnimal } from './species'
import { compose, flipX, mirror, type Grid, type Placed } from './sprite'

/**
 * The whale: a round plush bean that floats, with a pale grooved belly, a long smile from
 * cheek to cheek, little flippers that paddle and a tail that waves up behind its head.
 * Wears a scarf. (It started as a shark; the round body made it a whale anyway.)
 *
 *   o outline   b body   d body shade   l body light   w belly   v belly groove
 */

const BODY = mirror([
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
  '...obbbbbbbbbbbbbb',
  '...obbbbbbbbbbbbbb',
  '...obbbbbbbbbbbbbb',
  '...obbbbbbbbbbbbbb',
  '...obbbbbbbbbbwwww',
  '...odbbbbbbwwwwwww',
  '...odbbbbwwwwwwwww',
  '....odbbwwwwwwwwww',
  '....odbwvvvvvvvvvv',
  '....obbwwwwwwwwwww',
  '....obwvvvvvvvvvvv',
  '.....obwwwwwwwwwww',
  '.....odwvvvvvvvvvv',
  '......odwwwwwwwwww',
  '.......oovvvvvvvvv',
  '.........ooooooooo'
])

/** The tail, waving up behind the head on the right; drawn behind the body. */
const TAIL: Grid[] = [
  ['oo.....oo.', 'obo...obo.', 'obbo.obbo.', '.obbobbo..', '..obbbo...', '...obo....', '...obo....', '...obo....'],
  ['.oo.....oo', '.obo...obo', '.obbo.obbo', '..obbobbo.', '...obbbo..', '...obbo...', '...obo....', '...obo....']
]

/** The left flipper; the right one is its mirror image. */
const FLIPPER: Grid = ['...oo', '..obo', '.obbo', 'obbo.', 'obo..', 'obo..', 'oo...']

/** A long smile from cheek to cheek. */
const MOUTH = {
  closed: ['o............o', '.oo........oo.', '...oooooooo...'],
  open: ['o............o', '.oommmmmmmmoo.', '..ommmttmmmo..', '...oooooooo...'],
  small: ['..............', '......oo......', '.....o..o.....', '......oo......']
}

const SCARF: Grid = [
  'oorrrrrrrrrrrrrrrrrrrroo',
  '.oRrRrRrRrRrRrRrRrRrRro.',
  '..oooooooooooooooooooo..'
]
const SCARF_END: Grid = ['ooo', 'oro', 'oRo', 'oro', 'oRo', 'ooo']

export const whale: PixelAnimal = {
  coats: {
    ocean: { o: '#2c4a6e', b: '#5f8fc0', d: '#4a76a6', l: '#86b0d8', w: '#f2f5f7', v: '#d3dde7' },
    storm: { o: '#4c5560', b: '#9aa5b1', d: '#808b98', l: '#b9c2cb', w: '#f4f5f6', v: '#d9dee3' },
    coral: { o: '#9a4562', b: '#ee93b0', d: '#d97597', l: '#f6b5ca', w: '#fff3f6', v: '#f0d5de' },
    deep: { o: '#16203a', b: '#34476e', d: '#273859', l: '#4a5f8a', w: '#d6deeb', v: '#b5c2d6' }
  },
  anchor: [30, 6],
  frame(pose, accessory) {
    // A swimmer: the whole whale floats up and down, not just its head.
    const top = TOP + 1 - pose.bob
    const layers: Placed[] = [
      { grid: TAIL[pose.tail], x: 25, y: top - 1 },
      { grid: BODY, x: 0, y: top },
      // Where the others sway a tail, the whale also paddles its flippers.
      { grid: FLIPPER, x: 0, y: top + 24 - pose.tail },
      { grid: flipX(FLIPPER), x: 31, y: top + 24 - pose.tail },
      ...face(pose, top),
      { grid: MOUTH[pose.mouth], x: 11, y: top + 22 }
    ]
    if (accessory === 'collar') layers.push({ grid: SCARF, x: 6, y: top + 29 }, { grid: SCARF_END, x: 9, y: top + 31 })
    if (accessory === 'hat') layers.push(hat(top + 4))
    return compose(WIDTH, HEIGHT, layers)
  }
}
