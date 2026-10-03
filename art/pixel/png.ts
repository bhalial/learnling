import { deflateSync } from 'node:zlib'
import { rgba, type Grid, type Palette } from '../../src/renderer/src/companions/pixel/sprite'

/** A tiny PNG encoder (RGBA, no filtering), enough for pixel art. */

const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buf: Buffer): number {
  let c = 0xffffffff
  for (const byte of buf) c = CRC[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Buffer): Buffer {
  const head = Buffer.alloc(8)
  head.writeUInt32BE(data.length, 0)
  head.write(type, 4, 'ascii')
  const tail = Buffer.alloc(4)
  tail.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0)
  return Buffer.concat([head, data, tail])
}

export function png(width: number, height: number, pixels: Uint8ClampedArray): Buffer {
  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y++) Buffer.from(pixels.buffer, pixels.byteOffset + y * width * 4, width * 4).copy(raw, y * (width * 4 + 1) + 1)
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr.set([8, 6, 0, 0, 0], 8)
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}

/** A canvas of RGBA pixels filled with one colour, to place sprites on. */
export class Picture {
  readonly pixels: Uint8ClampedArray

  constructor(
    readonly width: number,
    readonly height: number,
    background: readonly [number, number, number]
  ) {
    this.pixels = new Uint8ClampedArray(width * height * 4)
    for (let i = 0; i < width * height; i++) this.pixels.set([...background, 255], i * 4)
  }

  /** Draws a sprite with its top left at (x, y), every art pixel `scale` pixels wide. */
  draw(grid: Grid, palette: Palette, x: number, y: number, scale: number): void {
    const width = grid[0]?.length ?? 0
    const sprite = rgba(grid, palette)
    for (let sy = 0; sy < grid.length; sy++)
      for (let sx = 0; sx < width; sx++) {
        const s = (sy * width + sx) * 4
        if (sprite[s + 3] === 0) continue
        for (let dy = 0; dy < scale; dy++)
          for (let dx = 0; dx < scale; dx++) {
            const px = x + sx * scale + dx
            const py = y + sy * scale + dy
            if (px >= 0 && py >= 0 && px < this.width && py < this.height) this.pixels.set(sprite.subarray(s, s + 4), (py * this.width + px) * 4)
          }
      }
  }

  /** A filled rectangle, for simple shapes such as a stack of books. */
  rect(x: number, y: number, width: number, height: number, colour: readonly [number, number, number]): void {
    for (let py = Math.max(0, y); py < Math.min(this.height, y + height); py++)
      for (let px = Math.max(0, x); px < Math.min(this.width, x + width); px++) this.pixels.set([...colour, 255], (py * this.width + px) * 4)
  }

  toPng(): Buffer {
    return png(this.width, this.height, this.pixels)
  }
}
