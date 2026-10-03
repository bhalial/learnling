/**
 * Pixel sprites as text. A grid is rows of characters, one per pixel; a palette says
 * which colour each character is, and '.' is see-through. Animals are drawn in layers
 * (body, head, eyes, mouth, tail, hat) so a mood only moves or swaps a layer, and a new
 * coat is just another palette.
 */

export type Grid = readonly string[]
export type Palette = Readonly<Record<string, string>>

/** A layer placed in a frame. */
export interface Placed {
  grid: Grid
  x: number
  y: number
}

/** A symmetric shape drawn as its left half: the right half is the mirror image. */
export function mirror(half: Grid): string[] {
  return half.map((row) => row + [...row].reverse().join(''))
}

/** The grid flipped left to right. */
export function flipX(grid: Grid): string[] {
  return grid.map((row) => [...row].reverse().join(''))
}

/** Changes single pixels: `[x, y, char]`. For the details that break a mirrored shape's symmetry. */
export function patch(grid: Grid, pixels: ReadonlyArray<readonly [number, number, string]>): string[] {
  const rows = grid.map((row) => [...row])
  for (const [x, y, char] of pixels) if (rows[y]?.[x] !== undefined) rows[y][x] = char
  return rows.map((row) => row.join(''))
}

/** Layers stacked into one grid of `width` × `height`; later layers cover earlier ones. */
export function compose(width: number, height: number, layers: ReadonlyArray<Placed>): string[] {
  const rows = Array.from({ length: height }, () => Array<string>(width).fill('.'))
  for (const { grid, x, y } of layers) {
    grid.forEach((row, dy) => {
      ;[...row].forEach((char, dx) => {
        const px = x + dx
        const py = y + dy
        if (char !== '.' && py >= 0 && py < height && px >= 0 && px < width) rows[py][px] = char
      })
    })
  }
  return rows.map((row) => row.join(''))
}

/** RGBA pixels for a grid, ready for an ImageData or a PNG. */
export function rgba(grid: Grid, palette: Palette): Uint8ClampedArray {
  const height = grid.length
  const width = grid[0]?.length ?? 0
  const out = new Uint8ClampedArray(width * height * 4)
  grid.forEach((row, y) => {
    ;[...row].forEach((char, x) => {
      const hex = palette[char]
      if (char === '.' || !hex) return
      const i = (y * width + x) * 4
      out[i] = parseInt(hex.slice(1, 3), 16)
      out[i + 1] = parseInt(hex.slice(3, 5), 16)
      out[i + 2] = parseInt(hex.slice(5, 7), 16)
      out[i + 3] = 255
    })
  })
  return out
}
