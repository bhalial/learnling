import { face, hat } from './face'
import { HEIGHT, TOP, WIDTH, type PixelAnimal } from './species'
import { compose, mirror, type Grid, type Placed } from './sprite'

/**
 * The parrot: a round head with three little feathers on top, a hooked beak, an egg of a
 * body with folded wings, little feet and tail feathers. Wears a bow tie.
 *
 *   o outline   b body   d body shade   l body light   x tuft
 *   c chest   a wing   A wing band   B/C beak and its shade   L lower beak   F feet
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
  '...obbbbbbbbbbbbbb',
  '...obbbbbbbbbbbbbb',
  '...obbbbbbbbbbbbbb',
  '...obbbbbbbbbbbbbb',
  '...odbbbbbbbbbbbbb',
  '....odbbbbbbbbbbbb',
  '.....odbbbbbbbbbbb',
  '......oddbbbbbbbbb',
  '.......ooddbbbbbbb',
  '.........ooooooooo'
])

/** Three little feathers on top; drawn behind the head so only their tips show. */
const TUFT: Grid = ['....o....', '.o.oxo.o.', 'oxooxooxo', '.oxxxxxo.', '..oxxxo..']

const BODY = mirror([
  '.........obbbccccc',
  '........obbbbccccc',
  '.......oaabbbccccc',
  '......oaaabbbccccc',
  '......oaaAAbbccccc',
  '......oaaaAbbbcccc',
  '......oaaaabbbcccc',
  '......oaaaabbbbccc',
  '.......oaaabbbbccc',
  '.......oaaobbbbbcc',
  '........oobbbbbbbb',
  '..........oooooooo'
])

const FOOT: Grid = ['oFFo', 'FooF']

/** Tail feathers peeking out behind the body, swaying. */
const TAIL: Grid[] = [
  ['.oo.....', 'oaao....', 'oaAao...', '.oaAao..', '..oaAao.', '...oaaAo', '....oaao', '.....oo.'],
  ['.oo.....', 'oaao....', 'oaAao...', '.oaAao..', '..oaAao.', '..oaaAo.', '..oaao..', '...oo...']
]

/** The beak: a hooked upper half; open, it shows the tongue and the dark lower half. */
const BEAK = {
  closed: ['.oooo.', 'oBBBBo', 'oBBBBo', 'oBBBCo', 'oCBBCo', '.oCCo.', '..oo..'],
  open: ['.oooo.', 'oBBBBo', 'oBBBBo', 'oCttCo', 'oLttLo', '.oLLo.', '..oo..'],
  small: ['.oooo.', 'oBBBBo', 'oBBBBo', 'oBBBCo', 'oCmmCo', '.oLLo.', '..oo..']
}

// Purple like the hat: red would vanish on the scarlet macaw.
const BOW_TIE: Grid = ['qq....qq', 'quuqquuq', 'quuUUuuq', 'quuqquuq', 'qq....qq']

export const parrot: PixelAnimal = {
  coats: {
    scarlet: {
      o: '#7a1d16', b: '#e0442f', d: '#b8301f', l: '#f07a5c', x: '#e0442f', c: '#e85a3c',
      a: '#2f6fcf', A: '#f2c230', B: '#efe6d6', C: '#cfc3ae', L: '#2b2118', F: '#7b7b82'
    },
    bluegold: {
      o: '#1b3f73', b: '#3584d6', d: '#2668b0', l: '#6aa8ea', x: '#3584d6', c: '#f2b632',
      a: '#2f74c4', A: '#1f5aa6', B: '#2e2a2c', C: '#1e1a1c', L: '#2e2a2c', F: '#5d5d66'
    },
    green: {
      o: '#2b5e1f', b: '#5cad42', d: '#46902f', l: '#86cc63', x: '#e0442f', c: '#8fcb5e',
      a: '#3c8a2c', A: '#2f6fcf', B: '#e8c96a', C: '#c9a548', L: '#c9a548', F: '#7b7b82'
    },
    cockatoo: {
      o: '#8a8478', b: '#f7f4ee', d: '#e4ded2', l: '#ffffff', x: '#f5d04a', c: '#fffdf8',
      a: '#ece6da', A: '#f5d04a', B: '#3a3a3a', C: '#2a2a2a', L: '#3a3a3a', F: '#5d5d66'
    }
  },
  anchor: [28, 6],
  frame(pose, accessory, headwear) {
    const head = TOP + 1 - pose.bob
    const layers: Placed[] = [
      { grid: TAIL[pose.tail], x: 25, y: TOP + 30 },
      { grid: TUFT, x: 13, y: head + 1 },
      { grid: BODY, x: 0, y: TOP + 27 },
      { grid: FOOT, x: 12, y: TOP + 37 },
      { grid: FOOT, x: 20, y: TOP + 37 },
      { grid: HEAD, x: 0, y: head },
      ...face(pose, head),
      { grid: BEAK[pose.mouth], x: 15, y: head + 19 }
    ]
    if (accessory === 'collar') layers.push({ grid: BOW_TIE, x: 14, y: TOP + 29 })
    if (accessory === 'hat') layers.push(...hat(head + 4, head, headwear))
    return compose(WIDTH, HEIGHT, layers)
  }
}
